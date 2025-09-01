-- تحديث وظيفة إرسال رسالة الواتس عند الموافقة على الحضانة لتشمل إنشاء حساب Auth
CREATE OR REPLACE FUNCTION public.send_approval_whatsapp()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    temp_pass TEXT;
    message_content TEXT;
    phone_formatted TEXT;
    auth_user_created BOOLEAN := false;
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
        
        -- محاولة إنشاء حساب في Supabase Auth
        BEGIN
            -- استدعاء دالة إرسال بيانات الدخول التي تتضمن إنشاء حساب Auth
            PERFORM net.http_post(
                url := 'https://ytjodudlnfamvnescumu.supabase.co/functions/v1/send-login-credentials',
                headers := jsonb_build_object(
                    'Content-Type', 'application/json',
                    'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
                ),
                body := jsonb_build_object('tenantId', NEW.id)
            );
            
            auth_user_created := true;
            RAISE NOTICE 'Auth user creation requested for tenant: %', NEW.name;
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create Auth user for tenant %: %', NEW.name, SQLERRM;
            auth_user_created := false;
        END;
        
        -- إنشاء رسالة الواتس (إذا لم يتم إرسالها عبر send-login-credentials)
        IF NOT auth_user_created THEN
            message_content := format('🎉 مرحباً بكم في SmartKindy!

تم اعتماد حضانة "%s" بنجاح ✅

بيانات الدخول المؤقتة:

👤 اسم المستخدم:
📧 %s

🔐 كلمة المرور:
🔑 %s

⚠️ مطلوب تغيير كلمة المرور عند أول تسجيل دخول

🌐 رابط تسجيل الدخول:
https://smartkindy.com/auth

نوع الباقة: %s
مدة الاشتراك: شهر واحد (تجريبي)

📞 للدعم الفني: 920012345
🌟 مرحباً بكم في عائلة SmartKindy!',
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
        END IF;
        
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
        
        RAISE NOTICE 'Approval process completed for tenant: % (Auth user: %)', NEW.name, auth_user_created;
    END IF;
    
    RETURN NEW;
END;
$function$;