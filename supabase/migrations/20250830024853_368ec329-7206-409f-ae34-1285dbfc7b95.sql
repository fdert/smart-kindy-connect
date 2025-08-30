-- إنشاء الحسابات التجريبية يدوياً في جدول users فقط (مؤقتاً)
-- سيتم إنشاء حسابات auth.users لاحقاً عبر edge function

-- إدراج المستخدمين بمعرفات مخصصة
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES 
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'superadmin@smartkindy.com',
    crypt('demo123456', gen_salt('bf')),
    NOW(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"مدير عام النظام","role":"super_admin"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000002',
    'authenticated',
    'authenticated',
    'owner@smartkindy.com',
    crypt('demo123456', gen_salt('bf')),
    NOW(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"مدير الروضة التجريبية","role":"owner"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000003',
    'authenticated',
    'authenticated',
    'teacher@smartkindy.com',
    crypt('demo123456', gen_salt('bf')),
    NOW(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"المعلمة التجريبية","role":"teacher"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    '00000000-0000-0000-0000-000000000004',
    'authenticated',
    'authenticated',
    'parent@smartkindy.com',
    crypt('demo123456', gen_salt('bf')),
    NOW(),
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"ولي أمر تجريبي","role":"guardian"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password,
  raw_user_meta_data = EXCLUDED.raw_user_meta_data,
  updated_at = NOW();

-- إدراج المستخدمين في جدول users
INSERT INTO public.users (id, email, full_name, role, tenant_id, is_active, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'superadmin@smartkindy.com', 'مدير عام النظام', 'super_admin', NULL, true, now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'owner@smartkindy.com', 'مدير الروضة التجريبية', 'owner', '11111111-1111-1111-1111-111111111111', true, now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'teacher@smartkindy.com', 'المعلمة التجريبية', 'teacher', '11111111-1111-1111-1111-111111111111', true, now(), now()),
  ('00000000-0000-0000-0000-000000000004', 'parent@smartkindy.com', 'ولي أمر تجريبي', 'guardian', '11111111-1111-1111-1111-111111111111', true, now(), now())
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  tenant_id = EXCLUDED.tenant_id,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- تحديث owner_id للتينانت التجريبي
UPDATE public.tenants 
SET owner_id = '00000000-0000-0000-0000-000000000002', status = 'active'
WHERE id = '11111111-1111-1111-1111-111111111111';