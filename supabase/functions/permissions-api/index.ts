import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.56.1';

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
  guardianId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get the authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get user's tenant
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('tenant_id, tenants(*)')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.tenant_id) {
      throw new Error('User has no associated tenant');
    }

    const body = await req.json();
    console.log('Request body:', body);

    // Handle different actions based on request body
    if (body.action === 'notify' && body.permissionId) {
      // Send Permission Notifications
      const permissionId = body.permissionId;
      
      console.log('Sending notifications for permission:', permissionId);

      // Get permission details with pending responses
      const { data: permission, error: permissionError } = await supabase
        .from('permissions')
        .select(`
          *,
          permission_responses!inner (
            id,
            guardian_id,
            student_id,
            response,
            guardians (
              full_name,
              whatsapp_number
            ),
            students (
              full_name,
              student_id
            )
          )
        `)
        .eq('id', permissionId)
        .eq('tenant_id', userData.tenant_id)
        .eq('permission_responses.response', 'pending')
        .single();

      if (permissionError) {
        throw permissionError;
      }

      // Send WhatsApp notifications for pending responses
      let notificationsSent = 0;
      const responses = permission.permission_responses || [];
      
      for (const response of responses) {
        if (response.guardians?.whatsapp_number && response.response === 'pending') {
          try {
            // Generate OTP token for response
            const otpToken = Math.random().toString(36).substring(2, 8).toUpperCase();
            const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            // Update response with OTP
            await supabase
              .from('permission_responses')
              .update({
                otp_token: otpToken,
                otp_expires_at: otpExpires.toISOString()
              })
              .eq('id', response.id);

            // Send WhatsApp notification
            await supabase.functions.invoke('whatsapp-outbound', {
              body: {
                tenantId: userData.tenant_id,
                to: response.guardians.whatsapp_number,
                templateName: 'permission_request',
                templateData: {
                  guardianName: response.guardians.full_name,
                  studentName: response.students?.full_name || '',
                  permissionTitle: permission.title,
                  permissionDescription: permission.description || '',
                  expiresAt: permission.expires_at,
                  nurseryName: userData.tenants?.name || '',
                  otpToken: otpToken
                },
                contextType: 'permission',
                contextId: permission.id,
                studentId: response.student_id
              }
            });
            notificationsSent++;
          } catch (error) {
            console.error('Failed to send notification:', error);
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, notificationsSent }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } else if (body.action === 'getResponses' && body.permissionId) {
      // Get Permission Responses
      const permissionId = body.permissionId;
      
      console.log('Getting responses for permission:', permissionId);

      const { data: responses, error: responsesError } = await supabase
        .from('permission_responses')
        .select(`
          *,
          guardians (
            full_name,
            whatsapp_number
          ),
          students (
            full_name
          )
        `)
        .eq('permission_id', permissionId)
        .eq('tenant_id', userData.tenant_id);

      if (responsesError) {
        throw responsesError;
      }

      return new Response(
        JSON.stringify(responses || []),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } else if (body.permissionId && body.response && body.otpToken) {
      // Respond to Permission
      const { permissionId, response: responseValue, otpToken, notes } = body;
      
      console.log('Processing permission response:', { permissionId, responseValue, otpToken });

      // Verify OTP and check expiration
      const { data: permissionResponse, error: responseError } = await supabase
        .from('permission_responses')
        .select('*')
        .eq('permission_id', permissionId)
        .eq('otp_token', otpToken)
        .gt('otp_expires_at', new Date().toISOString())
        .single();

      if (responseError || !permissionResponse) {
        throw new Error('Invalid or expired OTP token');
      }

      // Update response
      const { error: updateError } = await supabase
        .from('permission_responses')
        .update({
          response: responseValue,
          notes: notes || null,
          responded_at: new Date().toISOString()
        })
        .eq('id', permissionResponse.id);

      if (updateError) {
        throw updateError;
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Response recorded successfully' }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );

    } else {
      // Create Permission (default action)
      const permissionData: CreatePermissionRequest = body;
      
      console.log('Creating permission:', permissionData);

      // Insert permission
      const { data: permission, error: permissionError } = await supabase
        .from('permissions')
        .insert({
          title: permissionData.title,
          description: permissionData.description,
          permission_type: permissionData.permissionType,
          expires_at: permissionData.expiresAt,
          tenant_id: userData.tenant_id,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (permissionError) {
        console.error('Permission creation error:', permissionError);
        throw permissionError;
      }

      console.log('Permission created:', permission);

      // Create pending responses for each student's guardians
      if (permissionData.studentIds && permissionData.studentIds.length > 0) {
        // Get guardians for selected students
        const { data: guardianLinks, error: linksError } = await supabase
          .from('guardian_student_links')
          .select(`
            guardian_id,
            student_id,
            guardians (
              id,
              full_name,
              whatsapp_number
            )
          `)
          .eq('tenant_id', userData.tenant_id)
          .in('student_id', permissionData.studentIds);

        if (linksError) {
          console.error('Error fetching guardian links:', linksError);
          throw linksError;
        }

        // Create permission responses
        const responses = guardianLinks?.map(link => ({
          permission_id: permission.id,
          guardian_id: link.guardian_id,
          student_id: link.student_id,
          response: 'pending',
          tenant_id: userData.tenant_id
        })) || [];

        if (responses.length > 0) {
          const { error: responsesError } = await supabase
            .from('permission_responses')
            .insert(responses);

          if (responsesError) {
            console.error('Error creating permission responses:', responsesError);
            throw responsesError;
          }

          console.log('Permission responses created successfully');
        }
      }

      return new Response(
        JSON.stringify({ success: true, permission }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

  } catch (error: any) {
    console.error('Error in permissions-api:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});