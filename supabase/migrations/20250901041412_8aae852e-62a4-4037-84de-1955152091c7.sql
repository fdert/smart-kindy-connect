-- Add RLS policy to allow tenants to insert WhatsApp messages
CREATE POLICY "Tenants can insert whatsapp messages" ON public.whatsapp_messages
FOR INSERT 
WITH CHECK (tenant_id = get_user_tenant_id());