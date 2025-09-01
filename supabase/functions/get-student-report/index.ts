import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing student report request');
    
    let studentId: string;
    let isGuardianAccess: boolean;

    // Support both GET (URL params) and POST (request body) methods
    if (req.method === 'GET') {
      const url = new URL(req.url);
      studentId = url.searchParams.get('studentId') || '';
      isGuardianAccess = url.searchParams.get('guardian') === 'true';
    } else if (req.method === 'POST') {
      const body = await req.json();
      studentId = body.studentId || '';
      isGuardianAccess = body.guardian === 'true' || body.guardian === true;
    } else {
      return new Response('Method not allowed', { 
        status: 405, 
        headers: corsHeaders 
      });
    }

    if (!studentId) {
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
        classes (name),
        tenants (name)
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) {
      console.error('Student not found:', studentError);
      return new Response('Student not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    const tenantId = studentData.tenant_id;
    const currentDate = new Date();
    const oneYearAgo = new Date(currentDate.getFullYear() - 1, 0, 1);

    // Get all related data
    const [assignmentsData, attendanceData, rewardsData, notesData, healthData, mediaData, skillsData] = await Promise.all([
      // Assignments
      supabase
        .from('assignment_evaluations')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('evaluated_at', oneYearAgo.toISOString()),

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
        .select('*')
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
    const assignmentStats = {
      total: assignments.length,
      completed: assignments.filter(a => a.evaluation_status === 'completed').length,
      pending: assignments.filter(a => a.evaluation_status === 'not_completed').length,
      score_average: assignments.length ? 
        assignments.reduce((sum, a) => sum + (a.evaluation_score || 0), 0) / assignments.length : 0
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

    const reportData = {
      student: {
        ...studentData,
        class_name: studentData.classes?.name,
        tenant_name: studentData.tenants?.name
      },
      assignments: assignmentStats,
      attendance: attendanceStats,
      rewards: rewardsData.data || [],
      notes: notesData.data || [],
      health_checks: healthData.data || [],
      media: mediaFiles,
      development_skills: skillsData.data || []
    };

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