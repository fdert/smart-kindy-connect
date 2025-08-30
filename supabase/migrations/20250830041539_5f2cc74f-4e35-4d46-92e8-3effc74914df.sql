-- حذف جميع المستخدمين بالبريد admin@smartkindy.com من كلا الجدولين
DELETE FROM public.users WHERE email = 'admin@smartkindy.com';
DELETE FROM auth.users WHERE email = 'admin@smartkindy.com';

-- الآن إنشاء حساب جديد
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    confirmation_sent_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@smartkindy.com',
    crypt('SuperAdmin2024!', gen_salt('bf')),
    now(),
    now(),
    now(),
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"full_name": "مدير النظام الرئيسي"}'
);

-- إضافة الملف الشخصي
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
    NULL,
    true,
    now(),
    now()
FROM auth.users 
WHERE email = 'admin@smartkindy.com';