-- نقل المستخدم fm00002009@gmail.com مؤقتاً للمؤسسة الثانية لاختبار عزل البيانات
UPDATE users 
SET tenant_id = '22222222-2222-2222-2222-222222222222'
WHERE email = 'fm00002009@gmail.com';

-- إنشاء بعض الجوائز للمؤسسة الثانية لإظهار الفرق في البيانات
INSERT INTO rewards (tenant_id, student_id, type, title, description, points, awarded_by)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  s.id,
  'star',
  'نجمة التميز',
  'للسلوك المتميز في الفصل',
  10,
  '1a0263f2-fd79-4cbf-98d8-7f8cba278b37'
FROM students s 
WHERE s.tenant_id = '22222222-2222-2222-2222-222222222222'
LIMIT 2;