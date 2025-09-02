-- إضافة المزيد من الجوائز التجريبية للطالب محمد محمود للاختبار
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
-- جوائز أكاديمية
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'متفوق في الرياضيات',
    'أتقن الطالب عملية الجمع والطرح بشكل ممتاز',
    'academic',
    10,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '2 days',
    'يتميز بالفهم السريع والحل الصحيح',
    '#3B82F6',
    true
),
-- جوائز سلوكية
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'طفل مهذب ومتعاون',
    'يساعد زملاءه ويحترم المعلمات',
    'behavioral',
    8,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '5 days',
    'سلوك إيجابي ومثالي',
    '#10B981',
    true
),
-- جوائز المشاركة
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'نشط في الأنشطة',
    'يشارك بحماس في جميع الأنشطة الصفية',
    'participation',
    6,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '1 week',
    'مشاركة فعالة ومتميزة',
    '#8B5CF6',
    true
),
-- جوائز الإبداع
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'فنان موهوب',
    'رسم لوحة جميلة في حصة الفن',
    'creativity',
    7,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '10 days',
    'إبداع في الألوان والتصميم',
    '#EC4899',
    true
),
-- جوائز القيادة
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'قائد مسؤول',
    'ساعد في تنظيم الصف وتوجيه الأطفال',
    'leadership',
    9,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '3 days',
    'روح قيادية واضحة',
    '#F59E0B',
    true
),
-- جائزة أخرى حديثة
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'طفل نظيف ومرتب',
    'يحافظ على نظافة مكانه وأدواته',
    'behavioral',
    5,
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    NOW() - INTERVAL '1 day',
    'نظافة شخصية ممتازة',
    '#10B981',
    true
);