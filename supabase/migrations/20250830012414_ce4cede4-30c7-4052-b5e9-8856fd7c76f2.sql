-- إكمال إعداد نظام الاشتراكات - السياسات والـ triggers المتبقية

-- تفعيل Row Level Security على الجداول الجديدة
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للخطط (عامة للقراءة)
DO $$ BEGIN
    CREATE POLICY "Plans are viewable by everyone"
    ON public.plans FOR SELECT
    TO authenticated
    USING (is_active = true);
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Super admins can manage plans"
    ON public.plans FOR ALL
    TO authenticated  
    USING (public.has_role('super_admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- سياسات الأمان للاشتراكات
DO $$ BEGIN
    CREATE POLICY "Super admins can manage all subscriptions"
    ON public.subscriptions FOR ALL
    TO authenticated
    USING (public.has_role('super_admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenants can view their own subscription"
    ON public.subscriptions FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_user_tenant_id());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- سياسات الأمان للفواتير
DO $$ BEGIN
    CREATE POLICY "Super admins can manage all invoices" 
    ON public.invoices FOR ALL
    TO authenticated
    USING (public.has_role('super_admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenants can view their own invoices"
    ON public.invoices FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_user_tenant_id());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- سياسات الأمان لعناصر الفاتورة
DO $$ BEGIN
    CREATE POLICY "Super admins can manage invoice items"
    ON public.invoice_items FOR ALL
    TO authenticated
    USING (public.has_role('super_admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- سياسات الأمان للمدفوعات  
DO $$ BEGIN
    CREATE POLICY "Super admins can manage all payments"
    ON public.payments FOR ALL
    TO authenticated
    USING (public.has_role('super_admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenants can view their own payments"
    ON public.payments FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_user_tenant_id());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- سياسات الأمان لسجل الاشتراكات
DO $$ BEGIN
    CREATE POLICY "Super admins can manage subscription history"
    ON public.subscription_history FOR ALL
    TO authenticated
    USING (public.has_role('super_admin'));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Tenants can view their subscription history"
    ON public.subscription_history FOR SELECT
    TO authenticated
    USING (tenant_id = public.get_user_tenant_id());
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إضافة triggers للتحديث التلقائي لـ updated_at
DO $$ BEGIN
    CREATE TRIGGER update_plans_updated_at
        BEFORE UPDATE ON public.plans
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_subscriptions_updated_at
        BEFORE UPDATE ON public.subscriptions
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_invoices_updated_at
        BEFORE UPDATE ON public.invoices
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TRIGGER update_payments_updated_at
        BEFORE UPDATE ON public.payments
        FOR EACH ROW
        EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- إنشاء indexes للأداء
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id ON public.subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date ON public.subscriptions(next_billing_date);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);
CREATE INDEX IF NOT EXISTS idx_subscription_history_tenant_id ON public.subscription_history(tenant_id);

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