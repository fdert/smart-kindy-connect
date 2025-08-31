import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing scheduled assignment notifications...');

    // Get all pending notifications scheduled for today or earlier
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification_reminders')
      .select(`
        *,
        students (
          full_name,
          student_id
        ),
        assignments (
          title,
          description,
          due_date,
          assignment_type,
          priority
        )
      `)
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString().split('T')[0])
      .in('reminder_type', ['assignment_notification', 'assignment_reminder']);

    if (notificationsError) {
      throw new Error(`Error fetching notifications: ${notificationsError.message}`);
    }

    console.log(`Found ${notifications?.length || 0} pending notifications`);

    let successCount = 0;
    let errorCount = 0;

    if (notifications && notifications.length > 0) {
      for (const notification of notifications) {
        try {
          // Get guardians for this student
          const { data: guardianLinks, error: guardiansError } = await supabase
            .from('guardian_student_links')
            .select(`
              guardians (
                id,
                full_name,
                whatsapp_number
              )
            `)
            .eq('student_id', notification.student_id);

          if (guardiansError) {
            console.error('Error fetching guardians:', guardiansError);
            continue;
          }

          // Get tenant information
          const { data: tenant, error: tenantError } = await supabase
            .from('tenants')
            .select('name')
            .eq('id', notification.tenant_id)
            .single();

          if (tenantError) {
            console.error('Error fetching tenant:', tenantError);
            continue;
          }

          // Send WhatsApp notifications to each guardian
          for (const link of guardianLinks || []) {
            const guardian = link.guardians;
            if (guardian && guardian.whatsapp_number) {
              try {
                // Prepare the full message with tenant signature
                const fullMessage = `${notification.message_content}

من: ${tenant.name}
الطالب: ${notification.students?.full_name} (${notification.students?.student_id})`;

                // Call WhatsApp outbound function
                const { error: whatsappError } = await supabase.functions.invoke('whatsapp-outbound', {
                  body: {
                    tenantId: notification.tenant_id,
                    to: guardian.whatsapp_number,
                    message: fullMessage,
                    context: {
                      type: notification.reminder_type,
                      studentId: notification.student_id,
                      assignmentId: notification.assignment_id,
                      guardianId: guardian.id
                    }
                  }
                });

                if (whatsappError) {
                  console.error(`WhatsApp send error for guardian ${guardian.id}:`, whatsappError);
                  errorCount++;
                } else {
                  console.log(`Notification sent successfully to ${guardian.full_name} (${guardian.whatsapp_number})`);
                  successCount++;
                }
              } catch (error) {
                console.error(`Error sending to guardian ${guardian.id}:`, error);
                errorCount++;
              }
            }
          }

          // Mark notification as sent
          const { error: updateError } = await supabase
            .from('notification_reminders')
            .update({ 
              status: 'sent', 
              sent_at: new Date().toISOString() 
            })
            .eq('id', notification.id);

          if (updateError) {
            console.error('Error updating notification status:', updateError);
          }

        } catch (error) {
          console.error(`Error processing notification ${notification.id}:`, error);
          errorCount++;
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Assignment notifications processed successfully',
      processed: notifications?.length || 0,
      successCount,
      errorCount
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in assignment-notifications function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});