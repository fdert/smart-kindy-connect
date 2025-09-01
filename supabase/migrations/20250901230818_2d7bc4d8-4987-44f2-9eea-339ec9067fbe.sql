-- Update the user role from guardian to teacher
UPDATE users 
SET role = 'teacher'
WHERE email = 'fdert@gfdd.com' AND id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902';