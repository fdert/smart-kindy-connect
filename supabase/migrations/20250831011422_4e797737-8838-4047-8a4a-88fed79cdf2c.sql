-- Update tenants RLS policy to allow public read access to basic info for approved tenants
DROP POLICY IF EXISTS "Public can view approved tenant basic info" ON public.tenants;

CREATE POLICY "Public can view approved tenant basic info" 
ON public.tenants 
FOR SELECT 
USING (status = 'approved');