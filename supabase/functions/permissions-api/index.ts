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
  responseOptions: string[];
}

interface RespondToPermissionRequest {
  permissionId: string;
  guardianId: string;
  studentId: string;
  response: string;
  notes?: string;
  otpToken: string;
}

interface PublicResponseRequest {
  action: 'publicResponse';
  permissionId: string;
  response: string;
  notes?: string;
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

    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));

    // Handle public permission response (no auth needed)
    if (body.action === 'publicResponse') {
      return handlePublicResponse(body as PublicResponseRequest, supabase);
    }

    // Get the authenticated user for other actions
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
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user data:', userError);
        throw new Error('Failed to fetch user data');
      }

      if (!userData?.tenant_id) {
        console.error('User has no tenant_id:', user.id);
        throw new Error('User has no associated tenant');
      }

    // Handle different actions based on request body
    if (body.action === 'notify' && body.permissionId) {
      // Send Permission Notifications
      const permissionId = body.permissionId;
      
      console.log('Sending notifications for permission:', permissionId);

      // Get permission details
      const { data: permission, error: permissionError } = await supabase
        .from('permissions')
        .select('*')
        .eq('id', permissionId)
        .eq('tenant_id', userData.tenant_id)
        .maybeSingle();

      if (permissionError) {
        throw permissionError;
      }

      if (!permission) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'الإذن المطلوب غير موجود أو تم حذفه'
          }),
          { 
            status: 404,
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // Get pending responses separately
      const { data: pendingResponses, error: responsesError } = await supabase
        .from('permission_responses')
        .select(`
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
        `)
        .eq('permission_id', permissionId)
        .eq('tenant_id', userData.tenant_id)
        .eq('response', 'pending');

      if (responsesError) {
        console.error('Error fetching pending responses:', responsesError);
        throw responsesError;
      }

      // Check if there are any pending responses
      if (!pendingResponses || pendingResponses.length === 0) {
        // Check if there are any responses at all
        const { data: allResponses } = await supabase
          .from('permission_responses')
          .select('response')
          .eq('permission_id', permissionId)
          .eq('tenant_id', userData.tenant_id);

        let message;
        if (allResponses && allResponses.length > 0) {
          const respondedCount = allResponses.filter(r => r.response !== 'pending').length;
          message = `تم الرد على جميع الإشعارات (${respondedCount} استجابة). لا توجد استجابات معلقة.`;
        } else {
          message = 'لم يتم إنشاء استجابات لهذا الإذن. تأكد من وجود أولياء أمور مع أرقام واتس آب.';
        }

        return new Response(
          JSON.stringify({ 
            success: false, 
            message: message,
            notificationsSent: 0 
          }),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json' 
            } 
          }
        );
      }

      // Send WhatsApp notifications for pending responses
      let notificationsSent = 0;
      
      for (const response of pendingResponses) {
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
            const permissionLink = `https://5f232500-a2a2-44ad-9709-756a29678377.sandbox.lovable.dev/permission/${permissionId}`;
            console.log(`Sending reminder WhatsApp with permission link: ${permissionLink}`);
            
            const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('whatsapp-outbound', {
              body: {
                tenantId: userData.tenant_id,
                to: response.guardians.whatsapp_number,
                templateName: 'permission_request',
                templateData: {
                  guardianName: response.guardians.full_name,
                  studentName: response.students?.full_name || '',
                  permissionTitle: permission.title,
                  permissionDescription: permission.description || '',
                  expiresAt: new Date(permission.expires_at).toLocaleDateString('ar-SA'),
                  nurseryName: userData.tenants?.name || '',
                  permissionLink: permissionLink
                },
                contextType: 'permission',
                contextId: permission.id,
                studentId: response.student_id
              }
            });
            
            if (whatsappError) {
              console.error('WhatsApp error:', whatsappError);
              throw whatsappError;
            } else {
              console.log('WhatsApp notification sent successfully:', whatsappResult);
              notificationsSent++;
            }
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
        .maybeSingle();

      if (responseError) {
        throw new Error(`Database error: ${responseError.message}`);
      }

      if (!permissionResponse) {
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
          is_active: true,
          response_options: permissionData.responseOptions || ['موافق', 'غير موافق']
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
        // Get guardians for selected students with student information
        const { data: guardianLinks, error: linksError } = await supabase
          .from('guardian_student_links')
          .select(`
            guardian_id,
            student_id,
            guardians (
              id,
              full_name,
              whatsapp_number
            ),
            students (
              full_name
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

          // Automatically send WhatsApp notifications after creating permission
          try {
            console.log('Sending automatic notifications for new permission:', permission.id);
            let autoNotificationsSent = 0;
            
            for (const link of guardianLinks) {
              if (link.guardians?.whatsapp_number) {
                // Generate OTP token for response
                const otpToken = Math.random().toString(36).substring(2, 8).toUpperCase();
                const otpExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

                // Update the created response with OTP
                await supabase
                  .from('permission_responses')
                  .update({
                    otp_token: otpToken,
                    otp_expires_at: otpExpires.toISOString()
                  })
                  .eq('permission_id', permission.id)
                  .eq('guardian_id', link.guardian_id)
                  .eq('student_id', link.student_id);

                // Send WhatsApp notification
                const permissionLink = `https://5f232500-a2a2-44ad-9709-756a29678377.sandbox.lovable.dev/permission/${permission.id}`;
                console.log(`Sending new permission WhatsApp with permission link: ${permissionLink}`);
                
                const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('whatsapp-outbound', {
                  body: {
                    tenantId: userData.tenant_id,
                    to: link.guardians.whatsapp_number,
                    templateName: 'permission_request',
                    templateData: {
                      guardianName: link.guardians.full_name,
                      studentName: link.students?.full_name || '',
                      permissionTitle: permission.title,
                      permissionDescription: permission.description || '',
                      expiresAt: new Date(permission.expires_at).toLocaleDateString('ar-SA'),
                      nurseryName: userData.tenants?.name || '',
                      permissionLink: permissionLink
                    },
                    contextType: 'permission',
                    contextId: permission.id,
                    studentId: link.student_id
                  }
                });
                
                if (whatsappError) {
                  console.error('WhatsApp auto-notification error:', whatsappError);
                } else {
                  console.log('WhatsApp auto-notification sent successfully to:', link.guardians.whatsapp_number);
                  autoNotificationsSent++;
                }
              }
            }
            
            console.log(`Sent ${autoNotificationsSent} automatic notifications for new permission`);
          } catch (autoNotifyError) {
            console.error('Error sending automatic notifications:', autoNotifyError);
            // Don't throw here, as permission was created successfully
          }
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

