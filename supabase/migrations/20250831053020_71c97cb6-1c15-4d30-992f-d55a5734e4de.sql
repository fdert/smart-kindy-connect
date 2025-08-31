-- Create function to send WhatsApp notifications for attendance
CREATE OR REPLACE FUNCTION public.send_attendance_notification()
RETURNS TRIGGER AS $$
DECLARE
    student_info RECORD;
    guardian_info RECORD;
    notification_message TEXT;
    status_text TEXT;
BEGIN
    -- Get student information
    SELECT s.full_name, s.student_id, c.name as class_name
    INTO student_info
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.id = NEW.student_id;
    
    -- Get status text in Arabic
    CASE NEW.status
        WHEN 'present' THEN status_text := 'حاضر';
        WHEN 'absent' THEN status_text := 'غائب';
        WHEN 'late' THEN status_text := 'متأخر';
        WHEN 'excused' THEN status_text := 'معذور';
        ELSE status_text := 'غير محدد';
    END CASE;
    
    -- Prepare notification message
    notification_message := format('تنبيه حضور: الطالب %s (ID: %s) من فصل %s - الحالة: %s - التاريخ: %s',
        student_info.full_name,
        student_info.student_id,
        COALESCE(student_info.class_name, 'غير محدد'),
        status_text,
        NEW.date::TEXT
    );
    
    -- Insert notification for each guardian
    FOR guardian_info IN 
        SELECT g.id, g.whatsapp_number, g.full_name
        FROM guardians g
        JOIN guardian_student_links gsl ON g.id = gsl.guardian_id
        WHERE gsl.student_id = NEW.student_id
        AND g.whatsapp_number IS NOT NULL
        AND g.whatsapp_number != ''
    LOOP
        -- Send WhatsApp notification (this will be handled by the application)
        INSERT INTO notification_reminders (
            tenant_id,
            student_id,
            reminder_type,
            message_content,
            scheduled_date,
            status
        ) VALUES (
            NEW.tenant_id,
            NEW.student_id,
            'attendance_notification',
            notification_message,
            CURRENT_DATE,
            'pending'
        );
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for attendance notifications
DROP TRIGGER IF EXISTS attendance_notification_trigger ON attendance_events;
CREATE TRIGGER attendance_notification_trigger
    AFTER INSERT OR UPDATE ON attendance_events
    FOR EACH ROW
    EXECUTE FUNCTION send_attendance_notification();

-- Create function to check for excessive absences
CREATE OR REPLACE FUNCTION public.check_excessive_absences()
RETURNS TRIGGER AS $$
DECLARE
    consecutive_absences INTEGER;
    monthly_absences INTEGER;
    student_info RECORD;
    guardian_info RECORD;
    alert_message TEXT;
    current_month_start DATE;
    current_month_end DATE;
BEGIN
    -- Only check for absence status
    IF NEW.status != 'absent' THEN
        RETURN NEW;
    END IF;
    
    -- Get student information
    SELECT s.full_name, s.student_id, c.name as class_name
    INTO student_info
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.id = NEW.student_id;
    
    -- Calculate current month boundaries
    current_month_start := date_trunc('month', NEW.date)::DATE;
    current_month_end := (date_trunc('month', NEW.date) + interval '1 month - 1 day')::DATE;
    
    -- Check consecutive absences (last 3 days including today)
    SELECT COUNT(*)
    INTO consecutive_absences
    FROM attendance_events
    WHERE student_id = NEW.student_id
    AND status = 'absent'
    AND date >= NEW.date - interval '2 days'
    AND date <= NEW.date;
    
    -- Check monthly scattered absences
    SELECT COUNT(*)
    INTO monthly_absences
    FROM attendance_events
    WHERE student_id = NEW.student_id
    AND status = 'absent'
    AND date >= current_month_start
    AND date <= current_month_end;
    
    -- Send alert if conditions are met
    IF consecutive_absences >= 2 OR monthly_absences >= 5 THEN
        IF consecutive_absences >= 2 THEN
            alert_message := format('تنبيه هام: الطالب %s (ID: %s) من فصل %s غائب لأيام متتالية (%s أيام)',
                student_info.full_name,
                student_info.student_id,
                COALESCE(student_info.class_name, 'غير محدد'),
                consecutive_absences
            );
        ELSE
            alert_message := format('تنبيه هام: الطالب %s (ID: %s) من فصل %s لديه %s أيام غياب في الشهر الحالي',
                student_info.full_name,
                student_info.student_id,
                COALESCE(student_info.class_name, 'غير محدد'),
                monthly_absences
            );
        END IF;
        
        -- Insert high priority alert
        INSERT INTO notification_reminders (
            tenant_id,
            student_id,
            reminder_type,
            message_content,
            scheduled_date,
            status
        ) VALUES (
            NEW.tenant_id,
            NEW.student_id,
            'excessive_absence_alert',
            alert_message,
            CURRENT_DATE,
            'pending'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for excessive absence checking
DROP TRIGGER IF EXISTS excessive_absence_check_trigger ON attendance_events;
CREATE TRIGGER excessive_absence_check_trigger
    AFTER INSERT OR UPDATE ON attendance_events
    FOR EACH ROW
    EXECUTE FUNCTION check_excessive_absences();