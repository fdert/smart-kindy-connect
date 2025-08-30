-- الخطوة الثالثة: نظام الاشتراكات والفوترة
-- جداول الخطط والاشتراكات والفواتير والمدفوعات

-- إنشاء enum للفواتير
CREATE TYPE public.invoice_status AS ENUM ('draft', 'sent', 'paid', 'overdue', 'cancelled');

-- إنشاء enum للمدفوعات
CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'cancelled', 'refunded');

-- إنشاء enum لفترة الاشتراك
CREATE TYPE public.billing_interval AS ENUM ('monthly', 'quarterly', 'yearly');

-- جدول الخطط
CREATE TABLE public.plans (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    name_ar TEXT NOT NULL, -- الاسم بالعربية
    description TEXT,
    description_ar TEXT,
    features JSONB NOT NULL, -- قائمة الميزات
    max_students INTEGER, -- الحد الأقصى للطلاب
    max_teachers INTEGER, -- الحد الأقصى للمعلمين
    max_classes INTEGER, -- الحد الأقصى للفصول
    has_whatsapp BOOLEAN NOT NULL DEFAULT false,
    has_reports BOOLEAN NOT NULL DEFAULT false,
    has_analytics BOOLEAN NOT NULL DEFAULT false,
    storage_gb INTEGER DEFAULT 5, -- مساحة التخزين بالجيجابايت
    price_monthly DECIMAL(10,2) NOT NULL,
    price_quarterly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    currency TEXT NOT NULL DEFAULT 'SAR',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_popular BOOLEAN NOT NULL DEFAULT false, -- للعرض كخطة مميزة
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الاشتراكات
CREATE TABLE public.subscriptions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES public.plans(id),
    status subscription_status NOT NULL DEFAULT 'active',
    billing_interval billing_interval NOT NULL DEFAULT 'monthly',
    current_period_start DATE NOT NULL,
    current_period_end DATE NOT NULL,
    trial_end DATE, -- نهاية الفترة التجريبية
    cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    grace_period_end DATE, -- نهاية فترة السماح
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    payment_method TEXT, -- يدوي، بطاقة، تحويل
    next_billing_date DATE,
    failed_payments_count INTEGER DEFAULT 0,
    metadata JSONB, -- معلومات إضافية
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id) -- حضانة واحدة لها اشتراك واحد فقط
);

