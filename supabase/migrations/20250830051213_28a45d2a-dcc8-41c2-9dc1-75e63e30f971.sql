-- إكمال إعداد المؤسسة الثانية
-- تحديث المستخدم ليصبح مدير المؤسسة الثانية
UPDATE users 
SET tenant_id = '22222222-2222-2222-2222-222222222222',
    role = 'owner',
    full_name = 'مدير روضة النور'
WHERE email = 'teacher@smartkindy.com';

-- إنشاء فصول للمؤسسة الثانية (في حالة عدم وجودها)
INSERT INTO classes (tenant_id, name, description, capacity, age_min, age_max, is_active)
SELECT '22222222-2222-2222-2222-222222222222', 'التمهيدي الأول', 'فصل للأطفال من 3-4 سنوات', 15, 3, 4, true
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE tenant_id = '22222222-2222-2222-2222-222222222222' AND name = 'التمهيدي الأول');

INSERT INTO classes (tenant_id, name, description, capacity, age_min, age_max, is_active)
SELECT '22222222-2222-2222-2222-222222222222', 'التمهيدي الثاني', 'فصل للأطفال من 4-5 سنوات', 18, 4, 5, true
WHERE NOT EXISTS (SELECT 1 FROM classes WHERE tenant_id = '22222222-2222-2222-2222-222222222222' AND name = 'التمهيدي الثاني');

-- إنشاء طلاب للمؤسسة الثانية
INSERT INTO students (tenant_id, student_id, full_name, date_of_birth, gender, class_id, enrollment_date, is_active)
SELECT '22222222-2222-2222-2222-222222222222', 'ALN001', 'سارة محمد العتيبي', '2020-03-15'::date, 'أنثى', 
       (SELECT id FROM classes WHERE tenant_id = '22222222-2222-2222-2222-222222222222' LIMIT 1), 
       '2024-09-01'::date, true
WHERE NOT EXISTS (SELECT 1 FROM students WHERE tenant_id = '22222222-2222-2222-2222-222222222222' AND student_id = 'ALN001');

INSERT INTO students (tenant_id, student_id, full_name, date_of_birth, gender, class_id, enrollment_date, is_active)
SELECT '22222222-2222-2222-2222-222222222222', 'ALN002', 'عبدالله أحمد الشمري', '2019-07-22'::date, 'ذكر', 
       (SELECT id FROM classes WHERE tenant_id = '22222222-2222-2222-2222-222222222222' LIMIT 1), 
       '2024-09-01'::date, true
WHERE NOT EXISTS (SELECT 1 FROM students WHERE tenant_id = '22222222-2222-2222-2222-222222222222' AND student_id = 'ALN002');