-- إضافة حقل نوع الباقة إلى جدول tenants
ALTER TABLE public.tenants 
ADD COLUMN plan_type TEXT DEFAULT 'basic',
ADD COLUMN owner_name TEXT,
ADD COLUMN owner_email TEXT,
ADD COLUMN owner_phone TEXT,
ADD COLUMN temp_password TEXT,
ADD COLUMN password_reset_required BOOLEAN DEFAULT true;

-- إنشاء جدول لإدارة رسائل الواتس
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  message_content TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'approval', 'expiry_warning', 'general'
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول لإدارة الاشتراكات المربوطة بالحضانات
CREATE TABLE public.tenant_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'suspended'
  features JSONB,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'SAR',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- تفعيل RLS للجداول الجديدة
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان لجدول رسائل الواتس
CREATE POLICY "Super admins can manage whatsapp messages" 
ON public.whatsapp_messages 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND role = 'super_admin'::user_role
));

CREATE POLICY "Tenants can view their whatsapp messages" 
ON public.whatsapp_messages 
FOR SELECT 
USING (tenant_id = get_user_tenant_id());

-- سياسات الأمان لجدول اشتراكات الحضانات
CREATE POLICY "Super admins can manage tenant subscriptions" 
ON public.tenant_subscriptions 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE id = auth.uid() AND role = 'super_admin'::user_role
));

CREATE POLICY "Tenants can view their subscription" 
ON public.tenant_subscriptions 
FOR SELECT 
USING (tenant_id = get_user_tenant_id());

-- إنشاء تحديث triggers
CREATE TRIGGER update_whatsapp_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tenant_subscriptions_updated_at
  BEFORE UPDATE ON public.tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء دالة لإرسال رسائل واتس تلقائية عند اعتماد الحضانة
CREATE OR REPLACE FUNCTION send_approval_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
    temp_pass TEXT;
    message_content TEXT;
BEGIN
    -- التحقق من تغيير الحالة إلى approved
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        -- إنشاء كلمة مرور مؤقتة
        temp_pass := 'TK' || EXTRACT(YEAR FROM NOW())::TEXT || 
                    LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || 
                    LPAD((EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW()))::TEXT, 4, '0');
        
        -- تحديث الحضانة بكلمة المرور المؤقتة
        UPDATE public.tenants 
        SET temp_password = temp_pass,
            password_reset_required = true
        WHERE id = NEW.id;
        
        -- إنشاء رسالة الواتس
        message_content := format('🎉 مرحباً بكم في SmartKindy!

تم اعتماد حضانة "%s" بنجاح ✅

بيانات الدخول المؤقتة:
البريد الإلكتروني: %s
كلمة المرور المؤقتة: %s

⚠️ مطلوب تغيير كلمة المرور عند أول تسجيل دخول

رابط تسجيل الدخول:
https://smartkindy.com/auth

مرحباً بكم في عائلة SmartKindy! 🌟',
            NEW.name,
            NEW.owner_email,
            temp_pass
        );
        
        -- إدراج رسالة الواتس في الجدول
        INSERT INTO public.whatsapp_messages (
            tenant_id,
            recipient_phone,
            message_content,
            message_type,
            scheduled_at
        ) VALUES (
            NEW.id,
            NEW.owner_phone,
            message_content,
            'approval',
            NOW()
        );
        
        -- إنشاء اشتراك افتراضي للحضانة
        INSERT INTO public.tenant_subscriptions (
            tenant_id,
            plan_type,
            start_date,
            end_date,
            features,
            price
        ) VALUES (
            NEW.id,
            COALESCE(NEW.plan_type, 'basic'),
            CURRENT_DATE,
            CURRENT_DATE + INTERVAL '1 month',
            CASE NEW.plan_type
                WHEN 'premium' THEN '{"max_students": 100, "max_teachers": 10, "whatsapp": true, "reports": true}'::jsonb
                WHEN 'enterprise' THEN '{"max_students": 500, "max_teachers": 50, "whatsapp": true, "reports": true, "analytics": true}'::jsonb
                ELSE '{"max_students": 50, "max_teachers": 3, "whatsapp": false, "reports": false}'::jsonb
            END,
            CASE NEW.plan_type
                WHEN 'premium' THEN 299.00
                WHEN 'enterprise' THEN 599.00
                ELSE 99.00
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ربط الدالة بتحديث جدول tenants
CREATE TRIGGER tenant_approval_whatsapp_trigger
    AFTER UPDATE ON public.tenants
    FOR EACH ROW
    EXECUTE FUNCTION send_approval_whatsapp();

-- إنشاء دالة لإرسال تنبيهات انتهاء الاشتراك
CREATE OR REPLACE FUNCTION send_expiry_warnings()
RETURNS void AS $$
DECLARE
    subscription_record RECORD;
    warning_message TEXT;
BEGIN
    -- البحث عن اشتراكات تنتهي خلال 10 أيام
    FOR subscription_record IN
        SELECT ts.*, t.name as tenant_name, t.owner_phone
        FROM public.tenant_subscriptions ts
        JOIN public.tenants t ON ts.tenant_id = t.id
        WHERE ts.status = 'active'
        AND ts.end_date BETWEEN CURRENT_DATE + INTERVAL '9 days' AND CURRENT_DATE + INTERVAL '10 days'
        AND NOT EXISTS (
            SELECT 1 FROM public.whatsapp_messages wm
            WHERE wm.tenant_id = ts.tenant_id
            AND wm.message_type = 'expiry_warning'
            AND wm.created_at::date = CURRENT_DATE
        )
    LOOP
        -- إنشاء رسالة التنبيه
        warning_message := format('⚠️ تنبيه انتهاء الاشتراك

عزيزنا في حضانة "%s"

ينتهي اشتراككم في SmartKindy بتاريخ: %s
باقة الاشتراك: %s

يرجى تجديد الاشتراك لضمان استمرار الخدمة.

للتجديد أو الاستفسارات:
📞 الدعم الفني: 920012345
💻 الموقع: https://smartkindy.com

شكراً لثقتكم بنا 🌟',
            subscription_record.tenant_name,
            subscription_record.end_date,
            CASE subscription_record.plan_type
                WHEN 'premium' THEN 'الباقة المميزة'
                WHEN 'enterprise' THEN 'باقة المؤسسات'
                ELSE 'الباقة الأساسية'
            END
        );
        
        -- إدراج رسالة التنبيه
        INSERT INTO public.whatsapp_messages (
            tenant_id,
            recipient_phone,
            message_content,
            message_type,
            scheduled_at
        ) VALUES (
            subscription_record.tenant_id,
            subscription_record.owner_phone,
            warning_message,
            'expiry_warning',
            NOW()
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;