-- Update WhatsApp templates to include permission request with link
INSERT INTO public.tenant_settings (tenant_id, key, value, created_at, updated_at)
SELECT 
  t.id as tenant_id,
  'wa_templates_json' as key,
  jsonb_build_object(
    'permission_request', 
    '🔔 طلب إذن جديد

عزيز/ة {{guardianName}} ✨

يطلب منكم الموافقة على: {{permissionTitle}}

📝 التفاصيل: {{permissionDescription}}

للطالب/ة: {{studentName}}
📅 ينتهي الطلب في: {{expiresAt}}

🔗 للرد على الطلب انقر الرابط:
{{permissionLink}}

🙏 نقدر تعاونكم معنا

مع أطيب التحيات
{{nurseryName}}',
    'survey_notification',
    '📊 استطلاع رأي جديد

السلام عليكم {{guardianName}} ✨

📋 ندعوكم للمشاركة في استطلاع: {{surveyTitle}}

📝 الوصف: {{surveyDescription}}

🔗 للمشاركة في الاستطلاع انقر الرابط:
{{surveyLink}}

{{surveyQuestions}}

🙏 نقدر وقتكم ومشاركتكم في تحسين خدماتنا

مع أطيب التحيات 💝
{{nurseryName}}',
    'reward_notification',
    '🎉 تهنئة خاصة

مبروك {{studentName}}! 

حصلت على: {{rewardTitle}}
{{rewardDescription}}

نقاط التحفيز: {{points}} ⭐

{{nurseryName}} فخورة بك! 

مع أجمل التهاني 💝'
  ) as value,
  now() as created_at,
  now() as updated_at
FROM public.tenants t
WHERE t.status = 'approved'
ON CONFLICT (tenant_id, key) 
DO UPDATE SET 
  value = EXCLUDED.value,
  updated_at = now();