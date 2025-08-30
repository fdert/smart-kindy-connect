-- إضافة خطة تجريبية مجانية
INSERT INTO public.plans (id, name, name_ar, description, description_ar, price_monthly, price_quarterly, price_yearly, currency, max_students, max_teachers, max_classes, has_whatsapp, has_reports, has_analytics, storage_gb, is_active, is_popular, sort_order, created_at, updated_at)
VALUES (
    '10101010-1010-1010-1010-101010101010',
    'Demo Plan',
    'خطة تجريبية',
    'Full-featured demo plan for testing',
    'خطة تجريبية كاملة الميزات للاختبار',
    0,
    0,
    0,
    'SAR',
    100,
    10,
    10,
    true,
    true,
    true,
    50,
    true,
    false,
    0,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    name_ar = EXCLUDED.name_ar,
    description = EXCLUDED.description,
    description_ar = EXCLUDED.description_ar,
    max_students = EXCLUDED.max_students,
    max_teachers = EXCLUDED.max_teachers,
    max_classes = EXCLUDED.max_classes,
    has_whatsapp = EXCLUDED.has_whatsapp,
    has_reports = EXCLUDED.has_reports,
    has_analytics = EXCLUDED.has_analytics,
    storage_gb = EXCLUDED.storage_gb,
    updated_at = now();

-- إنشاء اشتراك تجريبي
INSERT INTO public.subscriptions (id, tenant_id, plan_id, status, billing_interval, amount, currency, current_period_start, current_period_end, next_billing_date, trial_end, created_at, updated_at)
VALUES (
    '20202020-2020-2020-2020-202020202020',
    '11111111-1111-1111-1111-111111111111',
    '10101010-1010-1010-1010-101010101010',
    'active',
    'monthly',
    0,
    'SAR',
    CURRENT_DATE,
    CURRENT_DATE + INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '1 year',
    CURRENT_DATE + INTERVAL '1 month',
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    status = EXCLUDED.status,
    current_period_end = EXCLUDED.current_period_end,
    next_billing_date = EXCLUDED.next_billing_date,
    updated_at = now();

-- إضافة شهادات تميز للطلاب
INSERT INTO public.testimonials (id, customer_name, customer_title, nursery_name, testimonial_text, testimonial_text_ar, rating, is_published, is_featured, avatar_url, sort_order, created_at, updated_at)
VALUES 
    ('30303030-3030-3030-3030-303030303030', 'أم أحمد', 'ولية أمر', 'روضة الأطفال التجريبية', 'Amazing system for managing our kindergarten!', 'نظام رائع لإدارة روضة الأطفال! سهل الاستخدام ومفيد جداً', 5, true, true, null, 1, now(), now()),
    ('40404040-4040-4040-4040-404040404040', 'المعلمة سارة', 'معلمة', 'روضة الأطفال التجريبية', 'Great features for teachers', 'ميزات رائعة للمعلمين، يوفر الوقت والجهد', 5, true, false, null, 2, now(), now())
ON CONFLICT (id) DO UPDATE SET
    customer_name = EXCLUDED.customer_name,
    testimonial_text = EXCLUDED.testimonial_text,
    testimonial_text_ar = EXCLUDED.testimonial_text_ar,
    rating = EXCLUDED.rating,
    is_published = EXCLUDED.is_published,
    updated_at = now();

-- إنشاء FAQs تجريبية
INSERT INTO public.faqs (id, question, question_ar, answer, answer_ar, category, is_published, sort_order, created_at, updated_at)
VALUES 
    ('50505050-5050-5050-5050-505050505050', 'How does WhatsApp integration work?', 'كيف يعمل تكامل واتساب؟', 'Our system automatically sends notifications to parents via WhatsApp when students arrive or leave.', 'يرسل النظام إشعارات تلقائية لأولياء الأمور عبر واتساب عند وصول أو مغادرة الطلاب.', 'features', true, 1, now(), now()),
    ('60606060-6060-6060-6060-606060606060', 'Is the system secure?', 'هل النظام آمن؟', 'Yes, we use advanced encryption and security measures to protect your data.', 'نعم، نستخدم تشفيراً متقدماً وإجراءات أمنية لحماية بياناتك.', 'security', true, 2, now(), now())
ON CONFLICT (id) DO UPDATE SET
    question = EXCLUDED.question,
    question_ar = EXCLUDED.question_ar,
    answer = EXCLUDED.answer,
    answer_ar = EXCLUDED.answer_ar,
    category = EXCLUDED.category,
    is_published = EXCLUDED.is_published,
    updated_at = now();