import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CreateVirtualClassRequest {
  title: string;
  description?: string;
  classId?: string;
  provider: string;
  meetingUrl: string;
  meetingId?: string;
  passcode?: string;
  scheduledAt: string;
  durationMinutes: number;
  studentIds: string[];
}

interface RecordAttendanceRequest {
  studentId: string;
  status: 'joined' | 'left' | 'absent';
  joinedAt?: string;
  leftAt?: string;
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
    const pathParts = url.pathname.split('/').filter(p => p);

    // Create virtual class
    if (req.method === 'POST' && pathParts.length === 0) {
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

      const requestData: CreateVirtualClassRequest = await req.json();
      
      // Create virtual class
      const { data: virtualClass, error: classError } = await supabase
        .from('virtual_classes')
        .insert({
          tenant_id: userData.tenant_id,
          title: requestData.title,
          description: requestData.description,
          class_id: requestData.classId,
          provider: requestData.provider,
          meeting_url: requestData.meetingUrl,
          meeting_id: requestData.meetingId,
          passcode: requestData.passcode,
          scheduled_at: requestData.scheduledAt,
          duration_minutes: requestData.durationMinutes,
          created_by: user.id
        })
        .select('id')
        .single();

      if (classError) throw classError;

      // Create attendance records for invited students
      for (const studentId of requestData.studentIds) {
        await supabase
          .from('virtual_class_attendance')
          .insert({
            tenant_id: userData.tenant_id,
            virtual_class_id: virtualClass.id,
            student_id: studentId,
            status: 'invited'
          });
      }

      return new Response(JSON.stringify({ 
        success: true, 
        virtualClassId: virtualClass.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send notifications for virtual class
    if (req.method === 'POST' && pathParts[1] === 'notify') {
      const virtualClassId = pathParts[0];
      
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

      // Get virtual class with attendance records
      const { data: virtualClass } = await supabase
        .from('virtual_classes')
        .select(`
          *,
          virtual_class_attendance(
            *,
            students(
              *,
              guardian_student_links(
                guardians(*)
              )
            )
          )
        `)
        .eq('id', virtualClassId)
        .eq('tenant_id', userData?.tenant_id)
        .single();

      if (!virtualClass) {
        return new Response('Virtual class not found', { status: 404, headers: corsHeaders });
      }

      // Send WhatsApp notifications to guardians
      let notificationsSent = 0;
      
      for (const attendance of virtualClass.virtual_class_attendance) {
        const student = attendance.students;
        
        if (student?.guardian_student_links) {
          for (const link of student.guardian_student_links) {
            const guardian = link.guardians;
            
            if (guardian?.whatsapp_number) {
              const scheduledDate = new Date(virtualClass.scheduled_at);
              const reminderTime = new Date(scheduledDate.getTime() - 30 * 60 * 1000); // 30 minutes before
              
              await supabase.functions.invoke('whatsapp-outbound', {
                body: {
                  tenantId: userData?.tenant_id,
                  to: guardian.whatsapp_number,
                  templateName: 'virtual_class_invite',
                  templateData: {
                    guardianName: guardian.full_name,
                    studentName: student.full_name,
                    classTitle: virtualClass.title,
                    classDescription: virtualClass.description,
                    meetingUrl: virtualClass.meeting_url,
                    scheduledTime: scheduledDate.toLocaleString('ar-SA'),
                    provider: virtualClass.provider,
                    nurseryName: 'الحضانة'
                  },
                  contextType: 'virtual_class',
                  contextId: virtualClassId,
                  studentId: student.id
                }
              });
              
              notificationsSent++;
            }
          }
        }
      }

      return new Response(JSON.stringify({ 
        success: true, 
        notificationsSent 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Record attendance
    if (req.method === 'POST' && pathParts[1] === 'attendance') {
      const virtualClassId = pathParts[0];
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const requestData: RecordAttendanceRequest = await req.json();

      // Update attendance record
      const updateData: any = {
        status: requestData.status,
        updated_at: new Date().toISOString()
      };

      if (requestData.joinedAt) {
        updateData.joined_at = requestData.joinedAt;
      }

      if (requestData.leftAt) {
        updateData.left_at = requestData.leftAt;
        
        // Calculate duration if both joined and left times are available
        if (requestData.joinedAt) {
          const joinedTime = new Date(requestData.joinedAt);
          const leftTime = new Date(requestData.leftAt);
          const durationMs = leftTime.getTime() - joinedTime.getTime();
          updateData.duration_minutes = Math.round(durationMs / (1000 * 60));
        }
      }

      const { error: updateError } = await supabase
        .from('virtual_class_attendance')
        .update(updateData)
        .eq('virtual_class_id', virtualClassId)
        .eq('student_id', requestData.studentId);

      if (updateError) throw updateError;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get virtual class details
    if (req.method === 'GET' && pathParts.length === 1) {
      const virtualClassId = pathParts[0];
      
      const authHeader = req.headers.get('authorization');
      if (!authHeader) {
        return new Response('Unauthorized', { status: 401, headers: corsHeaders });
      }

      const { data: virtualClass } = await supabase
        .from('virtual_classes')
        .select(`
          *,
          classes(*),
          virtual_class_attendance(
            *,
            students(*)
          )
        `)
        .eq('id', virtualClassId)
        .single();

      if (!virtualClass) {
        return new Response('Virtual class not found', { status: 404, headers: corsHeaders });
      }

      return new Response(JSON.stringify(virtualClass), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });

  } catch (error) {
    console.error('Virtual Classes API error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});