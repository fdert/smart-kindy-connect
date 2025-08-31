import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SendAlbumReportRequest {
  studentId: string;
  albumDate: string;
  pdfUrl?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    });
  }

  try {
    console.log('Processing album report send request');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const requestData: SendAlbumReportRequest = await req.json();
    const { studentId, albumDate, pdfUrl } = requestData;

    if (!studentId || !albumDate) {
      return new Response('studentId and albumDate are required', { 
        status: 400, 
        headers: corsHeaders 
      });
    }

    // Get student and guardian information
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select(`
        *,
        classes:class_id (name),
        guardian_student_links!inner (
          guardians!inner (
            id,
            full_name,
            whatsapp_number,
            phone
          )
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('Student not found:', studentError);
      return new Response('Student not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Get tenant information
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('id', student.tenant_id)
      .single();

    if (tenantError || !tenant) {
      console.error('Tenant not found:', tenantError);
      return new Response('Tenant not found', { 
        status: 404, 
        headers: corsHeaders 
      });
    }

    // Get media count for the album
    const { data: mediaItems, error: mediaError } = await supabase
      .from('media')
      .select(`
        id,
        file_type,
        media_student_links!inner (
          student_id
        )
      `)
      .eq('tenant_id', student.tenant_id)
      .eq('album_date', albumDate)
      .eq('media_student_links.student_id', studentId);

    if (mediaError) {
      console.error('Error fetching media:', mediaError);
    }

    const photoCount = mediaItems?.filter(m => m.file_type === 'image').length || 0;
    const videoCount = mediaItems?.filter(m => m.file_type === 'video').length || 0;

    // Send WhatsApp notification to each guardian
    const sendResults = [];
    
    for (const link of student.guardian_student_links) {
      const guardian = link.guardians;
      
      if (!guardian.whatsapp_number && !guardian.phone) {
        console.log(`No WhatsApp number for guardian: ${guardian.full_name}`);
        continue;
      }

      const phoneNumber = guardian.whatsapp_number || guardian.phone;
      
      try {
        // Call whatsapp-outbound function
        const { data: messageResult, error: messageError } = await supabase.functions.invoke(
          'whatsapp-outbound',
          {
            body: {
              tenantId: student.tenant_id,
              to: phoneNumber,
              templateName: 'album_report',
              templateData: {
                studentName: student.full_name,
                date: new Date(albumDate).toLocaleDateString('ar-SA'),
                className: student.classes?.name || 'غير محدد',
                nurseryName: tenant.name,
                photoCount: photoCount,
                videoCount: videoCount,
                linksMessage: 'يحتوي التقرير على روابط مباشرة للصور والفيديوهات للمشاهدة بجودة عالية'
              },
              mediaUrl: pdfUrl,
              contextType: 'album_report',
              contextId: `album_${studentId}_${albumDate}`,
              studentId: studentId
            }
          }
        );

        if (messageError) {
          console.error('Error sending WhatsApp message:', messageError);
          sendResults.push({
            guardianId: guardian.id,
            guardianName: guardian.full_name,
            phone: phoneNumber,
            success: false,
            error: messageError.message
          });
        } else {
          console.log('WhatsApp message sent successfully:', messageResult);
          sendResults.push({
            guardianId: guardian.id,
            guardianName: guardian.full_name,
            phone: phoneNumber,
            success: true,
            messageId: messageResult.messageId
          });
        }
      } catch (error) {
        console.error('Error calling whatsapp-outbound function:', error);
        sendResults.push({
          guardianId: guardian.id,
          guardianName: guardian.full_name,
          phone: phoneNumber,
          success: false,
          error: error.message
        });
      }
    }

    return new Response(JSON.stringify({
      success: true,
      studentId: studentId,
      albumDate: albumDate,
      photoCount: photoCount,
      videoCount: videoCount,
      sendResults: sendResults
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Album report processing error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Internal server error'
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});