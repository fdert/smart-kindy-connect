-- إنشاء جدول رسوم الطلاب
CREATE TABLE public.student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    student_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    fee_type TEXT NOT NULL DEFAULT 'monthly',
    due_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
    payment_date DATE,
    discount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول المعاملات المالية
CREATE TABLE public.financial_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    category TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_number TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security
ALTER TABLE public.student_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "Tenant isolation for student_fees" 
ON public.student_fees 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant isolation for financial_transactions" 
ON public.financial_transactions 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_student_fees_updated_at
    BEFORE UPDATE ON public.student_fees
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_financial_transactions_updated_at
    BEFORE UPDATE ON public.financial_transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء وظيفة تحديث حالة الرسوم المتأخرة
CREATE OR REPLACE FUNCTION public.update_overdue_fees()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- تحديث الرسوم المتأخرة
    UPDATE public.student_fees 
    SET status = 'overdue'
    WHERE due_date < CURRENT_DATE 
    AND status = 'pending';
END;
$$;