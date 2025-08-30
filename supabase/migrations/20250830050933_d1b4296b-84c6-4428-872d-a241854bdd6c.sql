-- إنشاء مؤسسة تجريبية ثانية بدون إنشاء مستخدم جديد
INSERT INTO tenants (id, name, email, phone, status, created_at, updated_at, slug, address)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'روضة النور الأهلية',
  'info@alnoor.edu.sa',
  '+966501234567',
  'approved',
  now(),
  now(),
  'alnoor-kindergarten',
  'الرياض، المملكة العربية السعودية'
);

-- إنشاء فصول للمؤسسة الثانية
INSERT INTO classes (tenant_id, name, description, capacity, age_min, age_max, is_active)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'التمهيدي الأول', 'فصل للأطفال من 3-4 سنوات', 15, 3, 4, true),
  ('22222222-2222-2222-2222-222222222222', 'التمهيدي الثاني', 'فصل للأطفال من 4-5 سنوات', 18, 4, 5, true);

-- إنشاء طلاب للمؤسسة الثانية
INSERT INTO students (tenant_id, student_id, full_name, date_of_birth, gender, class_id, enrollment_date, is_active)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'ALN001', 'سارة محمد العتيبي', '2020-03-15', 'أنثى', (SELECT id FROM classes WHERE tenant_id = '22222222-2222-2222-2222-222222222222' AND name = 'التمهيدي الأول' LIMIT 1), '2024-09-01', true),
  ('22222222-2222-2222-2222-222222222222', 'ALN002', 'عبدالله أحمد الشمري', '2019-07-22', 'ذكر', (SELECT id FROM classes WHERE tenant_id = '22222222-2222-2222-2222-222222222222' AND name = 'التمهيدي الثاني' LIMIT 1), '2024-09-01', true);

-- إنشاء جوائز للطلاب في المؤسسة الثانية
INSERT INTO rewards (tenant_id, student_id, type, title, description, points, awarded_by, is_public, awarded_at)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  s.id,
  'star',
  'نجمة التفوق',
  'مكافأة للتفوق الأكاديمي',
  5,
  '5390c93f-4b87-4b07-a5c9-6332583c5ed9', -- super admin ID
  true,
  now()
FROM students s 
WHERE s.tenant_id = '22222222-2222-2222-2222-222222222222';

-- إنشاء حضور للطلاب في المؤسسة الثانية لليوم الحالي
INSERT INTO attendance_events (tenant_id, student_id, class_id, date, status, check_in_time, recorded_by)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  s.id,
  s.class_id,
  CURRENT_DATE,
  'present',
  '08:00:00'::time,
  '5390c93f-4b87-4b07-a5c9-6332583c5ed9' -- super admin ID
FROM students s 
WHERE s.tenant_id = '22222222-2222-2222-2222-222222222222';