import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Plus, Clock, BookOpen, Users, Brain } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

interface Assignment {
  id: string;
  title: string;
  description: string;
  assignment_type: string;
  subject: string;
  due_date: string;
  status: string;
  priority: string;
  is_group_assignment: boolean;
  student_id?: string;
  class_id?: string;
  created_at: string;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
}

interface Class {
  id: string;
  name: string;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { toast } = useToast();
  const { tenant } = useTenant();

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignment_type: "homework",
    subject: "",
    priority: "medium",
    is_group_assignment: false,
    student_id: "",
    class_id: ""
  });

  // AI form states
  const [aiForm, setAiForm] = useState({
    subject: "",
    grade: "",
    topic: "",
    difficulty: "medium"
  });

  useEffect(() => {
    if (tenant?.id) {
      loadAssignments();
      loadStudents();
      loadClasses();
    }
  }, [tenant]);

  const loadAssignments = async () => {
    if (!tenant?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error loading assignments:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الواجبات",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadStudents = async () => {
    if (!tenant?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, student_id')
        .eq('tenant_id', tenant.id);

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadClasses = async () => {
    if (!tenant?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('tenant_id', tenant.id);

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleCreateAssignment = async () => {
    if (!tenant?.id || !formData.title || !selectedDate) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const assignmentData = {
        ...formData,
        tenant_id: tenant.id,
        teacher_id: user.id,
        due_date: format(selectedDate, 'yyyy-MM-dd'),
        student_id: formData.student_id || null,
        class_id: formData.class_id || null
      };

      const { data: newAssignment, error } = await supabase
        .from('assignments')
        .insert([assignmentData])
        .select()
        .single();

      if (error) throw error;

      // Send WhatsApp notifications immediately
      try {
        await supabase.functions.invoke('assignment-notifications', {
          body: {
            processImmediate: true,
            assignmentId: newAssignment.id
          }
        });
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the assignment creation if notifications fail
      }

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الواجب وإرسال الإشعارات لأولياء الأمور"
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadAssignments();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الواجب",
        variant: "destructive"
      });
    }
  };

  const generateAIAssignment = async () => {
    if (!aiForm.subject || !aiForm.topic) {
      toast({
        title: "خطأ",
        description: "يرجى ملء الموضوع والمادة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('assignments-ai', {
        body: {
          action: 'generate_assignment',
          ...aiForm
        }
      });

      if (error) throw error;

      setFormData(prev => ({
        ...prev,
        title: `واجب في ${aiForm.subject} - ${aiForm.topic}`,
        description: data.assignment,
        subject: aiForm.subject,
        assignment_type: aiForm.difficulty === 'hard' ? 'project' : 'homework'
      }));

      setIsAIDialogOpen(false);
      setIsCreateDialogOpen(true);

      toast({
        title: "تم بنجاح",
        description: "تم توليد الواجب بالذكاء الاصطناعي"
      });
    } catch (error) {
      console.error('Error generating AI assignment:', error);
      toast({
        title: "خطأ",
        description: "فشل في توليد الواجب",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      assignment_type: "homework",
      subject: "",
      priority: "medium",
      is_group_assignment: false,
      student_id: "",
      class_id: ""
    });
    setSelectedDate(undefined);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      assigned: { label: "مُكلف", variant: "default" as const },
      submitted: { label: "مُسلم", variant: "secondary" as const },
      reviewed: { label: "مُراجع", variant: "outline" as const },
      completed: { label: "مكتمل", variant: "secondary" as const }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.assigned;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      low: { label: "منخفضة", variant: "outline" as const },
      medium: { label: "متوسطة", variant: "secondary" as const },
      high: { label: "عالية", variant: "destructive" as const }
    };
    
    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">جاري التحميل...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6" dir="rtl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">إدارة الواجبات</h1>
        <div className="space-x-2 space-x-reverse">
          <Dialog open={isAIDialogOpen} onOpenChange={setIsAIDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Brain className="w-4 h-4 mr-2" />
                توليد بالذكاء الاصطناعي
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>توليد واجب بالذكاء الاصطناعي</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="ai-subject">المادة</Label>
                  <Select onValueChange={(value) => setAiForm(prev => ({ ...prev, subject: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="رياضيات">رياضيات</SelectItem>
                      <SelectItem value="علوم">علوم</SelectItem>
                      <SelectItem value="لغة عربية">لغة عربية</SelectItem>
                      <SelectItem value="انجليزي">انجليزي</SelectItem>
                      <SelectItem value="تاريخ">تاريخ</SelectItem>
                      <SelectItem value="جغرافيا">جغرافيا</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="ai-grade">الصف</Label>
                  <Input
                    id="ai-grade"
                    value={aiForm.grade}
                    onChange={(e) => setAiForm(prev => ({ ...prev, grade: e.target.value }))}
                    placeholder="مثال: الصف السادس"
                  />
                </div>
                <div>
                  <Label htmlFor="ai-topic">الموضوع</Label>
                  <Input
                    id="ai-topic"
                    value={aiForm.topic}
                    onChange={(e) => setAiForm(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="مثال: الكسور"
                  />
                </div>
                <div>
                  <Label htmlFor="ai-difficulty">مستوى الصعوبة</Label>
                  <Select onValueChange={(value) => setAiForm(prev => ({ ...prev, difficulty: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر مستوى الصعوبة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">سهل</SelectItem>
                      <SelectItem value="medium">متوسط</SelectItem>
                      <SelectItem value="hard">صعب</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={generateAIAssignment} className="w-full">
                  توليد الواجب
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                إضافة واجب جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء واجب جديد</DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="title">عنوان الواجب</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="أدخل عنوان الواجب"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="أدخل وصف الواجب"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="assignment_type">نوع الواجب</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, assignment_type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع الواجب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="homework">واجب منزلي</SelectItem>
                      <SelectItem value="task">مهمة</SelectItem>
                      <SelectItem value="project">مشروع</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="subject">المادة</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="أدخل اسم المادة"
                  />
                </div>
                <div>
                  <Label htmlFor="priority">الأولوية</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الأولوية" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">منخفضة</SelectItem>
                      <SelectItem value="medium">متوسطة</SelectItem>
                      <SelectItem value="high">عالية</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>تاريخ التسليم</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP", { locale: ar }) : "اختر التاريخ"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        locale={ar}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="class_id">الصف (اختياري)</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="student_id">الطالب (اختياري)</Label>
                  <Select onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 space-x-reverse mt-6">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={handleCreateAssignment}>
                  إنشاء الواجب
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {assignments.map((assignment) => (
          <Card key={assignment.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{assignment.title}</CardTitle>
                <div className="flex gap-2">
                  {getStatusBadge(assignment.status)}
                  {getPriorityBadge(assignment.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {assignment.description}
                </p>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{assignment.subject}</span>
                  </div>
                  {assignment.is_group_assignment && (
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>جماعي</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>تاريخ التسليم: {format(new Date(assignment.due_date), "dd/MM/yyyy")}</span>
                </div>
                
                <Badge variant="outline" className="w-fit">
                  {assignment.assignment_type === 'homework' ? 'واجب منزلي' : 
                   assignment.assignment_type === 'task' ? 'مهمة' : 'مشروع'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {assignments.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد واجبات</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإنشاء واجب جديد للطلاب</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة واجب جديد
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}