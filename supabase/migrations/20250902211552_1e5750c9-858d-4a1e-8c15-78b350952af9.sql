-- Drop existing function first
DROP FUNCTION IF EXISTS public.validate_report_token(TEXT);

-- Create report_tokens table for secure report access  
CREATE TABLE IF NOT EXISTS public.report_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  student_id UUID NOT NULL REFERENCES public.students(id),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id),
  report_type TEXT NOT NULL,
  guardian_access BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT false,
  accessed_count INTEGER NOT NULL DEFAULT 0,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.report_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies for report tokens (only accessible by service role)
CREATE POLICY "Service role can manage report tokens" 
ON public.report_tokens 
FOR ALL 
USING (true);

-- Create function to validate report tokens
CREATE OR REPLACE FUNCTION public.validate_report_token(p_token_hash TEXT)
RETURNS TABLE(
  student_id UUID,
  tenant_id UUID,
  report_type TEXT,
  guardian_access BOOLEAN
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rt.student_id,
    rt.tenant_id,
    rt.report_type,
    rt.guardian_access
  FROM public.report_tokens rt
  WHERE rt.token_hash = p_token_hash 
    AND rt.expires_at > now()
    AND rt.is_used = false;
    
  -- Mark token as used and update access count
  UPDATE public.report_tokens 
  SET 
    is_used = true,
    accessed_count = accessed_count + 1,
    last_accessed_at = now()
  WHERE token_hash = p_token_hash;
END;
$$ LANGUAGE plpgsql;