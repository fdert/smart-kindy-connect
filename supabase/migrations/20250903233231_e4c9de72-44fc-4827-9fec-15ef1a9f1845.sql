-- Update the evaluation notification trigger to match the new simple format
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
    SELECT a.title, a.description, a.due_date, a.assignment_type, a.priority
    INTO assignment_info
    FROM assignments a
    WHERE a.id = NEW.assignment_id;
    
    -- Get tenant information
    SELECT t.name INTO tenant_info
    FROM tenants t
    WHERE t.id = NEW.tenant_id;
    
    -- Prepare score text safely
    IF NEW.evaluation_score IS NOT NULL THEN
        score_text := 'النتيجة: ' || CAST(NEW.evaluation_score AS TEXT);
    ELSE
        score_text := '';
    END IF;
    
    -- Create simple evaluation notification message
    IF NEW.evaluation_status = 'completed' THEN
        status_text := 'مكتمل ✅';
        congratulations_text := '🎉 أحسنت!';
        
        notification_message := congratulations_text || E'\n\n' ||
            'الطالب: ' || student_info.full_name || ' (' || student_info.student_id || ')' || E'\n' ||
            'الواجب: ' || assignment_info.title || E'\n' ||
            'الحالة: ' || status_text || E'\n' ||
            CASE WHEN score_text != '' THEN score_text || E'\n' ELSE '' END ||
            CASE WHEN NEW.teacher_feedback IS NOT NULL THEN 'ملاحظات: ' || NEW.teacher_feedback || E'\n' ELSE '' END ||
            E'\nمن: ' || tenant_info.name;
    ELSE
        status_text := 'غير مكتمل ❌';
        notification_message := 'الطالب: ' || student_info.full_name || ' (' || student_info.student_id || ')' || E'\n' ||
            'الواجب: ' || assignment_info.title || E'\n' ||
            'الحالة: ' || status_text || E'\n' ||
            CASE WHEN NEW.teacher_feedback IS NOT NULL THEN 'ملاحظات: ' || NEW.teacher_feedback || E'\n' ELSE '' END ||
            E'\nمن: ' || tenant_info.name;
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
        assignment_priority,
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
        assignment_info.priority,
        NEW.evaluation_status,
        NEW.evaluation_score,
        NEW.teacher_feedback
    );
    
    RETURN NEW;
END;
$function$;