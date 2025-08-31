-- Check if trigger exists on assignments table and create it if missing
DROP TRIGGER IF EXISTS assignment_notification_trigger ON public.assignments;

-- Create trigger for assignment notifications
CREATE TRIGGER assignment_notification_trigger
  AFTER INSERT ON public.assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.send_assignment_notification();