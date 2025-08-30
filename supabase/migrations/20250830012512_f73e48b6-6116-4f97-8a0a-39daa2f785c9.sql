-- الخطوة الرابعة: نظام CMS لإدارة محتوى الصفحة الرئيسية
-- جداول إدارة المحتوى والقوالب والسمات

-- إنشاء enum لحالة المحتوى
DO $$ BEGIN
    CREATE TYPE public.content_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إنشاء enum لنوع الكتل
DO $$ BEGIN
    CREATE TYPE public.block_type AS ENUM ('hero', 'features', 'testimonials', 'pricing', 'faq', 'cta', 'gallery', 'stats', 'about', 'contact');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- جدول الصفحات
CREATE TABLE IF NOT EXISTS public.cms_pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    slug TEXT NOT NULL UNIQUE, -- مثل: 'home', 'about', 'pricing'
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    meta_title TEXT, -- SEO
    meta_description TEXT,
    meta_keywords TEXT,
    og_image TEXT, -- صورة الـ Open Graph
    is_published BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    template_name TEXT DEFAULT 'default', -- اسم القالب
    custom_css TEXT, -- CSS مخصص للصفحة
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول كتل المحتوى
CREATE TABLE IF NOT EXISTS public.cms_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
    block_type block_type NOT NULL,
    title TEXT,
    title_ar TEXT,
    content JSONB NOT NULL, -- محتوى الكتلة (نص، صور، بيانات)
    settings JSONB, -- إعدادات العرض (ألوان، تخطيط، إلخ)
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_visible BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الشهادات/التقييمات
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_name TEXT NOT NULL,
    customer_title TEXT, -- منصب الشخص
    nursery_name TEXT, -- اسم الحضانة
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    testimonial_text TEXT NOT NULL,
    testimonial_text_ar TEXT,
    avatar_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_published BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الأسئلة الشائعة
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    question_ar TEXT NOT NULL,
    answer TEXT NOT NULL,
    answer_ar TEXT NOT NULL,
    category TEXT, -- تصنيف السؤال
    is_published BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول إعدادات الموقع العامة
CREATE TABLE IF NOT EXISTS public.site_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB,
    description TEXT, -- وصف للإعداد
    category TEXT DEFAULT 'general', -- تصنيف الإعدادات
    is_public BOOLEAN NOT NULL DEFAULT false, -- هل يمكن عرضها في الواجهة الأمامية
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول السمات/القوالب
CREATE TABLE IF NOT EXISTS public.themes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    display_name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    preview_image TEXT,
    config JSONB NOT NULL, -- إعدادات السمة (ألوان، خطوط، تخطيط)
    css_variables JSONB, -- متغيرات CSS للسمة
    is_active BOOLEAN NOT NULL DEFAULT false,
    is_default BOOLEAN NOT NULL DEFAULT false,
    version TEXT DEFAULT '1.0.0',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج الصفحة الرئيسية الافتراضية
INSERT INTO public.cms_pages (slug, title, title_ar, description, description_ar, meta_title, meta_description, is_published, sort_order)
SELECT 'home', 'Home', 'الرئيسية', 'SmartKindy homepage', 'الصفحة الرئيسية لـ SmartKindy', 'SmartKindy - Smart Nursery Management Platform', 'منصة SmartKindy الذكية لإدارة رياض الأطفال', true, 1
WHERE NOT EXISTS (SELECT 1 FROM public.cms_pages WHERE slug = 'home');

-- إدراج كتل المحتوى الافتراضية للصفحة الرئيسية
INSERT INTO public.cms_blocks (page_id, block_type, title, title_ar, content, sort_order)
SELECT 
    (SELECT id FROM public.cms_pages WHERE slug = 'home'),
    'hero'::block_type,
    'Welcome to SmartKindy',
    'مرحباً بك في SmartKindy',
    '{"heading": "منصة إدارة رياض الأطفال الذكية", "subheading": "نظام شامل لإدارة الحضانات مع تكامل واتساب وتتبع الحضور ونظام التحفيز", "cta_text": "ابدأ رحلتك الآن", "cta_link": "/auth", "background_image": "", "show_video": false}'::jsonb,
    1
WHERE NOT EXISTS (
    SELECT 1 FROM public.cms_blocks cb 
    JOIN public.cms_pages cp ON cb.page_id = cp.id 
    WHERE cp.slug = 'home' AND cb.block_type = 'hero'
);

