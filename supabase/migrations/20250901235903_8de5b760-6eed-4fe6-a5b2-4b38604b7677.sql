-- إضافة RLS policy للوصول العام لجدول assignments للتقارير
CREATE POLICY "Public can view assignments for reports" 
ON public.assignments 
FOR SELECT 
USING (true);

-- تحديث RLS policy للجوائز للسماح بالوصول العام والمصادق عليه
DROP POLICY IF EXISTS "Tenant isolation for rewards" ON public.rewards;

CREATE POLICY "Tenant isolation for rewards" 
ON public.rewards 
FOR ALL 
USING (tenant_id = get_user_tenant_id())
WITH CHECK (tenant_id = get_user_tenant_id());

-- إضافة RLS policy منفصلة للوصول العام للجوائز في التقارير
CREATE POLICY "Public can view rewards for guardian reports" 
ON public.rewards 
FOR SELECT 
USING (true);