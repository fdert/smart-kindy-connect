-- إصلاح مشكلة confirmation_token في auth.users
UPDATE auth.users 
SET 
  confirmation_token = '',
  recovery_token = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, '')
WHERE email = 'admin@smartkindy.com';