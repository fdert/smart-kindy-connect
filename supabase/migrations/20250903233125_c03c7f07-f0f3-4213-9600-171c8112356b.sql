-- Update evaluation notification trigger to use simple messages
CREATE OR REPLACE FUNCTION public.send_evaluation_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    student_info RECORD;
    assignment_info RECORD;
    tenant_info RECORD;
    notification_message TEXT;
    status_text TEXT;
    congratulations_text TEXT;
    score_text TEXT;
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
    
    -- Create simple evaluation notification (like attendance)
    IF NEW.evaluation_status = 'completed' THEN
        status_text := 'مكتمل ✅';
        notification_message := format('📝 تقييم الواجب

الطالب: %s (%s)
الواجب: %s
الحالة: %s
%s%s

من: %s',
            student_info.full_name,
            student_info.student_id,
            assignment_info.title,
            status_text,
            CASE WHEN NEW.evaluation_score IS NOT NULL 
                THEN format('النتيجة: %s', NEW.evaluation_score) || E'\n'
                ELSE '' 
            END,
            CASE WHEN NEW.teacher_feedback IS NOT NULL 
                THEN format('ملاحظات المعلمة: %s', NEW.teacher_feedback)
                ELSE 'أحسنت! واصل التميز 🌟'
            END,
            tenant_info.name
        );
    ELSE
        status_text := 'غير مكتمل ❌';
        notification_message := format('📝 تقييم الواجب

الطالب: %s (%s)
الواجب: %s
الحالة: %s

%s

من: %s',
            student_info.full_name,
            student_info.student_id,
            assignment_info.title,
            status_text,
            COALESCE(NEW.teacher_feedback, 'يرجى مراجعة المعلمة لمناقشة الأسباب والحلول'),
            tenant_info.name
        );
    END IF;
    
    -- Insert notification reminder with evaluation details
    INSERT INTO notification_reminders (
        tenant_id,
        student_id,
        assignment_id,
        reminder_type,
        message_content,
        scheduled_date,
        status,
        assignment_title,
        assignment_type,
        evaluation_status,
        evaluation_score,
        teacher_feedback
    ) VALUES (
        NEW.tenant_id,
        NEW.student_id,
        NEW.assignment_id,
        'assignment_evaluation',
        notification_message,
        CURRENT_DATE,
        'pending',
        assignment_info.title,
        assignment_info.assignment_type,
        NEW.evaluation_status,
        NEW.evaluation_score,
        NEW.teacher_feedback
    );
    
    RETURN NEW;
END;
$function$;