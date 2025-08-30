-- تفعيل Row Level Security على الجداول المطلوبة لضمان الأمان

-- تفعيل RLS على جداول CMS إذا لم تكن مُفعلة
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;

-- تفعيل RLS على جداول الموقع العامة
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات أمان للجداول العامة

-- سياسات للـ FAQ
CREATE POLICY "Everyone can view published FAQs" ON public.faqs
  FOR SELECT USING (is_published = true);

CREATE POLICY "Super admins can manage FAQs" ON public.faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- سياسات للتوصيات
CREATE POLICY "Everyone can view published testimonials" ON public.testimonials
  FOR SELECT USING (is_published = true);

CREATE POLICY "Super admins can manage testimonials" ON public.testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- سياسات للثيمات
CREATE POLICY "Everyone can view active themes" ON public.themes
  FOR SELECT USING (is_active = true);

CREATE POLICY "Super admins can manage themes" ON public.themes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- سياسات لإعدادات الموقع
CREATE POLICY "Everyone can view public site settings" ON public.site_settings
  FOR SELECT USING (is_public = true);

CREATE POLICY "Super admins can manage site settings" ON public.site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- سياسات لصفحات CMS
CREATE POLICY "Everyone can view published CMS pages" ON public.cms_pages
  FOR SELECT USING (is_published = true);

CREATE POLICY "Super admins can manage CMS pages" ON public.cms_pages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );

-- سياسات لمكونات CMS
CREATE POLICY "Everyone can view CMS blocks for published pages" ON public.cms_blocks
  FOR SELECT USING (
    is_visible = true AND
    EXISTS (
      SELECT 1 FROM public.cms_pages 
      WHERE cms_pages.id = cms_blocks.page_id 
      AND cms_pages.is_published = true
    )
  );

CREATE POLICY "Super admins can manage CMS blocks" ON public.cms_blocks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE users.id = auth.uid() 
      AND users.role = 'super_admin'
    )
  );