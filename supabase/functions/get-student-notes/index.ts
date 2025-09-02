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
    console.log('Processing student notes request');
    console.log('Request URL:', req.url);
    console.log('Request method:', req.method);
    
    let studentId: string;
    let isGuardianAccess: boolean;
    let fromDate: string;
    let toDate: string;

    // Support both GET (URL params) and POST (request body) methods
    if (req.method === 'GET') {
      const url = new URL(req.url);
      studentId = url.searchParams.get('studentId') || '';
      isGuardianAccess = url.searchParams.get('guardian') === 'true';
      fromDate = url.searchParams.get('from') || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      toDate = url.searchParams.get('to') || new Date().toISOString();
      console.log('GET request - studentId:', studentId, 'guardian:', isGuardianAccess);
    } else if (req.method === 'POST') {
      const body = await req.json();
      studentId = body.studentId || '';
      isGuardianAccess = body.guardian === 'true' || body.guardian === true;
      fromDate = body.from || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
      toDate = body.to || new Date().toISOString();
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

    // Get student information with better validation
    console.log('Fetching student data for ID:', studentId);
    console.log('Student ID validation:', {
      length: studentId.length,
      isUUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(studentId)
    });
    
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

    console.log('Student query result:', { studentData, studentError });

    if (studentError || !studentData) {
      console.error('Student not found:', studentError);
      return new Response(JSON.stringify({
        success: false,
        error: `Student not found - ${studentError?.message || 'معرف الطالب غير صحيح'}`
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tenantId = studentData.tenant_id;
    console.log('Using tenant ID:', tenantId);
    console.log('Date range for notes:', { fromDate, toDate });

    // Get notes data with detailed logging
    console.log('Fetching notes for student:', studentId, 'in tenant:', tenantId);
    const { data: notesData, error: notesError } = await supabase
      .from('student_notes')
      .select(`
        id,
        title,
        content,
        note_type,
        severity,
        created_at,
        follow_up_required,
        follow_up_date,
        teacher_id,
        ai_analysis,
        ai_suggestions,
        is_private,
        guardian_notified,
        notified_at
      `)
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .eq('is_private', isGuardianAccess ? false : undefined) // Filter private notes for guardian access
      .gte('created_at', fromDate)
      .lte('created_at', toDate)
      .order('created_at', { ascending: false });

    console.log('Notes query result:', { 
      notesCount: notesData?.length || 0, 
      notesError,
      queryParams: { studentId, tenantId, fromDate, toDate, isGuardianAccess },
      sampleNote: notesData?.[0] || 'No notes found'
    });

    // Get total count of all notes for this student (for debugging)
    const { count: totalNotesCount } = await supabase
      .from('student_notes')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .eq('is_private', isGuardianAccess ? false : undefined);

    console.log('Total notes count for student (all time):', totalNotesCount);

    // Get development skills for this student
    console.log('Fetching development skills for student:', studentId);
    const { data: skillsData, error: skillsError } = await supabase
      .from('development_skills')
      .select(`
        id,
        skill_name,
        skill_category,
        level,
        assessment_date,
        notes,
        assessed_by,
        created_at
      `)
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .gte('assessment_date', fromDate.split('T')[0]) // Use date only for skills
      .lte('assessment_date', toDate.split('T')[0])
      .order('assessment_date', { ascending: false });

    console.log('Skills query result:', {
      skillsCount: skillsData?.length || 0,
      skillsError,
      sampleSkill: skillsData?.[0] || 'No skills found'
    });

    if (notesError) {
      console.error('Error fetching notes:', notesError);
      // Don't fail completely for notes error, just log and continue with empty array
      console.log('Continuing with empty notes array due to error');
    }

    if (skillsError) {
      console.error('Error fetching skills:', skillsError);
      console.log('Continuing with empty skills array due to error');
    }

    // Prepare final data
    const finalNotes = notesData || [];
    const finalSkills = skillsData || [];
    
    const responseData = {
      success: true,
      data: {
        student: {
          id: studentData.id,
          full_name: studentData.full_name,
          student_id: studentData.student_id,
          photo_url: studentData.photo_url,
          date_of_birth: studentData.date_of_birth,
          gender: studentData.gender,
          class_name: studentData.classes?.name || null,
          tenant_name: studentData.tenants?.name || null
        },
        notes: finalNotes,
        development_skills: finalSkills,
        metadata: {
          totalNotesCount: totalNotesCount || 0,
          dateRangeNotesCount: finalNotes.length,
          skillsCount: finalSkills.length,
          dateRange: { from: fromDate, to: toDate },
          queryInfo: {
            studentId,
            tenantId,
            isGuardianAccess
          }
        }
      }
    };

    console.log('Returning response with:', {
      studentName: studentData.full_name,
      notesInDateRange: finalNotes.length,
      skillsInDateRange: finalSkills.length,
      totalNotesEver: totalNotesCount || 0,
      hasNotesError: !!notesError,
      hasSkillsError: !!skillsError
    });

    return new Response(JSON.stringify(responseData), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Student notes processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});