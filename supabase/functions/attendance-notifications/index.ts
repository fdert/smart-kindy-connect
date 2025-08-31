import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface NotificationRequest {
  tenantId: string;
  studentId: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  date: string;
  notificationType: 'attendance' | 'alert';
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { tenantId, studentId, status, date, notificationType }: NotificationRequest = await req.json();

    console.log('Processing attendance notification:', { tenantId, studentId, status, date, notificationType });

    // Get student information
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        classes (name)
      `)
      .eq('id', studentId)
      .eq('tenant_id', tenantId)
      .single();

    if (studentError || !student) {
      throw new Error('Student not found');
    }

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', tenantId)
      .single();

    if (tenantError || !tenant) {
      throw new Error('Tenant not found');
    }

    // Get guardians for this student
    const { data: guardians, error: guardiansError } = await supabase
      .from('guardian_student_links')
      .select(`
        guardians (
          id,
          full_name,
          whatsapp_number
        )
      `)
      .eq('student_id', studentId);

    if (guardiansError) {
      throw new Error('Error fetching guardians');
    }

    // Prepare message
    const statusText = {
      'present': 'حاضر',
      'absent': 'غائب',
      'late': 'متأخر',
      'excused': 'معذور'
    }[status] || 'غير محدد';

    let message = '';
    if (notificationType === 'attendance') {
      message = `تنبيه حضور 📚\n\nالطالب: ${student.full_name}\nرقم الطالب: ${student.student_id}\nالفصل: ${student.classes?.name || 'غير محدد'}\nالحالة: ${statusText}\nالتاريخ: ${date}\n\nمن: ${tenant.name}`;
    } else {
      // Alert message for excessive absences
      message = `تنبيه هام ⚠️\n\nالطالب: ${student.full_name}\nرقم الطالب: ${student.student_id}\nالفصل: ${student.classes?.name || 'غير محدد'}\n\nتم تسجيل غيابات متكررة. يرجى التواصل مع إدارة الروضة.\n\nمن: ${tenant.name}`;
    }

    // Send WhatsApp notifications
    const notifications = [];
    
    for (const link of guardians) {
      const guardian = link.guardians;
      if (guardian && guardian.whatsapp_number) {
        try {
          // Call WhatsApp outbound function
          const { error: whatsappError } = await supabase.functions.invoke('whatsapp-outbound', {
            body: {
              tenantId,
              to: guardian.whatsapp_number,
              message,
              context: {
                type: 'attendance_notification',
                studentId,
                guardianId: guardian.id,
                status,
                date
              }
            }
          });

          if (whatsappError) {
            console.error('WhatsApp send error:', whatsappError);
          } else {
            notifications.push({
              guardianId: guardian.id,
              guardianName: guardian.full_name,
              phone: guardian.whatsapp_number,
              status: 'sent'
            });
          }
        } catch (error) {
          console.error('Error sending to guardian:', guardian.id, error);
          notifications.push({
            guardianId: guardian.id,
            guardianName: guardian.full_name,
            phone: guardian.whatsapp_number,
            status: 'failed',
            error: error.message
          });
        }
      }
    }

    // Also send to teachers and administrators if it's an alert
    if (notificationType === 'alert') {
      // Get tenant settings for admin/teacher notifications
      const { data: settings } = await supabase
        .from('tenant_settings')
        .select('value')
        .eq('tenant_id', tenantId)
        .eq('key', 'admin_notifications')
        .single();

      if (settings?.value?.admin_whatsapp) {
        try {
          const adminMessage = `تنبيه إداري ⚠️\n\nطالب يحتاج متابعة:\n${student.full_name} (${student.student_id})\nالفصل: ${student.classes?.name || 'غير محدد'}\n\nسبب التنبيه: غيابات متكررة\nالتاريخ: ${date}`;

          await supabase.functions.invoke('whatsapp-outbound', {
            body: {
              tenantId,
              to: settings.value.admin_whatsapp,
              message: adminMessage,
              context: {
                type: 'admin_alert',
                studentId,
                status,
                date
              }
            }
          });
        } catch (error) {
          console.error('Error sending admin notification:', error);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: 'Notifications processed successfully',
      notifications,
      sentCount: notifications.filter(n => n.status === 'sent').length
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in attendance-notifications function:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});