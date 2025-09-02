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

    // إنشاء توكن جديد
    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .rpc('generate_report_token', {
        p_student_id: studentId,
        p_report_type: reportType,
        p_guardian_access: guardianAccess
      });

    if (tokenError) {
      console.error('Error generating token:', tokenError);
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
    const reportUrl = `${baseUrl}/${reportType}/${studentId}?token=${tokenData}&guardian=${guardianAccess}`;

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          token: tokenData,
          reportUrl: reportUrl,
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString() // 72 ساعة
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