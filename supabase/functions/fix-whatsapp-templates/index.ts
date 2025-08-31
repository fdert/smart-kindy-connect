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
    console.log('Fixing WhatsApp templates for all tenants...');

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Get all tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name')
      .eq('status', 'approved');

    if (tenantsError) {
      throw tenantsError;
    }

    console.log(`Found ${tenants?.length || 0} approved tenants`);

    const defaultTemplates = {
      attendance_present: 'تم وصول {{studentName}} إلى الحضانة في تمام الساعة {{time}}. نتمنى لهم يوماً سعيداً! 🌟',
      attendance_absent: 'نود إعلامكم أن {{studentName}} لم يحضر اليوم. نأمل أن يكون بخير. إذا كان هناك عذر، يرجى إبلاغنا.',
      dismissal_approved_pin: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nرمز الاستلام: {{pin}}\n\nيرجى إظهار هذا الرمز عند الاستلام.',
      dismissal_approved_qr: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nيرجى إظهار رمز QR المرفق عند الاستلام.',
      album_shared: 'ألبوم {{studentName}} لليوم {{date}} متاح الآن! 📸\n\n{{mediaLinks}}\n\nستنتهي صلاحية الروابط خلال 24 ساعة.',
      album_report: 'تقرير ألبوم {{studentName}} لليوم {{date}} 📸\n\nاسم الطالب: {{studentName}}\nالفصل: {{className}}\nالروضة: {{nurseryName}}\nعدد الصور: {{photoCount}}\nعدد الفيديوهات: {{videoCount}}\n\nالألبوم متاح للعرض.',
      reward_notification: '🎉 تهانينا! حصل {{studentName}} على {{rewardType}} جديدة!\n\nعزيز/ة {{guardianName}}\n\nيسعدنا إخباركم أن {{studentName}} حصل/ت على:\n🏆 {{rewardTitle}}\n📝 {{rewardDescription}}\n⭐ النقاط: {{points}}\n\nنفخر بإنجازات طفلكم ونتطلع لمزيد من التميز!\n\nمع أطيب التحيات\n{{nurseryName}}',
      permission_request: '🔔 طلب إذن جديد\n\nعزيز/ة {{guardianName}}\n\nيطلب منكم الموافقة على: {{permissionTitle}}\n\nالتفاصيل: {{permissionDescription}}\n\nللطالب/ة: {{studentName}}\n\nينتهي الطلب في: {{expiresAt}}\n\nرمز التأكيد: {{otpToken}}\n\nيرجى الرد بـ "موافق" أو "غير موافق" مع رمز التأكيد.\n\nمع تحيات\n{{nurseryName}}',
      survey_notification: '📊 استطلاع رأي جديد\n\nعزيز/ة {{guardianName}}\n\nدعوة للمشاركة في: {{surveyTitle}}\n\nالوصف: {{surveyDescription}}\n\nنقدر مشاركتكم في تحسين خدماتنا\n\nمع تحيات\n{{nurseryName}}',
      general_notification: 'إشعار من {{nurseryName}}:\n\n{{message}}'
    };

    let updatedCount = 0;

    for (const tenant of tenants || []) {
      try {
        // Check if templates already exist
        const { data: existingTemplates } = await supabase
          .from('tenant_settings')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('key', 'wa_templates_json')
          .single();

        if (!existingTemplates) {
          // Insert new templates
          const { error: insertError } = await supabase
            .from('tenant_settings')
            .insert({
              tenant_id: tenant.id,
              key: 'wa_templates_json',
              value: defaultTemplates
            });

          if (insertError) {
            console.error(`Error inserting templates for tenant ${tenant.name}:`, insertError);
          } else {
            console.log(`✅ Added templates for tenant: ${tenant.name}`);
            updatedCount++;
          }
        } else {
          // Update existing templates to ensure all templates are present
          const currentTemplates = existingTemplates.value || {};
          const mergedTemplates = { ...defaultTemplates, ...currentTemplates };
          
          const { error: updateError } = await supabase
            .from('tenant_settings')
            .update({ value: mergedTemplates })
            .eq('tenant_id', tenant.id)
            .eq('key', 'wa_templates_json');

          if (updateError) {
            console.error(`Error updating templates for tenant ${tenant.name}:`, updateError);
          } else {
            console.log(`🔄 Updated templates for tenant: ${tenant.name}`);
            updatedCount++;
          }
        }
      } catch (error) {
        console.error(`Error processing tenant ${tenant.name}:`, error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Templates fixed for ${updatedCount} tenants`,
      totalTenants: tenants?.length || 0,
      updatedTenants: updatedCount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in fix-whatsapp-templates function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      stack: error.stack 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});