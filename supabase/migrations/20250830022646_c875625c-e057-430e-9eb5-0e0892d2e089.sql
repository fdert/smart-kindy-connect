-- إنشاء بيانات تجريبية لجميع أدوار النظام

-- إنشاء tenant تجريبي
INSERT INTO public.tenants (id, name, email, phone, address, slug, status, owner_id, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'روضة الأطفال التجريبية',
    'demo@smartkindy.com',
    '+966501234567',
    'الرياض، المملكة العربية السعودية',
    'demo-nursery',
    'active',
    null,
    now(),
    now()
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    slug = EXCLUDED.slug,
    status = EXCLUDED.status,
    updated_at = now();

-- إنشاء المستخدمين التجريبيين
INSERT INTO public.users (id, email, full_name, phone, role, tenant_id, is_active, created_at, updated_at)
VALUES 
    -- Super Admin
    ('22222222-2222-2222-2222-222222222222', 'superadmin@smartkindy.com', 'مدير عام النظام', '+966501111111', 'super_admin', null, true, now(), now()),
    -- Owner
    ('33333333-3333-3333-3333-333333333333', 'owner@smartkindy.com', 'مدير الروضة', '+966502222222', 'owner', '11111111-1111-1111-1111-111111111111', true, now(), now()),
    -- Teacher
    ('44444444-4444-4444-4444-444444444444', 'teacher@smartkindy.com', 'المعلمة سارة', '+966503333333', 'teacher', '11111111-1111-1111-1111-111111111111', true, now(), now()),
    -- Guardian
    ('55555555-5555-5555-5555-555555555555', 'parent@smartkindy.com', 'ولي أمر تجريبي', '+966504444444', 'guardian', '11111111-1111-1111-1111-111111111111', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role,
    tenant_id = EXCLUDED.tenant_id,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- تحديث owner_id في tenants
UPDATE public.tenants 
SET owner_id = '33333333-3333-3333-3333-333333333333' 
WHERE id = '11111111-1111-1111-1111-111111111111';

-- إنشاء فصول تجريبية
INSERT INTO public.classes (id, name, description, capacity, age_min, age_max, teacher_id, tenant_id, is_active, created_at, updated_at)
VALUES 
    ('66666666-6666-6666-6666-666666666666', 'فصل الأطفال الصغار', 'فصل للأطفال من عمر 2-3 سنوات', 15, 2, 3, '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', true, now(), now()),
    ('77777777-7777-7777-7777-777777777777', 'فصل الأطفال الكبار', 'فصل للأطفال من عمر 4-5 سنوات', 20, 4, 5, '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capacity = EXCLUDED.capacity,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    teacher_id = EXCLUDED.teacher_id,
    tenant_id = EXCLUDED.tenant_id,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- إنشاء أولياء أمور تجريبيين
INSERT INTO public.guardians (id, full_name, phone, email, whatsapp_number, relationship, tenant_id, user_id, is_primary, can_pickup, created_at, updated_at)
VALUES 
    ('88888888-8888-8888-8888-888888888888', 'أحمد محمد السعد', '+966504444444', 'parent@smartkindy.com', '+966504444444', 'والد', '11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', true, true, now(), now()),
    ('99999999-9999-9999-9999-999999999999', 'فاطمة علي الأحمد', '+966505555555', 'mother@smartkindy.com', '+966505555555', 'والدة', '11111111-1111-1111-1111-111111111111', null, false, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    whatsapp_number = EXCLUDED.whatsapp_number,
    relationship = EXCLUDED.relationship,
    tenant_id = EXCLUDED.tenant_id,
    user_id = EXCLUDED.user_id,
    is_primary = EXCLUDED.is_primary,
    can_pickup = EXCLUDED.can_pickup,
    updated_at = now();

-- إنشاء طلاب تجريبيين
INSERT INTO public.students (id, student_id, full_name, date_of_birth, gender, class_id, tenant_id, enrollment_date, is_active, medical_info, emergency_contact, created_at, updated_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ST001', 'محمد أحمد السعد', '2021-05-15', 'ذكر', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '6 months', true, 
     '{"allergies": ["الفول السوداني"], "medications": [], "special_needs": "لا توجد"}',
     '{"name": "أحمد محمد السعد", "phone": "+966504444444", "relationship": "والد"}',
     now(), now()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ST002', 'نور فاطمة الأحمد', '2020-03-22', 'أنثى', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '8 months', true,
     '{"allergies": [], "medications": [], "special_needs": "لا توجد"}',
     '{"name": "فاطمة علي الأحمد", "phone": "+966505555555", "relationship": "والدة"}',
     now(), now()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ST003', 'عبدالله سالم المطيري', '2021-08-10', 'ذكر', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '4 months', true,
     '{"allergies": ["البيض"], "medications": [], "special_needs": "لا توجد"}',
     '{"name": "سالم المطيري", "phone": "+966506666666", "relationship": "والد"}',
     now(), now())
ON CONFLICT (id) DO UPDATE SET
    student_id = EXCLUDED.student_id,
    full_name = EXCLUDED.full_name,
    date_of_birth = EXCLUDED.date_of_birth,
    gender = EXCLUDED.gender,
    class_id = EXCLUDED.class_id,
    tenant_id = EXCLUDED.tenant_id,
    enrollment_date = EXCLUDED.enrollment_date,
    is_active = EXCLUDED.is_active,
    medical_info = EXCLUDED.medical_info,
    emergency_contact = EXCLUDED.emergency_contact,
    updated_at = now();

-- ربط أولياء الأمور بالطلاب
INSERT INTO public.guardian_student_links (id, guardian_id, student_id, relationship, tenant_id, is_primary, can_pickup, created_at)
VALUES 
    ('dddddddd-dddd-dddd-dddd-dddddddddddd', '88888888-8888-8888-8888-888888888888', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'والد', '11111111-1111-1111-1111-111111111111', true, true, now()),
    ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '99999999-9999-9999-9999-999999999999', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'والدة', '11111111-1111-1111-1111-111111111111', true, true, now())
ON CONFLICT (id) DO UPDATE SET
    guardian_id = EXCLUDED.guardian_id,
    student_id = EXCLUDED.student_id,
    relationship = EXCLUDED.relationship,
    tenant_id = EXCLUDED.tenant_id,
    is_primary = EXCLUDED.is_primary,
    can_pickup = EXCLUDED.can_pickup;

-- إنشاء بيانات حضور تجريبية
INSERT INTO public.attendance_events (id, student_id, class_id, tenant_id, date, status, check_in_time, check_out_time, recorded_by, notes, created_at, updated_at)
VALUES 
    -- حضور اليوم
    ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'present', CURRENT_DATE + TIME '08:30:00', CURRENT_DATE + TIME '14:00:00', '44444444-4444-4444-4444-444444444444', 'حضر في الوقت المحدد', now(), now()),
    ('gggggggg-gggg-gggg-gggg-gggggggggggg', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'present', CURRENT_DATE + TIME '08:45:00', null, '44444444-4444-4444-4444-444444444444', 'تأخير 15 دقيقة', now(), now()),
    ('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', CURRENT_DATE, 'absent', null, null, '44444444-4444-4444-4444-444444444444', 'غياب بعذر - مريض', now(), now()),
    -- حضور أمس
    ('iiiiiiii-iiii-iiii-iiii-iiiiiiiiiiii', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - 1, 'present', (CURRENT_DATE - 1) + TIME '08:30:00', (CURRENT_DATE - 1) + TIME '14:00:00', '44444444-4444-4444-4444-444444444444', '', now(), now()),
    ('jjjjjjjj-jjjj-jjjj-jjjj-jjjjjjjjjjjj', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - 1, 'present', (CURRENT_DATE - 1) + TIME '08:30:00', (CURRENT_DATE - 1) + TIME '14:00:00', '44444444-4444-4444-4444-444444444444', '', now(), now())
ON CONFLICT (id) DO NOTHING;

-- إنشاء مكافآت تجريبية
INSERT INTO public.rewards (id, student_id, tenant_id, type, title, description, points, awarded_by, notes, badge_color, awarded_at, created_at)
VALUES 
    ('kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'star', 'نجمة التميز', 'للمشاركة الفعالة في النشاط', 5, '44444444-4444-4444-4444-444444444444', 'أداء ممتاز في نشاط الرسم', '#FFD700', now(), now()),
    ('llllllll-llll-llll-llll-llllllllllll', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', 'badge', 'وسام النظافة', 'للحفاظ على نظافة المكان', 3, '44444444-4444-4444-4444-444444444444', 'حافظت على نظافة مكانها', '#4CAF50', now() - INTERVAL '1 day', now()),
    ('mmmmmmmm-mmmm-mmmm-mmmm-mmmmmmmmmmmm', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 'certificate', 'شهادة التفوق', 'للأداء المتميز هذا الأسبوع', 10, '44444444-4444-4444-4444-444444444444', 'أداء متميز في جميع الأنشطة', '#9C27B0', now() - INTERVAL '2 days', now())
ON CONFLICT (id) DO NOTHING;

-- إنشاء رسائل واتساب تجريبية
INSERT INTO public.wa_messages (id, tenant_id, student_id, guardian_id, direction, from_number, to_number, message_type, message_text, template_name, status, context_type, context_id, created_at, updated_at)
VALUES 
    ('nnnnnnnn-nnnn-nnnn-nnnn-nnnnnnnnnnnn', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', 'outbound', '+966570000000', '+966504444444', 'template', 'وصل محمد أحمد إلى الروضة بأمان في تمام الساعة 8:30 صباحاً', 'arrival_notification', 'delivered', 'attendance', 'ffffffff-ffff-ffff-ffff-ffffffffffff', now(), now()),
    ('oooooooo-oooo-oooo-oooo-oooooooooooo', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '88888888-8888-8888-8888-888888888888', 'outbound', '+966570000000', '+966504444444', 'template', 'حصل محمد أحمد على نجمة التميز اليوم! 🌟 نهنئه على أدائه الرائع', 'reward_notification', 'delivered', 'reward', 'kkkkkkkk-kkkk-kkkk-kkkk-kkkkkkkkkkkk', now() - INTERVAL '1 hour', now())
ON CONFLICT (id) DO NOTHING;

-- إنشاء ملفات وسائط تجريبية
INSERT INTO public.media (id, tenant_id, file_name, file_path, file_type, mime_type, caption, album_date, uploaded_by, is_public, tags, created_at, updated_at)
VALUES 
    ('pppppppp-pppp-pppp-pppp-pppppppppppp', '11111111-1111-1111-1111-111111111111', 'نشاط_الرسم_اليوم.jpg', '/media/demo/art_activity.jpg', 'image', 'image/jpeg', 'نشاط الرسم لطلاب الفصل الصغير', CURRENT_DATE, '44444444-4444-4444-4444-444444444444', true, '["نشاط", "رسم", "فن"]', now(), now()),
    ('qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', '11111111-1111-1111-1111-111111111111', 'وقت_اللعب.jpg', '/media/demo/play_time.jpg', 'image', 'image/jpeg', 'وقت اللعب في الحديقة', CURRENT_DATE, '44444444-4444-4444-4444-444444444444', true, '["لعب", "حديقة", "نشاط"]', now(), now())
ON CONFLICT (id) DO NOTHING;

-- ربط الوسائط بالطلاب
INSERT INTO public.media_student_links (id, media_id, student_id, tenant_id, created_at)
VALUES 
    ('rrrrrrrr-rrrr-rrrr-rrrr-rrrrrrrrrrrr', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', now()),
    ('ssssssss-ssss-ssss-ssss-ssssssssssss', 'pppppppp-pppp-pppp-pppp-pppppppppppp', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '11111111-1111-1111-1111-111111111111', now()),
    ('tttttttt-tttt-tttt-tttt-tttttttttttt', 'qqqqqqqq-qqqq-qqqq-qqqq-qqqqqqqqqqqq', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', now())
ON CONFLICT (id) DO NOTHING;

-- إنشاء إعدادات WhatsApp تجريبية
INSERT INTO public.tenant_settings (id, tenant_id, key, value, created_at, updated_at)
VALUES 
    ('uuuuuuuu-uuuu-uuuu-uuuu-uuuuuuuuuuuu', '11111111-1111-1111-1111-111111111111', 'whatsapp_settings', 
     '{
       "business_phone": "+966570000000",
       "webhook_url": "https://example.com/webhook",
       "templates": {
         "arrival_notification": "وصل {student_name} إلى الروضة بأمان في تمام الساعة {time}",
         "departure_notification": "انصرف {student_name} من الروضة في تمام الساعة {time}",
         "reward_notification": "حصل {student_name} على {reward_title}! 🌟 نهنئه على أدائه الرائع",
         "absence_notification": "لم يحضر {student_name} اليوم. نتمنى أن يكون بخير"
       }
     }', now(), now())
ON CONFLICT (id) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = now();