import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Testing WhatsApp configuration...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

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

    const tenantId = userData.tenant_id;

    // Get WhatsApp settings for tenant
    const { data: settings, error: settingsError } = await supabase
      .from('tenant_settings')
      .select('key, value')
      .eq('tenant_id', tenantId)
      .in('key', ['wa_webhook_url', 'wa_webhook_secret', 'wa_templates_json']);

    console.log('Settings found:', settings);

    const settingsMap = settings?.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, any>) || {};

    // Get a test guardian
    const { data: guardians, error: guardiansError } = await supabase
      .from('guardians')
      .select('whatsapp_number, full_name')
      .eq('tenant_id', tenantId)
      .not('whatsapp_number', 'is', null)
      .limit(1);

    console.log('Guardians found:', guardians);
    
    const diagnostics = {
      tenantId,
      tenantName: userData.tenants?.name,
      settings: {
        hasWebhookUrl: !!settingsMap.wa_webhook_url,
        webhookUrl: settingsMap.wa_webhook_url,
        hasSecret: !!settingsMap.wa_webhook_secret,
        hasTemplates: !!settingsMap.wa_templates_json,
        templatesCount: settingsMap.wa_templates_json ? Object.keys(settingsMap.wa_templates_json).length : 0,
        availableTemplates: settingsMap.wa_templates_json ? Object.keys(settingsMap.wa_templates_json) : []
      },
      guardians: {
        totalFound: guardians?.length || 0,
        hasTestGuardian: !!guardians?.[0],
        testNumber: guardians?.[0]?.whatsapp_number
      }
    };

    console.log('Diagnostics:', diagnostics);

    // Test sending a message if requested
    const body = await req.json().catch(() => ({}));
    if (body.sendTest && guardians?.[0]) {
      console.log('Sending test message...');
      const { data: testResult, error: testError } = await supabase.functions.invoke('whatsapp-outbound', {
        body: {
          tenantId: tenantId,
          to: guardians[0].whatsapp_number,
          templateName: 'general_notification',
          templateData: {
            nurseryName: userData.tenants?.name || 'الحضانة',
            message: 'رسالة اختبار من النظام'
          },
          contextType: 'test',
          contextId: crypto.randomUUID()
        }
      });

      diagnostics.testResult = {
        success: !testError,
        error: testError?.message,
        result: testResult
      };
    }

    return new Response(JSON.stringify(diagnostics, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in test-whatsapp function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});