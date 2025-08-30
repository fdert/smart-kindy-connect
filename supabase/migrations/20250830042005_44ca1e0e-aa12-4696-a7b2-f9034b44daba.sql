-- تحديث كلمة المرور للحساب الموجود
UPDATE auth.users 
SET encrypted_password = crypt('SuperAdmin2024!', gen_salt('bf'))
WHERE email = 'admin@smartkindy.com';