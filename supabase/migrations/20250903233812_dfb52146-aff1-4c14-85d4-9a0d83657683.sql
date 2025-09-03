-- Update assignment notification to include full description in one message
CREATE OR REPLACE FUNCTION public.send_assignment_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    assignment_info RECORD;
    student_info RECORD;
    guardian_info RECORD;
    notification_message TEXT;
    due_date_formatted TEXT;
    assignment_type_ar TEXT;
    priority_ar TEXT;
BEGIN
    -- Get assignment information
    SELECT a.title, a.description, a.due_date, a.assignment_type, a.priority, c.name as class_name
    INTO assignment_info
    FROM assignments a
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.id = NEW.id;
    
    -- Format due date
    due_date_formatted := to_char(assignment_info.due_date, 'DD/MM/YYYY');
    
    -- Translate assignment type to Arabic
    assignment_type_ar := CASE assignment_info.assignment_type
        WHEN 'homework' THEN 'واجب منزلي'
        WHEN 'task' THEN 'مهمة'
        WHEN 'project' THEN 'مشروع'
        WHEN 'activity' THEN 'نشاط'
        ELSE assignment_info.assignment_type
    END;
    
    -- Translate priority to Arabic
    priority_ar := CASE assignment_info.priority
        WHEN 'high' THEN 'عالية'
        WHEN 'medium' THEN 'متوسطة'
        WHEN 'low' THEN 'منخفضة'
        ELSE assignment_info.priority
    END;
    
    -- Create comprehensive single notification message
    notification_message := format('📚 واجب جديد

العنوان: %s
النوع: %s
الأولوية: %s
الفصل: %s
موعد التسليم: %s

الوصف:
%s

يرجى متابعة طفلكم لإنجاز الواجب في الموعد المحدد.',
        assignment_info.title,
        assignment_type_ar,
        priority_ar,
        COALESCE(assignment_info.class_name, 'غير محدد'),
        due_date_formatted,
        COALESCE(assignment_info.description, 'لا يوجد وصف إضافي')
    );
    
    -- If it's a group assignment for a class
    IF NEW.is_group_assignment = true AND NEW.class_id IS NOT NULL THEN
        -- Get all students in the class and send notifications to their guardians
        FOR student_info IN 
            SELECT s.id, s.full_name, s.student_id
            FROM students s
            WHERE s.class_id = NEW.class_id
            AND s.is_active = true
            AND s.tenant_id = NEW.tenant_id
        LOOP
            -- Insert notification reminder for each student with assignment details
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
                assignment_due_date
            ) VALUES (
                NEW.tenant_id,
                student_info.id,
                NEW.id,
                'assignment_notification',
                notification_message,
                CURRENT_DATE,
                'pending',
                assignment_info.title,
                assignment_info.assignment_type,
                assignment_info.priority,
                due_date_formatted
            );
            
            -- Insert reminder notification for 1 day before due date
            IF assignment_info.due_date > CURRENT_DATE + INTERVAL '1 day' THEN
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
                    assignment_due_date
                ) VALUES (
                    NEW.tenant_id,
                    student_info.id,
                    NEW.id,
                    'assignment_reminder',
                    format('⏰ تذكير: الواجب "%s" مطلوب تسليمه غداً (%s)', 
                        assignment_info.title, 
                        due_date_formatted),
                    assignment_info.due_date - INTERVAL '1 day',
                    'pending',
                    assignment_info.title,
                    assignment_info.assignment_type,
                    assignment_info.priority,
                    due_date_formatted
                );
            END IF;
        END LOOP;
    ELSIF NEW.student_id IS NOT NULL THEN
        -- Individual assignment for specific student
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
            assignment_due_date
        ) VALUES (
            NEW.tenant_id,
            NEW.student_id,
            NEW.id,
            'assignment_notification',
            notification_message,
            CURRENT_DATE,
            'pending',
            assignment_info.title,
            assignment_info.assignment_type,
            assignment_info.priority,
            due_date_formatted
        );
        
        -- Insert reminder notification for 1 day before due date
        IF assignment_info.due_date > CURRENT_DATE + INTERVAL '1 day' THEN
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
                assignment_due_date
            ) VALUES (
                NEW.tenant_id,
                NEW.student_id,
                NEW.id,
                'assignment_reminder',
                format('⏰ تذكير: الواجب "%s" مطلوب تسليمه غداً (%s)', 
                    assignment_info.title, 
                    due_date_formatted),
                assignment_info.due_date - INTERVAL '1 day',
                'pending',
                assignment_info.title,
                assignment_info.assignment_type,
                assignment_info.priority,
                due_date_formatted
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;