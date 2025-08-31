import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendMessageRequest {
  tenantId: string;
  to: string;
  message?: string;
  templateName?: string;
  templateData?: Record<string, any>;
  mediaUrl?: string;
  contextType?: string;
  contextId?: string;
  studentId?: string;
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
    console.log('Processing WhatsApp outbound message request');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const requestData: SendMessageRequest = await req.json();
    const { tenantId, to, message, templateName, templateData, mediaUrl, contextType, contextId, studentId } = requestData;

    if (!tenantId || !to) {
      return new Response('tenantId and to are required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name, status')
      .eq('id', tenantId)
      .eq('status', 'approved')
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found or not approved:', tenantError);
      return new Response('Tenant not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Get WhatsApp settings for tenant
    const { data: settings } = await supabase
      .from('tenant_settings')
      .select('key, value')
      .eq('tenant_id', tenantId)
      .in('key', ['wa_webhook_url', 'wa_webhook_secret', 'wa_templates_json']);

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>) || {};

    const webhookUrl = settingsMap.wa_webhook_url;
    const webhookSecret = settingsMap.wa_webhook_secret;
    const templates = settingsMap.wa_templates_json || {};

    if (!webhookUrl) {
      console.error('WhatsApp webhook URL not configured for tenant');
      return new Response('WhatsApp webhook not configured', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    let messageText = message;

    // Use template if specified
    if (templateName && templates[templateName]) {
      messageText = processTemplate(templates[templateName], templateData || {});
      
      // Add card URL if it exists in templateData for reward notifications
      if (templateData?.cardUrl && templateName === 'reward_notification') {
        messageText += `\n\n🎉 شاهد بطاقة التحفيز:\n${templateData.cardUrl}`;
      }
    }

    if (!messageText && !mediaUrl) {
      return new Response('Message text or media URL required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Prepare message payload for N8N
    const messagePayload: any = {
      to: to,
      tenantId: tenantId,
      timestamp: new Date().toISOString(),
      contextType: contextType || 'general',
      contextId: contextId,
      studentId: studentId,
      templateName: templateName
    };

    if (messageText) {
      messagePayload.message = messageText;
    }

    if (mediaUrl) {
      messagePayload.mediaUrl = mediaUrl;
      messagePayload.mediaType = mediaUrl.match(/\.(jpg|jpeg|png|gif)$/i) ? 'image' : 
                               mediaUrl.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'document';
    }

    // Add webhook secret if configured
    if (webhookSecret) {
      messagePayload.secret = webhookSecret;
    }

    console.log('Sending message payload to N8N:', JSON.stringify(messagePayload, null, 2));

    // Send message via N8N Webhook
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messagePayload)
    });

    let result: any = {};
    try {
      result = await response.json();
    } catch (e) {
      result = { message: 'Response received but no JSON data' };
    }
    console.log('N8N Webhook response:', JSON.stringify(result, null, 2));

    // Log outbound message in database
    const { data: messageRecord, error: messageError } = await supabase
      .from('wa_messages')
      .insert({
        tenant_id: tenantId,
        direction: 'outbound',
        from_number: 'system',
        to_number: to,
        message_text: messageText,
        message_type: mediaUrl ? 'media' : 'text',
        media_url: mediaUrl,
        context_type: contextType || 'general',
        context_id: contextId || crypto.randomUUID(), // Generate UUID if contextId is missing
        student_id: studentId,
        template_name: templateName,
        message_id: result.messageId || result.id,
        status: response.ok ? 'sent' : 'failed',
        error_message: response.ok ? null : result.error || 'Unknown error',
        webhook_data: result,
        processed: true,
        sent_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (messageError) {
      console.error('Error logging message:', messageError);
    }

    if (!response.ok) {
      console.error('Failed to send WhatsApp message via N8N:', result);
      return new Response(JSON.stringify({
        success: false,
        error: result.error || 'Failed to send message to N8N',
        messageId: messageRecord?.id
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId || result.id,
      dbMessageId: messageRecord?.id
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Outbound message processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// Helper function to process message templates
function processTemplate(template: string, data: Record<string, any>): string {
  let processedTemplate = template;
  
  // Replace placeholders like {{studentName}}, {{time}}, etc.
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    processedTemplate = processedTemplate.replace(placeholder, data[key] || '');
  });
  
  // Replace common placeholders with current data
  const now = new Date();
  const currentTime = now.toLocaleTimeString('ar-SA', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
  const currentDate = now.toLocaleDateString('ar-SA');
  
  processedTemplate = processedTemplate
    .replace(/{{currentTime}}/g, currentTime)
    .replace(/{{currentDate}}/g, currentDate)
    .replace(/{{nurseryName}}/g, data.nurseryName || 'الحضانة');
  
  return processedTemplate;
}