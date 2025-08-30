import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('بدء إنشاء المستخدم...')

    // إنشاء المستخدم الجديد مباشرة
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: 'admin@smartkindy.com',
      password: 'SuperAdmin2024!',
      email_confirm: true,
      user_metadata: {
        full_name: 'مدير النظام الرئيسي'
      }
    })

    if (authError) {
      console.error('خطأ في إنشاء المستخدم:', authError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'خطأ في إنشاء المستخدم: ' + authError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'فشل في إنشاء المستخدم - لا توجد بيانات مستخدم'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('تم إنشاء المستخدم في Auth:', newUser.user.id)

    // إضافة السجل في جدول users باستخدام service role
    const { error: profileError } = await supabaseAdmin
      .from('users')
      .insert({
        id: newUser.user.id,
        email: 'admin@smartkindy.com',
        full_name: 'مدير النظام الرئيسي',
        role: 'super_admin',
        tenant_id: null,
        is_active: true
      })

    if (profileError) {
      console.error('خطأ في إنشاء الملف الشخصي:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'خطأ في إنشاء الملف الشخصي: ' + profileError.message
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    console.log('تم إنشاء الملف الشخصي بنجاح')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'تم إنشاء حساب المدير العام بنجاح',
        credentials: {
          email: 'admin@smartkindy.com',
          password: 'SuperAdmin2024!'
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('خطأ عام:', error)
    return new Response(
      JSON.stringify({ 
        success: false,
        error: 'خطأ غير متوقع: ' + (error.message || error.toString())
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})