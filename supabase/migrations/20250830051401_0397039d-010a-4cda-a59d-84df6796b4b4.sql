-- إضافة حضور وجوائز للمؤسسة الثانية مع تصحيح نوع البيانات
INSERT INTO attendance_events (tenant_id, student_id, class_id, date, status, check_in_time, recorded_by)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  s.id,
  s.class_id,
  CURRENT_DATE,
  'present',
  (CURRENT_DATE + INTERVAL '8 hours')::timestamp with time zone,
  '5390c93f-4b87-4b07-a5c9-6332583c5ed9' -- super admin ID
FROM students s 
WHERE s.tenant_id = '22222222-2222-2222-2222-222222222222';

-- إضافة جوائز للمؤسسة الثانية
INSERT INTO rewards (tenant_id, student_id, type, title, description, points, awarded_by, is_public, awarded_at)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  s.id,
  'star',
  'نجمة التفوق',
  'مكافأة للتفوق الأكاديمي',
  10,
  '5390c93f-4b87-4b07-a5c9-6332583c5ed9', -- super admin ID
  true,
  now()
FROM students s 
WHERE s.tenant_id = '22222222-2222-2222-2222-222222222222';

-- إضافة جوائز إضافية للمؤسسة الأولى لتوضيح الفرق
INSERT INTO rewards (tenant_id, student_id, type, title, description, points, awarded_by, is_public, awarded_at)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  s.id,
  'achievement',
  'إنجاز رائع',
  'تقدير للإنجاز المميز',
  15,
  '00000000-0000-0000-0000-000000000002', -- owner ID  
  true,
  now()
FROM students s 
WHERE s.tenant_id = '11111111-1111-1111-1111-111111111111'
LIMIT 2;