-- تحديث الدور بقوة
UPDATE users 
SET role = 'teacher', updated_at = NOW()
WHERE id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902';

-- التحقق من التحديث
SELECT 'After Update:' as status, id, email, role, updated_at 
FROM users 
WHERE id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902';