-- Create assignments table
CREATE TABLE public.assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  class_id UUID,
  student_id UUID,
  teacher_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT NOT NULL DEFAULT 'homework', -- homework, task, project
  subject TEXT,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'assigned', -- assigned, submitted, reviewed, completed
  priority TEXT DEFAULT 'medium', -- low, medium, high
  is_group_assignment BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student notes table
CREATE TABLE public.student_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  student_id UUID NOT NULL,
  teacher_id UUID NOT NULL,
  note_type TEXT NOT NULL, -- academic, behavioral, social, health
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  ai_analysis TEXT,
  ai_suggestions TEXT,
  severity TEXT DEFAULT 'low', -- low, medium, high
  is_private BOOLEAN DEFAULT false,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  guardian_notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create assignment submissions table
CREATE TABLE public.assignment_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  assignment_id UUID NOT NULL,
  student_id UUID NOT NULL,
  submission_content TEXT,
  file_urls JSONB,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  grade NUMERIC,
  feedback TEXT,
  status TEXT DEFAULT 'submitted', -- submitted, graded, needs_revision
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notification reminders table
CREATE TABLE public.notification_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID NOT NULL,
  assignment_id UUID,
  student_id UUID NOT NULL,
  reminder_type TEXT NOT NULL, -- assignment_due, follow_up
  scheduled_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  status TEXT DEFAULT 'pending', -- pending, sent, failed
  message_content TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reminders ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Tenant isolation for assignments" 
ON public.assignments 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant isolation for student_notes" 
ON public.student_notes 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant isolation for assignment_submissions" 
ON public.assignment_submissions 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Tenant isolation for notification_reminders" 
ON public.notification_reminders 
FOR ALL 
USING (tenant_id = get_user_tenant_id());

-- Create triggers for updated_at
CREATE TRIGGER update_assignments_updated_at
BEFORE UPDATE ON public.assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_notes_updated_at
BEFORE UPDATE ON public.student_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_assignment_submissions_updated_at
BEFORE UPDATE ON public.assignment_submissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();