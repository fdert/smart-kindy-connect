-- تحديث دور مدير الروضة سكن
UPDATE users 
SET role = 'admin'::user_role 
WHERE email = 'fm02009@hotmail.com';