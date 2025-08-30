-- إصلاح إنشاء جداول CMS بطريقة منفصلة
-- الخطوة الرابعة: نظام إدارة المحتوى (CMS) - إصلاح

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

-- حذف الجداول إذا كانت موجودة (لإعادة إنشائها)
DROP TABLE IF EXISTS public.cms_page_blocks;
DROP TABLE IF EXISTS public.cms_pages;
DROP TABLE IF EXISTS public.cms_blocks;
DROP TABLE IF EXISTS public.testimonials;
DROP TABLE IF EXISTS public.faqs;

-- جدول الصفحات
CREATE TABLE public.cms_pages (
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
    template TEXT DEFAULT 'default',
    sort_order INTEGER DEFAULT 0,
    featured_image TEXT,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مكونات المحتوى
CREATE TABLE public.cms_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    updated_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الشهادات
CREATE TABLE public.testimonials (
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
CREATE TABLE public.faqs (
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

-- جدول ربط الصفحات بالمكونات
CREATE TABLE public.cms_page_blocks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    page_id UUID NOT NULL REFERENCES public.cms_pages(id) ON DELETE CASCADE,
    block_id UUID NOT NULL REFERENCES public.cms_blocks(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    block_data JSONB,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cms_page_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;