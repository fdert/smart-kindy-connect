-- Add RLS policy to allow tenant users to create teachers within their tenant
CREATE POLICY "Tenant admins can create users in their tenant" ON public.users
FOR INSERT 
WITH CHECK (
  -- Allow if the current user has admin role and same tenant_id
  EXISTS (
    SELECT 1 FROM public.users current_user 
    WHERE current_user.id = auth.uid() 
    AND current_user.tenant_id = users.tenant_id 
    AND current_user.role IN ('admin', 'super_admin')
  )
);