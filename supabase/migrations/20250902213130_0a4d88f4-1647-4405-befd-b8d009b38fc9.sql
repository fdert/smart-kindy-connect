-- تحسين RLS policies لجدول الجوائز للتقارير العامة

-- حذف policy موجود قد يسبب تداخل
DROP POLICY IF EXISTS "Public can view student rewards for reports" ON public.rewards;

-- إنشاء policy جديد محسن للتقارير العامة
CREATE POLICY "Public access for student reports" 
ON public.rewards 
FOR SELECT 
USING (
  -- السماح للوصول العام للتقارير أو للمستخدمين المصرح لهم
  true
);

-- التأكد من وجود RLS
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;