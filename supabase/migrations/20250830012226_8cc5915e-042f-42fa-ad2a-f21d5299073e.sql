-- الخطوة الثالثة: نظام الاشتراكات والفوترة (إصلاح)
-- جداول الخطط والاشتراكات والفواتير والمدفوعات

-- إنشاء enum للفواتير (مع التحقق من الوجود)
DO $$ BEGIN
    CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إنشاء enum للمدفوعات
DO $$ BEGIN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'refunded');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إنشاء enum لفترة الاشتراك
DO $$ BEGIN
    CREATE TYPE public.billing_interval AS ENUM ('monthly', 'quarterly', 'yearly');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- جدول الخطط
CREATE TABLE IF NOT EXISTS public.plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL,
    description TEXT,
    description_ar TEXT,
    features JSONB NOT NULL,
    max_students INTEGER,
    max_teachers INTEGER,
    max_classes INTEGER,
    has_whatsapp BOOLEAN NOT NULL DEFAULT false,
    has_reports BOOLEAN NOT NULL DEFAULT false,
    has_analytics BOOLEAN NOT NULL DEFAULT false,
    storage_gb INTEGER DEFAULT 5,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_quarterly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'SAR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_popular BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الاشتراكات
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status subscription_status NOT NULL DEFAULT 'active',
    billing_interval billing_interval NOT NULL DEFAULT 'monthly',
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    trial_end DATE,
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    grace_period_end DATE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    payment_method TEXT,
    next_billing_date DATE,
    failed_payments_count INTEGER DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id)
);

-- جدول الفواتير
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
    invoice_number TEXT NOT NULL UNIQUE,
    status invoice_status NOT NULL DEFAULT 'draft',
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0.15,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    file_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عناصر الفاتورة
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    description TEXT NOT NULL,
    description_ar TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL,
    payment_provider TEXT,
    provider_transaction_id TEXT,
    reference_number TEXT,
    notes TEXT,
    receipt_url TEXT,
    processed_by UUID REFERENCES public.users(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجل تغيير الاشتراكات
CREATE TABLE IF NOT EXISTS public.subscription_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
    action TEXT NOT NULL,
    old_plan_id UUID REFERENCES public.plans(id),
    new_plan_id UUID REFERENCES public.plans(id),
    old_status subscription_status,
    new_status subscription_status,
    reason TEXT,
    notes TEXT,
    changed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج الخطط الافتراضية (إذا لم تكن موجودة)
INSERT INTO public.plans (name, name_ar, description, description_ar, features, max_students, max_teachers, max_classes, has_whatsapp, has_reports, has_analytics, storage_gb, price_monthly, price_quarterly, price_yearly, is_popular, sort_order) 
SELECT 'Basic', 'الخطة الأساسية', 'Perfect for small nurseries getting started', 'مثالية للحضانات الصغيرة التي تبدأ رحلتها', '["إدارة الطلاب", "تسجيل الحضور", "التواصل الأساسي", "الألبوم اليومي", "التقارير الأساسية"]'::jsonb, 50, 5, 3, false, true, false, 5, 299.00, 799.00, 2999.00, false, 1
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Basic');

INSERT INTO public.plans (name, name_ar, description, description_ar, features, max_students, max_teachers, max_classes, has_whatsapp, has_reports, has_analytics, storage_gb, price_monthly, price_quarterly, price_yearly, is_popular, sort_order)
SELECT 'Pro', 'الخطة الاحترافية', 'Most popular plan with WhatsApp and advanced features', 'الخطة الأكثر شعبية مع واتساب والميزات المتطورة', '["جميع ميزات الأساسية", "تكامل واتساب", "نظام التحفيز", "التقارير المتقدمة", "النسخ الاحتياطي", "الدعم المتقدم"]'::jsonb, 150, 15, 8, true, true, true, 20, 599.00, 1599.00, 5999.00, true, 2
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Pro');

INSERT INTO public.plans (name, name_ar, description, description_ar, features, max_students, max_teachers, max_classes, has_whatsapp, has_reports, has_analytics, storage_gb, price_monthly, price_quarterly, price_yearly, is_popular, sort_order)
SELECT 'Enterprise', 'الخطة المؤسسية', 'For large nurseries with unlimited features', 'للحضانات الكبيرة مع ميزات غير محدودة', '["جميع ميزات الاحترافية", "طلاب غير محدود", "معلمين غير محدود", "فصول غير محدودة", "تخزين غير محدود", "تكامل API", "دعم مخصص", "تدريب شخصي"]'::jsonb, null, null, null, true, true, true, null, 1299.00, 3499.00, 12999.00, false, 3
WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE name = 'Enterprise');