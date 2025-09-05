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
      console.log(`Looking for note with ID: ${noteId} and tenant: ${tenantId}`);
      
      const { data: noteData, error: noteError } = await supabase
        .from('student_notes')
        .select(`
          *,
          students!inner (
            id,
            full_name,
            student_id
          )
        `)
        .eq('id', noteId)
        .eq('tenant_id', tenantId)
        .single();

      console.log('Note query result:', { noteData, noteError });

      if (noteError) {
        console.error('Database error finding note:', noteError);
        throw new Error(`Note query failed: ${noteError.message}`);
      }
      
      if (!noteData) {
        console.error('No note found with the provided ID');
        throw new Error('Note not found in database');
      }

      console.log('Found note for student:', noteData.students?.full_name);

      // Get guardians for this student
      const { data: guardianLinks, error: guardiansError } = await supabase
        .from('guardian_student_links')
        .select(`
          guardians!inner (
            id,
            full_name,
            whatsapp_number,
            phone
          )
        `)
        .eq('student_id', noteData.student_id)
        .eq('tenant_id', tenantId);

      console.log('Guardians query result:', { guardianLinks, guardiansError });

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

      console.log('Found tenant:', tenantData?.name);

      if (guardianLinks && guardianLinks.length > 0) {
        console.log(`Found ${guardianLinks.length} guardian(s) for student`);
        
        for (const guardianLink of guardianLinks) {
          const guardian = guardianLink.guardians;
          if (guardian && (guardian.whatsapp_number || guardian.phone)) {
            const phone = guardian.whatsapp_number || guardian.phone;
            console.log(`Preparing to send message to guardian: ${guardian.full_name} at ${phone}`);
            
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
              const { data: whatsappResult, error: whatsappError } = await supabase.functions.invoke('whatsapp-outbound', {
                body: {
                  tenantId: tenantId,
                  to: phone,
                  message: message,
                  contextType: 'student_note',
                  contextId: noteId
                }
              });

              if (whatsappError) {
                console.error('WhatsApp function returned error:', whatsappError);
              } else {
                console.log(`Notification sent successfully to guardian: ${phone}`, whatsappResult);
              }
            } catch (whatsappError) {
              console.error('Failed to send WhatsApp message:', whatsappError);
              // Don't fail the whole operation
            }
          } else {
            console.log(`Guardian ${guardian?.full_name} has no phone/WhatsApp number`);
          }
        }
      } else {
        console.log('No guardians found for this student');
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
    console.error('Error stack:', error.stack);
    console.error('Request data received:', JSON.stringify({ noteId, tenantId, studentId, isPrivate }));
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process notifications',
      details: error.message,
      debugInfo: {
        noteId,
        tenantId, 
        studentId,
        isPrivate,
        errorType: error.constructor.name
      }
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});