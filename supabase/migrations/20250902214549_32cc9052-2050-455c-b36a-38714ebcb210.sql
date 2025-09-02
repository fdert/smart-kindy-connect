-- Fix RLS policies for comprehensive student reports
-- Add public access for tenants table when accessing reports

-- Drop existing policies that might conflict
DROP POLICY IF EXISTS "Public can view tenants for reports" ON public.tenants;

-- Create policy to allow public access to tenant data for reports
CREATE POLICY "Public can view tenants for reports"
ON public.tenants
FOR SELECT
USING (true);

-- Ensure proper access to all related tables for reports
DROP POLICY IF EXISTS "Public can view users for reports" ON public.users;

-- Create policy for users table access in reports context
CREATE POLICY "Public can view users for reports"
ON public.users
FOR SELECT
USING (true);

-- Log the migration
INSERT INTO public.audit_logs (
  tenant_id,
  action,
  resource_type,
  resource_id,
  user_id,
  new_values
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'migration',
  'rls_policies',
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  '{"description": "Fixed RLS policies for comprehensive student reports", "tables": ["tenants", "users"]}'::jsonb
);