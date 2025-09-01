-- Add public access policy for student reports
CREATE POLICY "Public can view student data for reports" 
ON public.students 
FOR SELECT 
USING (true);

-- Add public access for related data when accessed via student report link
CREATE POLICY "Public can view student assignments for reports" 
ON public.assignment_evaluations 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view student attendance for reports" 
ON public.attendance_events 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view student rewards for reports" 
ON public.rewards 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view student notes for reports" 
ON public.student_notes 
FOR SELECT 
USING (is_private = false);

CREATE POLICY "Public can view student health checks for reports" 
ON public.health_checks 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view student media links for reports" 
ON public.media_student_links 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view media for reports" 
ON public.media 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view student development skills for reports" 
ON public.development_skills 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view classes for reports" 
ON public.classes 
FOR SELECT 
USING (true);

CREATE POLICY "Public can view tenants for reports" 
ON public.tenants 
FOR SELECT 
USING (true);