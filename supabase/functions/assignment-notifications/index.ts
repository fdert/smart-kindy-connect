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

    // Check if this is an immediate processing request
    let requestBody = null;
    try {
      requestBody = await req.json();
    } catch {
      // No body, proceed with scheduled processing
    }

    if (requestBody?.processImmediate) {
      console.log('Processing immediate notifications...');
      
      // Check if it's evaluation notification processing
      if (requestBody?.evaluationNotification) {
        const { assignmentId, studentId } = requestBody;
        
        if (!assignmentId || !studentId) {
          throw new Error('Missing assignmentId or studentId for immediate processing');
        }

        // Get the latest evaluation notification for this assignment and student
        const { data: notifications, error: notificationsError } = await supabase
          .from('notification_reminders')
          .select('*')
          .eq('assignment_id', assignmentId)
          .eq('student_id', studentId)
          .eq('reminder_type', 'assignment_evaluation')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(1);

        if (notificationsError) {
          throw new Error(`Error fetching evaluation notifications: ${notificationsError.message}`);
        }

        if (!notifications || notifications.length === 0) {
          console.log('No pending evaluation notifications found');
          return new Response(JSON.stringify({
            success: true,
            message: 'No pending evaluation notifications found',
            processed: 0
          }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Process the notification immediately
        await processNotifications(supabase, notifications);

        return new Response(JSON.stringify({
          success: true,
          message: 'Evaluation notification processed immediately',
          processed: notifications.length
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      // Process all immediate pending notifications (for new assignments)
      console.log('Processing all immediate pending notifications...');
      
      // Get all recent pending notifications (created in the last 5 minutes)
      const { data: recentNotifications, error: recentError } = await supabase
        .from('notification_reminders')
        .select('*')
        .eq('status', 'pending')
        .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .in('reminder_type', ['assignment_notification', 'assignment_reminder', 'assignment_evaluation']);

      if (recentError) {
        throw new Error(`Error fetching recent notifications: ${recentError.message}`);
      }

      console.log(`Found ${recentNotifications?.length || 0} recent pending notifications`);

      if (recentNotifications && recentNotifications.length > 0) {
        const result = await processNotifications(supabase, recentNotifications);
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Immediate notifications processed successfully',
          processed: recentNotifications.length,
          successCount: result.successCount,
          errorCount: result.errorCount
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({
          success: true,
          message: 'No recent pending notifications found',
          processed: 0
        }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    console.log('Processing scheduled assignment notifications...');

    // Get all pending notifications scheduled for today or earlier
    const { data: notifications, error: notificationsError } = await supabase
      .from('notification_reminders')
      .select(`
        *
      `)
      .eq('status', 'pending')
      .lte('scheduled_date', new Date().toISOString().split('T')[0])
      .in('reminder_type', ['assignment_notification', 'assignment_reminder', 'assignment_evaluation']);

    if (notificationsError) {
      throw new Error(`Error fetching notifications: ${notificationsError.message}`);
    }

    console.log(`Found ${notifications?.length || 0} pending notifications`);

    const result = await processNotifications(supabase, notifications || []);

    return new Response(JSON.stringify({
      success: true,
      message: 'Assignment notifications processed successfully',
      processed: notifications?.length || 0,
      successCount: result.successCount,
      errorCount: result.errorCount
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

// Helper function to process notifications
async function processNotifications(supabase: any, notifications: any[]) {
  let successCount = 0;
  let errorCount = 0;

  if (notifications && notifications.length > 0) {
    for (const notification of notifications) {
      try {
        // Get student information
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('full_name, student_id')
          .eq('id', notification.student_id)
          .single();

        if (studentError) {
          console.error('Error fetching student:', studentError);
          continue;
        }

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

        // Get assignment details from database for complete message
        const { data: assignment, error: assignmentError } = await supabase
          .from('assignments')
          .select('title, assignment_type, priority, description, due_date, class_id')
          .eq('id', notification.assignment_id)
          .single();

        if (assignmentError) {
          console.error('Error fetching assignment details:', assignmentError);
          continue;
        }

        // Get class information if exists
        let className = 'غير محدد';
        if (assignment?.class_id) {
          const { data: classData } = await supabase
            .from('classes')
            .select('name')
            .eq('id', assignment.class_id)
            .single();
          
          if (classData) {
            className = classData.name;
          }
        }

        // Send WhatsApp notifications to each guardian
        for (const link of guardianLinks || []) {
          const guardian = link.guardians;
          if (guardian && guardian.whatsapp_number) {
            try {
              // Get WhatsApp settings for this tenant
              const { data: whatsappSettings } = await supabase
                .from('tenant_settings')
                .select('value')
                .eq('tenant_id', notification.tenant_id)
                .eq('key', 'wa_webhook_url')
                .single();

              if (!whatsappSettings?.value) {
                console.log(`No WhatsApp webhook configured for tenant ${notification.tenant_id}`);
                errorCount++;
                continue;
              }

              const webhookUrl = whatsappSettings.value;
              
              // Format message based on type
              let simpleMessage;
              
              if (notification.reminder_type === 'assignment_evaluation') {
                // Simple evaluation message
                simpleMessage = `📝 تقييم الواجب

الطالب: ${student.full_name} (${student.student_id})
الواجب: ${assignment?.title || 'الواجب'}
الحالة: ${notification.evaluation_status === 'completed' ? 'مكتمل ✅' : 'غير مكتمل ❌'}
${notification.evaluation_score ? `النتيجة: ${notification.evaluation_score}` : ''}
${notification.teacher_feedback ? `ملاحظات المعلمة: ${notification.teacher_feedback}` : ''}

من: ${tenant.name}`;
              } else if (notification.reminder_type === 'assignment_reminder') {
                // Simple reminder message
                simpleMessage = `⏰ تذكير واجب

الطالب: ${student.full_name} (${student.student_id})
الواجب: ${assignment?.title || 'الواجب'}
موعد التسليم: غداً

من: ${tenant.name}`;
              } else {
                // Complete assignment notification with all details
                const assignmentTypeAr = assignment?.assignment_type === 'homework' ? 'واجب منزلي' :
                                       assignment?.assignment_type === 'task' ? 'مهمة' :
                                       assignment?.assignment_type === 'project' ? 'مشروع' :
                                       assignment?.assignment_type === 'activity' ? 'نشاط' :
                                       'واجب منزلي';
                
                const priorityAr = assignment?.priority === 'high' ? 'عالية' :
                                 assignment?.priority === 'medium' ? 'متوسطة' :
                                 assignment?.priority === 'low' ? 'منخفضة' :
                                 'متوسطة';

                const dueDate = assignment?.due_date ? 
                  new Date(assignment.due_date).toLocaleDateString('ar-SA', {
                    day: '2-digit',
                    month: '2-digit', 
                    year: 'numeric'
                  }).replace(/\//g, '/') : 'غير محدد';
                
                simpleMessage = `🎓 واجب جديد

👨‍🎓 الطالب: ${student.full_name} 
🆔 رقم الطالب: ${student.student_id}

📋 تفاصيل الواجب:
📝 العنوان: ${assignment?.title || 'الواجب'}
📂 النوع: ${assignmentTypeAr}
⭐ الأولوية: ${priorityAr}
🏫 الفصل: ${className}
📅 موعد التسليم: ${dueDate}

📖 محتوى الواجب:
${assignment?.description || 'لا يوجد وصف إضافي'}

🙏 يرجى متابعة طفلكم لإنجاز الواجب في الموعد المحدد.

🏫 من: ${tenant.name}`;
              }
              
              // Send message directly to N8N webhook
              const webhookPayload = {
                to: guardian.whatsapp_number,
                message: simpleMessage,
                tenantId: notification.tenant_id,
                timestamp: new Date().toISOString(),
                contextType: notification.reminder_type,
                context: {
                  type: notification.reminder_type,
                  studentId: notification.student_id,
                  assignmentId: notification.assignment_id,
                  guardianId: guardian.id
                }
              };

              console.log(`Sending WhatsApp message to webhook: ${webhookUrl}`);
              console.log(`Message payload:`, webhookPayload);

              const webhookResponse = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(webhookPayload)
              });

              if (!webhookResponse.ok) {
                throw new Error(`Webhook responded with status: ${webhookResponse.status}`);
              }

              const webhookResult = await webhookResponse.json();
              console.log(`Webhook response:`, webhookResult);

              // Log the message to wa_messages table
              const { error: insertError } = await supabase
                .from('wa_messages')
                .insert({
                  tenant_id: notification.tenant_id,
                  to_number: guardian.whatsapp_number,
                  message_text: simpleMessage,
                  message_type: 'text',
                  direction: 'outbound',
                  status: 'sent',
                  context_type: notification.reminder_type,
                  sent_at: new Date().toISOString(),
                  webhook_data: webhookResult
                });

              if (insertError) {
                console.error('Error inserting wa_message:', insertError);
              } else {
                console.log('WhatsApp message logged successfully');
              }

              console.log(`Assignment notification sent successfully to ${guardian.full_name} (${guardian.whatsapp_number})`);
              successCount++;
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
        } else {
          console.log(`Notification ${notification.id} marked as sent successfully`);
        }

      } catch (error) {
        console.error(`Error processing notification ${notification.id}:`, error);
        errorCount++;
      }
    }
  }

  return { successCount, errorCount };
}