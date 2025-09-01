-- إصلاح مشكلة تسجيل الدخول للمعلمة
DO $$
DECLARE
    teacher_email TEXT := 'fdert@gfdd.com';
    temp_password TEXT := 'TK94303549';
    auth_user_id UUID;
BEGIN
    -- التحقق من وجود المستخدم في auth.users
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = teacher_email;
    
    IF auth_user_id IS NULL THEN
        -- إنشاء مستخدم جديد في Auth إذا لم يكن موجوداً
        INSERT INTO auth.users (
            id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            role
        ) VALUES (
            gen_random_uuid(),
            teacher_email,
            crypt(temp_password, gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"email_verified": true}',
            false,
            'authenticated'
        );
        
        RAISE NOTICE 'تم إنشاء مستخدم جديد في Auth: %', teacher_email;
    ELSE
        -- تحديث كلمة المرور للمستخدم الموجود
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(temp_password, gen_salt('bf')),
            updated_at = NOW(),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            raw_user_meta_data = COALESCE(raw_user_meta_data, '{}') || '{"email_verified": true}'
        WHERE id = auth_user_id;
        
        RAISE NOTICE 'تم تحديث كلمة المرور للمستخدم: %', teacher_email;
    END IF;
    
    -- التأكد من أن المستخدم موجود في جدول users
    INSERT INTO users (
        id, 
        email, 
        full_name, 
        role, 
        phone, 
        tenant_id, 
        is_active
    ) VALUES (
        COALESCE(auth_user_id, (SELECT id FROM auth.users WHERE email = teacher_email)),
        teacher_email,
        'معلمة تجريبية',
        'teacher',
        '+966500000000',
        '05c50850-3919-4fd9-a962-5b1174ee2b6c',
        true
    ) ON CONFLICT (email) DO UPDATE SET
        is_active = true,
        role = 'teacher',
        tenant_id = '05c50850-3919-4fd9-a962-5b1174ee2b6c';
    
    RAISE NOTICE 'تم التأكد من بيانات المستخدم في جدول users';
    
END $$;