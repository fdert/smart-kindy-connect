-- تحديث المستخدم الموجود ليصبح معلماً مع tenant_id صحيح
UPDATE public.users 
SET 
    role = 'teacher'::user_role,
    tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c',
    updated_at = now()
WHERE id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902' 
  AND email = 'fdert@gfdd.com';