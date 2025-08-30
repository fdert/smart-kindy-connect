-- إنشاء مؤسسة تجريبية ثانية لإظهار عزل البيانات
INSERT INTO tenants (id, name, email, phone, status, owner_id, created_at, updated_at, slug, address)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'روضة النور الأهلية',
  'info@alnoor.edu.sa',
  '+966501234567',
  'approved',
  (SELECT id FROM users WHERE email = 'teacher@smartkindy.com' LIMIT 1),
  now(),
  now(),
  'alnoor-kindergarten',
  'الرياض، المملكة العربية السعودية'
);

-- إنشاء مستخدم إضافي للمؤسسة الثانية بتحديث أحد المستخدمين الموجودين
UPDATE users 
SET tenant_id = '22222222-2222-2222-2222-222222222222',
    role = 'owner',
    full_name = 'مدير روضة النور'
WHERE email = 'teacher@smartkindy.com';

-- إنشاء فصول للمؤسسة الثانية
INSERT INTO classes (tenant_id, name, description, capacity, age_min, age_max, is_active)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'التمهيدي الأول', 'فصل للأطفال من 3-4 سنوات', 15, 3, 4, true),
  ('22222222-2222-2222-2222-222222222222', 'التمهيدي الثاني', 'فصل للأطفال من 4-5 سنوات', 18, 4, 5, true);

-- إنشاء طلاب للمؤسسة الثانية
INSERT INTO students (tenant_id, student_id, full_name, date_of_birth, gender, class_id, enrollment_date, is_active)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  'ALN' || LPAD((ROW_NUMBER() OVER())::text, 3, '0'),
  students_data.name,
  students_data.dob,
  students_data.gender,
  class_ids.class_id,
  '2024-09-01',
  true
FROM (
  VALUES 
    ('سارة محمد العتيبي', '2020-03-15', 'أنثى'),
    ('عبدالله أحمد الشمري', '2019-07-22', 'ذكر')
) AS students_data(name, dob, gender)
CROSS JOIN (
  SELECT id as class_id FROM classes 
  WHERE tenant_id = '22222222-2222-2222-2222-222222222222' 
  LIMIT 1
) AS class_ids;