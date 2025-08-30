-- إنشاء جداول الوحدات الجديدة: أذونات الوالدين، الاستطلاعات، والفصول الافتراضية

-- 1. جدول أذونات الوالدين
CREATE TABLE public.permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  permission_type TEXT DEFAULT 'activity' CHECK (permission_type IN ('activity', 'trip', 'medical', 'event', 'other')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. جدول ردود أذونات الوالدين
CREATE TABLE public.permission_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
  guardian_id UUID NOT NULL REFERENCES public.guardians(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  response TEXT NOT NULL CHECK (response IN ('approved', 'declined', 'pending')),
  otp_token TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  responded_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(permission_id, guardian_id, student_id)
);

-- 3. جدول الاستطلاعات
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  survey_type TEXT DEFAULT 'general' CHECK (survey_type IN ('general', 'satisfaction', 'feedback', 'evaluation')),
  target_audience TEXT DEFAULT 'guardians' CHECK (target_audience IN ('guardians', 'teachers', 'both')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. جدول أسئلة الاستطلاع
CREATE TABLE public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('yes_no', 'single_choice', 'multiple_choice', 'text', 'rating')),
  options JSONB, -- للخيارات في حالة اختيار واحد أو متعدد
  is_required BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. جدول ردود الاستطلاع
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.survey_questions(id) ON DELETE CASCADE,
  respondent_id UUID, -- guardian_id or user_id
  respondent_type TEXT DEFAULT 'guardian' CHECK (respondent_type IN ('guardian', 'teacher', 'admin')),
  response_text TEXT,
  response_options TEXT[], -- للخيارات المتعددة
  otp_token TEXT,
  otp_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. جدول الفصول الافتراضية
CREATE TABLE public.virtual_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL CHECK (provider IN ('zoom', 'meet', 'jitsi', 'teams')),
  meeting_url TEXT NOT NULL,
  meeting_id TEXT,
  passcode TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. جدول حضور الفصول الافتراضية
CREATE TABLE public.virtual_class_attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  virtual_class_id UUID NOT NULL REFERENCES public.virtual_classes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  joined_at TIMESTAMP WITH TIME ZONE,
  left_at TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'joined', 'left', 'absent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(virtual_class_id, student_id)
);

-- إنشاء الفهارس
CREATE INDEX idx_permissions_tenant_id ON public.permissions(tenant_id);
CREATE INDEX idx_permissions_expires_at ON public.permissions(expires_at);
CREATE INDEX idx_permission_responses_tenant_id ON public.permission_responses(tenant_id);
CREATE INDEX idx_permission_responses_permission_id ON public.permission_responses(permission_id);
CREATE INDEX idx_permission_responses_guardian_id ON public.permission_responses(guardian_id);

CREATE INDEX idx_surveys_tenant_id ON public.surveys(tenant_id);
CREATE INDEX idx_surveys_expires_at ON public.surveys(expires_at);
CREATE INDEX idx_survey_questions_survey_id ON public.survey_questions(survey_id);
CREATE INDEX idx_survey_responses_tenant_id ON public.survey_responses(tenant_id);
CREATE INDEX idx_survey_responses_survey_id ON public.survey_responses(survey_id);

CREATE INDEX idx_virtual_classes_tenant_id ON public.virtual_classes(tenant_id);
CREATE INDEX idx_virtual_classes_class_id ON public.virtual_classes(class_id);
CREATE INDEX idx_virtual_classes_scheduled_at ON public.virtual_classes(scheduled_at);
CREATE INDEX idx_virtual_class_attendance_tenant_id ON public.virtual_class_attendance(tenant_id);
CREATE INDEX idx_virtual_class_attendance_virtual_class_id ON public.virtual_class_attendance(virtual_class_id);

-- تفعيل RLS على الجداول الجديدة
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.virtual_class_attendance ENABLE ROW LEVEL SECURITY;

-- سياسات RLS للأذونات
CREATE POLICY "Tenant isolation for permissions" ON public.permissions
FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant isolation for permission_responses" ON public.permission_responses
FOR ALL USING (tenant_id = get_user_tenant_id());

-- سياسات RLS للاستطلاعات
CREATE POLICY "Tenant isolation for surveys" ON public.surveys
FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Survey questions access" ON public.survey_questions
FOR ALL USING (EXISTS (
  SELECT 1 FROM public.surveys 
  WHERE surveys.id = survey_questions.survey_id 
  AND surveys.tenant_id = get_user_tenant_id()
));

CREATE POLICY "Tenant isolation for survey_responses" ON public.survey_responses
FOR ALL USING (tenant_id = get_user_tenant_id());

-- سياسات RLS للفصول الافتراضية
CREATE POLICY "Tenant isolation for virtual_classes" ON public.virtual_classes
FOR ALL USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant isolation for virtual_class_attendance" ON public.virtual_class_attendance
FOR ALL USING (tenant_id = get_user_tenant_id());

-- إضافة الترايجرز للتحديث التلقائي للوقت
CREATE TRIGGER update_permissions_updated_at
BEFORE UPDATE ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
BEFORE UPDATE ON public.surveys
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_virtual_classes_updated_at
BEFORE UPDATE ON public.virtual_classes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_virtual_class_attendance_updated_at
BEFORE UPDATE ON public.virtual_class_attendance
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();