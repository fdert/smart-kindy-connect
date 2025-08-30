-- الخطوة الثانية: إضافة الجداول المتبقية للنظام
-- جداول الحضور والاستئذان والتحفيز والألبوم والتقارير ورسائل واتساب

-- إنشاء enum لحالة الحضور
CREATE TYPE public.attendance_status AS ENUM ('present', 'absent', 'late', 'excused');

-- إنشاء enum لحالة الاستئذان
CREATE TYPE public.dismissal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');

-- إنشاء enum لنوع التحفيز
CREATE TYPE public.reward_type AS ENUM ('star', 'badge', 'certificate', 'achievement');

-- إنشاء enum لحالة الرسالة
CREATE TYPE public.message_status AS ENUM ('pending', 'sent', 'delivered', 'failed');

-- جدول أحداث الحضور
CREATE TABLE public.attendance_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status attendance_status NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    late_minutes INTEGER DEFAULT 0,
    notes TEXT,
    recorded_by UUID REFERENCES public.users(id), -- من سجل الحضور
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(tenant_id, student_id, date)
);

-- جدول طلبات الاستئذان/الخروج
CREATE TABLE public.dismissal_requests (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
    request_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    pickup_time TIMESTAMP WITH TIME ZONE NOT NULL,
    reason TEXT,
    status dismissal_status NOT NULL DEFAULT 'pending',
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    pickup_method TEXT, -- قريب، واتساب، هاتف، إلخ
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رموز الاستئذان (PIN/QR)
CREATE TABLE public.dismissal_tokens (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    dismissal_request_id UUID NOT NULL REFERENCES public.dismissal_requests(id) ON DELETE CASCADE,
    token_type TEXT NOT NULL CHECK (token_type IN ('pin', 'qr')),
    token_value TEXT NOT NULL, -- الرمز أو QR البيانات
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES public.users(id), -- من استخدم الرمز
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول التحفيز والمكافآت
CREATE TABLE public.rewards (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    type reward_type NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    points INTEGER NOT NULL DEFAULT 1,
    icon_url TEXT,
    badge_color TEXT,
    awarded_by UUID NOT NULL REFERENCES public.users(id),
    awarded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    notes TEXT,
    is_public BOOLEAN NOT NULL DEFAULT true, -- ظهور في لوحة الشرف
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول مهارات التطوير
CREATE TABLE public.development_skills (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    skill_category TEXT, -- اجتماعي، معرفي، حركي، إبداعي
    level INTEGER NOT NULL CHECK (level BETWEEN 1 AND 5), -- 1 = مبتدئ، 5 = متقن
    notes TEXT,
    assessed_by UUID NOT NULL REFERENCES public.users(id),
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الفحوصات الصحية
CREATE TABLE public.health_checks (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    check_date DATE NOT NULL DEFAULT CURRENT_DATE,
    temperature DECIMAL(4,2),
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    notes TEXT,
    medications JSONB, -- أدوية
    allergies JSONB, -- حساسيات
    special_needs TEXT,
    checked_by UUID NOT NULL REFERENCES public.users(id),
    parent_notified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول الوسائط (الألبوم اليومي)
CREATE TABLE public.media (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES public.users(id),
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL, -- image, video
    file_size BIGINT,
    mime_type TEXT,
    caption TEXT,
    tags JSONB, -- وسوم قابلة للبحث
    is_public BOOLEAN NOT NULL DEFAULT false,
    album_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول ربط الوسائط بالطلاب
CREATE TABLE public.media_student_links (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    media_id UUID NOT NULL REFERENCES public.media(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(media_id, student_id)
);

-- جدول التقارير
CREATE TABLE public.reports (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- attendance, behavior, academic, health
    title TEXT NOT NULL,
    description TEXT,
    report_data JSONB NOT NULL, -- بيانات التقرير
    filters JSONB, -- فلاتر التقرير
    generated_by UUID NOT NULL REFERENCES public.users(id),
    generated_for UUID REFERENCES public.students(id), -- إذا كان خاص بطالب
    class_id UUID REFERENCES public.classes(id), -- إذا كان خاص بفصل
    file_path TEXT, -- مسار ملف PDF
    is_shared BOOLEAN NOT NULL DEFAULT false,
    shared_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول رسائل واتساب
CREATE TABLE public.wa_messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    message_id TEXT, -- ID من WhatSender
    direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
    from_number TEXT NOT NULL,
    to_number TEXT NOT NULL,
    message_text TEXT,
    message_type TEXT DEFAULT 'text', -- text, image, document
    media_url TEXT,
    status message_status NOT NULL DEFAULT 'pending',
    guardian_id UUID REFERENCES public.guardians(id),
    student_id UUID REFERENCES public.students(id),
    template_name TEXT, -- اسم القالب المستخدم
    context_type TEXT, -- attendance, dismissal, album, general
    context_id UUID, -- ID السجل المرتبط
    webhook_data JSONB, -- بيانات webhook الأصلية
    processed BOOLEAN NOT NULL DEFAULT false,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول سجل الأحداث (Audit Log)
CREATE TABLE public.audit_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id),
    action TEXT NOT NULL, -- create, update, delete, login, logout
    resource_type TEXT NOT NULL, -- student, class, attendance, etc.
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل Row Level Security على الجداول الجديدة
ALTER TABLE public.attendance_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dismissal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dismissal_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.development_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wa_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان للجداول الجديدة (نفس مبدأ عزل الـ tenant)
CREATE POLICY "Tenant isolation for attendance_events"
ON public.attendance_events FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for dismissal_requests"
ON public.dismissal_requests FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for dismissal_tokens"
ON public.dismissal_tokens FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for rewards"
ON public.rewards FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for development_skills"
ON public.development_skills FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for health_checks"
ON public.health_checks FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for media"
ON public.media FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for media_student_links"
ON public.media_student_links FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for reports"
ON public.reports FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for wa_messages"
ON public.wa_messages FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

CREATE POLICY "Tenant isolation for audit_logs"
ON public.audit_logs FOR ALL
TO authenticated
USING (tenant_id = public.get_user_tenant_id());

-- إضافة triggers للتحديث التلقائي لـ updated_at
CREATE TRIGGER update_attendance_events_updated_at
    BEFORE UPDATE ON public.attendance_events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_dismissal_requests_updated_at
    BEFORE UPDATE ON public.dismissal_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_development_skills_updated_at
    BEFORE UPDATE ON public.development_skills
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_health_checks_updated_at
    BEFORE UPDATE ON public.health_checks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_media_updated_at
    BEFORE UPDATE ON public.media
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wa_messages_updated_at
    BEFORE UPDATE ON public.wa_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء indexes للأداء
CREATE INDEX idx_attendance_events_tenant_student_date ON public.attendance_events(tenant_id, student_id, date);
CREATE INDEX idx_attendance_events_class_date ON public.attendance_events(class_id, date);
CREATE INDEX idx_dismissal_requests_tenant_status ON public.dismissal_requests(tenant_id, status);
CREATE INDEX idx_dismissal_requests_student_id ON public.dismissal_requests(student_id);
CREATE INDEX idx_dismissal_tokens_expires_at ON public.dismissal_tokens(expires_at);
CREATE INDEX idx_rewards_tenant_student ON public.rewards(tenant_id, student_id);
CREATE INDEX idx_rewards_awarded_at ON public.rewards(awarded_at DESC);
CREATE INDEX idx_development_skills_tenant_student ON public.development_skills(tenant_id, student_id);
CREATE INDEX idx_health_checks_tenant_student ON public.health_checks(tenant_id, student_id);
CREATE INDEX idx_media_tenant_album_date ON public.media(tenant_id, album_date DESC);
CREATE INDEX idx_media_student_links_media_id ON public.media_student_links(media_id);
CREATE INDEX idx_reports_tenant_type ON public.reports(tenant_id, report_type);
CREATE INDEX idx_wa_messages_tenant_direction ON public.wa_messages(tenant_id, direction);
CREATE INDEX idx_wa_messages_from_number ON public.wa_messages(from_number);
CREATE INDEX idx_wa_messages_status ON public.wa_messages(status);
CREATE INDEX idx_audit_logs_tenant_created_at ON public.audit_logs(tenant_id, created_at DESC);