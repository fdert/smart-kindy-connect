-- Create assignment evaluations table
CREATE TABLE public.assignment_evaluations (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    assignment_id UUID NOT NULL,
    student_id UUID NOT NULL,
    evaluation_status TEXT NOT NULL CHECK (evaluation_status IN ('completed', 'not_completed')),
    evaluation_score NUMERIC(5,2),
    teacher_feedback TEXT,
    completion_date DATE,
    evaluated_by UUID NOT NULL,
    evaluated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignment_evaluations ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Tenant isolation for assignment_evaluations" 
ON public.assignment_evaluations 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

-- Create trigger for updated_at
CREATE TRIGGER update_assignment_evaluations_updated_at
BEFORE UPDATE ON public.assignment_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to send evaluation notifications
CREATE OR REPLACE FUNCTION public.send_evaluation_notification()
RETURNS TRIGGER AS $$
DECLARE
    student_info RECORD;
    assignment_info RECORD;
    tenant_info RECORD;
    notification_message TEXT;
    status_text TEXT;
    congratulations_text TEXT;
BEGIN
    -- Get student information
    SELECT s.full_name, s.student_id, c.name as class_name
    INTO student_info
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.id = NEW.student_id;
    
    -- Get assignment information
    SELECT a.title, a.description, a.due_date, a.assignment_type
    INTO assignment_info
    FROM assignments a
    WHERE a.id = NEW.assignment_id;
    
    -- Get tenant information
    SELECT t.name INTO tenant_info
    FROM tenants t
    WHERE t.id = NEW.tenant_id;
    
    -- Prepare notification based on evaluation status
    IF NEW.evaluation_status = 'completed' THEN
        status_text := 'مكتمل ✅';
        congratulations_text := '🎉 أحسنت! لقد أكملت الواجب بنجاح.';
        
        notification_message := format('🌟 تقييم الواجب

%s

الطالب: %s (%s)
الواجب: %s
النوع: %s
الحالة: %s
تاريخ الإكمال: %s

%s

%s

تقييم المعلمة: %s

من: %s
نفخر بإنجازك واجتهادك! 💪',
            congratulations_text,
            student_info.full_name,
            student_info.student_id,
            assignment_info.title,
            CASE assignment_info.assignment_type
                WHEN 'homework' THEN 'واجب منزلي'
                WHEN 'task' THEN 'مهمة'
                WHEN 'project' THEN 'مشروع'
                WHEN 'activity' THEN 'نشاط'
                ELSE assignment_info.assignment_type
            END,
            status_text,
            COALESCE(to_char(NEW.completion_date, 'DD/MM/YYYY'), 'غير محدد'),
            CASE 
                WHEN NEW.evaluation_score IS NOT NULL THEN format('النتيجة: %.1f', NEW.evaluation_score)
                ELSE ''
            END,
            COALESCE(NEW.teacher_feedback, 'لا توجد ملاحظات إضافية'),
            tenant_info.name
        );
    ELSE
        status_text := 'غير مكتمل ❌';
        notification_message := format('📋 تقييم الواجب

الطالب: %s (%s)
الواجب: %s
النوع: %s
الحالة: %s

⚠️ لم يتم إكمال الواجب في الموعد المحدد.

ملاحظات المعلمة: %s

من: %s
يرجى مراجعة المعلمة لمناقشة الأسباب والحلول.',
            student_info.full_name,
            student_info.student_id,
            assignment_info.title,
            CASE assignment_info.assignment_type
                WHEN 'homework' THEN 'واجب منزلي'
                WHEN 'task' THEN 'مهمة'
                WHEN 'project' THEN 'مشروع'
                WHEN 'activity' THEN 'نشاط'
                ELSE assignment_info.assignment_type
            END,
            status_text,
            COALESCE(NEW.teacher_feedback, 'لا توجد ملاحظات إضافية'),
            tenant_info.name
        );
    END IF;
    
    -- Insert notification reminder
    INSERT INTO notification_reminders (
        tenant_id,
        student_id,
        assignment_id,
        reminder_type,
        message_content,
        scheduled_date,
        status
    ) VALUES (
        NEW.tenant_id,
        NEW.student_id,
        NEW.assignment_id,
        'assignment_evaluation',
        notification_message,
        CURRENT_DATE,
        'pending'
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for evaluation notifications
CREATE TRIGGER assignment_evaluation_notification_trigger
AFTER INSERT ON public.assignment_evaluations
FOR EACH ROW
EXECUTE FUNCTION public.send_evaluation_notification();