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