-- جدول الفواتير
CREATE TABLE public.invoices (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
    invoice_number TEXT NOT NULL UNIQUE,
    status invoice_status NOT NULL DEFAULT 'draft',
    billing_period_start DATE NOT NULL,
    billing_period_end DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    tax_rate DECIMAL(5,4) DEFAULT 0.15, -- ضريبة القيمة المضافة 15%
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    due_date DATE NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    file_path TEXT, -- مسار ملف PDF للفاتورة
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول عناصر الفاتورة
CREATE TABLE public.invoice_items (
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
CREATE TABLE public.payments (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id),
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    status payment_status NOT NULL DEFAULT 'pending',
    payment_method TEXT NOT NULL, -- manual, bank_transfer, card, wallet
    payment_provider TEXT, -- للمستقبل: stripe, paypal, tap
    provider_transaction_id TEXT, -- ID من مزود الدفع
    reference_number TEXT, -- رقم مرجعي للدفع اليدوي
    notes TEXT,
    receipt_url TEXT, -- رابط إيصال الدفع
    processed_by UUID REFERENCES public.users(id), -- من عالج الدفع (للمدفوعات اليدوية)
    processed_at TIMESTAMP WITH TIME ZONE,
    failed_reason TEXT,
    metadata JSONB, -- بيانات إضافية من مزود الدفع
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجل تغيير الاشتراكات
CREATE TABLE public.subscription_history (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    subscription_id UUID NOT NULL REFERENCES public.subscriptions(id),
    action TEXT NOT NULL, -- created, upgraded, downgraded, cancelled, renewed
    old_plan_id UUID REFERENCES public.plans(id),
    new_plan_id UUID REFERENCES public.plans(id),
    old_status subscription_status,
    new_status subscription_status,
    reason TEXT,
    notes TEXT,
    changed_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج الخطط الافتراضية
INSERT INTO public.plans (name, name_ar, description, description_ar, features, max_students, max_teachers, max_classes, has_whatsapp, has_reports, has_analytics, storage_gb, price_monthly, price_quarterly, price_yearly, is_popular, sort_order) VALUES 
(
    'Basic',
    'الخطة الأساسية',
    'Perfect for small nurseries getting started',
    'مثالية للحضانات الصغيرة التي تبدا رحلتها',
    '["إدارة الطلاب", "تسجيل الحضور", "التواصل الأساسي", "الألبوم اليومي", "التقارير الأساسية"]'::jsonb,
    50,
    5,
    3,
    false,
    true,
    false,
    5,
    299.00,
    799.00,
    2999.00,
    false,
    1
),
(
    'Pro',
    'الخطة الاحترافية', 
    'Most popular plan with WhatsApp and advanced features',
    'الخطة الأكثر شعبية مع واتساب والميزات المتطورة',
    '["جميع ميزات الأساسية", "تكامل واتساب", "نظام التحفيز", "التقارير المتقدمة", "النسخ الاحتياطي", "الدعم المتقدم"]'::jsonb,
    150,
    15,
    8,
    true,
    true,
    true,
    20,
    599.00,
    1599.00,
    5999.00,
    true,
    2
),
(
    'Enterprise',
    'الخطة المؤسسية',
    'For large nurseries with unlimited features',
    'للحضانات الكبيرة مع ميزات غير محدودة',
    '["جميع ميزات الاحترافية", "طلاب غير محدود", "معلمين غير محدود", "فصول غير محدودة", "تخزين غير محدود", "تكامل API", "دعم مخصص", "تدريب شخصي"]'::jsonb,
    null, -- غير محدود
    null, -- غير محدود
    null, -- غير محدود
    true,
    true,
    true,
    null, -- غير محدود
    1299.00,
    3499.00,
    12999.00,
    false,
    3
);

-- تفعيل Row Level Security
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للخطط (عامة للقراءة)
CREATE POLICY "Plans are viewable by everyone"
ON public.plans FOR SELECT
TO authenticated
USING (is_active = true);

CREATE POLICY "Super admins can manage plans"
ON public.plans FOR ALL
TO authenticated  
USING (public.has_role('super_admin'));

-- سياسات الأمان للاشتراكات
CREATE POLICY "Super admins can manage all subscriptions"
ON public.subscriptions FOR ALL
TO authenticated
USING (public.has_role('super_admin'));

CREATE POLICY "Tenants can view their own subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- سياسات الأمان للفواتير
CREATE POLICY "Super admins can manage all invoices" 
ON public.invoices FOR ALL
TO authenticated
USING (public.has_role('super_admin'));

CREATE POLICY "Tenants can view their own invoices"
ON public.invoices FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- سياسات الأمان لعناصر الفاتورة
CREATE POLICY "Super admins can manage invoice items"
ON public.invoice_items FOR ALL
TO authenticated
USING (public.has_role('super_admin'));

CREATE POLICY "Users can view invoice items for their invoices"
ON public.invoice_items FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.invoices i 
        WHERE i.id = invoice_id 
        AND (i.tenant_id = public.get_user_tenant_id() OR public.has_role('super_admin'))
    )
);

-- سياسات الأمان للمدفوعات  
CREATE POLICY "Super admins can manage all payments"
ON public.payments FOR ALL
TO authenticated
USING (public.has_role('super_admin'));

CREATE POLICY "Tenants can view their own payments"
ON public.payments FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- سياسات الأمان لسجل الاشتراكات
CREATE POLICY "Super admins can manage subscription history"
ON public.subscription_history FOR ALL
TO authenticated
USING (public.has_role('super_admin'));

CREATE POLICY "Tenants can view their subscription history"
ON public.subscription_history FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- إضافة triggers للتحديث التلقائي لـ updated_at
CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON public.plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at
    BEFORE UPDATE ON public.invoices
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payments_updated_at
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء indexes للأداء
CREATE INDEX idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);
CREATE INDEX idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_subscription_history_tenant_id ON public.subscription_history(tenant_id);

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
    
    -- البحث عن أعلى رقم في الشهر الحالي
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