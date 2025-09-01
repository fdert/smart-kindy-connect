-- إجبار تحديث الدور مع التأكد من الحفظ
BEGIN;

-- تحديث الدور
UPDATE public.users 
SET 
  role = 'teacher'::user_role,
  updated_at = NOW()
WHERE email = 'fdert@gfdd.com' 
  AND id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902';

-- التحقق من التحديث فوراً
SELECT 
  'Updated:' as status,
  id, 
  email, 
  role, 
  updated_at 
FROM public.users 
WHERE email = 'fdert@gfdd.com';

COMMIT;