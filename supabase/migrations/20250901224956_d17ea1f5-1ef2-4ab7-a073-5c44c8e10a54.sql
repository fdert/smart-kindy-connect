-- تحديث دور المستخدم المسجل الدخول ليكون معلماً
UPDATE public.users 
SET role = 'teacher' 
WHERE id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902' AND email = 'fdert@gfdd.com';