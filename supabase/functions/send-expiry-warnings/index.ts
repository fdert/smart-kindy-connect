import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log('Starting expiry warnings check...');

    // استدعاء دالة قاعدة البيانات لإرسال تنبيهات انتهاء الاشتراك
    const { error: functionError } = await supabaseClient
      .rpc('send_expiry_warnings');

    if (functionError) throw functionError;

    console.log('Expiry warnings function executed successfully');

    // الآن قم بمعالجة الرسائل المُجدولة
    const { data: pendingMessages, error: fetchError } = await supabaseClient
      .from('whatsapp_messages')
      .select('*')
      .eq('message_type', 'expiry_warning')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString());

    if (fetchError) throw fetchError;

    console.log(`Found ${pendingMessages?.length || 0} expiry warning messages to send`);

    const results = [];
    
    for (const message of pendingMessages || []) {
      try {
        // محاكاة إرسال رسالة واتساب
        console.log(`Sending expiry warning WhatsApp to ${message.recipient_phone}:`);
        console.log(message.message_content);
        
        // تحديث حالة الرسالة إلى مرسلة
        const { error: updateError } = await supabaseClient
          .from('whatsapp_messages')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString()
          })
          .eq('id', message.id);

        if (updateError) throw updateError;

        results.push({
          id: message.id,
          status: 'sent',
          recipient: message.recipient_phone,
          type: 'expiry_warning'
        });

      } catch (error) {
        console.error(`Failed to send expiry warning ${message.id}:`, error);
        
        await supabaseClient
          .from('whatsapp_messages')
          .update({ status: 'failed' })
          .eq('id', message.id);

        results.push({
          id: message.id,
          status: 'failed',
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-expiry-warnings:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});