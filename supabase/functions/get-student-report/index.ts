import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// دالة التحقق من التوكن
async function validateToken(token: string, studentId: string) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data, error } = await supabase
      .rpc('validate_report_token', { p_token_hash: token });

    if (error || !data || !data.student_id) {
      console.log('Token validation failed:', error);
      return { isValid: false, guardianAccess: false };
    }

    // تحقق أن التوكن خاص بنفس الطالب
    if (data.student_id !== studentId) {
      console.log('Token student ID mismatch');
      return { isValid: false, guardianAccess: false };
    }

    return { 
      isValid: true, 
      guardianAccess: data.guardian_access || false 
    };
  } catch (error) {
    console.error('Token validation error:', error);
    return { isValid: false, guardianAccess: false };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing student report request');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    
    let studentId: string;
    let isGuardianAccess: boolean = false;

    // Support both GET (URL params) and POST (request body) methods
    if (req.method === 'GET') {
      const url = new URL(req.url);
      studentId = url.searchParams.get('studentId') || '';
      isGuardianAccess = url.searchParams.get('guardian') === 'true';
      console.log('GET request - studentId:', studentId, 'guardian:', isGuardianAccess);
    } else if (req.method === 'POST') {
      const body = await req.json();
      studentId = body.studentId || '';
      isGuardianAccess = body.guardian === 'true' || body.guardian === true;
      
      console.log('POST request - studentId:', studentId, 'guardian:', isGuardianAccess);
    } else {
      console.log('Method not allowed:', req.method);
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    if (!studentId) {
      console.log('No student ID provided');
      return new Response(JSON.stringify({
        success: false,
        error: 'Student ID is required'
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Create Supabase client with service role (bypasses RLS)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get student information
    console.log('Fetching student data for ID:', studentId);
    console.log('Student ID length:', studentId.length);
    console.log('Student ID format check:', /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId));
    
    // First check if student exists at all (without joins)
    const { data: basicStudentData, error: basicStudentError } = await supabase
      .from('students')
      .select('id, full_name, student_id, tenant_id, class_id')
      .eq('id', studentId)
      .single();

    console.log('Basic student query result:', { basicStudentData, basicStudentError });

    if (basicStudentError || !basicStudentData) {
      console.error('Student not found in basic query:', basicStudentError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Student not found - معرف الطالب غير صحيح أو غير موجود'
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Now get full student data with joins
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        student_id,
        photo_url,
        date_of_birth,
        gender,
        tenant_id,
        class_id,
        classes!left (name),
        tenants!left (name)
      `)
      .eq('id', studentId)
      .single();

    console.log('Full student query result:', { studentData, studentError });

    if (studentError || !studentData) {
      console.error('Student not found in full query:', studentError);
      // Use basic data if full query fails
      const fallbackData = {
        ...basicStudentData,
        photo_url: null,
        date_of_birth: '2020-01-01',
        gender: 'unknown',
        classes: null,
        tenants: null
      };
      console.log('Using fallback student data:', fallbackData);
      var finalStudentData = fallbackData;
    } else {
      var finalStudentData = studentData;
    }

    const tenantId = finalStudentData.tenant_id;
    const currentDate = new Date();
    const oneYearAgo = new Date(currentDate.getFullYear() - 1, 0, 1);

    console.log('Using tenant ID:', tenantId);
    console.log('Student class ID:', finalStudentData.class_id);

    // Get all related data
    const [assignmentsData, attendanceData, rewardsData, notesData, healthData, mediaData, skillsData] = await Promise.all([
      // Assignments - جلب الواجبات المخصصة للطالب أو الواجبات الجماعية لفصله
      supabase
        .from('assignments')
        .select(`
          id,
          title,
          description,
          subject,
          due_date,
          created_at,
          assignment_type,
          priority,
          student_id,
          is_group_assignment,
          class_id,
          assignment_evaluations!left (
            evaluation_status,
            evaluation_score,
            teacher_feedback,
            evaluated_at,
            completion_date,
            student_id
          )
        `)
        .eq('tenant_id', tenantId)
        .or(`student_id.eq.${studentId},and(is_group_assignment.eq.true,class_id.eq.${finalStudentData.class_id || 'null'})`)
        .gte('created_at', oneYearAgo.toISOString())
        .order('created_at', { ascending: false }),

      // Attendance  
      supabase
        .from('attendance_events')
        .select('status, date')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('date', oneYearAgo.toISOString().split('T')[0]),

      // Rewards
      supabase
        .from('rewards')
        .select(`
          id,
          title,
          type,
          points,
          awarded_at,
          description,
          badge_color,
          notes
        `)
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('awarded_at', oneYearAgo.toISOString())
        .order('awarded_at', { ascending: false }),

      // Notes (only non-private for guardian access)
      isGuardianAccess 
        ? supabase
            .from('student_notes')
            .select('*')
            .eq('student_id', studentId)
            .eq('tenant_id', tenantId)
            .eq('is_private', false)
            .gte('created_at', oneYearAgo.toISOString())
            .order('created_at', { ascending: false })
        : supabase
            .from('student_notes')
            .select('*')
            .eq('student_id', studentId)
            .eq('tenant_id', tenantId)
            .gte('created_at', oneYearAgo.toISOString())
            .order('created_at', { ascending: false }),

      // Health checks
      supabase
        .from('health_checks')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('check_date', oneYearAgo.toISOString().split('T')[0])
        .order('check_date', { ascending: false }),

      // Media
      supabase
        .from('media_student_links')
        .select(`
          media!inner (
            id,
            file_name,
            file_path,
            caption,
            album_date,
            tenant_id
          )
        `)
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId),

      // Development skills
      supabase
        .from('development_skills')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('assessment_date', oneYearAgo.toISOString().split('T')[0])
        .order('assessment_date', { ascending: false })
    ]);

    // Process assignments data
    const assignments = assignmentsData.data || [];
    console.log('Raw assignments data:', assignments);
    
    const processedAssignments = assignments.map(assignment => {
      // البحث عن التقييم المناسب للطالب الحالي
      let evaluation = null;
      if (assignment.assignment_evaluations && assignment.assignment_evaluations.length > 0) {
        // للواجبات الفردية، نأخذ التقييم الوحيد
        if (!assignment.is_group_assignment) {
          evaluation = assignment.assignment_evaluations[0];
        } else {
          // للواجبات الجماعية، نبحث عن تقييم الطالب المحدد
          evaluation = assignment.assignment_evaluations.find(evalItem => evalItem.student_id === studentId) || null;
        }
      }
      
      return {
        ...assignment,
        evaluation_status: evaluation?.evaluation_status || 'pending',
        evaluation_score: evaluation?.evaluation_score || null,
        teacher_feedback: evaluation?.teacher_feedback || '',
        evaluated_at: evaluation?.evaluated_at || null,
        completion_date: evaluation?.completion_date || null
      };
    });
    
    console.log('Processed assignments:', processedAssignments);
    
    const assignmentStats = {
      total: processedAssignments.length,
      completed: processedAssignments.filter(a => a.evaluation_status === 'completed').length,
      pending: processedAssignments.filter(a => a.evaluation_status === 'not_completed' || a.evaluation_status === 'pending').length,
      score_average: processedAssignments.length ? 
        processedAssignments
          .filter(a => a.evaluation_score !== null && a.evaluation_score !== undefined)
          .reduce((sum, a, _, filteredArray) => {
            return filteredArray.length > 0 ? sum + (a.evaluation_score || 0) : 0;
          }, 0) / Math.max(processedAssignments.filter(a => a.evaluation_score !== null && a.evaluation_score !== undefined).length, 1) : 0,
      assignments_list: processedAssignments.slice(0, 5) // أول 5 واجبات للعرض
    };

    // Process attendance data
    const attendance = attendanceData.data || [];
    const attendanceStats = {
      total_days: attendance.length,
      present_days: attendance.filter(a => a.status === 'present').length,
      absent_days: attendance.filter(a => a.status === 'absent').length,
      late_days: attendance.filter(a => a.status === 'late').length,
      attendance_rate: attendance.length ? 
        (attendance.filter(a => a.status === 'present').length / attendance.length) * 100 : 0
    };

    // Process media data
    const mediaFiles = (mediaData.data || [])
      .map(m => m.media)
      .filter(Boolean)
      .filter(media => media.tenant_id === tenantId);

    // Log rewards data for debugging
    console.log('Rewards query result:', { 
      data: rewardsData.data, 
      error: rewardsData.error,
      count: rewardsData.data?.length || 0 
    });

    const reportData = {
      student: {
        ...finalStudentData,
        class_name: finalStudentData.classes?.name || null,
        tenant_name: finalStudentData.tenants?.name || null
      },
      assignments: assignmentStats,
      attendance: attendanceStats,
      rewards: rewardsData.data || [],
      notes: notesData.data || [],
      health_checks: healthData.data || [],
      media: mediaFiles,
      development_skills: skillsData.data || [],
      raw_assignments: processedAssignments // إضافة الواجبات الكاملة للعرض التفصيلي
    };

    console.log('Final report data summary:', {
      student_id: reportData.student.id,
      assignments_count: reportData.assignments.total,
      attendance_days: reportData.attendance.total_days,
      rewards_count: reportData.rewards.length,
      notes_count: reportData.notes.length,
      media_count: reportData.media.length
    });

    return new Response(JSON.stringify({
      success: true,
      data: reportData
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Student report processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});