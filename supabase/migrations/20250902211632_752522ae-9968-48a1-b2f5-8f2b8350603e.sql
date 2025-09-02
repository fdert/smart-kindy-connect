-- Drop existing function and recreate it
DROP FUNCTION IF EXISTS public.validate_report_token(TEXT);

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