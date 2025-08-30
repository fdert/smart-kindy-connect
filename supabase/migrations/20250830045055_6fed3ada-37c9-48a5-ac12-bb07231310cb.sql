-- إضافة المستخدم fm00002009@gmail.com إلى الحضانة التجريبية
UPDATE users 
SET tenant_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'fm00002009@gmail.com' AND tenant_id IS NULL;

-- إنشاء guardian مرتبط بهذا المستخدم في جدول guardians
INSERT INTO guardians (
  id, 
  tenant_id, 
  full_name, 
  phone, 
  whatsapp_number, 
  email, 
  relationship, 
  is_primary, 
  can_pickup, 
  user_id
) VALUES (
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  'محمدج',
  '0555000001',
  '0555000001',
  'fm00002009@gmail.com',
  'الأب',
  true,
  true,
  (SELECT id FROM users WHERE email = 'fm00002009@gmail.com')
) ON CONFLICT DO NOTHING;

-- ربط ولي الأمر بأحد الطلاب الموجودين
INSERT INTO guardian_student_links (
  id,
  tenant_id,
  guardian_id,
  student_id,
  relationship,
  is_primary,
  can_pickup
) 
SELECT 
  gen_random_uuid(),
  '11111111-1111-1111-1111-111111111111',
  g.id,
  s.id,
  'الأب',
  true,
  true
FROM guardians g
CROSS JOIN (SELECT id FROM students WHERE tenant_id = '11111111-1111-1111-1111-111111111111' LIMIT 1) s
WHERE g.email = 'fm00002009@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM guardian_student_links gsl 
    WHERE gsl.guardian_id = g.id
  );