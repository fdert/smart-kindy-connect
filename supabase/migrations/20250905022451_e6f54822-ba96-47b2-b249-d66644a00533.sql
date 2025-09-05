-- تحديث دور الحساب التجريبي للمعلمة إلى teacher
UPDATE users 
SET role = 'teacher' 
WHERE email = 'teacher@smartkindy.com';