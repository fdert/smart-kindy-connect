-- إزالة جميع سياسات INSERT الموجودة على جدول tenants وإنشاء سياسة بسيطة للتسجيل العام
DROP POLICY IF EXISTS "Allow tenant registration for all users" ON public.tenants;

-- إنشاء سياسة جديدة تسمح للجميع بالتسجيل دون قيود معقدة
CREATE POLICY "Enable INSERT for tenant registration" 
ON public.tenants 
FOR INSERT 
TO public
WITH CHECK (
  status = 'pending' AND
  name IS NOT NULL AND 
  slug IS NOT NULL AND 
  email IS NOT NULL
);

-- التأكد من أن RLS مفعل على الجدول لكن يسمح بـ INSERT للجميع
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;