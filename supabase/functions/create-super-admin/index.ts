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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // حذف المستخدم الحالي إذا كان موجوداً
    try {
      const { data: existingUsers } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('email', 'admin@smartkindy.com')
      
      if (existingUsers && existingUsers.length > 0) {
        // حذف من جدول users أولاً
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('email', 'admin@smartkindy.com')
        
        // ثم من auth.users
        for (const user of existingUsers) {
          await supabaseAdmin.auth.admin.deleteUser(user.id)
        }
      }
    } catch (deleteError) {
      console.log('تم تجاهل خطأ الحذف:', deleteError)
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

    if (!newUser.user) {
      throw new Error('فشل في إنشاء المستخدم')
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
      JSON.stringify({ 
        success: false,
        error: error.message || 'حدث خطأ غير متوقع' 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})