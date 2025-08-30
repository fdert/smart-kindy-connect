import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreatePermissionRequest {
  title: string;
  description?: string;
  permissionType: string;
  expiresAt: string;
  studentIds: string[];
}

interface RespondToPermissionRequest {
  response: 'approved' | 'declined';
  notes?: string;
  otpToken: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');

    // Create permission
    if (req.method === 'POST' && pathParts.length === 1) {
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      if (!userData?.tenant_id) {
        return new Response('Tenant not found', { status: 404, headers: corsHeaders });
      }

      const requestData: CreatePermissionRequest = await req.json();
      
      // Create permission
      const { data: permission, error: permissionError } = await supabase
        .from('permissions')
        .insert({
          tenant_id: userData.tenant_id,
          title: requestData.title,
          description: requestData.description,
          permission_type: requestData.permissionType,
          expires_at: requestData.expiresAt,
          created_by: user.id
        })
        .select('id')
        .single();

      if (permissionError) throw permissionError;

      // Create responses for each student and their guardians
      for (const studentId of requestData.studentIds) {
        const { data: guardianLinks } = await supabase
          .from('guardian_student_links')
          .select('guardian_id, guardians(*)')
          .eq('student_id', studentId)
          .eq('tenant_id', userData.tenant_id);

        for (const link of guardianLinks || []) {
          const otpToken = crypto.randomUUID();
          const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

          await supabase
            .from('permission_responses')
            .insert({
              tenant_id: userData.tenant_id,
              permission_id: permission.id,
              guardian_id: link.guardian_id,
              student_id: studentId,
              response: 'pending',
              otp_token: otpToken,
              otp_expires_at: otpExpiresAt.toISOString()
            });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        permissionId: permission.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Respond to permission
    if (req.method === 'POST' && pathParts[2] === 'respond') {
      const permissionId = pathParts[1];
      const requestData: RespondToPermissionRequest = await req.json();

      // Verify OTP token
      const { data: response, error: responseError } = await supabase
        .from('permission_responses')
        .select('*')
        .eq('permission_id', permissionId)
        .eq('otp_token', requestData.otpToken)
        .gt('otp_expires_at', new Date().toISOString())
        .single();

      if (responseError || !response) {
        return new Response('Invalid or expired token', { 
          status: 400, 
          headers: corsHeaders 
        });
      }

      // Update response
      const { error: updateError } = await supabase
        .from('permission_responses')
        .update({
          response: requestData.response,
          notes: requestData.notes,
          responded_at: new Date().toISOString()
        })
        .eq('id', response.id);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send notifications
    if (req.method === 'POST' && pathParts[2] === 'notify') {
      const permissionId = pathParts[1];
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      if (!user) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: userData } = await supabase
        .from('users')
        .select('tenant_id')
        .eq('id', user.id)
        .single();

      // Get permission and pending responses
      const { data: permission } = await supabase
        .from('permissions')
        .select(`
          *,
          permission_responses(
            *,
            guardians(*),
            students(*)
          )
        `)
        .eq('id', permissionId)
        .eq('tenant_id', userData?.tenant_id)
        .single();

      if (!permission) {
        return new Response('Permission not found', { status: 404, headers: corsHeaders });
      }

      // Send WhatsApp notifications for pending responses
      const pendingResponses = permission.permission_responses.filter(
        (r: any) => r.response === 'pending'
      );

      for (const response of pendingResponses) {
        if (response.guardians?.whatsapp_number) {
          const responseUrl = `${req.headers.get('origin') || 'https://smartkindy.com'}/permissions/respond?token=${response.otp_token}`;
          
          await supabase.functions.invoke('whatsapp-outbound', {
            body: {
              tenantId: userData?.tenant_id,
              to: response.guardians.whatsapp_number,
              templateName: 'permission_request',
              templateData: {
                studentName: response.students?.full_name,
                permissionTitle: permission.title,
                permissionDescription: permission.description,
                responseUrl: responseUrl,
                nurseryName: 'الحضانة'
              },
              contextType: 'permission',
              contextId: permissionId,
              studentId: response.student_id
            }
          });
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        notificationsSent: pendingResponses.length 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get permission responses
    if (req.method === 'GET' && pathParts[2] === 'responses') {
      const permissionId = pathParts[1];
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: responses } = await supabase
        .from('permission_responses')
        .select(`
          *,
          guardians(*),
          students(*)
        `)
        .eq('permission_id', permissionId);

      return new Response(JSON.stringify(responses), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Permissions API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});