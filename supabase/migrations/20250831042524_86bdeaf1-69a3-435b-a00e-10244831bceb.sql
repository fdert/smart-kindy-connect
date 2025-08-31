-- Update WhatsApp survey notification template to include survey link
UPDATE tenant_settings 
SET value = jsonb_set(
  value::jsonb,
  '{survey_notification}',
  '"📊 استطلاع رأي جديد\n\nالسلام عليكم {{guardianName}} ✨\n\n📋 ندعوكم للمشاركة في استطلاع: {{surveyTitle}}\n\n📝 الوصف: {{surveyDescription}}\n\n🔗 للمشاركة في الاستطلاع انقر الرابط:\n{{surveyLink}}\n\n{{surveyQuestions}}\n\n🙏 نقدر وقتكم ومشاركتكم في تحسين خدماتنا\n\nمع أطيب التحيات 💝\n{{nurseryName}}"'::jsonb
)
WHERE key = 'wa_templates_json' 
AND tenant_id = '22222222-2222-2222-2222-222222222222';