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
    const { tenantId } = await req.json();

    if (!tenantId) {
      throw new Error("معرف الحضانة مطلوب");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // جلب بيانات الحضانة
    const { data: tenant, error: tenantError } = await supabaseClient
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error("لم يتم العثور على الحضانة");
    }

    // التحقق من أن الحضانة معتمدة
    if (tenant.status !== 'approved') {
      throw new Error("الحضانة غير معتمدة");
    }

    // إنشاء كلمة مرور جديدة
    const newTempPassword = 'TK' + Date.now().toString().slice(-8);

    // جلب قالب رسالة تسجيل الدخول من إعدادات الحضانة
    let whatsappMessage = `🔐 بيانات تسجيل الدخول - SmartKindy

حضانة: ${tenant.name}

📧 البريد الإلكتروني: ${tenant.email}
🔑 كلمة المرور: ${newTempPassword}

🌐 رابط تسجيل الدخول:
https://smartkindy.com/auth

⚠️ ملاحظة هامة:
- كلمة المرور صالحة لمدة 24 ساعة
- مطلوب تغيير كلمة المرور عند أول تسجيل دخول
- احتفظ بهذه البيانات في مكان آمن

للدعم الفني: 920012345
SmartKindy - منصة إدارة رياض الأطفال الذكية 🌟`;

    // محاولة استخدام القالب المخصص إذا كان متوفراً
    try {
      const { data: templateSettings } = await supabaseClient
        .from('tenant_settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'wa_templates_json')
        .single();

      if (templateSettings && templateSettings.value && templateSettings.value.login_credentials) {
        const template = templateSettings.value.login_credentials;
        whatsappMessage = template
          .replace(/\{\{nurseryName\}\}/g, tenant.name)
          .replace(/\{\{email\}\}/g, tenant.email)
          .replace(/\{\{tempPassword\}\}/g, newTempPassword);
      }
    } catch (templateError) {
      console.log('Using default template for login credentials');
    }

    // تحديث كلمة المرور المؤقتة في قاعدة البيانات
    const { error: updateError } = await supabaseClient
      .from('tenants')
      .update({
        temp_password: newTempPassword,
        password_reset_required: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', tenantId);

    if (updateError) {
      throw new Error("فشل في تحديث كلمة المرور المؤقتة");
    }

    // إرسال رسالة الواتساب عبر whatsapp-outbound function
    try {
      const outboundResponse = await supabaseClient.functions.invoke('whatsapp-outbound', {
        body: {
          tenantId: tenantId,
          to: tenant.phone,
          templateName: 'login_credentials',
          templateData: {
            nurseryName: tenant.name,
            email: tenant.email,
            tempPassword: newTempPassword
          },
          contextType: 'login',
          contextId: tenantId
        }
      });

      if (outboundResponse.error) {
        console.error('Error sending WhatsApp via outbound function:', outboundResponse.error);
      } else {
        console.log('WhatsApp message sent successfully via outbound function:', outboundResponse.data);
      }
    } catch (outboundError) {
      console.error('Error calling whatsapp-outbound function:', outboundError);
      // في حالة فشل الإرسال، نحفظ الرسالة في قاعدة البيانات للمعالجة اللاحقة
      const fallbackMessage = whatsappMessage
        .replace(/\{\{nurseryName\}\}/g, tenant.name)
        .replace(/\{\{email\}\}/g, tenant.email)
        .replace(/\{\{tempPassword\}\}/g, newTempPassword);
        
      await supabaseClient
        .from('whatsapp_messages')
        .insert({
          tenant_id: tenantId,
          recipient_phone: tenant.phone,
          message_content: fallbackMessage,
          message_type: 'login_credentials',
          scheduled_at: new Date().toISOString(),
          status: 'pending'
        });
    }

    console.log(`Login credentials prepared for tenant: ${tenant.name}`);
    console.log(`Temporary password: ${newTempPassword}`);
    console.log(`WhatsApp recipient: ${tenant.phone}`);

    return new Response(JSON.stringify({
      success: true,
      message: "تم إرسال بيانات تسجيل الدخول بنجاح",
      tempPassword: newTempPassword,
      recipient: tenant.phone
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-login-credentials:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});