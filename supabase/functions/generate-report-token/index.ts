import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface RequestBody {
  studentId: string;
  reportType: string;
  guardianAccess?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Processing report token generation request');
    console.log('Request method:', req.method);
    console.log('Request URL:', req.url);

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { studentId, reportType, guardianAccess = false }: RequestBody = await req.json();

    if (!studentId || !reportType) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Request parameters:', { studentId, reportType, guardianAccess });

    // استخدام service role للدخول المباشر لقاعدة البيانات
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // أولاً، احصل على بيانات الطالب لأخذ tenant_id
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select('tenant_id')
      .eq('id', studentId)
      .single();

    if (studentError || !studentData) {
      console.error('Error fetching student data:', studentError);
      return new Response(
        JSON.stringify({ error: 'Student not found or invalid' }),
        { 
          status: 404, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // إنشاء hash للتوكن
    const encoder = new TextEncoder();
    const data = encoder.encode(crypto.randomUUID() + Date.now() + Math.random());
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const tokenHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 ساعة

    // إدراج التوكن في قاعدة البيانات
    const { error: insertError } = await supabaseAdmin
      .from('report_tokens')
      .insert({
        token_hash: tokenHash,
        student_id: studentId,
        tenant_id: studentData.tenant_id,
        report_type: reportType,
        guardian_access: guardianAccess,
        expires_at: expiresAt.toISOString(),
        is_used: false
      });

    if (insertError) {
      console.error('Error inserting token:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate token' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Token generated successfully');

    // إنشاء رابط التقرير المحلي
    const baseUrl = req.headers.get('origin') || 'https://yourapp.com';
    const reportUrl = `${baseUrl}/${reportType}/${studentId}?token=${tokenHash}&guardian=${guardianAccess}`;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token: tokenHash,
          reportUrl: reportUrl,
          expiresAt: expiresAt.toISOString()
        }
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});