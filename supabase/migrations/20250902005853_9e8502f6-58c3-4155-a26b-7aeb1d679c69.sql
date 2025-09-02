-- إضافة ملاحظات تجريبية للطالب محمد محمود
INSERT INTO public.student_notes (
    student_id,
    tenant_id,
    teacher_id,
    title,
    content,
    note_type,
    severity,
    follow_up_required,
    follow_up_date,
    is_private,
    guardian_notified,
    ai_analysis,
    ai_suggestions,
    created_at
) VALUES 
-- ملاحظات أكاديمية
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    'تقدم ممتاز في الرياضيات',
    'الطالب محمد يظهر فهماً عميقاً لمفاهيم الجمع والطرح. يحل المسائل بسرعة ودقة ويساعد زملاءه في الصف.',
    'academic',
    'low',
    false,
    null,
    false,
    true,
    'يُظهر الطالب قدرات أكاديمية متميزة في الرياضيات مع مهارات تعلم متقدمة للمرحلة العمرية.',
    'الاستمرار في تقديم تحديات إضافية لتنمية قدراته وإشراكه في مساعدة الزملاء.',
    NOW() - INTERVAL '3 days'
),
-- ملاحظات سلوكية إيجابية
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    'طفل مهذب ومتعاون',
    'محمد يتمتع بأخلاق حميدة، يحترم المعلمات والزملاء، ويلعب بشكل إيجابي مع الأطفال. يشارك ألعابه ولا يتردد في مساعدة الآخرين.',
    'behavioral',
    'low',
    false,
    null,
    false,
    true,
    'سلوك إيجابي متميز يدل على تربية جيدة وشخصية اجتماعية سليمة.',
    'تعزيز هذا السلوك الإيجابي من خلال الثناء والتقدير المستمر.',
    NOW() - INTERVAL '5 days'
),
-- ملاحظة تحتاج متابعة
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    'يحتاج لتحسين مهارات الإمساك بالقلم',
    'لاحظت أن محمد يمسك القلم بطريقة غير صحيحة أثناء الكتابة. هذا قد يؤثر على خطه وسرعة كتابته لاحقاً.',
    'academic',
    'medium',
    true,
    NOW() + INTERVAL '1 week',
    false,
    true,
    'مشكلة شائعة في هذه المرحلة العمرية تحتاج لتدخل مبكر لتصحيح العادات الخاطئة.',
    'ممارسة تمارين تقوية الأصابع واستخدام أدوات مساعدة لتعليم الإمساك الصحيح بالقلم.',
    NOW() - INTERVAL '2 days'
),
-- ملاحظة اجتماعية  
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    'قائد طبيعي في المجموعة',
    'محمد لديه شخصية قيادية، الأطفال يحبون اللعب معه ويستمعون لآرائه. يقترح أفكار إبداعية للألعاب الجماعية.',
    'social',
    'low',
    false,
    null,
    false,
    true,
    'مهارات قيادية طبيعية مع قدرة على التأثير الإيجابي على الأقران.',
    'توجيه هذه المهارات القيادية نحو أنشطة تعليمية وتكليفه بمسؤوليات صغيرة في الصف.',
    NOW() - INTERVAL '1 week'
),
-- ملاحظة صحية
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1),
    'عادات صحية ممتازة',
    'محمد يحافظ على نظافته الشخصية، يغسل يديه قبل الأكل وبعده، ويتناول طعاماً صحياً. يشرب الماء بانتظام.',
    'health',
    'low',
    false,
    null,
    false,
    true,
    'وعي صحي متقدم للمرحلة العمرية يدل على تربية أسرية جيدة.',
    'الاستمرار في تعزيز هذه العادات والاستفادة منه كمثال للأطفال الآخرين.',
    NOW() - INTERVAL '4 days'
);

-- إضافة بعض مهارات التطوير للطالب
INSERT INTO public.development_skills (
    student_id,
    tenant_id,
    skill_name,
    skill_category,
    level,
    assessment_date,
    notes,
    assessed_by
) VALUES
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'التعرف على الأرقام',
    'رياضيات',
    5,
    NOW() - INTERVAL '1 week',
    'يتعرف على الأرقام من 1 إلى 20 بثقة',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1)
),
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'التواصل الشفهي',
    'لغة',
    4,
    NOW() - INTERVAL '5 days',
    'يعبر عن أفكاره بوضوح ويشارك في المحادثات',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1)
),
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'المهارات الحركية الدقيقة',
    'حركي',
    3,
    NOW() - INTERVAL '3 days',
    'يحتاج لتحسين في استخدام المقص والإمساك بالقلم',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1)
),
(
    'cdf90435-5b2a-482e-8422-e64dd1471dc0',
    '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    'التفاعل الاجتماعي',
    'اجتماعي',
    5,
    NOW() - INTERVAL '2 days',
    'متفوق في التعامل مع الآخرين ومشاركة الأنشطة',
    (SELECT id FROM users WHERE role = 'teacher' AND tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c' LIMIT 1)
);