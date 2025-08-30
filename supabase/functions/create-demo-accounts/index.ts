import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // إنشاء Supabase admin client
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

    const demoTenantId = '11111111-1111-1111-1111-111111111111'
    
    // الحسابات التجريبية
    const demoUsers = [
      {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'superadmin@smartkindy.com',
        password: 'demo123456',
        full_name: 'مدير عام النظام',
        role: 'super_admin',
        tenant_id: null
      },
      {
        id: '00000000-0000-0000-0000-000000000002',
        email: 'owner@smartkindy.com',
        password: 'demo123456',
        full_name: 'مدير الروضة التجريبية',
        role: 'owner',
        tenant_id: demoTenantId
      },
      {
        id: '00000000-0000-0000-0000-000000000003',
        email: 'teacher@smartkindy.com',
        password: 'demo123456',
        full_name: 'المعلمة التجريبية',
        role: 'teacher',
        tenant_id: demoTenantId
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        email: 'parent@smartkindy.com',
        password: 'demo123456',
        full_name: 'ولي أمر تجريبي',
        role: 'guardian',
        tenant_id: demoTenantId
      }
    ]

    const results = []

    for (const user of demoUsers) {
      try {
        // التحقق من وجود المستخدم في auth.users
        const { data: existingAuthUser } = await supabaseAdmin.auth.admin.getUserById(user.id)
        
        if (!existingAuthUser.user) {
          // إنشاء المستخدم في auth.users
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            id: user.id,
            email: user.email,
            password: user.password,
            email_confirm: true,
            user_metadata: {
              full_name: user.full_name,
              role: user.role
            }
          })

          if (authError) {
            console.error(`Failed to create auth user ${user.email}:`, authError)
            results.push({ email: user.email, success: false, error: authError.message })
            continue
          }

          console.log(`Created auth user: ${user.email}`)
        }

        // التحقق من وجود المستخدم في جدول users
        const { data: existingUser } = await supabaseAdmin
          .from('users')
          .select('id')
          .eq('id', user.id)
          .single()

        if (!existingUser) {
          // إنشاء المستخدم في جدول users
          const { error: userError } = await supabaseAdmin
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.full_name,
              role: user.role,
              tenant_id: user.tenant_id,
              is_active: true
            })

          if (userError) {
            console.error(`Failed to create user record ${user.email}:`, userError)
            results.push({ email: user.email, success: false, error: userError.message })
            continue
          }

          console.log(`Created user record: ${user.email}`)
        }

        results.push({ email: user.email, success: true })

      } catch (error) {
        console.error(`Error creating user ${user.email}:`, error)
        results.push({ email: user.email, success: false, error: error.message })
      }
    }

    // تحديث owner_id للتينانت التجريبي
    const { error: tenantError } = await supabaseAdmin
      .from('tenants')
      .update({ 
        owner_id: '00000000-0000-0000-0000-000000000002',
        status: 'active'
      })
      .eq('id', demoTenantId)

    if (tenantError) {
      console.error('Failed to update tenant owner:', tenantError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo accounts creation completed',
        results: results 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )

  } catch (error) {
    console.error('Error in create-demo-accounts function:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})