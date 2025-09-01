-- حذف المستخدم الخطأ (guardian) الذي ليس له tenant_id
DELETE FROM public.users 
WHERE id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902' AND email = 'fdert@gfdd.com' AND role = 'guardian';

-- تحديث auth.users ليشير إلى المستخدم الصحيح (المعلم)
UPDATE auth.users 
SET id = 'c9f070e1-848e-4cd5-bd0c-d8226d43027b'
WHERE email = 'fdert@gfdd.com' AND id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902';