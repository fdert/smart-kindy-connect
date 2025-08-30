import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateSurveyRequest {
  title: string;
  description?: string;
  surveyType: string;
  targetAudience: string;
  expiresAt: string;
  isAnonymous: boolean;
  questions: Array<{
    questionText: string;
    questionType: string;
    options?: string[];
    isRequired: boolean;
  }>;
}

interface SurveyResponseRequest {
  surveyId: string;
  responses: Array<{
    questionId: string;
    responseText?: string;
    responseOptions?: string[];
  }>;
  otpToken?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);

    // Create survey
    if (req.method === 'POST' && pathParts.length === 0) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) {
        return new Response('Tenant not found', { status: 404, headers: corsHeaders });
      }

      const requestData: CreateSurveyRequest = await req.json();
      
      // Create survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          tenant_id: userData.tenant_id,
          title: requestData.title,
          description: requestData.description,
          survey_type: requestData.surveyType,
          target_audience: requestData.targetAudience,
          expires_at: requestData.expiresAt,
          is_anonymous: requestData.isAnonymous,
          created_by: user.id
        })
        .select('id')
        .single();

      if (surveyError) throw surveyError;

      // Create questions
      for (let i = 0; i < requestData.questions.length; i++) {
        const question = requestData.questions[i];
        await supabase
          .from('survey_questions')
          .insert({
            survey_id: survey.id,
            question_text: question.questionText,
            question_type: question.questionType,
            options: question.options ? JSON.stringify(question.options) : null,
            is_required: question.isRequired,
            sort_order: i
          });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        surveyId: survey.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Submit survey response
    if (req.method === 'POST' && pathParts[1] === 'respond') {
      const surveyId = pathParts[0];
      const requestData: SurveyResponseRequest = await req.json();

      let respondentId = null;
      let respondentType = 'anonymous';

      // If not anonymous, verify OTP or auth
      const authHeader = req.headers.get('authorization');
      if (authHeader) {
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('id, role, tenant_id')
            .eq('id', user.id)
            .single();

          if (userData) {
            respondentId = userData.id;
            respondentType = userData.role === 'guardian' ? 'guardian' : 
                           userData.role === 'teacher' ? 'teacher' : 'admin';
          }
        }
      }

      // Get survey and tenant
      const { data: survey } = await supabase
        .from('surveys')
        .select('tenant_id, is_anonymous')
        .eq('id', surveyId)
        .single();

      if (!survey) {
        return new Response('Survey not found', { status: 404, headers: corsHeaders });
      }

      // Submit responses
      for (const response of requestData.responses) {
        await supabase
          .from('survey_responses')
          .insert({
            tenant_id: survey.tenant_id,
            survey_id: surveyId,
            question_id: response.questionId,
            respondent_id: survey.is_anonymous ? null : respondentId,
            respondent_type: survey.is_anonymous ? 'anonymous' : respondentType,
            response_text: response.responseText,
            response_options: response.responseOptions
          });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send survey notifications
    if (req.method === 'POST' && pathParts[1] === 'notify') {
      const surveyId = pathParts[0];
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      // Get survey
      const { data: survey } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .eq('tenant_id', userData?.tenant_id)
        .single();

      if (!survey) {
        return new Response('Survey not found', { status: 404, headers: corsHeaders });
      }

      let recipients = [];

      // Get recipients based on target audience
      if (survey.target_audience === 'guardians' || survey.target_audience === 'both') {
        const { data: guardians } = await supabase
          .from('guardians')
          .select('whatsapp_number, full_name')
          .eq('tenant_id', userData?.tenant_id)
          .not('whatsapp_number', 'is', null);

        recipients.push(...(guardians || []));
      }

      if (survey.target_audience === 'teachers' || survey.target_audience === 'both') {
        const { data: teachers } = await supabase
          .from('users')
          .select('phone as whatsapp_number, full_name')
          .eq('tenant_id', userData?.tenant_id)
          .in('role', ['teacher', 'admin'])
          .not('phone', 'is', null);

        recipients.push(...(teachers || []));
      }

      // Send notifications
      const surveyUrl = `${req.headers.get('origin') || 'https://smartkindy.com'}/surveys/${surveyId}`;
      
      for (const recipient of recipients) {
        if (recipient.whatsapp_number) {
          await supabase.functions.invoke('whatsapp-outbound', {
            body: {
              tenantId: userData?.tenant_id,
              to: recipient.whatsapp_number,
              templateName: 'survey_invitation',
              templateData: {
                recipientName: recipient.full_name,
                surveyTitle: survey.title,
                surveyDescription: survey.description,
                surveyUrl: surveyUrl,
                nurseryName: 'الحضانة'
              },
              contextType: 'survey',
              contextId: surveyId
            }
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        notificationsSent: recipients.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get survey results
    if (req.method === 'GET' && pathParts[1] === 'results') {
      const surveyId = pathParts[0];
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      // Get survey with questions and responses
      const { data: survey } = await supabase
        .from('surveys')
        .select(`
          *,
          survey_questions(*),
          survey_responses(*)
        `)
        .eq('id', surveyId)
        .single();

      if (!survey) {
        return new Response('Survey not found', { status: 404, headers: corsHeaders });
      }

      // Process results
      const results = survey.survey_questions.map((question: any) => {
        const questionResponses = survey.survey_responses.filter(
          (response: any) => response.question_id === question.id
        );

        const stats: any = {
          questionId: question.id,
          questionText: question.question_text,
          questionType: question.question_type,
          totalResponses: questionResponses.length,
          responses: questionResponses
        };

        // Calculate statistics based on question type
        if (question.question_type === 'yes_no') {
          const yesCount = questionResponses.filter(r => r.response_text === 'yes').length;
          const noCount = questionResponses.filter(r => r.response_text === 'no').length;
          stats.yesCount = yesCount;
          stats.noCount = noCount;
          stats.yesPercentage = questionResponses.length > 0 ? (yesCount / questionResponses.length * 100) : 0;
        } else if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
          const optionCounts: Record<string, number> = {};
          questionResponses.forEach((response: any) => {
            if (response.response_options) {
              response.response_options.forEach((option: string) => {
                optionCounts[option] = (optionCounts[option] || 0) + 1;
              });
            }
          });
          stats.optionCounts = optionCounts;
        } else if (question.question_type === 'rating') {
          const ratings = questionResponses.map(r => parseInt(r.response_text)).filter(r => !isNaN(r));
          const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
          stats.averageRating = averageRating;
          stats.ratings = ratings;
        }

        return stats;
      });

      return new Response(JSON.stringify({
        survey,
        results,
        totalRespondents: survey.survey_responses.length
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Surveys API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});