-- إنشاء طلاب للمؤسسة الثانية إذا لم تكن موجودة
INSERT INTO students (tenant_id, student_id, full_name, date_of_birth, gender, class_id, enrollment_date, is_active)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  'ALN001',
  'سارة محمد العتيبي', 
  '2020-03-15', 
  'female', 
  c.id,
  '2024-09-01', 
  true
FROM classes c 
WHERE c.tenant_id = '22222222-2222-2222-2222-222222222222' 
  AND c.name = 'التمهيدي الأول'
  AND NOT EXISTS (
    SELECT 1 FROM students 
    WHERE tenant_id = '22222222-2222-2222-2222-222222222222' 
      AND student_id = 'ALN001'
  )
LIMIT 1;

INSERT INTO students (tenant_id, student_id, full_name, date_of_birth, gender, class_id, enrollment_date, is_active)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  'ALN002',
  'عبدالله أحمد الشمري', 
  '2019-07-22', 
  'male', 
  c.id,
  '2024-09-01', 
  true
FROM classes c 
WHERE c.tenant_id = '22222222-2222-2222-2222-222222222222' 
  AND c.name = 'التمهيدي الثاني'
  AND NOT EXISTS (
    SELECT 1 FROM students 
    WHERE tenant_id = '22222222-2222-2222-2222-222222222222' 
      AND student_id = 'ALN002'
  )
LIMIT 1;

INSERT INTO students (tenant_id, student_id, full_name, date_of_birth, gender, class_id, enrollment_date, is_active)
SELECT 
  '22222222-2222-2222-2222-222222222222',
  'ALN003',
  'نورا خالد المطيري', 
  '2020-01-10', 
  'female', 
  c.id,
  '2024-09-01', 
  true
FROM classes c 
WHERE c.tenant_id = '22222222-2222-2222-2222-222222222222' 
  AND c.name = 'التمهيدي الأول'
  AND NOT EXISTS (
    SELECT 1 FROM students 
    WHERE tenant_id = '22222222-2222-2222-2222-222222222222' 
      AND student_id = 'ALN003'
  )
LIMIT 1;