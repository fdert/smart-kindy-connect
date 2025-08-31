-- Add reward_notification template to existing wa_templates_json
UPDATE tenant_settings 
SET value = jsonb_set(
  value::jsonb, 
  '{reward_notification}', 
  '"🎉 تهانينا! حصل {{studentName}} على {{rewardType}} جديدة!\n\nعزيز/ة {{guardianName}}\n\nيسعدنا إخباركم أن {{studentName}} حصل/ت على:\n🏆 {{rewardTitle}}\n📝 {{rewardDescription}}\n⭐ النقاط: {{points}}\n\nنفخر بإنجازات طفلكم ونتطلع لمزيد من التميز!\n\nمع أطيب التحيات\n{{nurseryName}}"'::jsonb
)
WHERE key = 'wa_templates_json' AND tenant_id = '22222222-2222-2222-2222-222222222222';