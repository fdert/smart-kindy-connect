-- تحديث دالة إرسال رسالة الواتساب لتشمل نوع login_credentials
-- وإضافة المزيد من أنواع الرسائل
ALTER TYPE public.message_type_enum ADD VALUE IF NOT EXISTS 'login_credentials';

-- إذا لم يكن هناك enum، نقوم بإنشاءه
DO $$ 
BEGIN
    -- التحقق من وجود enum وإنشاءه إذا لم يكن موجوداً
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_type_enum') THEN
        CREATE TYPE public.message_type_enum AS ENUM ('approval', 'expiry_warning', 'general', 'login_credentials');
        
        -- تحديث عمود message_type في جدول whatsapp_messages ليستخدم enum
        ALTER TABLE public.whatsapp_messages 
        ALTER COLUMN message_type TYPE public.message_type_enum 
        USING message_type::public.message_type_enum;
    ELSE
        -- إضافة القيم الجديدة إذا لم تكن موجودة
        BEGIN
            ALTER TYPE public.message_type_enum ADD VALUE 'login_credentials';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- إضافة فهرس لتحسين أداء البحث
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status_type 
ON public.whatsapp_messages (status, message_type);

-- إضافة فهرس لتحسين أداء البحث حسب التاريخ
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_scheduled_at 
ON public.whatsapp_messages (scheduled_at);

-- تحديث دالة إرسال رسائل الاعتماد لتشمل المزيد من التحققات
CREATE OR REPLACE FUNCTION send_approval_whatsapp()
RETURNS TRIGGER AS $$
DECLARE
    temp_pass TEXT;
    message_content TEXT;
    phone_formatted TEXT;
BEGIN
    -- التحقق من تغيير الحالة إلى approved
    IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
        -- التحقق من وجود رقم الهاتف
        IF NEW.owner_phone IS NULL OR LENGTH(TRIM(NEW.owner_phone)) = 0 THEN
            RAISE NOTICE 'No phone number provided for tenant %', NEW.name;
            RETURN NEW;
        END IF;
        
        -- تنسيق رقم الهاتف للتأكد من أنه يبدأ بـ +966
        phone_formatted := NEW.owner_phone;
        IF NOT phone_formatted LIKE '+966%' THEN
            IF phone_formatted LIKE '05%' THEN
                phone_formatted := '+966' || SUBSTRING(phone_formatted FROM 2);
            ELSIF phone_formatted LIKE '966%' THEN
                phone_formatted := '+' || phone_formatted;
            ELSIF phone_formatted LIKE '5%' AND LENGTH(phone_formatted) = 9 THEN
                phone_formatted := '+966' || phone_formatted;
            END IF;
        END IF;
        
        -- إنشاء كلمة مرور مؤقتة
        temp_pass := 'TK' || EXTRACT(YEAR FROM NOW())::TEXT || 
                    LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || 
                    LPAD((EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW()))::TEXT, 4, '0');
        
        -- تحديث الحضانة بكلمة المرور المؤقتة
        UPDATE public.tenants 
        SET temp_password = temp_pass,
            password_reset_required = true,
            owner_phone = phone_formatted
        WHERE id = NEW.id;
        
        -- إنشاء رسالة الواتس
        message_content := format('🎉 مرحباً بكم في SmartKindy!

تم اعتماد حضانة "%s" بنجاح ✅

بيانات الدخول المؤقتة:
📧 البريد الإلكتروني: %s
🔑 كلمة المرور المؤقتة: %s

⚠️ مطلوب تغيير كلمة المرور عند أول تسجيل دخول

🌐 رابط تسجيل الدخول:
https://smartkindy.com/auth

نوع الباقة: %s
مدة الاشتراك: شهر واحد (تجريبي)

للدعم الفني: 920012345
مرحباً بكم في عائلة SmartKindy! 🌟',
            NEW.name,
            NEW.owner_email,
            temp_pass,
            CASE NEW.plan_type
                WHEN 'premium' THEN 'الباقة المميزة'
                WHEN 'enterprise' THEN 'باقة المؤسسات'
                ELSE 'الباقة الأساسية'
            END
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
            phone_formatted,
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
        
        RAISE NOTICE 'Approval WhatsApp message scheduled for tenant: % to phone: %', NEW.name, phone_formatted;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;