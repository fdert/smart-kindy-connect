import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface NotificationRequest {
  noteId?: string;
  tenantId: string;
  studentId?: string;
  noteTitle?: string;
  isPrivate?: boolean;
  processImmediate?: boolean;
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
    const { noteId, tenantId, studentId, isPrivate }: NotificationRequest = await req.json();

    console.log('Processing student note notification:', { noteId, tenantId, studentId, isPrivate });

    if (!tenantId) {
      return new Response(JSON.stringify({ 
        error: 'Missing required parameters: tenantId' 
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Skip if note is private
    if (isPrivate) {
      console.log('Note is private, skipping notifications');
      return new Response(JSON.stringify({ 
        success: true,
        message: 'Note is private, no notifications sent'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (noteId) {
      // Process specific note immediately
      const { data: noteData, error: noteError } = await supabase
        .from('student_notes')
        .select(`
          *,
          students (
            id,
            full_name,
            student_id
          )
        `)
        .eq('id', noteId)
        .eq('tenant_id', tenantId)
        .single();

      if (noteError || !noteData) {
        throw new Error('Note not found');
      }

      // Get guardians for this student
      const { data: guardians, error: guardiansError } = await supabase
        .from('guardian_student_links')
        .select(`
          guardians (
            id,
            full_name,
            whatsapp_number,
            phone
          )
        `)
        .eq('student_id', noteData.student_id)
        .eq('tenant_id', tenantId);

      if (guardiansError) {
        console.error('Error getting guardians:', guardiansError);
        throw guardiansError;
      }

      // Get tenant info
      const { data: tenantData } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenantId)
        .single();

      if (guardians && guardians.length > 0) {
        for (const guardianLink of guardians) {
          const guardian = guardianLink.guardians;
          if (guardian && (guardian.whatsapp_number || guardian.phone)) {
            const phone = guardian.whatsapp_number || guardian.phone;
            
            // Prepare notification message
            const message = `📝 ملاحظة جديدة عن طفلكم

الطالب: ${noteData.students.full_name} (${noteData.students.student_id})
نوع الملاحظة: ${noteData.note_type === 'academic' ? 'أكاديمية' :
                  noteData.note_type === 'behavioral' ? 'سلوكية' :
                  noteData.note_type === 'health' ? 'صحية' :
                  noteData.note_type === 'social' ? 'اجتماعية' : noteData.note_type}
مستوى الأهمية: ${noteData.severity === 'high' ? 'عالية' :
                   noteData.severity === 'medium' ? 'متوسطة' : 'منخفضة'}

العنوان: ${noteData.title}

المحتوى: ${noteData.content}

${noteData.follow_up_required ? '⚠️ تتطلب هذه الملاحظة متابعة' : ''}

من: ${tenantData?.name || 'الروضة'}
يرجى مراجعة المعلمة للمزيد من التفاصيل.`;

            // Send WhatsApp message
            try {
              await supabase.functions.invoke('whatsapp-outbound', {
                body: {
                  tenantId: tenantId,
                  to: phone,
                  message: message,
                  contextType: 'student_note',
                  contextId: noteId
                }
              });

              console.log(`Notification sent to guardian: ${phone}`);
            } catch (whatsappError) {
              console.error('Failed to send WhatsApp message:', whatsappError);
              // Don't fail the whole operation
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Notifications processed successfully'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error processing student note notifications:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to process notifications',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});