-- إضافة سياسة أمان بديلة أكثر مرونة لتسجيل tenants
DROP POLICY IF EXISTS "Anyone can register new tenants" ON public.tenants;

-- إنشاء سياسة جديدة أكثر بساطة
CREATE POLICY "Allow tenant registration for all users" 
ON public.tenants 
FOR INSERT 
TO public
WITH CHECK (
  -- فقط للتأكد من أن status هو pending
  status = 'pending'::tenant_status AND
  -- التأكد من أن الحقول المطلوبة موجودة
  name IS NOT NULL AND 
  slug IS NOT NULL AND 
  email IS NOT NULL
);