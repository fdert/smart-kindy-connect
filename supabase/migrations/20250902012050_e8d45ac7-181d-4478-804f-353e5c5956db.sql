-- إضافة جدول إعداد التقارير المشتركة لإصلاح روابط التقارير
CREATE TABLE IF NOT EXISTS public.shared_report_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  expiry_hours INTEGER NOT NULL DEFAULT 72,
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.shared_report_settings ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "Tenant isolation for shared_report_settings" 
ON public.shared_report_settings 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

-- إنشاء جدول لروابط التقارير المؤقتة
CREATE TABLE IF NOT EXISTS public.report_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  student_id UUID NOT NULL,
  report_type TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  guardian_access BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accessed_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تمكين RLS
ALTER TABLE public.report_tokens ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات الأمان
CREATE POLICY "Tenant isolation for report_tokens" 
ON public.report_tokens 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

-- سياسة للوصول العام للتوكن الصالحة
CREATE POLICY "Public access to valid tokens" 
ON public.report_tokens 
FOR SELECT 
USING (expires_at > now());

-- فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_report_tokens_hash ON public.report_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_report_tokens_expires ON public.report_tokens(expires_at);

-- دالة لإنشاء توكن التقرير
CREATE OR REPLACE FUNCTION public.generate_report_token(
  p_student_id UUID,
  p_report_type TEXT,
  p_guardian_access BOOLEAN DEFAULT false,
  p_tenant_id UUID DEFAULT NULL
) RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_hash TEXT;
  v_tenant_id UUID;
BEGIN
  -- الحصول على tenant_id
  v_tenant_id := COALESCE(p_tenant_id, get_user_tenant_id());
  
  -- إنشاء hash عشوائي
  v_token_hash := encode(gen_random_bytes(32), 'hex');
  
  -- إدراج التوكن الجديد
  INSERT INTO public.report_tokens (
    tenant_id,
    student_id,
    report_type,
    token_hash,
    guardian_access,
    expires_at
  ) VALUES (
    v_tenant_id,
    p_student_id,
    p_report_type,
    v_token_hash,
    p_guardian_access,
    now() + interval '72 hours'
  );
  
  RETURN v_token_hash;
END;
$$;

-- دالة للتحقق من صحة التوكن
CREATE OR REPLACE FUNCTION public.validate_report_token(
  p_token_hash TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token_data JSONB;
BEGIN
  -- البحث عن التوكن وتحديث عداد الوصول
  UPDATE public.report_tokens 
  SET 
    accessed_count = accessed_count + 1,
    last_accessed_at = now()
  WHERE 
    token_hash = p_token_hash 
    AND expires_at > now()
  RETURNING jsonb_build_object(
    'student_id', student_id::text,
    'report_type', report_type,
    'guardian_access', guardian_access,
    'tenant_id', tenant_id::text
  ) INTO v_token_data;
  
  RETURN COALESCE(v_token_data, '{}'::jsonb);
END;
$$;

-- دالة تنظيف التوكنز المنتهية الصلاحية
CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM public.report_tokens 
  WHERE expires_at < now() - interval '1 day';
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  RETURN v_deleted_count;
END;
$$;