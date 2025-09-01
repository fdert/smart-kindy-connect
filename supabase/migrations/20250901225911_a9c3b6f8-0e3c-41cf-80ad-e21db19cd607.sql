-- حذف المستخدم المكرر (المعلم) والاحتفاظ بالمستخدم المرتبط بـ auth
DELETE FROM public.users 
WHERE id = 'c9f070e1-848e-4cd5-bd0c-d8226d43027b' AND email = 'fdert@gfdd.com';

-- تحديث المستخدم الصحيح (المرتبط بـ auth) ليصبح معلماً
UPDATE public.users 
SET 
    role = 'teacher'::user_role,
    updated_at = now()
WHERE id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902' 
  AND email = 'fdert@gfdd.com';