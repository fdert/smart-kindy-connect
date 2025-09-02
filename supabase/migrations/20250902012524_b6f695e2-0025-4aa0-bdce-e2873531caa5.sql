-- إصلاح دور المستخدمة "مها" إلى معلمة
UPDATE users 
SET role = 'teacher', updated_at = now()
WHERE id = '2e8b6e42-bb3b-4667-98b5-6ca5546a2902' 
AND email = 'fdert@gfdd.com';

-- إنشاء دالة لإصلاح التوجيه بناءً على الدور الصحيح
CREATE OR REPLACE FUNCTION public.get_user_dashboard_redirect(p_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- جلب الدور من قاعدة البيانات
  SELECT role INTO v_role
  FROM users
  WHERE id = p_user_id AND is_active = true;
  
  -- إرجاع الرابط المناسب حسب الدور
  CASE v_role
    WHEN 'super_admin' THEN
      RETURN '/super-admin';
    WHEN 'admin' THEN
      RETURN '/dashboard';
    WHEN 'teacher' THEN
      RETURN '/teacher-dashboard';
    WHEN 'guardian' THEN
      RETURN '/dashboard';
    ELSE
      RETURN '/dashboard';
  END CASE;
END;
$$;