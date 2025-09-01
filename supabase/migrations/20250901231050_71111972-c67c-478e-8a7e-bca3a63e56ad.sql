-- Force update the user role to teacher
UPDATE users 
SET role = 'teacher'::user_role,
    updated_at = now()
WHERE email = 'fdert@gfdd.com' 
  AND id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902';

-- Verify the update worked
SELECT id, email, role, updated_at FROM users WHERE email = 'fdert@gfdd.com';