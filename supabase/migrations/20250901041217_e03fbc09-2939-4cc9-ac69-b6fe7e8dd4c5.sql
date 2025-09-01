-- Remove foreign key constraint from users table id column to auth.users
-- This will allow us to create user records independently
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_id_fkey;