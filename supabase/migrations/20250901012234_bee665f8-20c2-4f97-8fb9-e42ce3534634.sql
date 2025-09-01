-- إضافة سياسة أمان للسماح بتسجيل tenants جديدة
CREATE POLICY "Anyone can register new tenants" 
ON public.tenants 
FOR INSERT 
WITH CHECK (
  -- المستخدم يمكنه فقط تسجيل tenant بحالة pending
  status = 'pending'::tenant_status
);