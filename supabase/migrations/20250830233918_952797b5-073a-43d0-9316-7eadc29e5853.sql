-- Create storage bucket for media files
INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true);

-- Create RLS policies for media bucket
CREATE POLICY "Media files are accessible to everyone" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'media');

CREATE POLICY "Users can upload media files to their tenant folder" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'media' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update their own media files" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'media' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can delete their own media files" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'media' AND 
  auth.uid() IS NOT NULL AND
  (storage.foldername(name))[1] = (
    SELECT tenant_id::text 
    FROM public.users 
    WHERE id = auth.uid()
  )
);