import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

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
    options: string[];
    isRequired: boolean;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

      // Get user's tenant
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tenant_id, tenants(*)')
        .eq('id', user.id)
        .single();

    if (userError || !userData?.tenant_id) {
      throw new Error('User has no associated tenant');
    }

    const body = await req.json();
    console.log('Request body:', body);

    // Handle different actions based on request body
    if (body.action === 'notify' && body.surveyId) {
      // Send Survey Notifications
      const surveyId = body.surveyId;
      
      console.log('Sending notifications for survey:', surveyId);

      // Get survey details
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (surveyError) {
        throw surveyError;
      }

      // Get target audience contacts based on survey settings
      let contacts = [];
      if (survey.target_audience === 'guardians' || survey.target_audience === 'both') {
        const { data: guardians } = await supabase
          .from('guardians')
          .select('whatsapp_number, full_name')
          .eq('tenant_id', userData.tenant_id)
          .not('whatsapp_number', 'is', null);
        
        contacts.push(...(guardians || []));
      }

      // Send WhatsApp notifications
      let notificationsSent = 0;
      for (const contact of contacts) {
        try {
          const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('whatsapp-outbound', {
            body: {
              tenantId: userData.tenant_id,
              to: contact.whatsapp_number,
              templateName: 'survey_notification',
              templateData: {
                guardianName: contact.full_name,
                surveyTitle: survey.title,
                surveyDescription: survey.description || '',
                nurseryName: userData.tenants?.name || ''
              },
              contextType: 'survey',
              contextId: survey.id
            }
          });
          
          if (whatsappError) {
            console.error('WhatsApp notification error:', whatsappError);
            throw whatsappError;
          } else {
            console.log('WhatsApp notification sent successfully:', whatsappResult);
            notificationsSent++;
          }
        } catch (error) {
          console.error('Failed to send notification to:', contact.whatsapp_number, error);
        }
      }

      return new Response(
        JSON.stringify({ success: true, notificationsSent }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } else if (body.action === 'getResults' && body.surveyId) {
      // Get Survey Results
      const surveyId = body.surveyId;
      
      console.log('Getting results for survey:', surveyId);

      // Get survey with questions
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .select(`
          *,
          survey_questions (*)
        `)
        .eq('id', surveyId)
        .eq('tenant_id', userData.tenant_id)
        .single();

      if (surveyError) {
        throw surveyError;
      }

      // Get responses for each question
      const results = [];
      for (const question of survey.survey_questions || []) {
        const { data: responses } = await supabase
          .from('survey_responses')
          .select('*')
          .eq('question_id', question.id)
          .eq('tenant_id', userData.tenant_id);

        const totalResponses = responses?.length || 0;
        
        let questionResult: any = {
          questionId: question.id,
          questionText: question.question_text,
          questionType: question.question_type,
          totalResponses
        };

        // Process responses based on question type
        if (question.question_type === 'yes_no') {
          const yesCount = responses?.filter(r => r.response_text === 'yes').length || 0;
          const noCount = responses?.filter(r => r.response_text === 'no').length || 0;
          questionResult.yesCount = yesCount;
          questionResult.noCount = noCount;
          questionResult.yesPercentage = totalResponses > 0 ? Math.round((yesCount / totalResponses) * 100) : 0;
        } else if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
          const optionCounts: Record<string, number> = {};
          responses?.forEach(response => {
            if (response.response_options) {
              response.response_options.forEach((option: string) => {
                optionCounts[option] = (optionCounts[option] || 0) + 1;
              });
            }
          });
          questionResult.optionCounts = optionCounts;
        } else if (question.question_type === 'rating') {
          const ratings = responses?.map(r => parseInt(r.response_text)).filter(r => !isNaN(r)) || [];
          const averageRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
          questionResult.ratings = ratings;
          questionResult.averageRating = Math.round(averageRating * 100) / 100;
        }

        results.push(questionResult);
      }

      return new Response(
        JSON.stringify({ success: true, results }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } else {
      // Create Survey (default action)
      const surveyData: CreateSurveyRequest = body;
      
      console.log('Creating survey:', surveyData);

      // Insert survey
      const { data: survey, error: surveyError } = await supabase
        .from('surveys')
        .insert({
          title: surveyData.title,
          description: surveyData.description,
          survey_type: surveyData.surveyType,
          target_audience: surveyData.targetAudience,
          expires_at: surveyData.expiresAt,
          is_anonymous: surveyData.isAnonymous,
          tenant_id: userData.tenant_id,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (surveyError) {
        console.error('Survey creation error:', surveyError);
        throw surveyError;
      }

      console.log('Survey created:', survey);

      // Insert questions
      if (surveyData.questions && surveyData.questions.length > 0) {
        const questions = surveyData.questions.map((q, index) => ({
          survey_id: survey.id,
          question_text: q.questionText,
          question_type: q.questionType,
          options: q.options.length > 0 ? q.options : null,
          is_required: q.isRequired,
          sort_order: index
        }));

        const { error: questionsError } = await supabase
          .from('survey_questions')
          .insert(questions);

        if (questionsError) {
          console.error('Questions creation error:', questionsError);
          throw questionsError;
        }

        console.log('Questions created successfully');

        // Automatically send WhatsApp notifications after creating survey
        try {
          console.log('Sending automatic notifications for new survey:', survey.id);
          
          // Get target audience contacts based on survey settings
          let contacts = [];
          if (survey.target_audience === 'guardians' || survey.target_audience === 'both') {
            const { data: guardians } = await supabase
              .from('guardians')
              .select('whatsapp_number, full_name')
              .eq('tenant_id', userData.tenant_id)
              .not('whatsapp_number', 'is', null);
            
            contacts.push(...(guardians || []));
          }

          // Send WhatsApp notifications
          let autoNotificationsSent = 0;
          for (const contact of contacts) {
            try {
              const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('whatsapp-outbound', {
                body: {
                  tenantId: userData.tenant_id,
                  to: contact.whatsapp_number,
                  templateName: 'survey_notification',
                  templateData: {
                    guardianName: contact.full_name,
                    surveyTitle: survey.title,
                    surveyDescription: survey.description || '',
                    nurseryName: userData.tenants?.name || ''
                  },
                  contextType: 'survey',
                  contextId: survey.id
                }
              });
              
              if (whatsappError) {
                console.error('WhatsApp auto-notification error:', whatsappError);
              } else {
                console.log('WhatsApp auto-notification sent successfully to:', contact.whatsapp_number);
                autoNotificationsSent++;
              }
            } catch (contactError) {
              console.error('Failed to send auto-notification to:', contact.whatsapp_number, contactError);
            }
          }
          
          console.log(`Sent ${autoNotificationsSent} automatic notifications for survey`);
        } catch (autoNotifyError) {
          console.error('Error sending automatic survey notifications:', autoNotifyError);
          // Don't throw here, as survey was created successfully
        }
      }

      return new Response(
        JSON.stringify({ success: true, survey }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

  } catch (error: any) {
    console.error('Error in surveys-api:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});