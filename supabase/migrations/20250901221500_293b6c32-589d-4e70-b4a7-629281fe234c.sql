-- إضافة دالة لإصلاح حسابات المعلمين المعطلة
CREATE OR REPLACE FUNCTION fix_teacher_auth_accounts()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    teacher_record RECORD;
    auth_user_exists BOOLEAN;
    result_text TEXT := '';
BEGIN
    -- التحقق من المعلمين النشطين الذين قد لا يملكون حساب auth
    FOR teacher_record IN 
        SELECT id, email, full_name 
        FROM users 
        WHERE role = 'teacher' 
        AND is_active = true
        AND email IS NOT NULL
    LOOP
        -- التحقق من وجود المستخدم في auth.users
        SELECT EXISTS(
            SELECT 1 FROM auth.users 
            WHERE email = teacher_record.email
        ) INTO auth_user_exists;
        
        IF NOT auth_user_exists THEN
            result_text := result_text || 'Teacher missing auth account: ' || teacher_record.email || E'\n';
        END IF;
    END LOOP;
    
    -- إرجاع تقرير بالحسابات المعطلة
    IF result_text = '' THEN
        result_text := 'All active teachers have auth accounts.';
    END IF;
    
    RETURN result_text;
END;
$$;

-- إضافة دالة لتفعيل حساب معلم معين
CREATE OR REPLACE FUNCTION activate_teacher_account(teacher_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    teacher_id UUID;
    result_text TEXT;
BEGIN
    -- البحث عن المعلم
    SELECT id INTO teacher_id 
    FROM users 
    WHERE email = teacher_email 
    AND role = 'teacher';
    
    IF teacher_id IS NULL THEN
        RETURN 'Teacher not found with email: ' || teacher_email;
    END IF;
    
    -- تفعيل حساب المعلم
    UPDATE users 
    SET is_active = true,
        updated_at = now()
    WHERE id = teacher_id;
    
    result_text := 'Teacher account activated: ' || teacher_email;
    RETURN result_text;
END;
$$;

-- تحديث كلمات المرور للمعلمين لجعلها أكثر أمانا
UPDATE users 
SET temp_password = 'TK' || LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0'),
    password_reset_required = true,
    updated_at = now()
WHERE role = 'teacher' 
AND is_active = true 
AND (temp_password IS NULL OR LENGTH(temp_password) < 8);