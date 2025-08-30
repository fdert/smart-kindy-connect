-- تعطيل تأكيد الإيميل مؤقتاً لتسهيل التطوير
UPDATE auth.users 
SET email_confirmed_at = now(), 
    confirmation_token = ''
WHERE email_confirmed_at IS NULL;

-- إعداد المستخدم الجديد
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change_token_current,
  email_change,
  phone_change,
  phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'fm0002009@gmail.com',
  crypt('password123', gen_salt('bf')),
  now(),
  now(),
  now(),
  '',
  '',
  '',
  '',
  '',
  '',
  ''
) ON CONFLICT (email) DO UPDATE SET
  email_confirmed_at = now(),
  confirmation_token = '';

-- إنشاء ملف تعريف المستخدم في جدول users
INSERT INTO public.users (id, email, full_name, role, tenant_id)
SELECT 
  au.id,
  au.email,
  'مستخدم جديد',
  'guardian',
  NULL
FROM auth.users au
WHERE au.email = 'fm0002009@gmail.com'
ON CONFLICT (id) DO NOTHING;