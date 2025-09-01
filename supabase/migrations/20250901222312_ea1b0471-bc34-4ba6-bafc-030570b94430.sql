-- إصلاح حساب المعلمة fdert@gfdd.com
DO $$
DECLARE
    teacher_record RECORD;
    temp_password TEXT;
BEGIN
    -- الحصول على بيانات المعلمة من جدول users وجدول tenants
    SELECT u.*, t.temp_password as tenant_temp_password, t.name as tenant_name
    INTO teacher_record
    FROM users u
    JOIN tenants t ON u.tenant_id = t.id
    WHERE u.email = 'fdert@gfdd.com' AND u.role = 'teacher';
    
    IF teacher_record IS NULL THEN
        RAISE EXCEPTION 'المعلمة غير موجودة في جدول المستخدمين';
    END IF;
    
    -- إنشاء كلمة مرور مؤقتة جديدة
    temp_password := 'TK' || EXTRACT(YEAR FROM NOW())::TEXT || 
                    LPAD(EXTRACT(DOY FROM NOW())::TEXT, 3, '0') || 
                    LPAD((EXTRACT(HOUR FROM NOW()) * 60 + EXTRACT(MINUTE FROM NOW()))::TEXT, 4, '0');
    
    -- تحديث كلمة المرور في نظام Auth
    UPDATE auth.users 
    SET encrypted_password = crypt(temp_password, gen_salt('bf')),
        updated_at = NOW(),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE email = teacher_record.email;
    
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
        format('🔐 بيانات دخول محدثة - SmartKindy

السلام عليكم أ. %s 👩‍🏫

تم تحديث بيانات دخولك:
📧 البريد الإلكتروني: %s
🔑 كلمة المرور الجديدة: %s

🌐 رابط تسجيل الدخول:
https://smart-kindy-connect.lovable.app/auth

⚠️ يُرجى حفظ هذه البيانات واستخدامها لتسجيل الدخول

من: %s 🏫
📞 للدعم: تواصلي مع إدارة الحضانة

تحياتنا 🌟',
            teacher_record.full_name,
            teacher_record.email,
            temp_password,
            teacher_record.tenant_name
        ),
        'teacher_credentials_fixed',
        NOW()
    );
    
    RAISE NOTICE 'تم إصلاح حساب المعلمة وإرسال بيانات الدخول الجديدة: % (كلمة المرور: %)', teacher_record.email, temp_password;
    
END $$;