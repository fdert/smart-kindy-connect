-- Add marketing settings table for message timing configuration
CREATE TABLE public.marketing_settings (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL DEFAULT '{}',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.marketing_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for super admins only
CREATE POLICY "Super admins can manage marketing settings" 
ON public.marketing_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'super_admin'::user_role
  )
);

-- Insert default marketing timing settings
INSERT INTO public.marketing_settings (setting_key, setting_value, description) VALUES
('message_delay', '{"min_delay_seconds": 5, "max_delay_seconds": 15, "default_delay_seconds": 10}', 'Message sending delay settings between each message'),
('batch_settings', '{"batch_size": 50, "batch_delay_minutes": 5}', 'Batch processing settings for large campaigns');

-- Add delay settings to marketing campaigns table
ALTER TABLE public.marketing_campaigns 
ADD COLUMN message_delay_seconds INTEGER DEFAULT 10,
ADD COLUMN use_random_delay BOOLEAN DEFAULT false;