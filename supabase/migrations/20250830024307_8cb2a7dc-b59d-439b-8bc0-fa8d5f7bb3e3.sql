-- إنشاء الحسابات التجريبية
-- نحتاج لإنشاء المستخدمين في جدول auth.users أولاً باستخدام auth admin API

-- إنشاء دالة لإنشاء المستخدمين التجريبيين
CREATE OR REPLACE FUNCTION create_demo_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    demo_tenant_id uuid := '11111111-1111-1111-1111-111111111111';
    super_admin_id uuid := '00000000-0000-0000-0000-000000000001';
    owner_id uuid := '00000000-0000-0000-0000-000000000002';
    teacher_id uuid := '00000000-0000-0000-0000-000000000003';
    guardian_id uuid := '00000000-0000-0000-0000-000000000004';
BEGIN
    -- إدراج المستخدمين في جدول users (سيتم إنشاؤهم في auth.users لاحقاً)
    INSERT INTO public.users (id, email, full_name, role, tenant_id, is_active, created_at, updated_at)
    VALUES 
        (super_admin_id, 'superadmin@smartkindy.com', 'مدير عام النظام', 'super_admin', NULL, true, now(), now()),
        (owner_id, 'owner@smartkindy.com', 'مدير الروضة التجريبية', 'owner', demo_tenant_id, true, now(), now()),
        (teacher_id, 'teacher@smartkindy.com', 'المعلمة التجريبية', 'teacher', demo_tenant_id, true, now(), now()),
        (guardian_id, 'parent@smartkindy.com', 'ولي أمر تجريبي', 'guardian', demo_tenant_id, true, now(), now())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = EXCLUDED.full_name,
        role = EXCLUDED.role,
        tenant_id = EXCLUDED.tenant_id,
        is_active = EXCLUDED.is_active,
        updated_at = now();

    -- تحديث owner_id للتينانت التجريبي
    UPDATE public.tenants 
    SET owner_id = owner_id, status = 'active'
    WHERE id = demo_tenant_id;
END;
$$;

-- تشغيل الدالة
SELECT create_demo_users();

-- إنشاء edge function لإنشاء المستخدمين في auth.users
-- سنحتاج لهذا لاحقاً