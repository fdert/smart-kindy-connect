-- Add RLS policy to allow public access to read surveys
CREATE POLICY "Public can view active surveys" 
ON public.surveys 
FOR SELECT 
USING (is_active = true);

-- Add RLS policy to allow public access to read survey questions
CREATE POLICY "Public can view questions for active surveys" 
ON public.survey_questions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.surveys 
  WHERE surveys.id = survey_questions.survey_id 
  AND surveys.is_active = true
));

-- Add RLS policy to allow public responses to surveys
CREATE POLICY "Public can submit responses to active surveys" 
ON public.survey_responses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.surveys 
  WHERE surveys.id = survey_responses.survey_id 
  AND surveys.is_active = true 
  AND surveys.expires_at > now()
));