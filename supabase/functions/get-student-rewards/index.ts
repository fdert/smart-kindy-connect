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
    console.log('Processing student rewards request');
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
      fromDate = url.searchParams.get('from') || new Date(new Date().getFullYear() - 1, 0, 1).toISOString();
      toDate = url.searchParams.get('to') || new Date().toISOString();
      console.log('GET request - studentId:', studentId, 'guardian:', isGuardianAccess);
    } else if (req.method === 'POST') {
      const body = await req.json();
      studentId = body.studentId || '';
      isGuardianAccess = body.guardian === 'true' || body.guardian === true;
      fromDate = body.from || new Date(new Date().getFullYear() - 1, 0, 1).toISOString();
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
    console.log('Date range for rewards:', { fromDate, toDate });

    // Get rewards data with detailed logging
    console.log('Fetching rewards for student:', studentId, 'in tenant:', tenantId);
    const { data: rewardsData, error: rewardsError } = await supabase
      .from('rewards')
      .select(`
        id,
        title,
        description,
        type,
        points,
        awarded_at,
        awarded_by,
        notes,
        badge_color,
        icon_url,
        is_public,
        created_at
      `)
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId)
      .gte('awarded_at', fromDate)
      .lte('awarded_at', toDate)
      .order('awarded_at', { ascending: false });

    console.log('Rewards query result:', { 
      rewardsCount: rewardsData?.length || 0, 
      rewardsError,
      queryParams: { studentId, tenantId, fromDate, toDate },
      sampleReward: rewardsData?.[0] || 'No rewards found'
    });

    // Get total count of all rewards for this student (for debugging)
    const { count: totalRewardsCount } = await supabase
      .from('rewards')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('tenant_id', tenantId);

    console.log('Total rewards count for student (all time):', totalRewardsCount);

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      // Don't fail completely for rewards error, just log and continue with empty array
      console.log('Continuing with empty rewards array due to error');
    }

    // Prepare final rewards data
    const finalRewards = rewardsData || [];
    
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
        rewards: finalRewards,
        metadata: {
          totalRewardsCount: totalRewardsCount || 0,
          dateRangeCount: finalRewards.length,
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
      rewardsInDateRange: finalRewards.length,
      totalRewardsEver: totalRewardsCount || 0,
      hasError: !!rewardsError
    });

    return new Response(JSON.stringify(responseData), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Student rewards processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});