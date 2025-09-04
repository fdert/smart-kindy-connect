import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('🧪 Testing WhatsApp direct send...');

    // Test direct call to whatsapp-outbound
    const { data: testResult, error: testError } = await supabase.functions.invoke('whatsapp-outbound', {
      body: {
        tenantId: '05c50850-3919-4fd9-a962-5b1174ee2b6c',
        to: '+966535983261',
        message: '🧪 رسالة تجريبية من SmartKindy\n\nهذه رسالة اختبار للتأكد من عمل الواتساب\n\nالتوقيت: ' + new Date().toLocaleString('ar-SA'),
        context: {
          type: 'test_message'
        }
      }
    });

    console.log('Test WhatsApp result:', testResult);
    console.log('Test WhatsApp error:', testError);

    if (testError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'WhatsApp test failed',
        details: testError
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'WhatsApp test completed',
      result: testResult
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Test WhatsApp error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});