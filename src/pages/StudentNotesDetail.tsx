import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BookOpen, Heart, Users, Brain, Stethoscope, ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface NoteData {
  id: string;
  title: string;
  content: string;
  note_type: string;
  severity: string;
  created_at: string;
  follow_up_required: boolean;
  follow_up_date: string | null;
  teacher_id: string;
  ai_analysis: string | null;
  ai_suggestions: string | null;
}

export default function StudentNotesDetail() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { tenant } = useTenant();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get date filters from URL params
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateRange = {
    from: fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: toParam ? new Date(toParam) : new Date()
  };

  useEffect(() => {
    // Check if this is guardian access or regular authenticated access
    const isGuardianAccess = searchParams.get('guardian') === 'true';
    
    if (isGuardianAccess) {
      // For guardian access, we only need studentId
      if (studentId) {
        loadData();
      }
    } else {
      // For regular access, we need both tenant and studentId
      if (tenant && studentId) {
        loadData();
      }
    }
  }, [tenant, studentId, searchParams]);

  const loadData = async () => {
    if (!studentId) {
      console.error('No studentId provided');
      return;
    }

    // تحقق من صحة UUID
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
      console.error('Invalid studentId format:', studentId);
      toast({
        title: "خطأ في الرابط",
        description: "معرف الطالب غير صحيح",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      console.log('Loading notes for student:', studentId);
      
      // Check if this is a guardian access (public access)
      const isGuardianAccess = searchParams.get('guardian') === 'true';
      let tenantId: string;

      console.log('Guardian access mode:', isGuardianAccess);
      console.log('Date range:', dateRange);

      if (isGuardianAccess) {
        // For guardian access, we don't need tenant verification
        console.log('Guardian access mode - loading notes for student:', studentId);
        
        // Load student basic info without tenant restriction for guardian access
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            id,
            full_name,
            student_id,
            photo_url,
            tenant_id,
            classes (name)
          `)
          .eq('id', studentId)
          .single();

        if (studentError) {
          console.error('Student data error:', studentError);
          throw new Error('لم يتم العثور على بيانات الطالب');
        }

        console.log('Student data loaded:', studentData);
        setStudentInfo(studentData);
        tenantId = studentData.tenant_id;
        
      } else {
        // Regular authenticated access - require tenant
        if (!tenant?.id) {
          throw new Error('معرف الروضة غير صحيح');
        }

        // Load student info with tenant verification
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('full_name, student_id, photo_url, classes(name)')
          .eq('id', studentId)
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        if (studentError) throw studentError;
        setStudentInfo(studentData);
        tenantId = tenant.id;
      }

      console.log('Using tenant ID:', tenantId);

      // Load notes with exact same query as in StudentReport (only non-private ones)
      const { data: notesData, error: notesError } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .eq('is_private', false)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      if (notesError) {
        console.error('Notes error:', notesError);
        throw notesError;
      }

      console.log('Notes loaded:', notesData?.length || 0, 'records');
      setNotes(notesData || []);

    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return <BookOpen className="h-5 w-5" />;
      case 'behavioral': return <Heart className="h-5 w-5" />;
      case 'health': return <Stethoscope className="h-5 w-5" />;
      case 'social': return <Users className="h-5 w-5" />;
      default: return <Brain className="h-5 w-5" />;
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-100 text-blue-800';
      case 'behavioral': return 'bg-purple-100 text-purple-800';
      case 'health': return 'bg-red-100 text-red-800';
      case 'social': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getNoteTypeText = (type: string) => {
    switch (type) {
      case 'academic': return 'أكاديمية';
      case 'behavioral': return 'سلوكية';
      case 'health': return 'صحية';
      case 'social': return 'اجتماعية';
      default: return 'عامة';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'high': return 'عالية';
      case 'medium': return 'متوسطة';
      case 'low': return 'منخفضة';
      default: return 'غير محدد';
    }
  };

  const groupedNotes = notes.reduce((acc, note) => {
    if (!acc[note.note_type]) {
      acc[note.note_type] = [];
    }
    acc[note.note_type].push(note);
    return acc;
  }, {} as Record<string, NoteData[]>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '?guardian=true' : '';
              navigate(`/student-report/${studentId}${guardianParam}`);
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للتقرير
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              ملاحظات الطالب: {studentInfo?.full_name}
            </h1>
            <p className="text-gray-600">
              الفترة: {format(dateRange.from, 'dd MMM yyyy', { locale: ar })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{notes.filter(n => n.note_type === 'academic').length}</p>
                <p className="text-sm opacity-90">أكاديمية</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{notes.filter(n => n.note_type === 'behavioral').length}</p>
                <p className="text-sm opacity-90">سلوكية</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{notes.filter(n => n.note_type === 'social').length}</p>
                <p className="text-sm opacity-90">اجتماعية</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{notes.filter(n => n.note_type === 'health').length}</p>
                <p className="text-sm opacity-90">صحية</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes by Category */}
        {notes.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد ملاحظات</h3>
              <p className="text-gray-500">لم يتم تسجيل أي ملاحظات للطالب في هذه الفترة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedNotes).map(([noteType, typeNotes]) => (
              <div key={noteType}>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  {getNoteTypeIcon(noteType)}
                  الملاحظات {getNoteTypeText(noteType)}
                  <Badge className={getNoteTypeColor(noteType)}>
                    {typeNotes.length}
                  </Badge>
                </h2>
                <div className="space-y-4">
                  {typeNotes.map((note) => (
                    <Card key={note.id} className="bg-white/90 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            {getNoteTypeIcon(note.note_type)}
                            {note.title}
                          </CardTitle>
                          <div className="flex gap-2">
                            <Badge className={getNoteTypeColor(note.note_type)}>
                              {getNoteTypeText(note.note_type)}
                            </Badge>
                            <Badge className={getSeverityColor(note.severity)}>
                              {getSeverityText(note.severity)}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-800 mb-4 leading-relaxed">{note.content}</p>
                        
                        {note.ai_analysis && (
                          <div className="bg-blue-50 p-4 rounded-lg mb-4">
                            <h4 className="font-semibold text-blue-800 mb-2">التحليل التلقائي:</h4>
                            <p className="text-blue-700 text-sm">{note.ai_analysis}</p>
                          </div>
                        )}

                        {note.ai_suggestions && (
                          <div className="bg-green-50 p-4 rounded-lg mb-4">
                            <h4 className="font-semibold text-green-800 mb-2">الاقتراحات:</h4>
                            <p className="text-green-700 text-sm">{note.ai_suggestions}</p>
                          </div>
                        )}

                        {note.follow_up_required && (
                          <div className="bg-yellow-50 p-3 rounded-lg mb-4">
                            <h4 className="font-semibold text-yellow-800 mb-1">متابعة مطلوبة</h4>
                            {note.follow_up_date && (
                              <p className="text-yellow-700 text-sm">
                                موعد المتابعة: {format(new Date(note.follow_up_date), 'dd MMM yyyy', { locale: ar })}
                              </p>
                            )}
                          </div>
                        )}

                        <div className="flex justify-between items-center text-xs text-gray-500 border-t pt-3">
                          <span>{format(new Date(note.created_at), 'dd MMM yyyy - HH:mm', { locale: ar })}</span>
                          <span>ملاحظة {getNoteTypeText(note.note_type).toLowerCase()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}