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
    const { teacherId } = await req.json();

    if (!teacherId) {
      throw new Error("معرف المعلمة مطلوب");
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // جلب بيانات المعلمة مع بيانات الحضانة
    const { data: teacher, error: teacherError } = await supabaseClient
      .from('users')
      .select(`
        *,
        tenants (
          id,
          name,
          phone
        )
      `)
      .eq('id', teacherId)
      .single();

    if (teacherError || !teacher) {
      throw new Error("لم يتم العثور على المعلمة");
    }

    // التحقق من أن المعلمة نشطة
    if (!teacher.is_active) {
      throw new Error("المعلمة غير نشطة");
    }

    // إنشاء كلمة مرور مؤقتة
    const newTempPassword = 'TK' + Date.now().toString().slice(-8);

    // تحديث كلمة المرور المؤقتة
    const { error: updateError } = await supabaseClient
      .from('users')
      .update({
        updated_at: new Date().toISOString()
      })
      .eq('id', teacherId);

    if (updateError) {
      console.log("Warning: Could not update teacher record:", updateError);
    }

    // إنشاء أو تحديث حساب في Supabase Auth
    try {
      // محاولة إنشاء المستخدم أولاً
      const { data: authUser, error: createAuthError } = await supabaseClient.auth.admin.createUser({
        email: teacher.email,
        password: newTempPassword,
        user_metadata: {
          full_name: teacher.full_name,
          tenant_id: teacher.tenant_id,
          is_teacher: true
        },
        email_confirm: true
      });

      if (createAuthError && createAuthError.message !== 'User already registered') {
        console.log('Error creating auth user:', createAuthError);
        
        // إذا كان المستخدم موجود، نحدث كلمة المرور
        try {
          const { error: updateAuthError } = await supabaseClient.auth.admin.updateUserById(
            teacher.id,
            { password: newTempPassword }
          );
          
          if (updateAuthError) {
            console.log('Error updating auth password:', updateAuthError);
          }
        } catch (updateError) {
          console.log('Failed to update existing user password:', updateError);
        }
      } else {
        console.log('Auth user created/updated successfully for teacher:', teacher.full_name);
      }
    } catch (authError) {
      console.error('Auth operation failed:', authError);
    }

    // إرسال رسالة الواتساب عبر whatsapp-outbound function
    try {
      const outboundResponse = await supabaseClient.functions.invoke('whatsapp-outbound', {
        body: {
          tenantId: teacher.tenant_id,
          to: teacher.phone,
          templateName: 'login_credentials',
          templateData: {
            nurseryName: teacher.tenants?.name || 'الحضانة',
            email: teacher.email,
            tempPassword: newTempPassword,
            teacherName: teacher.full_name
          },
          contextType: 'teacher_login',
          contextId: teacherId
        }
      });

      if (outboundResponse.error) {
        console.error('Error sending WhatsApp via outbound function:', outboundResponse.error);
        throw new Error("فشل في إرسال رسالة الواتساب");
      } else {
        console.log('WhatsApp message sent successfully via outbound function:', outboundResponse.data);
      }
    } catch (outboundError) {
      console.error('Error calling whatsapp-outbound function:', outboundError);
      throw new Error("فشل في إرسال رسالة الواتساب: " + outboundError.message);
    }

    console.log(`Teacher credentials sent successfully: ${teacher.full_name}`);
    console.log(`Temporary password: ${newTempPassword}`);
    console.log(`WhatsApp recipient: ${teacher.phone}`);

    return new Response(JSON.stringify({
      success: true,
      message: "تم إرسال بيانات تسجيل الدخول بنجاح",
      tempPassword: newTempPassword,
      recipient: teacher.phone,
      teacherName: teacher.full_name
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error('Error in send-teacher-credentials:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});