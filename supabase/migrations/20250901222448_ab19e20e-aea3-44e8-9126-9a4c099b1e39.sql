-- تحديث كلمة مرور المعلمة لتتطابق مع كلمة المرور المؤقتة للحضانة
DO $$
DECLARE
    teacher_record RECORD;
    tenant_temp_password TEXT;
BEGIN
    -- الحصول على بيانات المعلمة وكلمة المرور المؤقتة للحضانة
    SELECT u.*, t.temp_password as tenant_temp_pass, t.name as tenant_name
    INTO teacher_record
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.email = 'fdert@gfdd.com' AND u.role = 'teacher';
    
    IF teacher_record IS NULL THEN
        RAISE EXCEPTION 'المعلمة غير موجودة';
    END IF;
    
    tenant_temp_password := teacher_record.tenant_temp_pass;
    
    IF tenant_temp_password IS NULL THEN
        RAISE EXCEPTION 'كلمة المرور المؤقتة للحضانة غير موجودة';
    END IF;
    
    -- تحديث كلمة مرور المعلمة في Auth لتتطابق مع كلمة المرور المؤقتة للحضانة
    UPDATE auth.users 
    SET encrypted_password = crypt(tenant_temp_password, gen_salt('bf')),
        updated_at = NOW(),
        email_confirmed_at = CASE WHEN email_confirmed_at IS NULL THEN NOW() ELSE email_confirmed_at END
    WHERE email = teacher_record.email;
    
    -- إرسال رسالة واتساب مع بيانات الدخول
    INSERT INTO whatsapp_messages (
        tenant_id,
        recipient_phone,
        message_content,
        message_type,
        scheduled_at
    ) VALUES (
        teacher_record.tenant_id,
        teacher_record.phone,
        format('🔐 بيانات الدخول - SmartKindy

أهلاً وسهلاً أ. %s 👩‍🏫

بيانات الدخول:
📧 البريد الإلكتروني: %s
🔑 كلمة المرور: %s

🌐 رابط تسجيل الدخول:
https://smart-kindy-connect.lovable.app/auth

ℹ️ هذه كلمة المرور المؤقتة لحضانة "%s"
يُرجى استخدامها لتسجيل الدخول

📞 للدعم: تواصلي مع إدارة الحضانة',
            teacher_record.full_name,
            teacher_record.email,
            tenant_temp_password,
            teacher_record.tenant_name
        ),
        'teacher_credentials',
        NOW()
    );
    
    RAISE NOTICE 'تم تحديث كلمة مرور المعلمة وإرسال بيانات الدخول: %', teacher_record.email;
    
END $$;