// Handle public permission response
async function handlePublicResponse(requestData: PublicResponseRequest, supabase: any) {
  try {
    console.log('Processing public permission response:', JSON.stringify({
      permissionId: requestData.permissionId,
      response: requestData.response
    }));

    const { permissionId, response, notes } = requestData;

    // Verify permission exists and is active
    const { data: permission, error: permissionError } = await supabase
      .from('permissions')
      .select('*')
      .eq('id', permissionId)
      .eq('is_active', true)
      .maybeSingle();

    if (permissionError) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Database error while checking permission'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!permission) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permission not found or no longer active'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if permission has expired
    if (new Date(permission.expires_at) < new Date()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Permission has expired'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // For public responses, find an existing pending response to update instead of creating new one
    const { data: existingResponse, error: findError } = await supabase
      .from('permission_responses')
      .select('id')
      .eq('permission_id', permissionId)
      .eq('response', 'pending')
      .limit(1)
      .maybeSingle();

    if (findError) {
      console.error('Error finding existing response:', findError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to find permission response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (!existingResponse) {
      return new Response(JSON.stringify({
        success: false,
        error: 'No pending response found for this permission'
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Update the existing response
    const { data: responseData, error: responseError } = await supabase
      .from('permission_responses')
      .update({
        response: response,
        notes: notes,
        responded_at: new Date().toISOString()
      })
      .eq('id', existingResponse.id)
      .select('id')
      .single();

    if (responseError) {
      console.error('Error creating permission response:', responseError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to save response'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      responseId: responseData.id
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('Public permission response error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}