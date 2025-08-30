-- إنشاء حساب مدير عام حقيقي جديد
-- هذا المثال ينشئ حساب مدير عام، يمكنك تغيير البيانات حسب احتياجاتك

-- إضافة المستخدم إلى auth.users 
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@smartkindy.com',  -- يمكنك تغيير هذا الإيميل
    crypt('SuperAdmin2024!', gen_salt('bf')),  -- يمكنك تغيير كلمة المرور
    now(),
    now(),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "مدير النظام الرئيسي"}'
);

-- الحصول على معرف المستخدم الجديد
WITH new_user AS (
    SELECT id FROM auth.users WHERE email = 'admin@smartkindy.com'
)
-- إضافة الملف الشخصي في public.users
INSERT INTO public.users (
    id,
    email,
    full_name,
    role,
    tenant_id,
    is_active,
    created_at,
    updated_at
)
SELECT 
    id,
    'admin@smartkindy.com',
    'مدير النظام الرئيسي',
    'super_admin'::user_role,
    NULL,  -- المدير العام لا يحتاج لمعرف مؤسسة
    true,
    now(),
    now()
FROM new_user;