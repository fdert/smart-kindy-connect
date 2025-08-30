-- إصلاح المشاكل الأمنية في الدوال
-- إضافة search_path للحماية من SQL injection

-- إعادة إنشاء دالة get_user_tenant_id مع search_path محدد
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$;

-- إعادة إنشاء دالة has_role مع search_path محدد  
CREATE OR REPLACE FUNCTION public.has_role(_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = _role
  );
$$;

-- إعادة إنشاء دالة update_updated_at_column مع search_path محدد
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;