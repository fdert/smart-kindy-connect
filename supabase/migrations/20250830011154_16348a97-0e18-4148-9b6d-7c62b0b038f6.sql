-- إنشاء قاعدة البيانات الأساسية لمنصة SmartKindy
-- الخطوة الأولى: الجداول الأساسية للنظام متعدد المستأجرين (Multi-tenant)

-- إنشاء enum للأدوار
CREATE TYPE public.user_role AS ENUM ('super_admin', 'owner', 'admin', 'teacher', 'gate', 'guardian');

-- إنشاء enum لحالة الحضانة
CREATE TYPE public.tenant_status AS ENUM ('pending', 'approved', 'suspended', 'cancelled');

-- إنشاء enum لحالة الاشتراك
CREATE TYPE public.subscription_status AS ENUM ('active', 'past_due', 'cancelled', 'suspended');

-- جدول الحضانات (Tenants)
CREATE TABLE public.tenants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE, -- للدومين الفرعي
    domain TEXT, -- دومين مخصص (اختياري)
    email TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    status tenant_status NOT NULL DEFAULT 'pending',
    owner_id UUID, -- سيتم ربطه بـ users لاحقاً
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID -- Super Admin الذي وافق
);

-- جدول إعدادات الحضانة
CREATE TABLE public.tenant_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, key)
);

-- جدول المستخدمين (يرتبط بـ auth.users)
CREATE TABLE public.users (
    id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'guardian',
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الفصول
CREATE TABLE public.classes (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    capacity INTEGER NOT NULL DEFAULT 20,
    age_min INTEGER, -- العمر الأدنى بالسنوات
    age_max INTEGER, -- العمر الأعلى بالسنوات
    teacher_id UUID REFERENCES public.users(id),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الطالبات
CREATE TABLE public.students (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id TEXT NOT NULL, -- رقم الطالبة في الحضانة
    full_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('male', 'female')),
    class_id UUID REFERENCES public.classes(id),
    photo_url TEXT,
    medical_info JSONB, -- معلومات طبية
    emergency_contact JSONB, -- جهات اتصال الطوارئ
    is_active BOOLEAN NOT NULL DEFAULT true,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, student_id)
);

-- جدول الأولياء
CREATE TABLE public.guardians (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    whatsapp_number TEXT, -- رقم واتساب (قد يختلف عن الهاتف)
    email TEXT,
    relationship TEXT, -- أب، أم، جد، إلخ
    is_primary BOOLEAN NOT NULL DEFAULT false, -- ولي الأمر الأساسي
    can_pickup BOOLEAN NOT NULL DEFAULT true, -- يمكنه استلام الطفل
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول ربط الأولياء بالطالبات
CREATE TABLE public.guardian_student_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL, -- والد، والدة، جد، إلخ
    is_primary BOOLEAN NOT NULL DEFAULT false,
    can_pickup BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(guardian_id, student_id)
);

-- تفعيل Row Level Security على كل الجداول
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardians ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_student_links ENABLE ROW LEVEL SECURITY;

-- إنشاء دالة للحصول على tenant_id للمستخدم الحالي
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$$;

-- إنشاء دالة للتحقق من دور المستخدم
CREATE OR REPLACE FUNCTION public.has_role(_role user_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = _role
  );
$$;

-- سياسات الأمان - جدول tenants
CREATE POLICY "Super admins can manage all tenants"
ON public.tenants FOR ALL
TO authenticated
USING (public.has_role('super_admin'));

CREATE POLICY "Users can view their own tenant"
ON public.tenants FOR SELECT
TO authenticated
USING (id = public.get_user_tenant_id());

-- سياسات الأمان - جدول tenant_settings
CREATE POLICY "Users can manage their tenant settings"
ON public.tenant_settings FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- سياسات الأمان - جدول users
CREATE POLICY "Super admins can manage all users"
ON public.users FOR ALL
TO authenticated
USING (public.has_role('super_admin'));

CREATE POLICY "Users can view users in their tenant"
ON public.users FOR SELECT
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Admins can manage users in their tenant"
ON public.users FOR ALL
TO authenticated
USING (
  tenant_id = public.get_user_tenant_id() 
  AND (public.has_role('owner') OR public.has_role('admin'))
);

-- سياسات الأمان - بقية الجداول (نفس المبدأ)
CREATE POLICY "Tenant isolation for classes"
ON public.classes FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for students"
ON public.students FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for guardians"
ON public.guardians FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for guardian_student_links"
ON public.guardian_student_links FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- إنشاء دالة تحديث updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- إضافة triggers للتحديث التلقائي لـ updated_at
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_settings_updated_at
    BEFORE UPDATE ON public.tenant_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_users_updated_at  
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_classes_updated_at
    BEFORE UPDATE ON public.classes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_students_updated_at
    BEFORE UPDATE ON public.students
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_guardians_updated_at
    BEFORE UPDATE ON public.guardians
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء indexes للأداء
CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX idx_classes_tenant_id ON public.classes(tenant_id);
CREATE INDEX idx_students_tenant_id ON public.students(tenant_id);
CREATE INDEX idx_guardians_tenant_id ON public.guardians(tenant_id);
CREATE INDEX idx_guardian_student_links_tenant_id ON public.guardian_student_links(tenant_id);
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_students_class_id ON public.students(class_id);