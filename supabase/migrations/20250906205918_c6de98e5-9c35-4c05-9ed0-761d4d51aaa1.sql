-- إنشاء جدول الحملات التسويقية
CREATE TABLE public.marketing_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_by UUID NOT NULL,
  campaign_name TEXT NOT NULL,
  message_content TEXT NOT NULL,
  phone_numbers JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_recipients INTEGER NOT NULL DEFAULT 0,
  sent_count INTEGER NOT NULL DEFAULT 0,
  failed_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'completed', 'failed')),
  webhook_url TEXT,
  webhook_secret TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنشاء جدول تفاصيل إرسال الرسائل
CREATE TABLE public.marketing_message_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.marketing_campaigns(id) ON DELETE CASCADE,
  recipient_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إنضافة RLS policies
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketing_message_logs ENABLE ROW LEVEL SECURITY;

-- سماح للمدراء العامين فقط بإدارة الحملات التسويقية
CREATE POLICY "Super admins can manage marketing campaigns" 
ON public.marketing_campaigns 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.role = 'super_admin'::user_role
));

CREATE POLICY "Super admins can manage marketing message logs" 
ON public.marketing_message_logs 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.users 
  WHERE users.id = auth.uid() AND users.role = 'super_admin'::user_role
));

-- إنشاء trigger لتحديث updated_at
CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON public.marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- إنشاء indexes لتحسين الأداء
CREATE INDEX idx_marketing_campaigns_status ON public.marketing_campaigns(status);
CREATE INDEX idx_marketing_campaigns_created_by ON public.marketing_campaigns(created_by);
CREATE INDEX idx_marketing_message_logs_campaign_id ON public.marketing_message_logs(campaign_id);
CREATE INDEX idx_marketing_message_logs_status ON public.marketing_message_logs(status);