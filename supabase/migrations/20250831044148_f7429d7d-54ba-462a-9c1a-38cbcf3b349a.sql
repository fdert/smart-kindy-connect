-- Add response_options column to permissions table
ALTER TABLE public.permissions 
ADD COLUMN response_options JSONB DEFAULT '["موافق", "غير موافق"]'::jsonb;

-- Allow public to view permissions for public responses
CREATE POLICY "Public can view active permissions for responses"
ON public.permissions 
FOR SELECT 
USING (is_active = true);

-- Allow public to insert permission responses  
CREATE POLICY "Public can submit permission responses"
ON public.permission_responses
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.permissions 
  WHERE id = permission_responses.permission_id 
  AND is_active = true 
  AND expires_at > now()
));