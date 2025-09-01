import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// نمط محاكاة إرسال الواتساب (للتطوير)
// في الإنتاج، استبدل هذه الدالة مع API الواتساب الحقيقي
async function sendWhatsAppMessage(phone: string, message: string) {
  // محاكاة تأخير الشبكة
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // في الإنتاج، استخدم Twilio أو WhatsApp Business API
  console.log(`📱 WhatsApp sent to ${phone}:`);
  console.log(`📝 Message: ${message}`);
  
  // إرجاع نجاح محاكي
  return { success: true, messageId: `wa_${Date.now()}` };
}

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

    // جلب الرسائل المعلقة
    const { data: pendingMessages, error: fetchError } = await supabaseClient
      .from('whatsapp_messages')
      .select('*')
      .eq('status', 'pending')
      .lte('scheduled_at', new Date().toISOString())
      .limit(50);

    if (fetchError) {
      console.error('Error fetching messages:', fetchError);
      throw fetchError;
    }

    console.log(`📋 Found ${pendingMessages?.length || 0} pending messages`);

    const results = [];
    
    for (const message of pendingMessages || []) {
      try {
        // إرسال رسالة واتساب
        const result = await sendWhatsAppMessage(
          message.recipient_phone, 
          message.message_content
        );
        
        if (result.success) {
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
            messageId: result.messageId
          });

          console.log(`✅ Message sent successfully to ${message.recipient_phone}`);
        }

      } catch (error) {
        console.error(`❌ Failed to send message ${message.id}:`, error);
        
        // تحديث حالة الرسالة إلى فاشلة
        await supabaseClient
          .from('whatsapp_messages')
          .update({ 
            status: 'failed',
            sent_at: new Date().toISOString()
          })
          .eq('id', message.id);

        results.push({
          id: message.id,
          status: 'failed',
          error: error.message,
          recipient: message.recipient_phone
        });
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      processed: results.length,
      results,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('❌ Error in send-whatsapp-notifications:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});