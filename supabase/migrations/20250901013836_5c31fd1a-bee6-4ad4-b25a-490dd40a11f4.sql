-- إزالة السياسة الحالية وإنشاء سياسة جديدة أكثر بساطة
DROP POLICY IF EXISTS "Enable INSERT for tenant registration" ON public.tenants;

-- إنشاء سياسة جديدة تسمح للجميع بالإدراج دون قيود معقدة
CREATE POLICY "Allow public tenant registration" 
ON public.tenants 
FOR INSERT 
TO public
WITH CHECK (true);

-- التأكد من وجود سياسة SELECT للمستخدمين العاديين
DROP POLICY IF EXISTS "Public can view their own tenant registration" ON public.tenants;
CREATE POLICY "Public can view their own tenant registration" 
ON public.tenants 
FOR SELECT 
TO public
USING (true);