import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { CalendarIcon, Plus, FileText, Brain, AlertTriangle, Users, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTenant } from "@/hooks/useTenant";

interface StudentNote {
  id: string;
  student_id: string;
  title: string;
  content: string;
  note_type: string;
  ai_analysis?: string;
  ai_suggestions?: string;
  severity: string;
  is_private: boolean;
  follow_up_required: boolean;
  follow_up_date?: string;
  guardian_notified: boolean;
  notified_at?: string;
  created_at: string;
  student?: {
    full_name: string;
    student_id: string;
  } | null;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
}

export default function StudentNotes() {
  const [notes, setNotes] = useState<StudentNote[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<StudentNote | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const { toast } = useToast();
  const { tenant } = useTenant();

  // Form states
  const [formData, setFormData] = useState({
    student_id: "",
    title: "",
    content: "",
    note_type: "academic",
    severity: "low",
    is_private: false,
    follow_up_required: false
  });

  useEffect(() => {
    if (tenant?.id) {
      loadNotes();
      loadStudents();
    }
  }, [tenant]);

  const loadNotes = async () => {
    if (!tenant?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_notes')
        .select(`
          *,
          students (
            full_name,
            student_id
          )
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to match interface  
      const transformedData: StudentNote[] = (data || []).map((note: any) => ({
        ...note,
        student: note.students
      }));
      
      setNotes(transformedData);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast({
        title: "خطأ",
        description: "فشل في تحميل الملاحظات",
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

  const handleCreateNote = async () => {
    console.log('Starting note creation...', { tenant, formData });
    
    if (!tenant?.id || !formData.student_id || !formData.title || !formData.content) {
      console.log('Validation failed:', { tenant_id: tenant?.id, student_id: formData.student_id, title: formData.title, content: formData.content });
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
      
      console.log('User authenticated:', user.id);

      // First, get AI analysis
      let aiAnalysis = '';
      let aiSuggestions = '';

      try {
        console.log('Calling AI analysis...');
        const { data: aiData, error: aiError } = await supabase.functions.invoke('assignments-ai', {
          body: {
            action: 'analyze_note',
            noteContent: formData.content,
            noteType: formData.note_type
          }
        });

        if (!aiError && aiData) {
          aiAnalysis = aiData.analysis;
          aiSuggestions = aiData.suggestions;
          console.log('AI analysis successful');
        }
      } catch (aiError) {
        console.log('AI analysis failed, continuing without it:', aiError);
      }

      const noteData = {
        ...formData,
        tenant_id: tenant.id,
        teacher_id: user.id,
        ai_analysis: aiAnalysis,
        ai_suggestions: aiSuggestions,
        follow_up_date: formData.follow_up_required && selectedDate ? 
          format(selectedDate, 'yyyy-MM-dd') : null
      };

      console.log('Inserting note data:', noteData);

      const { data: newNote, error } = await supabase
        .from('student_notes')
        .insert([noteData])
        .select()
        .single();

      if (error) {
        console.error('Database insert error:', error);
        throw error;
      }

      console.log('Note created successfully:', newNote);

      // Send WhatsApp notifications immediately
      try {
        console.log('Triggering WhatsApp notifications...');
        await supabase.functions.invoke('student-note-notifications', {
          body: {
            processImmediate: true,
            noteId: newNote.id,
            type: 'student_note'
          }
        });
        console.log('WhatsApp notifications triggered');
      } catch (notificationError) {
        console.error('Error sending notifications:', notificationError);
        // Don't fail the note creation if notifications fail
      }

      toast({
        title: "تم بنجاح",
        description: "تم إنشاء الملاحظة وإرسال الإشعارات لأولياء الأمور"
      });

      setIsCreateDialogOpen(false);
      resetForm();
      loadNotes();
    } catch (error) {
      console.error('Error creating note:', error);
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الملاحظة",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: "",
      title: "",
      content: "",
      note_type: "academic",
      severity: "low",
      is_private: false,
      follow_up_required: false
    });
    setSelectedDate(undefined);
  };

  const getNoteTypeBadge = (type: string) => {
    const typeConfig = {
      academic: { label: "أكاديمي", variant: "default" as const, icon: FileText },
      behavioral: { label: "سلوكي", variant: "secondary" as const, icon: Users },
      social: { label: "اجتماعي", variant: "outline" as const, icon: MessageSquare },
      health: { label: "صحي", variant: "destructive" as const, icon: AlertTriangle }
    };
    
    const config = typeConfig[type as keyof typeof typeConfig] || typeConfig.academic;
    const IconComponent = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { label: "منخفضة", variant: "outline" as const },
      medium: { label: "متوسطة", variant: "secondary" as const },
      high: { label: "عالية", variant: "destructive" as const }
    };
    
    const config = severityConfig[severity as keyof typeof severityConfig] || severityConfig.low;
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
        <h1 className="text-3xl font-bold">ملاحظات الطلاب</h1>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              إضافة ملاحظة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إنشاء ملاحظة جديدة</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="student_id">الطالب</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name} ({student.student_id})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="note_type">نوع الملاحظة</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, note_type: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">أكاديمي</SelectItem>
                    <SelectItem value="behavioral">سلوكي</SelectItem>
                    <SelectItem value="social">اجتماعي</SelectItem>
                    <SelectItem value="health">صحي</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="title">عنوان الملاحظة</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="أدخل عنوان الملاحظة"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="content">محتوى الملاحظة</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="أدخل تفاصيل الملاحظة"
                  rows={4}
                />
              </div>
              <div>
                <Label htmlFor="severity">مستوى الأهمية</Label>
                <Select onValueChange={(value) => setFormData(prev => ({ ...prev, severity: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر مستوى الأهمية" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">منخفضة</SelectItem>
                    <SelectItem value="medium">متوسطة</SelectItem>
                    <SelectItem value="high">عالية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="is_private"
                  checked={formData.is_private}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_private: checked }))}
                />
                <Label htmlFor="is_private">ملاحظة خاصة</Label>
              </div>
              <div className="flex items-center space-x-2 space-x-reverse">
                <Switch
                  id="follow_up_required"
                  checked={formData.follow_up_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, follow_up_required: checked }))}
                />
                <Label htmlFor="follow_up_required">تحتاج متابعة</Label>
              </div>
              {formData.follow_up_required && (
                <div>
                  <Label>تاريخ المتابعة</Label>
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
              )}
            </div>
            <div className="flex justify-end space-x-2 space-x-reverse mt-6">
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                إلغاء
              </Button>
              <Button onClick={handleCreateNote}>
                إنشاء الملاحظة
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {notes.map((note) => (
          <Card key={note.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{note.title}</CardTitle>
                <div className="flex gap-2 flex-wrap">
                  {getNoteTypeBadge(note.note_type)}
                  {getSeverityBadge(note.severity)}
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {note.student?.full_name} ({note.student?.student_id})
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {note.content}
                </p>
                
                {note.ai_analysis && (
                  <div className="bg-secondary/20 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">تحليل الذكاء الاصطناعي</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{note.ai_analysis}</p>
                  </div>
                )}
                
                {note.ai_suggestions && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-800">اقتراحات</span>
                    </div>
                    <p className="text-xs text-green-700">{note.ai_suggestions}</p>
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{format(new Date(note.created_at), "dd/MM/yyyy")}</span>
                  <div className="flex gap-2">
                    {note.is_private && (
                      <Badge variant="outline" className="text-xs">خاص</Badge>
                    )}
                    {note.follow_up_required && (
                      <Badge variant="outline" className="text-xs">يحتاج متابعة</Badge>
                    )}
                    {note.guardian_notified && (
                      <Badge variant="secondary" className="text-xs">تم إشعار الولي</Badge>
                    )}
                  </div>
                </div>
                
                {note.follow_up_date && (
                  <div className="text-xs text-muted-foreground">
                    تاريخ المتابعة: {format(new Date(note.follow_up_date), "dd/MM/yyyy")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        
        {notes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">لا توجد ملاحظات</h3>
            <p className="text-muted-foreground mb-4">ابدأ بإضافة ملاحظة جديدة للطلاب</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  إضافة ملاحظة جديدة
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}