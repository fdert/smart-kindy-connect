-- إنشاء جدول لتتبع زوار الصفحة
CREATE TABLE public.page_visitors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_url TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referrer TEXT,
  visit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  country TEXT,
  city TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX idx_page_visitors_page_url ON public.page_visitors(page_url);
CREATE INDEX idx_page_visitors_visit_date ON public.page_visitors(visit_date);

-- تفعيل RLS
ALTER TABLE public.page_visitors ENABLE ROW LEVEL SECURITY;

-- سياسة لعرض البيانات للمديرين فقط
CREATE POLICY "Only super admins can view visitor data" 
ON public.page_visitors 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'
  )
);

-- سياسة للإدراج العام (بدون مصادقة لتتبع الزوار)
CREATE POLICY "Allow anonymous visitor tracking" 
ON public.page_visitors 
FOR INSERT 
WITH CHECK (true);

-- دالة لتسجيل زيارة جديدة
CREATE OR REPLACE FUNCTION public.track_page_visit(
  p_page_url TEXT,
  p_visitor_ip TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_country TEXT DEFAULT NULL,
  p_city TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_browser TEXT DEFAULT NULL,
  p_os TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  visit_id UUID;
BEGIN
  INSERT INTO public.page_visitors (
    page_url,
    visitor_ip,
    user_agent,
    referrer,
    country,
    city,
    device_type,
    browser,
    os
  ) VALUES (
    p_page_url,
    p_visitor_ip,
    p_user_agent,
    p_referrer,
    p_country,
    p_city,
    p_device_type,
    p_browser,
    p_os
  ) RETURNING id INTO visit_id;
  
  RETURN visit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;