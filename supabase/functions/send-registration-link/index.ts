import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SendRegistrationLinkRequest {
  studentId: string;
  guardianPhone: string;
  tenantId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const { studentId, guardianPhone, tenantId }: SendRegistrationLinkRequest = await req.json();

    console.log('Processing registration link request for student:', studentId);

    // Validate required parameters
    if (!studentId || !guardianPhone || !tenantId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: studentId, guardianPhone, tenantId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get student and tenant information
    const { data: studentData, error: studentError } = await supabase
      .from('students')
      .select(`
        id,
        full_name,
        student_id,
        tenants (name)
      `)
      .eq('id', studentId)
      .eq('tenant_id', tenantId)
      .single();

    if (studentError || !studentData) {
      throw new Error('Student not found');
    }

    // Create registration link with student info - use the current domain
    const registrationLink = `https://5f232500-a2a2-44ad-9709-756a29678377.sandbox.lovable.dev/student-report/${studentId}?guardian=true`;

    console.log('Generated registration link:', registrationLink);

    // Prepare WhatsApp message
    const message = `🎓 مرحباً بكم في ${studentData.tenants?.name}

تم تسجيل طفلكم ${studentData.full_name} (رقم الطالب: ${studentData.student_id}) بنجاح في نظامنا.

📊 يمكنكم الآن الاطلاع على التقرير الشامل لطفلكم من خلال الرابط التالي:
${registrationLink}

التقرير يتضمن:
✅ الأداء الأكاديمي
✅ سجل الحضور والغياب
✅ المكافآت والإنجازات
✅ الملاحظات السلوكية والتعليمية
✅ ألبوم الصور والأنشطة
✅ الفحوصات الصحية

يرجى حفظ هذا الرابط للرجوع إليه في أي وقت.

شكراً لثقتكم في ${studentData.tenants?.name} 🌟`;

    // Send WhatsApp message via the outbound function
    const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('whatsapp-outbound', {
      body: {
        tenantId: tenantId,
        to: guardianPhone,
        message: message,
        contextType: 'registration_link',
        contextId: studentId
      }
    });

    if (whatsappError) {
      console.error('WhatsApp sending error:', whatsappError);
      throw whatsappError;
    }

    console.log('Registration link sent successfully to:', guardianPhone);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'تم إرسال رابط التسجيل بنجاح',
      registrationLink 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error sending registration link:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to send registration link',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});