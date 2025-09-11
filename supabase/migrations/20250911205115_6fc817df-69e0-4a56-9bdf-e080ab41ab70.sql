-- إصلاح الحملة المعلقة وتحديث حالتها لفشل
UPDATE public.marketing_campaigns 
SET status = 'failed', 
    completed_at = NOW(), 
    failed_count = total_recipients
WHERE id = '913a0571-92c0-48db-9d61-271369d12bd2' 
AND status = 'sending';

-- تحديث سجلات الرسائل المعلقة لتظهر كفاشلة مع سبب الفشل
UPDATE public.marketing_message_logs 
SET status = 'failed',
    error_message = 'انتهت مهلة الإرسال - مشكلة في الويب هوك أو الاتصال',
    sent_at = NOW()
WHERE campaign_id = '913a0571-92c0-48db-9d61-271369d12bd2' 
AND status = 'pending';