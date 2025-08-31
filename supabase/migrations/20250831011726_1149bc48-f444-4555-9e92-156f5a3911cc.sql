-- Create public read access policy for rewards that are public and shareable
DROP POLICY IF EXISTS "Public can view public rewards" ON public.rewards;
DROP POLICY IF EXISTS "Public can view public reward cards" ON public.rewards;

CREATE POLICY "Public can view public reward cards" 
ON public.rewards 
FOR SELECT 
USING (is_public = true);

-- Create public read access policy for students linked to public rewards  
DROP POLICY IF EXISTS "Public can view student names for public rewards" ON public.students;

CREATE POLICY "Public can view student names for public rewards" 
ON public.students 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.rewards 
    WHERE rewards.student_id = students.id 
    AND rewards.is_public = true
  )
);