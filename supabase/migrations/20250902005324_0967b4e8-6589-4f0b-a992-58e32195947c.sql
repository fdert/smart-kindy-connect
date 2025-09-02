-- إضافة المزيد من الجوائز التجريبية للطالب محمد محمود باستخدام enum صحيح
INSERT INTO public.rewards (
    student_id,
    tenant_id,
    title,
    description,
    type,
    points,
    awarded_by,
    awarded_at,
    notes,
    badge_color,
    is_public
) VALUES 
-- جوائز أكاديمية - نجمة
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'متفوق في الرياضيات',
    'أتقن الطالب عملية الجمع والطرح بشكل ممتاز',
    'star',
    10,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '2 days',
    'يتميز بالفهم السريع والحل الصحيح',
    '#3B82F6',
    true
),
-- جوائز سلوكية - شارة
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'طفل مهذب ومتعاون',
    'يساعد زملاءه ويحترم المعلمات',
    'badge',
    8,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '5 days',
    'سلوك إيجابي ومثالي',
    '#10B981',
    true
),
-- شهادة تقدير
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'نشط في الأنشطة',
    'يشارك بحماس في جميع الأنشطة الصفية',
    'certificate',
    12,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '1 week',
    'مشاركة فعالة ومتميزة',
    '#8B5CF6',
    true
),
-- إنجاز 
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'فنان موهوب',
    'رسم لوحة جميلة في حصة الفن',
    'achievement',
    7,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '10 days',
    'إبداع في الألوان والتصميم',
    '#EC4899',
    true
),
-- نجمة أخرى
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'قائد مسؤول',
    'ساعد في تنظيم الصف وتوجيه الأطفال',
    'star',
    9,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '3 days',
    'روح قيادية واضحة',
    '#F59E0B',
    true
),
-- شارة أخرى حديثة
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'طفل نظيف ومرتب',
    'يحافظ على نظافة مكانه وأدواته',
    'badge',
    5,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '1 day',
    'نظافة شخصية ممتازة',
    '#10B981',
    true
);

-- تحديث الجائزة الموجودة مسبقاً لتتماشى مع enum الصحيح إذا لزم الأمر
UPDATE public.rewards 
SET type = 'star'::reward_type 
WHERE id = 'f0ec93eb-d5e0-4d3b-9849-cf7579a416aa';