INSERT INTO public.cms_blocks (page_id, block_type, title, title_ar, content, sort_order)
SELECT 
    (SELECT id FROM public.cms_pages WHERE slug = 'home'),
    'features'::block_type,
    'Features',
    'الميزات',
    '{"features": [{"title": "إدارة الطلاب", "description": "إدارة شاملة لمعلومات الطلاب والفصول مع إمكانية التتبع والمراقبة", "icon": "users"}, {"title": "تتبع الحضور", "description": "نظام متقدم لتسجيل الحضور والغياب مع إشعارات فورية للأولياء", "icon": "calendar"}, {"title": "نظام التحفيز", "description": "تحفيز الطلاب بالنجوم والأوسمة مع لوحة شرف تفاعلية", "icon": "star"}, {"title": "تكامل واتساب", "description": "إرسال الإشعارات والتحديثات للأولياء عبر واتساب بشكل تلقائي", "icon": "message-circle"}, {"title": "الألبوم اليومي", "description": "مشاركة صور وأنشطة الطلاب مع الأولياء بروابط آمنة ومؤقتة", "icon": "heart"}, {"title": "إدارة متقدمة", "description": "لوحة تحكم شاملة مع تقارير مفصلة وإعدادات قابلة للتخصيص", "icon": "settings"}]}'::jsonb,
    2
WHERE NOT EXISTS (
    SELECT 1 FROM public.cms_blocks cb 
    JOIN public.cms_pages cp ON cb.page_id = cp.id 
    WHERE cp.slug = 'home' AND cb.block_type = 'features'
);

-- إدراج بعض الأسئلة الشائعة الافتراضية
INSERT INTO public.faqs (question, question_ar, answer, answer_ar, category, sort_order)
SELECT 'What is SmartKindy?', 'ما هو SmartKindy؟', 'SmartKindy is a comprehensive nursery management platform that helps nurseries manage their students, staff, and daily operations efficiently.', 'SmartKindy هو منصة شاملة لإدارة رياض الأطفال تساعد الحضانات على إدارة طلابهم وموظفيهم وعملياتهم اليومية بكفاءة.', 'general', 1
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question_ar = 'ما هو SmartKindy؟');

INSERT INTO public.faqs (question, question_ar, answer, answer_ar, category, sort_order)
SELECT 'How does WhatsApp integration work?', 'كيف يعمل تكامل واتساب؟', 'Our WhatsApp integration allows nurseries to send automated notifications to parents about attendance, dismissals, and daily updates directly through WhatsApp.', 'تكامل واتساب لدينا يسمح للحضانات بإرسال إشعارات تلقائية للأولياء حول الحضور والانصراف والتحديثات اليومية مباشرة عبر واتساب.', 'features', 2
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question_ar = 'كيف يعمل تكامل واتساب؟');

-- إدراج إعدادات الموقع الافتراضية
INSERT INTO public.site_settings (key, value, description, category, is_public)
SELECT 'site_name', '"SmartKindy"'::jsonb, 'اسم الموقع', 'general', true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'site_name');

INSERT INTO public.site_settings (key, value, description, category, is_public)
SELECT 'site_tagline', '"منصة إدارة رياض الأطفال الذكية"'::jsonb, 'شعار الموقع', 'general', true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'site_tagline');

INSERT INTO public.site_settings (key, value, description, category, is_public)
SELECT 'contact_email', '"info@smartkindy.com"'::jsonb, 'البريد الإلكتروني للتواصل', 'contact', true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'contact_email');

INSERT INTO public.site_settings (key, value, description, category, is_public)
SELECT 'contact_phone', '"+966501234567"'::jsonb, 'رقم الهاتف للتواصل', 'contact', true
WHERE NOT EXISTS (SELECT 1 FROM public.site_settings WHERE key = 'contact_phone');

-- إدراج السمة الافتراضية
INSERT INTO public.themes (name, display_name, display_name_ar, description, description_ar, config, css_variables, is_active, is_default)
SELECT 'default', 'Default Theme', 'السمة الافتراضية', 'The default SmartKindy theme with playful colors', 'السمة الافتراضية لـ SmartKindy بألوان مرحة', 
'{"colors": {"primary": "#e879f9", "secondary": "#bfdbfe", "accent": "#fde047"}, "fonts": {"primary": "Cairo", "secondary": "Inter"}}'::jsonb,
'{"--primary": "338 66% 64%", "--secondary": "204 94% 94%", "--accent": "51 100% 84%"}'::jsonb,
true, true
WHERE NOT EXISTS (SELECT 1 FROM public.themes WHERE name = 'default');