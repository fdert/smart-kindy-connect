-- Create trigger for student note notifications
CREATE TRIGGER student_note_notification_trigger
  AFTER INSERT ON public.student_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.send_student_note_notification();