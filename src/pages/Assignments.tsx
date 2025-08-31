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
import { Checkbox } from "@/components/ui/checkbox";
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

interface AssignmentEvaluation {
  id: string;
  assignment_id: string;
  evaluation_status: 'completed' | 'not_completed';
  evaluation_score?: number;
  teacher_feedback?: string;
  completion_date?: string;
  student_id: string;
}

export default function Assignments() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [evaluations, setEvaluations] = useState<AssignmentEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAIDialogOpen, setIsAIDialogOpen] = useState(false);
  const [isEvaluationDialogOpen, setIsEvaluationDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
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
    student_ids: [] as string[],
    class_id: ""
  });

  // AI form states
  const [aiForm, setAiForm] = useState({
    subject: "",
    grade: "",
    topic: "",
    difficulty: "medium"
  });

  // Evaluation form states
  const [evalForm, setEvalForm] = useState({
    evaluation_status: 'completed' as 'completed' | 'not_completed',
    evaluation_score: '',
    teacher_feedback: '',
    completion_date: format(new Date(), 'yyyy-MM-dd'),
    student_ids: [] as string[]
  });

  useEffect(() => {
    if (tenant?.id) {
      loadAssignments();
      loadStudents();
      loadClasses();
      loadEvaluations();
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

  const loadEvaluations = async () => {
    if (!tenant?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('assignment_evaluations')
        .select('*')
        .eq('tenant_id', tenant.id);

      if (error) throw error;
      
      // Type assertion to ensure evaluation_status matches our interface
      const typedData = (data || []).map(evaluation => ({
        ...evaluation,
        evaluation_status: evaluation.evaluation_status as 'completed' | 'not_completed'
      }));
      
      setEvaluations(typedData);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    }
  };

  const handleCreateEvaluation = async () => {
    if (!tenant?.id || !selectedAssignment || evalForm.student_ids.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طالب واحد على الأقل للتقييم",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Create evaluations for all selected students
      const evaluationsToCreate = evalForm.student_ids.map(studentId => ({
        tenant_id: tenant.id,
        assignment_id: selectedAssignment.id,
        student_id: studentId,
        evaluation_status: evalForm.evaluation_status,
        evaluation_score: evalForm.evaluation_score ? parseFloat(evalForm.evaluation_score) : null,
        teacher_feedback: evalForm.teacher_feedback || null,
        completion_date: evalForm.completion_date || null,
        evaluated_by: user.id
      }));

      const { error } = await supabase
        .from('assignment_evaluations')
        .insert(evaluationsToCreate);

      if (error) throw error;

      // Send WhatsApp notifications for each student
      try {
        for (const studentId of evalForm.student_ids) {
          await supabase.functions.invoke('assignment-notifications', {
            body: {
              processImmediate: true,
              evaluationNotification: true,
              assignmentId: selectedAssignment.id,
              studentId: studentId
            }
          });
        }
      } catch (notificationError) {
        console.error('Error sending evaluation notifications:', notificationError);
      }

      toast({
        title: "تم بنجاح",
        description: `تم حفظ تقييم ${evalForm.student_ids.length} طالب وإرسال الإشعارات لأولياء الأمور`
      });

      setIsEvaluationDialogOpen(false);
      resetEvalForm();
      loadEvaluations();
    } catch (error) {
      console.error('Error creating evaluation:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء التقييم",
        variant: "destructive"
      });
    }
  };

  const resetEvalForm = () => {
    setEvalForm({
      evaluation_status: 'completed',
      evaluation_score: '',
      teacher_feedback: '',
      completion_date: format(new Date(), 'yyyy-MM-dd'),
      student_ids: []
    });
  };

  const openEvaluationDialog = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsEvaluationDialogOpen(true);
  };

  const getEvaluationsForAssignment = (assignmentId: string) => {
    return evaluations.filter(evaluation => evaluation.assignment_id === assignmentId);
  };

  const getStudentEvaluationStatus = (assignmentId: string, studentId: string) => {
    const evaluation = evaluations.find(evaluation => 
      evaluation.assignment_id === assignmentId && evaluation.student_id === studentId
    );
    return evaluation?.evaluation_status;
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

      // Create assignments for each selected student or class
      const assignmentsToCreate = [];

      if (formData.student_ids.length > 0) {
        // Create individual assignments for selected students
        for (const studentId of formData.student_ids) {
          assignmentsToCreate.push({
            title: formData.title,
            description: formData.description,
            assignment_type: formData.assignment_type,
            subject: formData.subject,
            priority: formData.priority,
            is_group_assignment: formData.is_group_assignment,
            tenant_id: tenant.id,
            teacher_id: user.id,
            due_date: format(selectedDate, 'yyyy-MM-dd'),
            student_id: studentId,
            class_id: formData.class_id || null
          });
        }
      } else {
        // Create a general assignment for the class
        assignmentsToCreate.push({
          title: formData.title,
          description: formData.description,
          assignment_type: formData.assignment_type,
          subject: formData.subject,
          priority: formData.priority,
          is_group_assignment: formData.is_group_assignment,
          tenant_id: tenant.id,
          teacher_id: user.id,
          due_date: format(selectedDate, 'yyyy-MM-dd'),
          student_id: null,
          class_id: formData.class_id || null
        });
      }

      const { data: newAssignments, error } = await supabase
        .from('assignments')
        .insert(assignmentsToCreate)
        .select();

      if (error) throw error;

      // Send WhatsApp notifications immediately for each assignment
      try {
        for (const assignment of newAssignments || []) {
          await supabase.functions.invoke('assignment-notifications', {
            body: {
              processImmediate: true,
              assignmentId: assignment.id
            }
          });
        }
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the assignment creation if notifications fail
      }

      toast({
        title: "تم بنجاح",
        description: `تم إنشاء ${assignmentsToCreate.length} واجب وإرسال الإشعارات لأولياء الأمور`
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
      student_ids: [],
      class_id: ""
    });
    setSelectedDate(undefined);
  };

  const handleStudentSelection = (studentId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      student_ids: checked 
        ? [...prev.student_ids, studentId]
        : prev.student_ids.filter(id => id !== studentId)
    }));
  };

  const handleSelectAllStudents = () => {
    const allStudentIds = students.map(student => student.id);
    const isAllSelected = formData.student_ids.length === students.length;
    
    setFormData(prev => ({
      ...prev,
      student_ids: isAllSelected ? [] : allStudentIds
    }));
  };

  const handleEvalStudentSelection = (studentId: string, checked: boolean) => {
    setEvalForm(prev => ({
      ...prev,
      student_ids: checked 
        ? [...prev.student_ids, studentId]
        : prev.student_ids.filter(id => id !== studentId)
    }));
  };

  const handleSelectAllEvalStudents = () => {
    const allStudentIds = students.map(student => student.id);
    const isAllSelected = evalForm.student_ids.length === students.length;
    
    setEvalForm(prev => ({
      ...prev,
      student_ids: isAllSelected ? [] : allStudentIds
    }));
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
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label>الطلاب (اختياري)</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAllStudents}
                    >
                      {formData.student_ids.length === students.length ? "إلغاء تحديد الكل" : "اختيار الكل"}
                    </Button>
                  </div>
                  <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                    {students.length === 0 ? (
                      <p className="text-muted-foreground text-sm">لا توجد طلاب متاحين</p>
                    ) : (
                      <div className="space-y-2">
                        {students.map((student) => (
                          <div key={student.id} className="flex items-center space-x-2 space-x-reverse">
                            <Checkbox
                              id={`student-${student.id}`}
                              checked={formData.student_ids.includes(student.id)}
                              onCheckedChange={(checked) => 
                                handleStudentSelection(student.id, checked as boolean)
                              }
                            />
                            <Label 
                              htmlFor={`student-${student.id}`}
                              className="text-sm cursor-pointer"
                            >
                              {student.full_name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {formData.student_ids.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      تم اختيار {formData.student_ids.length} من {students.length} طالب
                    </p>
                  )}
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
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {assignment.description}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEvaluationDialog(assignment)}
                    >
                      تقييم الطلاب
                    </Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="font-medium">المادة:</span>
                    <p className="text-muted-foreground">{assignment.subject}</p>
                  </div>
                  <div>
                    <span className="font-medium">موعد التسليم:</span>
                    <p className="text-muted-foreground">
                      {format(new Date(assignment.due_date), "PPP", { locale: ar })}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">الحالة:</span>
                    <div className="mt-1">{getStatusBadge(assignment.status)}</div>
                  </div>
                  <div>
                    <span className="font-medium">الأولوية:</span>
                    <div className="mt-1">{getPriorityBadge(assignment.priority)}</div>
                  </div>
                </div>

                {/* Display evaluations for this assignment */}
                {getEvaluationsForAssignment(assignment.id).length > 0 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">تقييمات الطلاب:</h4>
                    <div className="space-y-2">
                      {getEvaluationsForAssignment(assignment.id).map((evaluation) => {
                        const student = students.find(s => s.id === evaluation.student_id);
                        return (
                          <div key={evaluation.id} className="flex items-center justify-between text-sm">
                            <span>{student?.full_name || 'طالب غير معروف'}</span>
                            <div className="flex items-center gap-2">
                              {evaluation.evaluation_status === 'completed' ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800">
                                  مكتمل ✅
                                </Badge>
                              ) : (
                                <Badge variant="destructive">
                                  غير مكتمل ❌
                                </Badge>
                              )}
                              {evaluation.evaluation_score && (
                                <span className="text-muted-foreground">
                                  ({evaluation.evaluation_score})
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
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

      {/* Evaluation Dialog */}
      <Dialog open={isEvaluationDialogOpen} onOpenChange={setIsEvaluationDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>تقييم الواجب: {selectedAssignment?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>الطلاب</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSelectAllEvalStudents}
                >
                  {evalForm.student_ids.length === students.length ? "إلغاء تحديد الكل" : "اختيار الكل"}
                </Button>
              </div>
              <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                {students.length === 0 ? (
                  <p className="text-muted-foreground text-sm">لا توجد طلاب متاحين</p>
                ) : (
                  <div className="space-y-2">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center space-x-2 space-x-reverse">
                        <Checkbox
                          id={`eval-student-${student.id}`}
                          checked={evalForm.student_ids.includes(student.id)}
                          onCheckedChange={(checked) => 
                            handleEvalStudentSelection(student.id, checked as boolean)
                          }
                        />
                        <Label 
                          htmlFor={`eval-student-${student.id}`}
                          className="text-sm cursor-pointer"
                        >
                          {student.full_name} ({student.student_id})
                        </Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {evalForm.student_ids.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  تم اختيار {evalForm.student_ids.length} من {students.length} طالب
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="eval-status">حالة الإنجاز</Label>
              <Select 
                value={evalForm.evaluation_status}
                onValueChange={(value: 'completed' | 'not_completed') => 
                  setEvalForm(prev => ({ ...prev, evaluation_status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر حالة الإنجاز" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">مكتمل ✅</SelectItem>
                  <SelectItem value="not_completed">غير مكتمل ❌</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="eval-score">النتيجة (اختياري)</Label>
              <Input
                id="eval-score"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={evalForm.evaluation_score}
                onChange={(e) => setEvalForm(prev => ({ ...prev, evaluation_score: e.target.value }))}
                placeholder="أدخل النتيجة من 100"
              />
            </div>

            <div>
              <Label htmlFor="eval-date">تاريخ الإكمال</Label>
              <Input
                id="eval-date"
                type="date"
                value={evalForm.completion_date}
                onChange={(e) => setEvalForm(prev => ({ ...prev, completion_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="eval-feedback">ملاحظات المعلمة</Label>
              <Textarea
                id="eval-feedback"
                value={evalForm.teacher_feedback}
                onChange={(e) => setEvalForm(prev => ({ ...prev, teacher_feedback: e.target.value }))}
                placeholder="أدخل ملاحظاتك على أداء الطالب"
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => setIsEvaluationDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button onClick={handleCreateEvaluation}>
                حفظ التقييم وإرسال الإشعار
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}