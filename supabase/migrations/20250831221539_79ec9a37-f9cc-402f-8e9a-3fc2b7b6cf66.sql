-- إنشاء bucket للطلاب إذا لم يكن موجود
INSERT INTO storage.buckets (id, name, public) 
VALUES ('students', 'students', true)
ON CONFLICT (id) DO NOTHING;

-- إنشاء policies للسماح برفع وعرض صور الطلاب
CREATE POLICY "Users can upload student photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'students' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view student photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'students');

CREATE POLICY "Users can update student photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'students' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete student photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'students' 
  AND auth.uid() IS NOT NULL
);