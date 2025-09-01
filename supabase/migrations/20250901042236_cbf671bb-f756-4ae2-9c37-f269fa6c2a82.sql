-- Add RLS policy to allow tenant users to view other users in their tenant
CREATE POLICY "Tenant users can view users in their tenant" ON public.users
FOR SELECT 
USING (
  -- Allow if the current user is from the same tenant
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.tenant_id = users.tenant_id
  )
);

-- Add policy for updating users in the same tenant
CREATE POLICY "Tenant admins can update users in their tenant" ON public.users
FOR UPDATE 
USING (
  -- Allow if the current user has admin role and same tenant_id
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.tenant_id = users.tenant_id 
    AND u.role IN ('admin', 'super_admin')
  )
);