-- إكمال إعداد نظام الفوترة والانتقال لنظام CMS
-- إضافة RLS والـ triggers المتبقية + جداول CMS

-- إضافة RLS للجداول المتبقية في نظام الفوترة
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للخطط (عامة للقراءة)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Plans are viewable by everyone' AND tablename = 'plans') THEN
        CREATE POLICY "Plans are viewable by everyone"
        ON public.plans FOR SELECT
        TO authenticated
        USING (is_active = true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage plans' AND tablename = 'plans') THEN
        CREATE POLICY "Super admins can manage plans"
        ON public.plans FOR ALL
        TO authenticated  
        USING (public.has_role('super_admin'));
    END IF;
END $$;

-- إضافة triggers للجداول الجديدة
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_plans_updated_at') THEN
        CREATE TRIGGER update_plans_updated_at
            BEFORE UPDATE ON public.plans
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- دالة لتوليد رقم فاتورة فريد
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_year TEXT;
    current_month TEXT;
    sequence_num INTEGER;
    invoice_num TEXT;
BEGIN
    current_year := to_char(current_date, 'YYYY');
    current_month := to_char(current_date, 'MM');
    
    SELECT COALESCE(
        MAX(
            CAST(
                split_part(split_part(invoice_number, '-', 3), '-', 1) AS INTEGER
            )
        ), 0
    ) + 1
    INTO sequence_num
    FROM public.invoices
    WHERE invoice_number LIKE 'INV-' || current_year || current_month || '-%';
    
    invoice_num := 'INV-' || current_year || current_month || '-' || lpad(sequence_num::text, 4, '0');
    
    RETURN invoice_num;
END;
$$;

-- الخطوة الرابعة: نظام إدارة المحتوى (CMS) للصفحة الرئيسية
-- جداول إدارة صفحات ومحتوى المنصة

-- إنشاء enum لحالة الصفحة
DO $$ BEGIN
    CREATE TYPE public.page_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إنشاء enum لنوع المحتوى
DO $$ BEGIN
    CREATE TYPE public.content_type AS ENUM ('text', 'image', 'video', 'html', 'markdown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- جدول الصفحات
CREATE TABLE IF NOT EXISTS public.cms_pages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    title_ar TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    description_ar TEXT,
    content JSONB, -- محتوى الصفحة كـ JSON
    meta_title TEXT,
    meta_title_ar TEXT,
    meta_description TEXT,
    meta_description_ar TEXT,
    status page_status NOT NULL DEFAULT 'draft',
    is_homepage BOOLEAN NOT NULL DEFAULT false,
    template TEXT DEFAULT 'default', -- قالب الصفحة
    sort_order INTEGER DEFAULT 0,
    featured_image TEXT,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مكونات المحتوى القابلة لإعادة الاستخدام
CREATE TABLE IF NOT EXISTS public.cms_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    type TEXT NOT NULL, -- hero, features, testimonials, pricing, faq, cta
    content JSONB NOT NULL, -- محتوى المكون
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول ربط الصفحات بالمكونات
CREATE TABLE IF NOT EXISTS public.cms_page_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES public.cms_blocks(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    block_data JSONB, -- بيانات إضافية خاصة بهذا الاستخدام
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الشهادات/التوصيات
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    position TEXT,
    position_ar TEXT,
    company TEXT,
    company_ar TEXT,
    testimonial TEXT NOT NULL,
    testimonial_ar TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    avatar_url TEXT,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
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
    category TEXT,
    category_ar TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج المحتوى الافتراضي للصفحة الرئيسية
INSERT INTO public.cms_pages (title, title_ar, slug, description, description_ar, content, status, is_homepage, published_at)
SELECT 
    'SmartKindy - Smart Nursery Management Platform',
    'SmartKindy - منصة إدارة رياض الأطفال الذكية',
    'home',
    'The ultimate platform for nursery management with WhatsApp integration, attendance tracking, and reward systems.',
    'المنصة الشاملة لإدارة رياض الأطفال مع تكامل واتساب وتتبع الحضور ونظام التحفيز.',
    '{
        "hero": {
            "title": "SmartKindy",
            "title_ar": "SmartKindy",
            "subtitle": "The Ultimate Nursery Management Platform",
            "subtitle_ar": "منصة إدارة رياض الأطفال الشاملة",
            "description": "Manage your nursery with ease using our comprehensive platform featuring WhatsApp integration, attendance tracking, reward systems, and more.",
            "description_ar": "أدر حضانتك بسهولة باستخدام منصتنا الشاملة التي تتضمن تكامل واتساب وتتبع الحضور ونظام التحفيز والمزيد.",
            "cta_text": "Get Started Now",
            "cta_text_ar": "ابدأ الآن",
            "image": "/hero-image.jpg"
        }
    }'::jsonb,
    'published',
    true,
    now()
WHERE NOT EXISTS (SELECT 1 FROM public.cms_pages WHERE slug = 'home');

-- إدراج مكونات افتراضية
INSERT INTO public.cms_blocks (name, name_ar, type, content)
SELECT 'Hero Section', 'القسم الترويجي', 'hero', '{
    "title": "SmartKindy",
    "title_ar": "SmartKindy", 
    "subtitle": "Smart Nursery Management",
    "subtitle_ar": "إدارة رياض الأطفال الذكية",
    "description": "The comprehensive platform for modern nursery management",
    "description_ar": "المنصة الشاملة لإدارة رياض الأطفال العصرية",
    "buttons": [
        {"text": "Get Started", "text_ar": "ابدأ الآن", "type": "primary"},
        {"text": "Learn More", "text_ar": "اعرف المزيد", "type": "secondary"}
    ]
}'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM public.cms_blocks WHERE name = 'Hero Section');

-- إدراج شهادة افتراضية
INSERT INTO public.testimonials (name, name_ar, position, position_ar, company, company_ar, testimonial, testimonial_ar, rating, is_featured)
SELECT 
    'Sarah Al-Ahmad',
    'سارة الأحمد',
    'Nursery Director',
    'مديرة الحضانة',
    'Little Stars Nursery',
    'حضانة النجوم الصغيرة',
    'SmartKindy has transformed how we manage our nursery. The WhatsApp integration makes communication with parents seamless!',
    'لقد غيرت SmartKindy طريقة إدارتنا للحضانة. تكامل واتساب جعل التواصل مع الأولياء سلساً جداً!',
    5,
    true
WHERE NOT EXISTS (SELECT 1 FROM public.testimonials WHERE name = 'Sarah Al-Ahmad');

-- إدراج سؤال شائع افتراضي
INSERT INTO public.faqs (question, question_ar, answer, answer_ar, category, category_ar, sort_order)
SELECT 
    'How does the WhatsApp integration work?',
    'كيف يعمل تكامل واتساب؟',
    'Our platform integrates seamlessly with WhatsApp to send automated notifications to parents about attendance, dismissals, daily albums, and important updates.',
    'تتكامل منصتنا بسلاسة مع واتساب لإرسال إشعارات تلقائية للأولياء حول الحضور والاستئذان والألبوم اليومي والتحديثات المهمة.',
    'Integration',
    'التكامل',
    1
WHERE NOT EXISTS (SELECT 1 FROM public.faqs WHERE question = 'How does the WhatsApp integration work?');

-- تفعيل Row Level Security على جداول CMS
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لـ CMS (عامة للقراءة، محدودة للكتابة)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'CMS pages are viewable by everyone' AND tablename = 'cms_pages') THEN
        CREATE POLICY "CMS pages are viewable by everyone"
        ON public.cms_pages FOR SELECT
        TO authenticated
        USING (status = 'published');
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super admins can manage CMS pages' AND tablename = 'cms_pages') THEN
        CREATE POLICY "Super admins can manage CMS pages"
        ON public.cms_pages FOR ALL
        TO authenticated
        USING (public.has_role('super_admin'));
    END IF;
