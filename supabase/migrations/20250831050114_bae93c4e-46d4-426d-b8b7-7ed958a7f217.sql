-- Check what the current constraint is
SELECT conname, pg_get_constraintdef(oid) as definition 
FROM pg_constraint 
WHERE conrelid = 'public.permission_responses'::regclass 
AND contype = 'c';

-- Drop the existing check constraint that's causing issues
ALTER TABLE public.permission_responses 
DROP CONSTRAINT IF EXISTS permission_responses_response_check;

-- Recreate a more flexible constraint that allows any valid response text
ALTER TABLE public.permission_responses 
ADD CONSTRAINT permission_responses_response_check 
CHECK (length(trim(response)) > 0);