-- إصلاح بسيط لمشكلة تسجيل الدخول للمعلمة
DO $$
DECLARE
    teacher_email TEXT := 'fdert@gfdd.com';
    temp_password TEXT := 'TK94303549';
    auth_user_exists BOOLEAN;
BEGIN
    -- التحقق من وجود المستخدم في auth.users
    SELECT EXISTS(
        SELECT 1 FROM auth.users 
        WHERE email = teacher_email
    ) INTO auth_user_exists;
    
    IF auth_user_exists THEN
        -- تحديث كلمة المرور للمستخدم الموجود
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(temp_password, gen_salt('bf')),
            updated_at = NOW(),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW())
        WHERE email = teacher_email;
        
        RAISE NOTICE 'تم تحديث كلمة المرور للمستخدم: %', teacher_email;
    ELSE
        RAISE NOTICE 'المستخدم غير موجود في نظام المصادقة: %', teacher_email;
    END IF;
    
    -- التأكد من تفعيل المستخدم في جدول users
    UPDATE users 
    SET is_active = true
    WHERE email = teacher_email AND role = 'teacher';
    
    RAISE NOTICE 'تم تفعيل المستخدم في النظام: %', teacher_email;
    
END $$;