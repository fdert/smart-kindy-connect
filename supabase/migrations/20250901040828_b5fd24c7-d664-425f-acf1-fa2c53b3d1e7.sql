-- Add RLS policy to allow tenant users to create teachers within their tenant
CREATE POLICY "Tenant admins can create users in their tenant" ON public.users
FOR INSERT 
WITH CHECK (
  -- Allow if the current user has admin role and same tenant_id
  EXISTS (
    SELECT 1 FROM public.users u 
    WHERE u.id = auth.uid() 
    AND u.tenant_id = users.tenant_id 
    AND u.role IN ('admin', 'super_admin')
  )
);