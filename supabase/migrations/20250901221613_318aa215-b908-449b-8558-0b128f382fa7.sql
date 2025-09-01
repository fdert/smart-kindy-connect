-- إضافة دالة لفحص حالة حسابات المعلمين
CREATE OR REPLACE FUNCTION check_teacher_auth_status()
RETURNS TABLE(
    teacher_email TEXT,
    user_active BOOLEAN,
    auth_account_exists BOOLEAN,
    status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.email,
        u.is_active,
        EXISTS(SELECT 1 FROM auth.users au WHERE au.email = u.email) as auth_exists,
        CASE 
            WHEN NOT u.is_active THEN 'معطل في النظام'
            WHEN NOT EXISTS(SELECT 1 FROM auth.users au WHERE au.email = u.email) 
            THEN 'مفقود من نظام المصادقة'
            ELSE 'نشط'
        END as status
    FROM users u
    WHERE u.role = 'teacher'::user_role
    ORDER BY u.email;
END;
$$;

-- دالة لتفعيل حساب معلم
CREATE OR REPLACE FUNCTION activate_teacher_by_email(teacher_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result_message TEXT;
    teacher_exists BOOLEAN;
BEGIN
    -- التحقق من وجود المعلم
    SELECT EXISTS(
        SELECT 1 FROM users 
        WHERE email = teacher_email AND role = 'teacher'::user_role
    ) INTO teacher_exists;
    
    IF NOT teacher_exists THEN
        RETURN 'المعلم غير موجود: ' || teacher_email;
    END IF;
    
    -- تفعيل حساب المعلم
    UPDATE users 
    SET is_active = true,
        updated_at = now()
    WHERE email = teacher_email 
    AND role = 'teacher'::user_role;
    
    result_message := 'تم تفعيل حساب المعلم: ' || teacher_email;
    RETURN result_message;
END;
$$;

-- تفعيل جميع حسابات المعلمين
UPDATE users 
SET is_active = true,
    updated_at = now()
WHERE role = 'teacher'::user_role;