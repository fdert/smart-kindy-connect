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
      console.error('Missing required parameters:', { tenantId, to });
      return new Response(JSON.stringify({
        error: 'tenantId and to are required',
        details: { hastenantId: !!tenantId, hasTo: !!to }
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
      console.error('WhatsApp webhook URL not configured for tenant:', tenantId);
      return new Response(JSON.stringify({
        error: 'WhatsApp webhook not configured',
        details: { tenantId, hasSettings: !!settings?.length }
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let messageText = message;

    // Use template if specified
    if (templateName && templates[templateName]) {
      console.log(`Using template: ${templateName}`, templates[templateName]);
      console.log('Template data before processing:', JSON.stringify(templateData, null, 2));
      messageText = processTemplate(templates[templateName], templateData || {});
      console.log(`Processed message text: ${messageText}`);
      
      // Add card URL if it exists in templateData for reward notifications
      if (templateData?.cardUrl && templateName === 'reward_notification') {
        messageText += `\n\n🎉 شاهد بطاقة التحفيز:\n${templateData.cardUrl}`;
      }
    } else if (templateName) {
      console.log(`Template '${templateName}' not found in:`, Object.keys(templates));
      console.log('Template data provided:', templateData);
      
      // Create fallback templates for common cases
      if (templateName === 'permission_request' && templateData) {
        messageText = `🔔 *طلب إذن جديد*

السلام عليكم *${templateData.guardianName || 'ولي الأمر المحترم'}* ✨

┌─────────────────────────┐
│        📋 *تفاصيل الإذن*        │
└─────────────────────────┘

🎯 *الموضوع:*
   ${templateData.permissionTitle || 'الإذن'}

📝 *الوصف:*
   ${templateData.permissionDescription || 'الإذن'}

👤 *اسم الطالب/ة:*
   ${templateData.studentName || 'الطالب'}

⏰ *تاريخ انتهاء الطلب:*
   ${templateData.expiresAt || 'غير محدد'}

┌─────────────────────────┐
│          🔗 *الاستجابة*          │
└─────────────────────────┘

${templateData.permissionLink || `https://5f232500-a2a2-44ad-9709-756a29678377.sandbox.lovable.dev/permission/${contextId}`}

👆 *اضغط على الرابط أعلاه للاستجابة*

━━━━━━━━━━━━━━━━━━━━━━━

🙏 نشكركم لتعاونكم معنا

مع أطيب التحيات 💝
*${templateData.nurseryName || 'الحضانة'}*`;
      } else if (templateName === 'survey_notification' && templateData) {
        // Build the survey link with the correct production domain
        let surveyLink = templateData.surveyLink;
        if (!surveyLink && contextId) {
          // Use the correct production domain
          surveyLink = `https://5f232500-a2a2-44ad-9709-756a29678377.sandbox.lovable.dev/survey/${contextId}`;
        }
        
        console.log(`Survey notification - contextId: ${contextId}, surveyLink: ${surveyLink}`);
        
        messageText = `📊 *استطلاع رأي جديد*

السلام عليكم *${templateData.guardianName || 'ولي الأمر المحترم'}* ✨

┌─────────────────────────┐
│       📋 *تفاصيل الاستطلاع*      │
└─────────────────────────┘

🎯 *عنوان الاستطلاع:*
   ${templateData.surveyTitle || 'الاستطلاع'}

${templateData.surveyDescription ? `📝 *الوصف:*
   ${templateData.surveyDescription}

` : ''}${templateData.surveyQuestions ? `📋 *الأسئلة:*
${templateData.surveyQuestions}

` : ''}┌─────────────────────────┐
│        🔗 *المشاركة*         │
└─────────────────────────┘

${surveyLink}

👆 *اضغط على الرابط أعلاه للمشاركة*

━━━━━━━━━━━━━━━━━━━━━━━

🙏 نقدر وقتكم ومشاركتكم في تحسين خدماتنا

مع أطيب التحيات 💝
*${templateData.nurseryName || 'إدارة الحضانة'}*`;
        
        console.log(`Generated survey message with link: ${messageText}`);
      } else {
        // Use fallback message if template is missing
        messageText = message || `رسالة من ${templateData?.nurseryName || 'الحضانة'}`;
      }
    }

    if (!messageText && !mediaUrl) {
      console.error('No message text or media URL provided', { templateName, templateData, message });
      return new Response(JSON.stringify({
        error: 'Message text or media URL required',
        details: { templateName, hasTemplate: !!templates[templateName], hasMessage: !!message }
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
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
    try {
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
          context_id: contextId && contextId.length === 36 ? contextId : null, // Only insert valid UUIDs
          student_id: studentId,
          template_name: templateName,
          message_id: result.messageId || result.id || crypto.randomUUID(),
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
      } else {
        console.log('Message logged successfully with ID:', messageRecord?.id);
      }
    } catch (logError) {
      console.error('Failed to log message in database:', logError);
      // Continue processing even if logging fails
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
  console.log('Processing template with data:', JSON.stringify(data, null, 2));
  Object.keys(data).forEach(key => {
    const placeholder = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    const oldTemplate = processedTemplate;
    processedTemplate = processedTemplate.replace(placeholder, data[key] || '');
    if (oldTemplate !== processedTemplate) {
      console.log(`Replaced {{${key}}} with: ${data[key]}`);
    }
  });
  
  console.log(`Template after replacements: ${processedTemplate}`);
  
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