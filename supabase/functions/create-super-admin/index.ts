import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
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

    // حذف المستخدم الحالي إذا كان موجوداً
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail('admin@smartkindy.com')
    
    if (existingUser.user) {
      await supabaseAdmin.auth.admin.deleteUser(existingUser.user.id)
      
      // حذف السجل من جدول users إذا كان موجوداً
      await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', existingUser.user.id)
    }

    // إنشاء المستخدم الجديد
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
      throw authError
    }

    // إضافة السجل في جدول users
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
      throw profileError
    }

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
    console.error('خطأ:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})