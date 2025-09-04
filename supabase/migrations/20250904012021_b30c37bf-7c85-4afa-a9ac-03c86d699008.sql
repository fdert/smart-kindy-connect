-- إزالة التrigger الذي يسبب التكرار والمشاكل في الرسائل
DROP TRIGGER IF EXISTS assignment_notification_trigger ON public.assignments;

-- تحديث دالة send_assignment_notification لتنشئ فقط notification reminders بسيطة
-- بدون محتوى نص لأن assignment-notifications function سيتولى بناء النص
CREATE OR REPLACE FUNCTION public.send_assignment_notification()
RETURNS TRIGGER AS $$
DECLARE
    student_info RECORD;
    due_date_formatted TEXT;
BEGIN
    -- Format due date
    due_date_formatted := to_char(NEW.due_date, 'DD/MM/YYYY');
    
    -- If it's a group assignment for a class
    IF NEW.is_group_assignment = true AND NEW.class_id IS NOT NULL THEN
        -- Get all students in the class and create simple reminders
        FOR student_info IN 
            SELECT s.id, s.full_name, s.student_id
            FROM students s
            WHERE s.class_id = NEW.class_id
            AND s.is_active = true
            AND s.tenant_id = NEW.tenant_id
        LOOP
            -- Insert notification reminder for each student (assignment-notifications function will handle message content)
            INSERT INTO notification_reminders (
                tenant_id,
                student_id,
                assignment_id,
                reminder_type,
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
                CURRENT_DATE,
                'pending',
                NEW.title,
                NEW.assignment_type,
                NEW.priority,
                due_date_formatted
            );
            
            -- Insert reminder notification for 1 day before due date
            IF NEW.due_date > CURRENT_DATE + INTERVAL '1 day' THEN
                INSERT INTO notification_reminders (
                    tenant_id,
                    student_id,
                    assignment_id,
                    reminder_type,
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
                    NEW.due_date - INTERVAL '1 day',
                    'pending',
                    NEW.title,
                    NEW.assignment_type,
                    NEW.priority,
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
            CURRENT_DATE,
            'pending',
            NEW.title,
            NEW.assignment_type,
            NEW.priority,
            due_date_formatted
        );
        
        -- Insert reminder notification for 1 day before due date
        IF NEW.due_date > CURRENT_DATE + INTERVAL '1 day' THEN
            INSERT INTO notification_reminders (
                tenant_id,
                student_id,
                assignment_id,
                reminder_type,
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
                NEW.due_date - INTERVAL '1 day',
                'pending',
                NEW.title,
                NEW.assignment_type,
                NEW.priority,
                due_date_formatted
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- إعادة إنشاء الـ trigger
CREATE TRIGGER assignment_notification_trigger
    AFTER INSERT ON public.assignments
    FOR EACH ROW
    EXECUTE FUNCTION public.send_assignment_notification();