END $$;

-- سياسات مماثلة للجداول الأخرى
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'CMS blocks are viewable by everyone' AND tablename = 'cms_blocks') THEN
        CREATE POLICY "CMS blocks are viewable by everyone"
        ON public.cms_blocks FOR SELECT
        TO authenticated
        USING (is_active = true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Testimonials are viewable by everyone' AND tablename = 'testimonials') THEN
        CREATE POLICY "Testimonials are viewable by everyone"
        ON public.testimonials FOR SELECT
        TO authenticated
        USING (is_active = true);
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'FAQs are viewable by everyone' AND tablename = 'faqs') THEN
        CREATE POLICY "FAQs are viewable by everyone"
        ON public.faqs FOR SELECT
        TO authenticated
        USING (is_active = true);
    END IF;
END $$;

-- إضافة triggers للمحتوى
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cms_pages_updated_at') THEN
        CREATE TRIGGER update_cms_pages_updated_at
            BEFORE UPDATE ON public.cms_pages
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cms_blocks_updated_at') THEN
        CREATE TRIGGER update_cms_blocks_updated_at
            BEFORE UPDATE ON public.cms_blocks
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_testimonials_updated_at') THEN
        CREATE TRIGGER update_testimonials_updated_at
            BEFORE UPDATE ON public.testimonials
            FOR EACH ROW
            EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END $$;

-- إنشاء indexes للـ CMS
CREATE INDEX IF NOT EXISTS idx_cms_pages_slug ON public.cms_pages(slug);
CREATE INDEX IF NOT EXISTS idx_cms_pages_status ON public.cms_pages(status);
CREATE INDEX IF NOT EXISTS idx_cms_blocks_type ON public.cms_blocks(type);
CREATE INDEX IF NOT EXISTS idx_testimonials_featured ON public.testimonials(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_faqs_category ON public.faqs(category, is_active);