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

-- تحديث المستخدم ليصبح مدير المؤسسة الثانية
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

-- إنشاء طلاب للمؤسسة الثانية مع تحويل البيانات
INSERT INTO students (tenant_id, student_id, full_name, date_of_birth, gender, class_id, enrollment_date, is_active)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'ALN001', 'سارة محمد العتيبي', '2020-03-15'::date, 'أنثى', 
   (SELECT id FROM classes WHERE tenant_id = '22222222-2222-2222-2222-222222222222' LIMIT 1), 
   '2024-09-01'::date, true),
  ('22222222-2222-2222-2222-222222222222', 'ALN002', 'عبدالله أحمد الشمري', '2019-07-22'::date, 'ذكر', 
   (SELECT id FROM classes WHERE tenant_id = '22222222-2222-2222-2222-222222222222' LIMIT 1), 
   '2024-09-01'::date, true);