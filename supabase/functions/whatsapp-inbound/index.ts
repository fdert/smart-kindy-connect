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
        message: `مرحباً بك في ${tenant.name} 🌟\n\nلطلب استئذان طفلك، يرجى إرسال رسالة بالصيغة التالية:\n\nاستئذان [اسم الطالب] [الوقت]\nمثال: استئذان سارة 12:30\n\nللاستفسارات الأخرى، يرجى التواصل مع إدارة الحضانة.`,
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