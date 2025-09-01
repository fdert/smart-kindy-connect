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

    // رسالة الواتساب مع بيانات الدخول
    const whatsappMessage = `🔐 بيانات تسجيل الدخول - SmartKindy

حضانة: ${tenant.name}

📧 البريد الإلكتروني: ${tenant.owner_email}
🔑 كلمة المرور: ${newTempPassword}

🌐 رابط تسجيل الدخول:
https://smartkindy.com/auth

⚠️ ملاحظة هامة:
- كلمة المرور صالحة لمدة 24 ساعة
- مطلوب تغيير كلمة المرور عند أول تسجيل دخول
- احتفظ بهذه البيانات في مكان آمن

للدعم الفني: 920012345
SmartKindy - منصة إدارة رياض الأطفال الذكية 🌟`;

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

    // إدراج رسالة الواتساب
    const { error: messageError } = await supabaseClient
      .from('whatsapp_messages')
      .insert({
        tenant_id: tenantId,
        recipient_phone: tenant.owner_phone,
        message_content: whatsappMessage,
        message_type: 'login_credentials',
        scheduled_at: new Date().toISOString(),
        status: 'pending'
      });

    if (messageError) {
      console.error('Error inserting WhatsApp message:', messageError);
      // لا نرمي خطأ هنا لأن الرسالة قد تكون مُرسلة لاحقاً
    }

    console.log(`Login credentials prepared for tenant: ${tenant.name}`);
    console.log(`Temporary password: ${newTempPassword}`);
    console.log(`WhatsApp recipient: ${tenant.owner_phone}`);

    return new Response(JSON.stringify({
      success: true,
      message: "تم إرسال بيانات تسجيل الدخول بنجاح",
      tempPassword: newTempPassword,
      recipient: tenant.owner_phone
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