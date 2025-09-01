-- Remove the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Tenant users can view users in their tenant" ON public.users;
DROP POLICY IF EXISTS "Tenant admins can update users in their tenant" ON public.users;

-- Create a security definer function to avoid recursion
CREATE OR REPLACE FUNCTION public.get_current_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$;

-- Add correct policies using the security definer function
CREATE POLICY "Tenant users can view users in their tenant" ON public.users
FOR SELECT 
USING (tenant_id = public.get_current_user_tenant_id());

CREATE POLICY "Tenant admins can update users in their tenant" ON public.users
FOR UPDATE 
USING (
  tenant_id = public.get_current_user_tenant_id() AND
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.role IN ('admin', 'super_admin')
  )
);