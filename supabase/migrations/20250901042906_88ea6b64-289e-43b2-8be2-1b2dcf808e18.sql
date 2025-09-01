-- إضافة جدول إعدادات وقوالب الواتساب
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid REFERENCES public.tenants(id) ON DELETE CASCADE,
  template_name text NOT NULL,
  template_content text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- إضافة RLS للجدول الجديد
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

-- إضافة سياسات للواتساب تمبلت
CREATE POLICY "Tenants can manage their whatsapp templates" ON public.whatsapp_templates
FOR ALL USING (tenant_id = get_user_tenant_id());

-- إدراج القوالب الافتراضية لرسائل المعلمات
INSERT INTO public.whatsapp_templates (tenant_id, template_name, template_content) 
VALUES 
('05c50850-3919-4fd9-a962-5b1174ee2b6c', 'teacher_welcome', 
'🔐 مرحباً بك في SmartKindy

حضانة: {{tenant_name}}

👤 تم إنشاء حساب لك باسم: {{teacher_name}}
📧 البريد الإلكتروني: {{teacher_email}}

🌐 لتسجيل الدخول:
1. اذهب إلى: https://smartkindy.com/auth
2. انقر على "نسيت كلمة المرور"
3. أدخل بريدك الإلكتروني لإنشاء كلمة مرور جديدة

للدعم الفني: 920012345
مرحباً بك في فريق SmartKindy! 🌟'),

('05c50850-3919-4fd9-a962-5b1174ee2b6c', 'teacher_credentials',
'🔐 بيانات تسجيل الدخول - SmartKindy

حضانة: {{tenant_name}}

👤 اسم المستخدم: {{teacher_name}}
📧 البريد الإلكتروني: {{teacher_email}}
🔑 كلمة المرور المؤقتة: {{temp_password}}

🌐 رابط تسجيل الدخول:
https://smartkindy.com/auth

⚠️ ملاحظة هامة:
- كلمة المرور صالحة لمدة 24 ساعة  
- مطلوب تغيير كلمة المرور عند أول تسجيل دخول

للدعم الفني: 920012345
SmartKindy - نظام إدارة رياض الأطفال 🌟');