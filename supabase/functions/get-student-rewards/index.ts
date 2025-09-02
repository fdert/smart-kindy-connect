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

    // Get student information
    console.log('Fetching student data for ID:', studentId);
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        student_id,
        photo_url,
        tenant_id,
        classes (name)
      `)
      .eq('id', studentId)
      .single();

    console.log('Student query result:', { studentData, studentError });

    if (studentError || !studentData) {
      console.error('Student not found:', studentError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Student not found'
      }), { 
        status: 404, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get rewards data
    console.log('Fetching rewards for student:', studentId);
    const { data: rewardsData, error: rewardsError } = await supabase
      .from('rewards')
      .select('*')
      .eq('student_id', studentId)
      .eq('tenant_id', studentData.tenant_id)
      .gte('awarded_at', fromDate)
      .lte('awarded_at', toDate)
      .order('awarded_at', { ascending: false });

    console.log('Rewards query result:', { rewardsData, rewardsError });

    if (rewardsError) {
      console.error('Error fetching rewards:', rewardsError);
      // Don't fail completely for rewards error, just return empty array
    }

    const responseData = {
      success: true,
      data: {
        student: {
          ...studentData,
          class_name: studentData.classes?.name
        },
        rewards: rewardsData || []
      }
    };

    console.log('Returning response with:', {
      studentName: studentData.full_name,
      rewardsCount: rewardsData?.length || 0
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