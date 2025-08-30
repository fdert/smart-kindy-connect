-- إزالة جميع السياسات الحالية أولاً
DO $$
DECLARE
    policy_rec RECORD;
BEGIN
    FOR policy_rec IN 
        SELECT policyname FROM pg_policies 
        WHERE tablename = 'users' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', policy_rec.policyname);
    END LOOP;
END $$;

-- إعادة إنشاء سياسات مبسطة بدون recursion
CREATE POLICY "Auth users can access their data" 
ON public.users 
FOR ALL 
USING (auth.uid() = id);

-- سياسة خاصة للمدير العام باستخدام ID مباشر
CREATE POLICY "Super admin access" 
ON public.users 
FOR ALL 
USING (auth.uid() = '5390c93f-4b87-4b07-a5c9-6332583c5ed9'::uuid);