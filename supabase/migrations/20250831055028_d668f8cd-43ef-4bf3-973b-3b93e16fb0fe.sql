-- Create function to send student note notifications
CREATE OR REPLACE FUNCTION public.send_student_note_notification()
RETURNS TRIGGER AS $$
DECLARE
    student_info RECORD;
    guardian_info RECORD;
    notification_message TEXT;
    note_type_text TEXT;
    severity_text TEXT;
    follow_up_text TEXT;
BEGIN
    -- Get student information
    SELECT s.full_name, s.student_id, c.name as class_name
    INTO student_info
    FROM students s
    LEFT JOIN classes c ON s.class_id = c.id
    WHERE s.id = NEW.student_id;
    
    -- Get note type text in Arabic
    CASE NEW.note_type
        WHEN 'academic' THEN note_type_text := 'أكاديمية';
        WHEN 'behavioral' THEN note_type_text := 'سلوكية';
        WHEN 'health' THEN note_type_text := 'صحية';
        WHEN 'social' THEN note_type_text := 'اجتماعية';
        ELSE note_type_text := NEW.note_type;
    END CASE;
    
    -- Get severity text in Arabic
    CASE NEW.severity
        WHEN 'high' THEN severity_text := 'عالية';
        WHEN 'medium' THEN severity_text := 'متوسطة';
        WHEN 'low' THEN severity_text := 'منخفضة';
        ELSE severity_text := NEW.severity;
    END CASE;
    
    -- Follow up text
    IF NEW.follow_up_required THEN
        follow_up_text := format('⚠️ تتطلب هذه الملاحظة متابعة في تاريخ: %s', 
            COALESCE(to_char(NEW.follow_up_date, 'DD/MM/YYYY'), 'غير محدد'));
    ELSE
        follow_up_text := '';
    END IF;
    
    -- Prepare notification message (only if not private)
    IF NEW.is_private = false THEN
        notification_message := format('📝 ملاحظة جديدة عن طفلكم

الطالب: %s (%s)
الفصل: %s
نوع الملاحظة: %s
مستوى الأهمية: %s

العنوان: %s

المحتوى: %s

%s

يرجى مراجعة المعلمة للمزيد من التفاصيل.',
            student_info.full_name,
            student_info.student_id,
            COALESCE(student_info.class_name, 'غير محدد'),
            note_type_text,
            severity_text,
            NEW.title,
            NEW.content,
            follow_up_text
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
            -- Send WhatsApp notification
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
                'student_note_notification',
                notification_message,
                CURRENT_DATE,
                'pending'
            );
        END LOOP;
        
        -- If follow-up is required, schedule reminder
        IF NEW.follow_up_required = true AND NEW.follow_up_date IS NOT NULL THEN
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
                'follow_up_reminder',
                format('📅 تذكير متابعة

الطالب: %s (%s)
الملاحظة: %s

هذه ملاحظة تتطلب متابعة اليوم. يرجى التواصل مع المعلمة.',
                    student_info.full_name,
                    student_info.student_id,
                    NEW.title
                ),
                NEW.follow_up_date,
                'pending'
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for student note notifications
DROP TRIGGER IF EXISTS student_note_notification_trigger ON student_notes;
CREATE TRIGGER student_note_notification_trigger
    AFTER INSERT ON student_notes
    FOR EACH ROW
    EXECUTE FUNCTION send_student_note_notification();