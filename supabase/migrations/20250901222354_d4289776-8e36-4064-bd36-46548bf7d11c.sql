-- إنشاء حساب Auth للمعلمة إذا لم يكن موجوداً وإرسال بيانات الدخول
DO $$
DECLARE
    teacher_record RECORD;
    auth_exists BOOLEAN;
    temp_password TEXT;
BEGIN
    -- الحصول على بيانات المعلمة
    SELECT u.*, t.temp_password as tenant_temp_password, t.name as tenant_name
    INTO teacher_record
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.email = 'fdert@gfdd.com' AND u.role = 'teacher';
    
    IF teacher_record IS NULL THEN
        RAISE EXCEPTION 'المعلمة غير موجودة';
    END IF;
    
    -- التحقق من وجود حساب Auth
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = 'fdert@gfdd.com'
    ) INTO auth_exists;
    
    -- إنشاء كلمة مرور مؤقتة للمعلمة
    temp_password := 'TK' || EXTRACT(YEAR FROM NOW())::TEXT || 
                    LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || 
                    LPAD((EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW()))::TEXT, 4, '0');
    
    IF NOT auth_exists THEN
        -- إنشاء حساب Auth للمعلمة
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            teacher_record.id,
            'authenticated',
            'authenticated',
            teacher_record.email,
            crypt(temp_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            jsonb_build_object(
                'full_name', teacher_record.full_name,
                'role', 'teacher'
            ),
            false,
            '',
            '',
            '',
            ''
        );
        
        RAISE NOTICE 'تم إنشاء حساب Auth للمعلمة: %', teacher_record.email;
    ELSE
        -- تحديث كلمة المرور للحساب الموجود
        UPDATE auth.users 
        SET encrypted_password = crypt(temp_password, gen_salt('bf')),
            updated_at = NOW()
        WHERE email = teacher_record.email;
        
        RAISE NOTICE 'تم تحديث كلمة مرور المعلمة: %', teacher_record.email;
    END IF;
    
    -- تحديث كلمة المرور المؤقتة في جدول المستخدمين لهذه المعلمة
    UPDATE users 
    SET temp_password = temp_password,
        updated_at = NOW()
    WHERE id = teacher_record.id;
    
    -- إرسال رسالة واتساب مع بيانات الدخول الجديدة
    INSERT INTO whatsapp_messages (
        tenant_id,
        recipient_phone,
        message_content,
        message_type,
        scheduled_at
    ) VALUES (
        teacher_record.tenant_id,
        teacher_record.phone,
        format('🔐 بيانات دخول جديدة - SmartKindy

أهلاً وسهلاً أ. %s 👩‍🏫

بيانات الدخول المحدثة:
📧 البريد الإلكتروني: %s
🔑 كلمة المرور: %s

🌐 رابط تسجيل الدخول:
https://smart-kindy-connect.lovable.app/auth

⚠️ يُرجى تغيير كلمة المرور عند أول تسجيل دخول

من: %s 🏫
📞 للدعم: تواصلي مع إدارة الحضانة',
            teacher_record.full_name,
            teacher_record.email,
            temp_password,
            teacher_record.tenant_name
        ),
        'teacher_credentials',
        NOW()
    );
    
    RAISE NOTICE 'تم إرسال بيانات الدخول للمعلمة عبر الواتساب: %', teacher_record.phone;
    
END $$;