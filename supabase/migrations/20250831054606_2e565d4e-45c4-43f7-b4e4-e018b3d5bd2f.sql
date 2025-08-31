-- Create function to send assignment notifications
CREATE OR REPLACE FUNCTION public.send_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
    assignment_info RECORD;
    student_info RECORD;
    guardian_info RECORD;
    notification_message TEXT;
    due_date_formatted TEXT;
BEGIN
    -- Get assignment information
    SELECT a.title, a.description, a.due_date, a.assignment_type, a.priority, c.name as class_name
    INTO assignment_info
    FROM assignments a
    LEFT JOIN classes c ON a.class_id = c.id
    WHERE a.id = NEW.id;
    
    -- Format due date
    due_date_formatted := to_char(assignment_info.due_date, 'DD/MM/YYYY');
    
    -- Prepare notification message
    notification_message := format('📚 واجب جديد

العنوان: %s
النوع: %s
الأولوية: %s
الفصل: %s
موعد التسليم: %s

الوصف: %s

يرجى متابعة طفلكم لإنجاز الواجب في الموعد المحدد.',
        assignment_info.title,
        CASE assignment_info.assignment_type
            WHEN 'homework' THEN 'واجب منزلي'
            WHEN 'project' THEN 'مشروع'
            WHEN 'activity' THEN 'نشاط'
            ELSE assignment_info.assignment_type
        END,
        CASE assignment_info.priority
            WHEN 'high' THEN 'عالية'
            WHEN 'medium' THEN 'متوسطة'
            WHEN 'low' THEN 'منخفضة'
            ELSE assignment_info.priority
        END,
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
            -- Insert notification reminder for each student
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
                student_info.id,
                NEW.id,
                'assignment_notification',
                notification_message,
                CURRENT_DATE,
                'pending'
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
                    status
                ) VALUES (
                    NEW.tenant_id,
                    student_info.id,
                    NEW.id,
                    'assignment_reminder',
                    format('⏰ تذكير: الواجب "%s" مطلوب تسليمه غداً (%s)', 
                        assignment_info.title, 
                        due_date_formatted),
                    assignment_info.due_date - INTERVAL '1 day',
                    'pending'
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
            status
        ) VALUES (
            NEW.tenant_id,
            NEW.student_id,
            NEW.id,
            'assignment_notification',
            notification_message,
            CURRENT_DATE,
            'pending'
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
                status
            ) VALUES (
                NEW.tenant_id,
                NEW.student_id,
                NEW.id,
                'assignment_reminder',
                format('⏰ تذكير: الواجب "%s" مطلوب تسليمه غداً (%s)', 
                    assignment_info.title, 
                    due_date_formatted),
                assignment_info.due_date - INTERVAL '1 day',
                'pending'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for assignment notifications
DROP TRIGGER IF EXISTS assignment_notification_trigger ON assignments;
CREATE TRIGGER assignment_notification_trigger
    AFTER INSERT ON assignments
    FOR EACH ROW
    EXECUTE FUNCTION send_assignment_notification();

-- Create function to process scheduled notifications
CREATE OR REPLACE FUNCTION public.process_scheduled_notifications()
RETURNS void AS $$
DECLARE
    notification_record RECORD;
    guardian_record RECORD;
    tenant_info RECORD;
BEGIN
    -- Process pending notifications scheduled for today or earlier
    FOR notification_record IN 
        SELECT nr.*
        FROM notification_reminders nr
        WHERE nr.status = 'pending'
        AND nr.scheduled_date <= CURRENT_DATE
    LOOP
        -- Get tenant information
        SELECT name INTO tenant_info FROM tenants WHERE id = notification_record.tenant_id;
        
        -- Get guardians for this student
        FOR guardian_record IN
            SELECT g.id, g.full_name, g.whatsapp_number
            FROM guardians g
            JOIN guardian_student_links gsl ON g.id = gsl.guardian_id
            WHERE gsl.student_id = notification_record.student_id
            AND g.whatsapp_number IS NOT NULL
            AND g.whatsapp_number != ''
        LOOP
            -- Here you would typically call an external service or queue system
            -- For now, we'll just log that a notification should be sent
            RAISE NOTICE 'Sending WhatsApp notification to % (%) for student %: %',
                guardian_record.full_name,
                guardian_record.whatsapp_number,
                notification_record.student_id,
                notification_record.message_content;
        END LOOP;
        
        -- Mark notification as sent
        UPDATE notification_reminders 
        SET status = 'sent', sent_at = now()
        WHERE id = notification_record.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;