-- التأكد من أن الوظائف موجودة وتعمل بشكل صحيح
CREATE OR REPLACE FUNCTION public.get_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT tenant_id FROM public.users WHERE id = auth.uid();
$function$;

CREATE OR REPLACE FUNCTION public.has_role(_role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() AND role = _role
  );
$function$;

-- إزالة وإعادة إنشاء RLS policies للـ users table
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users in their tenant" ON public.users;
DROP POLICY IF EXISTS "Users can view users in their tenant" ON public.users;

-- إنشاء سياسات جديدة مبسطة
CREATE POLICY "Super admins full access" 
ON public.users 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.users u2 
    WHERE u2.id = auth.uid() 
    AND u2.role = 'super_admin'
  )
);

CREATE POLICY "Users can read own profile" 
ON public.users 
FOR SELECT 
USING (id = auth.uid());

CREATE POLICY "Users can update own profile" 
ON public.users 
FOR UPDATE 
USING (id = auth.uid());