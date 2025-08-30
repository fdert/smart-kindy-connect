-- إنشاء tenant وبيانات أساسية للنظام التجريبي (مع القيم الصحيحة)

-- إنشاء tenant تجريبي
INSERT INTO public.tenants (id, name, email, phone, address, slug, status, created_at, updated_at)
VALUES (
    '11111111-1111-1111-1111-111111111111',
    'روضة الأطفال التجريبية',
    'demo@smartkindy.com',
    '+966501234567',
    'الرياض، المملكة العربية السعودية',
    'demo-nursery',
    'approved',
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

-- إنشاء فصول تجريبية
INSERT INTO public.classes (id, name, description, capacity, age_min, age_max, tenant_id, is_active, created_at, updated_at)
VALUES 
    ('66666666-6666-6666-6666-666666666666', 'فصل الأطفال الصغار', 'فصل للأطفال من عمر 2-3 سنوات', 15, 2, 3, '11111111-1111-1111-1111-111111111111', true, now(), now()),
    ('77777777-7777-7777-7777-777777777777', 'فصل الأطفال الكبار', 'فصل للأطفال من عمر 4-5 سنوات', 20, 4, 5, '11111111-1111-1111-1111-111111111111', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    capacity = EXCLUDED.capacity,
    age_min = EXCLUDED.age_min,
    age_max = EXCLUDED.age_max,
    tenant_id = EXCLUDED.tenant_id,
    is_active = EXCLUDED.is_active,
    updated_at = now();

-- إنشاء أولياء أمور تجريبيين
INSERT INTO public.guardians (id, full_name, phone, email, whatsapp_number, relationship, tenant_id, is_primary, can_pickup, created_at, updated_at)
VALUES 
    ('88888888-8888-8888-8888-888888888888', 'أحمد محمد السعد', '+966504444444', 'parent@smartkindy.com', '+966504444444', 'والد', '11111111-1111-1111-1111-111111111111', true, true, now(), now()),
    ('99999999-9999-9999-9999-999999999999', 'فاطمة علي الأحمد', '+966505555555', 'mother@smartkindy.com', '+966505555555', 'والدة', '11111111-1111-1111-1111-111111111111', false, true, now(), now())
ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    whatsapp_number = EXCLUDED.whatsapp_number,
    relationship = EXCLUDED.relationship,
    tenant_id = EXCLUDED.tenant_id,
    is_primary = EXCLUDED.is_primary,
    can_pickup = EXCLUDED.can_pickup,
    updated_at = now();

-- إنشاء طلاب تجريبيين (بالقيم الإنجليزية للجنس)
INSERT INTO public.students (id, student_id, full_name, date_of_birth, gender, class_id, tenant_id, enrollment_date, is_active, medical_info, emergency_contact, created_at, updated_at)
VALUES 
    ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'ST001', 'محمد أحمد السعد', '2021-05-15', 'male', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '6 months', true, 
     '{"allergies": ["الفول السوداني"], "medications": [], "special_needs": "لا توجد"}',
     '{"name": "أحمد محمد السعد", "phone": "+966504444444", "relationship": "والد"}',
     now(), now()),
    ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'ST002', 'نور فاطمة الأحمد', '2020-03-22', 'female', '77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '8 months', true,
     '{"allergies": [], "medications": [], "special_needs": "لا توجد"}',
     '{"name": "فاطمة علي الأحمد", "phone": "+966505555555", "relationship": "والدة"}',
     now(), now()),
    ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'ST003', 'عبدالله سالم المطيري', '2021-08-10', 'male', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', CURRENT_DATE - INTERVAL '4 months', true,
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