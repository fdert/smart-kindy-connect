import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { teacher, tenantId } = await req.json()
    
    console.log('Creating teacher:', teacher)

    // Generate temporary password
    const tempPassword = 'TK' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 6)
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: teacher.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: teacher.full_name,
        is_teacher: true,
        tenant_id: tenantId
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw authError
    }

    console.log('Auth user created:', authData.user.id)

    // Create user record in public.users table
    const userRecord = {
      id: authData.user.id,
      full_name: teacher.full_name,
      email: teacher.email,
      phone: teacher.phone,
      role: teacher.role,
      tenant_id: tenantId,
      is_active: true
    }

    const { error: userError } = await supabaseAdmin
      .from('users')
      .insert(userRecord)

    if (userError) {
      console.error('User record error:', userError)
      // If user record creation fails, clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      throw userError
    }

    console.log('User record created successfully')

    // Get tenant info for WhatsApp message
    const { data: tenantData } = await supabaseAdmin
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single()

    // Create WhatsApp message
    const whatsappMessage = `🔐 بيانات تسجيل الدخول - SmartKindy

حضانة: ${tenantData?.name || ''}

👤 اسم المستخدم: ${teacher.full_name}
📧 البريد الإلكتروني: ${teacher.email}
🔑 كلمة المرور المؤقتة: ${tempPassword}

🌐 رابط تسجيل الدخول:
https://smartkindy.com/auth

⚠️ ملاحظة هامة:
- مطلوب تغيير كلمة المرور عند أول تسجيل دخول
- احتفظ بهذه البيانات في مكان آمن

للدعم الفني: 920012345
مرحباً بك في فريق SmartKindy! 🌟`

    // Insert WhatsApp message
    const { error: whatsappError } = await supabaseAdmin
      .from('whatsapp_messages')
      .insert({
        tenant_id: tenantId,
        recipient_phone: teacher.phone,
        message_content: whatsappMessage,
        message_type: 'teacher_credentials',
        scheduled_at: new Date().toISOString(),
        status: 'pending'
      })

    if (whatsappError) {
      console.warn('WhatsApp message creation failed:', whatsappError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: authData.user.id,
        tempPassword: tempPassword 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error creating teacher:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message || 'حدث خطأ أثناء إنشاء حساب المعلمة' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})