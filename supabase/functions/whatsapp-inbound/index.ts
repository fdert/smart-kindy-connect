import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-tenant',
};

interface WebhookPayload {
  event: string;
  data: {
    from: string;
    message: {
      conversation?: string;
      type?: string;
    };
    timestamp?: number;
  };
}

interface DismissalRequestData {
  studentName: string;
  time: string;
  reason?: string;
}

interface SurveyResponseData {
  surveyId?: string;
  responses: Array<{
    questionNumber: number;
    answer: string;
    options?: string[];
  }>;
}

interface PermissionResponseData {
  permissionId?: string;
  response: 'approve' | 'reject';
  reason?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('Received WhatsApp inbound webhook');

    // Get tenant from header or extract from subdomain
    const tenantHeader = req.headers.get('x-tenant');
    const host = req.headers.get('host') || '';
    const tenantSlug = tenantHeader || host.split('.')[0];

    if (!tenantSlug) {
      return new Response('Tenant not specified', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, status')
      .eq('slug', tenantSlug)
      .eq('status', 'approved')
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found or not approved:', tenantError);
      return new Response('Tenant not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Get tenant WhatsApp settings
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('key, value')
      .eq('tenant_id', tenant.id)
      .in('key', ['wa_webhook_secret', 'wa_provider', 'wa_api_key']);

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>) || {};

    // Verify webhook signature if secret is configured
    const webhookSecret = settingsMap.wa_webhook_secret;
    if (webhookSecret) {
      const signature = req.headers.get('x-webhook-signature');
      if (!signature || signature !== webhookSecret) {
        console.error('Invalid webhook signature');
        return new Response('Unauthorized', { 
          status: 401, 
          headers: corsHeaders 
        });
      }
    }

    const payload: WebhookPayload = await req.json();
    console.log('Webhook payload:', JSON.stringify(payload, null, 2));

    // Process only message events
    if (payload.event !== 'messages.upsert') {
      console.log('Ignoring non-message event:', payload.event);
      return new Response('Event ignored', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    const { from, message } = payload.data;
    const messageText = message.conversation?.trim() || '';

    if (!messageText) {
      console.log('Empty message, ignoring');
      return new Response('Empty message', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Find guardian by phone number
    const { data: guardian, error: guardianError } = await supabase
      .from('guardians')
      .select(`
        id, full_name, phone, whatsapp_number, tenant_id,
        guardian_student_links!inner(
          student_id, is_primary,
          students!inner(id, full_name, class_id)
        )
      `)
      .eq('tenant_id', tenant.id)
      .or(`phone.eq.${from},whatsapp_number.eq.${from}`)
      .limit(1);

    if (guardianError || !guardian || guardian.length === 0) {
      console.log('Guardian not found for number:', from);
      
      // Log the message for admin review
      await supabase.from('wa_messages').insert({
        tenant_id: tenant.id,
        direction: 'inbound',
        from_number: from,
        to_number: 'system',
        message_text: messageText,
        status: 'failed',
        error_message: 'Guardian not found',
        webhook_data: payload,
        processed: false
      });

      return new Response('Guardian not found', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    const guardianData = guardian[0];
    console.log('Found guardian:', guardianData.full_name);

    // Log incoming message
    const { data: messageRecord } = await supabase
      .from('wa_messages')
      .insert({
        tenant_id: tenant.id,
        direction: 'inbound',
        from_number: from,
        to_number: 'system',
        message_text: messageText,
        guardian_id: guardianData.id,
        context_type: 'general',
        webhook_data: payload,
        status: 'pending',
        processed: false
      })
      .select('id')
      .single();

    // First, check for survey responses
    const surveyResponse = await parseSurveyResponse(supabase, tenant.id, guardianData.id, messageText);
    
    if (surveyResponse) {
      console.log('Processing survey response:', surveyResponse);
      
      // Save survey responses
      for (const response of surveyResponse.responses) {
        const { data: question } = await supabase
          .from('survey_questions')
          .select('id, question_type')
          .eq('survey_id', surveyResponse.surveyId)
          .eq('sort_order', response.questionNumber - 1)
          .single();

        if (question) {
          const responseData: any = {
            tenant_id: tenant.id,
            survey_id: surveyResponse.surveyId,
            question_id: question.id,
            respondent_id: guardianData.id,
            respondent_type: 'guardian'
          };

          // Handle different question types
          if (question.question_type === 'single_choice' || question.question_type === 'multiple_choice') {
            responseData.response_options = response.options || [response.answer];
          } else if (question.question_type === 'yes_no') {
            responseData.response_text = response.answer.toLowerCase() === 'نعم' || response.answer.toLowerCase() === 'yes' ? 'yes' : 'no';
          } else if (question.question_type === 'rating') {
            const rating = parseInt(response.answer);
            responseData.response_text = isNaN(rating) ? '0' : rating.toString();
          } else {
            responseData.response_text = response.answer;
          }

          await supabase.from('survey_responses').insert(responseData);
        }
      }

      // Update message context
      if (messageRecord) {
        await supabase
          .from('wa_messages')
          .update({
            context_type: 'survey_response',
            context_id: surveyResponse.surveyId,
            processed: true,
            status: 'delivered'
          })
          .eq('id', messageRecord.id);
      }

      // Send confirmation
      await sendWhatsAppMessage(supabase, tenant.id, {
        to: from,
        message: `شكراً لك على المشاركة في الاستطلاع! ✅\n\nتم استلام إجاباتك بنجاح.\n\nنقدر وقتكم ومشاركتكم في تحسين خدماتنا.\n\nمع تحيات\n${tenant.name}`,
        contextType: 'survey_response_confirmation',
        contextId: surveyResponse.surveyId,
        messageId: messageRecord?.id
      });

      return new Response('Survey response processed', { 
        status: 200, 
        headers: corsHeaders 
      });
    }

    // Check for permission responses
    const permissionResponse = await parsePermissionResponse(supabase, tenant.id, guardianData.id, messageText);
    
    if (permissionResponse) {
      console.log('Processing permission response:', permissionResponse);

      // Save permission response
      const { error: responseError } = await supabase
        .from('permission_responses')
        .insert({
          tenant_id: tenant.id,
          permission_id: permissionResponse.permissionId,
          guardian_id: guardianData.id,
          response: permissionResponse.response,
          notes: permissionResponse.reason,
          responded_at: new Date().toISOString()
        });

      if (responseError) {
        console.error('Error saving permission response:', responseError);
      } else {
        // Update message context
        if (messageRecord) {
          await supabase
            .from('wa_messages')
            .update({
              context_type: 'permission_response',
              context_id: permissionResponse.permissionId,
              processed: true,
              status: 'delivered'
            })
            .eq('id', messageRecord.id);
        }

        // Send confirmation
        const responseText = permissionResponse.response === 'approve' ? 'موافقة' : 'رفض';
        await sendWhatsAppMessage(supabase, tenant.id, {
          to: from,
          message: `تم استلام ردكم: ${responseText} ✅\n\nشكراً لتفاعلكم مع طلب الإذن.\n\nمع تحيات\n${tenant.name}`,
          contextType: 'permission_response_confirmation',
          contextId: permissionResponse.permissionId,
          messageId: messageRecord?.id
        });

        return new Response('Permission response processed', { 
          status: 200, 
          headers: corsHeaders 
        });
      }
    }

    // Parse dismissal request
    const dismissalData = parseDismissalRequest(messageText);
    
    if (dismissalData) {
      console.log('Parsed dismissal request:', dismissalData);
      
      // Find student by name
      const studentLinks = guardianData.guardian_student_links;
      const matchingStudent = studentLinks.find((link: any) => 
        link.students.full_name.toLowerCase().includes(dismissalData.studentName.toLowerCase())
      );

      if (!matchingStudent) {
        // Student not found - ask for clarification
        await sendWhatsAppMessage(supabase, tenant.id, {
          to: from,
          message: `عذراً، لم أتمكن من العثور على الطالب "${dismissalData.studentName}". يرجى التأكد من كتابة الاسم بشكل صحيح أو إرسال رسالة بالصيغة التالية:\n\nاستئذان [اسم الطالب] [الوقت]\nمثال: استئذان أحمد 12:30`,
          contextType: 'dismissal_error',
          messageId: messageRecord?.id
        });

        return new Response('Student not found', { 
          status: 200, 
          headers: corsHeaders 
        });
      }

      // Create dismissal request
      const pickupTime = parseTime(dismissalData.time);
      
      const { data: dismissalRequest, error: dismissalError } = await supabase
        .from('dismissal_requests')
        .insert({
          tenant_id: tenant.id,
          student_id: matchingStudent.students.id,
          guardian_id: guardianData.id,
          pickup_time: pickupTime,
          reason: dismissalData.reason || 'طلب عبر واتساب',
          status: 'pending',
          pickup_method: 'whatsapp'
        })
        .select('id')
        .single();

      if (dismissalError) {
        console.error('Error creating dismissal request:', dismissalError);
        
        await sendWhatsAppMessage(supabase, tenant.id, {
          to: from,
          message: 'عذراً، حدث خطأ أثناء معالجة طلب الاستئذان. يرجى المحاولة مرة أخرى أو التواصل مع الحضانة.',
          contextType: 'dismissal_error',
          messageId: messageRecord?.id
        });

        return new Response('Error creating dismissal request', { 
          status: 500, 
          headers: corsHeaders 
        });
      }

      // Update message context
      if (messageRecord) {
        await supabase
          .from('wa_messages')
          .update({
            context_type: 'dismissal',
            context_id: dismissalRequest.id,
            student_id: matchingStudent.students.id,
            processed: true,
            status: 'delivered'
          })
          .eq('id', messageRecord.id);
      }

      // Send confirmation message
      await sendWhatsAppMessage(supabase, tenant.id, {
        to: from,
        message: `تم استلام طلب استئذان ${matchingStudent.students.full_name} في تمام الساعة ${dismissalData.time}.\n\nسيتم مراجعة الطلب وإرسال رمز الاستلام عند الموافقة.\n\nشكراً لك.`,
        contextType: 'dismissal_confirmation',
        contextId: dismissalRequest.id,
        studentId: matchingStudent.students.id,
        messageId: messageRecord?.id
      });

    } else {
      // General message - send auto-reply with instructions
      await sendWhatsAppMessage(supabase, tenant.id, {
        to: from,
        message: `مرحباً بك في ${tenant.name} 🌟\n\nيمكنك:\n\n📊 الرد على الاستطلاعات المرسلة\n🔔 الرد على طلبات الأذونات بـ "موافق" أو "غير موافق"\n📝 طلب استئذان: استئذان [اسم الطالب] [الوقت]\n\nمثال: استئذان سارة 12:30\n\nللاستفسارات الأخرى، يرجى التواصل مع إدارة الحضانة.`,
        contextType: 'general_help',
        messageId: messageRecord?.id
      });
    }

    // Mark message as processed
    if (messageRecord) {
      await supabase
        .from('wa_messages')
        .update({ processed: true, status: 'delivered' })
        .eq('id', messageRecord.id);
    }

    return new Response('Message processed successfully', { 
      status: 200, 
      headers: corsHeaders 
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Internal server error', { 
      status: 500, 
      headers: corsHeaders 
    });
  }
});

// Helper function to parse dismissal requests
function parseDismissalRequest(text: string): DismissalRequestData | null {
  const dismissalKeywords = ['استئذان', 'استاذان', 'خروج', 'استلام'];
  const normalizedText = text.toLowerCase().replace(/[أإآ]/g, 'ا');
  
  const hasDismissalKeyword = dismissalKeywords.some(keyword => 
    normalizedText.includes(keyword.toLowerCase())
  );
  
  if (!hasDismissalKeyword) {
    return null;
  }

  // Extract time pattern (HH:MM or HH.MM or HH-MM)
  const timePattern = /(\d{1,2})[:.،-]\s*(\d{2})/;
  const timeMatch = text.match(timePattern);
  
  if (!timeMatch) {
    return null;
  }

  const time = `${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`;
  
  // Extract student name (text between keyword and time)
  const keywordPattern = new RegExp(`(${dismissalKeywords.join('|')})\\s+(.+?)\\s+${timeMatch[0]}`, 'i');
  const nameMatch = text.match(keywordPattern);
  
  let studentName = '';
  if (nameMatch && nameMatch[2]) {
    studentName = nameMatch[2].trim();
  } else {
    // Fallback: try to extract name after keyword
    const fallbackPattern = new RegExp(`(${dismissalKeywords.join('|')})\\s+([^\\d]+)`, 'i');
    const fallbackMatch = text.match(fallbackPattern);
    if (fallbackMatch && fallbackMatch[2]) {
      studentName = fallbackMatch[2].trim().replace(/\s+\d.*$/, '');
    }
  }

  if (!studentName) {
    return null;
  }

  // Extract reason (text after time)
  const reasonPattern = new RegExp(`${timeMatch[0]}\\s+(.+)$`, 'i');
  const reasonMatch = text.match(reasonPattern);
  const reason = reasonMatch ? reasonMatch[1].trim() : undefined;

  return {
    studentName: studentName.trim(),
    time,
    reason
  };
}

// Helper function to parse time and create timestamp
function parseTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const pickupDate = new Date(now);
  pickupDate.setHours(hours, minutes, 0, 0);
  
  // If time is in the past, assume it's for tomorrow
  if (pickupDate < now) {
    pickupDate.setDate(pickupDate.getDate() + 1);
  }
  
  return pickupDate.toISOString();
}

// Helper function to send WhatsApp messages
async function sendWhatsAppMessage(
  supabase: any,
  tenantId: string,
  params: {
    to: string;
    message: string;
    contextType: string;
    contextId?: string;
    studentId?: string;
    messageId?: string;
  }
) {
  const { to, message, contextType, contextId, studentId, messageId } = params;

  try {
    // Get WhatsApp settings for tenant
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('key, value')
      .eq('tenant_id', tenantId)
      .in('key', ['wa_api_base', 'wa_api_key']);

    const settingsMap = settings?.reduce((acc: any, setting: any) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {}) || {};

    const apiBase = settingsMap.wa_api_base || 'https://www.wasenderapi.com';
    const apiKey = settingsMap.wa_api_key;

    if (!apiKey) {
      console.error('WhatsApp API key not configured for tenant');
      return;
    }

    // Send message via WhatSender API
    const response = await fetch(`${apiBase}/api/send-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: to,
        text: message
      })
    });

    const result = await response.json();
    
    // Log outbound message
    await supabase.from('wa_messages').insert({
      tenant_id: tenantId,
      direction: 'outbound',
      from_number: 'system',
      to_number: to,
      message_text: message,
      context_type: contextType,
      context_id: contextId,
      student_id: studentId,
      message_id: result.messageId || result.id,
      status: response.ok ? 'sent' : 'failed',
      webhook_data: result,
      processed: true,
      sent_at: new Date().toISOString()
    });

    console.log('WhatsApp message sent:', response.ok ? 'success' : 'failed');
    
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
  }
}

// Helper function to parse survey responses
async function parseSurveyResponse(
  supabase: any, 
  tenantId: string, 
  guardianId: string, 
  text: string
): Promise<SurveyResponseData | null> {
  try {
    // Get active surveys for this guardian
    const { data: activeSurveys } = await supabase
      .from('surveys')
      .select(`
        id, title,
        survey_questions (id, question_text, question_type, options, sort_order)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!activeSurveys || activeSurveys.length === 0) {
      return null;
    }

    // Try to parse structured responses
    const responses: Array<{
      questionNumber: number;
      answer: string;
      options?: string[];
    }> = [];

    // Look for numbered responses (1. answer, 2. answer, etc.)
    const numberedPattern = /(\d+)[.\)]\s*([^\d\n]+?)(?=\d+[.\)]|$)/g;
    let match;
    
    while ((match = numberedPattern.exec(text)) !== null) {
      const questionNum = parseInt(match[1]);
      let answer = match[2].trim();
      
      // Handle multiple choice by looking for letters (a, b, c, etc.)
      const choicePattern = /([أابتثجحخدذرزسشصضطظعغفقكلمنهوي])\)/g;
      const choices: string[] = [];
      let choiceMatch;
      
      while ((choiceMatch = choicePattern.exec(answer)) !== null) {
        choices.push(choiceMatch[1]);
      }
      
      responses.push({
        questionNumber: questionNum,
        answer: answer,
        options: choices.length > 0 ? choices : undefined
      });
    }

    // If no structured responses found, try to match simple yes/no or approval patterns
    if (responses.length === 0) {
      const yesNoPattern = /^(نعم|لا|yes|no|موافق|غير موافق|أوافق|لا أوافق)$/i;
      const ratingPattern = /^[1-5]$/;
      
      if (yesNoPattern.test(text.trim())) {
        responses.push({
          questionNumber: 1,
          answer: text.trim()
        });
      } else if (ratingPattern.test(text.trim())) {
        responses.push({
          questionNumber: 1,
          answer: text.trim()
        });
      }
    }

    if (responses.length > 0) {
      // Use the most recent active survey
      const survey = activeSurveys[0];
      return {
        surveyId: survey.id,
        responses
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing survey response:', error);
    return null;
  }
}

// Helper function to parse permission responses
async function parsePermissionResponse(
  supabase: any,
  tenantId: string,
  guardianId: string,
  text: string
): Promise<PermissionResponseData | null> {
  try {
    // Get active permissions for this guardian's students
    const { data: activePermissions } = await supabase
      .from('permissions')
      .select(`
        id, title,
        permission_responses!left (id, guardian_id)
      `)
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false });

    if (!activePermissions || activePermissions.length === 0) {
      return null;
    }

    // Find permissions that haven't been responded to by this guardian
    const pendingPermissions = activePermissions.filter(permission => 
      !permission.permission_responses.some((response: any) => response.guardian_id === guardianId)
    );

    if (pendingPermissions.length === 0) {
      return null;
    }

    const normalizedText = text.toLowerCase().trim();
    
    // Check for approval patterns
    const approvalPatterns = [
      'موافق', 'أوافق', 'نعم', 'yes', 'موافقة', 'اوافق', 'نعام'
    ];
    
    // Check for rejection patterns
    const rejectionPatterns = [
      'غير موافق', 'لا أوافق', 'لا', 'no', 'رفض', 'غير موافقة', 'لا اوافق', 'مش موافق'
    ];

    let response: 'approve' | 'reject' | null = null;
    let reason: string | undefined;

    // Check for approval
    if (approvalPatterns.some(pattern => normalizedText.includes(pattern.toLowerCase()))) {
      response = 'approve';
    }
    // Check for rejection
    else if (rejectionPatterns.some(pattern => normalizedText.includes(pattern.toLowerCase()))) {
      response = 'reject';
      
      // Extract reason if provided
      const reasonMatch = text.match(/(?:سبب|لأن|بسبب|reason)[:\s]*(.+)/i);
      if (reasonMatch) {
        reason = reasonMatch[1].trim();
      }
    }

    if (response) {
      // Use the most recent pending permission
      const permission = pendingPermissions[0];
      return {
        permissionId: permission.id,
        response,
        reason
      };
    }

    return null;
  } catch (error) {
    console.error('Error parsing permission response:', error);
    return null;
  }
}