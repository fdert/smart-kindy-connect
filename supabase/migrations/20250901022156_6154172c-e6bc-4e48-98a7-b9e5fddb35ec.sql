-- إضافة إعدادات واتساب لحضانة سكن
INSERT INTO tenant_settings (tenant_id, key, value, created_at, updated_at) VALUES 
('05c50850-3919-4fd9-a962-5b1174ee2b6c', 'wa_provider', '"n8n"', NOW(), NOW()),
('05c50850-3919-4fd9-a962-5b1174ee2b6c', 'wa_webhook_url', '"https://n8n.srv894347.hstgr.cloud/webhook/0af28cc4-5544-48be-aabe-f58aad606d4f"', NOW(), NOW()),
('05c50850-3919-4fd9-a962-5b1174ee2b6c', 'wa_webhook_secret', '""', NOW(), NOW()),
('05c50850-3919-4fd9-a962-5b1174ee2b6c', 'wa_templates_json', '{
  "login_credentials": "🔐 بيانات تسجيل الدخول - SmartKindy\\n\\nحضانة: {{nurseryName}}\\n\\n📧 البريد الإلكتروني: {{email}}\\n🔑 كلمة المرور: {{tempPassword}}\\n\\n🌐 رابط تسجيل الدخول:\\nhttps://smartkindy.com/auth\\n\\n⚠️ ملاحظة هامة:\\n- كلمة المرور صالحة لمدة 24 ساعة\\n- مطلوب تغيير كلمة المرور عند أول تسجيل دخول\\n- احتفظ بهذه البيانات في مكان آمن\\n\\nللدعم الفني: 920012345\\nSmartKindy - منصة إدارة رياض الأطفال الذكية 🌟",
  "permission_request": "🔔 طلب إذن جديد\\n\\nعزيز/ة {{guardianName}} ✨\\n\\nيطلب منكم الموافقة على: {{permissionTitle}}\\n\\n📝 التفاصيل: {{permissionDescription}}\\n\\nللطالب/ة: {{studentName}}\\n📅 ينتهي الطلب في: {{expiresAt}}\\n\\n🔗 للرد على الطلب انقر الرابط:\\n{{permissionLink}}\\n\\n🙏 نقدر تعاونكم معنا\\n\\nمع أطيب التحيات\\n{{nurseryName}}",
  "survey_notification": "📊 استطلاع رأي جديد\\n\\nالسلام عليكم {{guardianName}} ✨\\n\\n📋 ندعوكم للمشاركة في استطلاع: {{surveyTitle}}\\n\\n📝 الوصف: {{surveyDescription}}\\n\\n🔗 للمشاركة في الاستطلاع انقر الرابط:\\n{{surveyLink}}\\n\\n{{surveyQuestions}}\\n\\n🙏 نقدر وقتكم ومشاركتكم في تحسين خدماتنا\\n\\nمع أطيب التحيات 💝\\n{{nurseryName}}",
  "reward_notification": "🎉 تهنئة خاصة\\n\\nمبروك {{studentName}}!\\n\\nحصلت على: {{rewardTitle}}\\n{{rewardDescription}}\\n\\nنقاط التحفيز: {{points}} ⭐\\n\\n{{nurseryName}} فخورة بك!\\n\\nمع أجمل التهاني 💝"
}', NOW(), NOW());