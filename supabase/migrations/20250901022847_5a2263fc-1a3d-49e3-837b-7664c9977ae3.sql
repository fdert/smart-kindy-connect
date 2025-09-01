-- تحديث قالب رسالة تسجيل الدخول في قاعدة البيانات
UPDATE tenant_settings 
SET value = jsonb_set(
  value, 
  '{login_credentials}', 
  '"🔐 بيانات تسجيل الدخول - SmartKindy\n\n🏛️ حضانة: {{nurseryName}}\n\n👤 اسم المستخدم:\n📧 {{email}}\n\n🔐 كلمة المرور:\n🔑 {{tempPassword}}\n\n🌐 رابط تسجيل الدخول:\nhttps://smartkindy.com/auth\n\n⚠️ ملاحظة هامة:\n• كلمة المرور صالحة لمدة 24 ساعة\n• مطلوب تغيير كلمة المرور عند أول تسجيل دخول\n• احتفظ بهذه البيانات في مكان آمن\n\n📞 للدعم الفني: 920012345\n🌟 SmartKindy - منصة إدارة رياض الأطفال الذكية"'
) 
WHERE key = 'wa_templates_json' 
AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c';