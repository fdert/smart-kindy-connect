-- تحديث دور المستخدم بالقوة مع التحقق
UPDATE users 
SET role = 'teacher'::user_role,
    updated_at = CURRENT_TIMESTAMP
WHERE email = 'fdert@gfdd.com' 
  AND id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902';

-- التحقق من التحديث
SELECT 'After Update:' as status, id, email, role, updated_at 
FROM users 
WHERE email = 'fdert@gfdd.com';

-- مسح أي سجلات مكررة إذا وجدت
DELETE FROM users 
WHERE email = 'fdert@gfdd.com' 
  AND role = 'guardian'::user_role
  AND id != '2e8b6e42-bb3b-4667-98b5-6ca5546a2902';

-- التحقق النهائي
SELECT 'Final Check:' as status, COUNT(*) as count, role 
FROM users 
WHERE email = 'fdert@gfdd.com' 
GROUP BY role;