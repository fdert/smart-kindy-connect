-- Fix the remaining infinite recursion issue
DROP POLICY IF EXISTS "Tenant admins can update users in their tenant" ON public.users;

-- Create a better security definer function for user role checking
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- Add the corrected update policy
CREATE POLICY "Tenant admins can update users in their tenant" ON public.users
FOR UPDATE 
USING (
  tenant_id = public.get_current_user_tenant_id() AND
  public.get_current_user_role() IN ('admin', 'super_admin')
);