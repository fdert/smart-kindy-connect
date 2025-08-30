-- إنشاء مؤسسة تجريبية ثانية لإظهار عزل البيانات
INSERT INTO tenants (id, name, email, phone, status, owner_id, created_at, updated_at, slug, address)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'روضة النور الأهلية',
  'info@alnoor.edu.sa',
  '+966501234567',
  'approved',
  '00000000-0000-0000-0000-000000000003',
  now(),
  now(),
  'alnoor-kindergarten',
  'الرياض، المملكة العربية السعودية'
);

-- إنشاء مستخدم مدير للمؤسسة الثانية
INSERT INTO users (id, email, full_name, role, tenant_id, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-0000-0000-000000000003',
  'manager@alnoor.edu.sa',
  'مدير روضة النور',
  'owner',
  '22222222-2222-2222-2222-222222222222',
  true,
  now(),
  now()
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

-- إنشاء أولياء أمور للمؤسسة الثانية
INSERT INTO guardians (tenant_id, full_name, phone, email, relationship, is_primary, can_pickup)
VALUES 
  ('22222222-2222-2222-2222-222222222222', 'محمد سعد العتيبي', '+966551234567', 'mohammed.otaibi@email.com', 'والد', true, true),
  ('22222222-2222-2222-2222-222222222222', 'أحمد علي الشمري', '+966561234567', 'ahmed.shamri@email.com', 'والد', true, true);

-- ربط أولياء الأمور بالطلاب
INSERT INTO guardian_student_links (tenant_id, guardian_id, student_id, relationship, is_primary, can_pickup)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  g.id,
  s.id,
  'والد',
  true,
  true
FROM guardians g
CROSS JOIN students s
WHERE g.tenant_id = '22222222-2222-2222-2222-222222222222' 
  AND s.tenant_id = '22222222-2222-2222-2222-222222222222'
  AND ((g.full_name LIKE '%العتيبي%' AND s.full_name LIKE '%العتيبي%')
       OR (g.full_name LIKE '%الشمري%' AND s.full_name LIKE '%الشمري%'));