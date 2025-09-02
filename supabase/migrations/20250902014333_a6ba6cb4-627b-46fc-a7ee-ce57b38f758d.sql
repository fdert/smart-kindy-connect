-- Update the role of user with email fdert@gfdd.com from guardian to teacher
UPDATE users 
SET role = 'teacher', updated_at = now() 
WHERE email = 'fdert@gfdd.com' AND role = 'guardian';