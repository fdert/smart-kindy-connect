import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { BookOpen, Heart, Users, Brain, Stethoscope, ArrowLeft, FileText, Star, TrendingUp } from 'lucide-react';
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
  is_private: boolean;
  guardian_notified: boolean;
  notified_at: string | null;
}

interface SkillData {
  id: string;
  skill_name: string;
  skill_category: string;
  level: number;
  assessment_date: string;
  notes: string | null;
  assessed_by: string;
  created_at: string;
}

interface StudentData {
  id: string;
  full_name: string;
  student_id: string;
  photo_url: string | null;
  date_of_birth: string | null;
  gender: string | null;
  class_name?: string;
  tenant_name?: string;
}

export default function StudentNotesDetail() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [developmentSkills, setDevelopmentSkills] = useState<SkillData[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get date filters from URL params
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateRange = {
    from: fromParam ? new Date(fromParam) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: toParam ? new Date(toParam) : new Date()
  };

  const loadNotesData = async () => {
    console.log('=== loadNotesData START ===');
    console.log('Current URL:', window.location.href);
    console.log('StudentId param:', studentId);
    console.log('Guardian param:', searchParams.get('guardian'));
    console.log('Date range:', { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() });
    
    if (!studentId) {
      console.log('No studentId provided');
      setError('معرف الطالب غير متوفر');
      setLoading(false);
      return;
    }

    // Simple UUID validation
    if (studentId.length !== 36 || !studentId.includes('-')) {
      console.log('Invalid studentId format:', studentId);
      setError('معرف الطالب غير صحيح');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isGuardianAccess = searchParams.get('guardian') === 'true';
      console.log('Guardian access:', isGuardianAccess);

      // Direct API call to edge function
      console.log('Calling get-student-notes edge function...');
      
      const functionUrl = `https://ytjodudlnfamvnescumu.supabase.co/functions/v1/get-student-notes`;
      
      const requestBody = {
        studentId: studentId,
        guardian: isGuardianAccess,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      };
      
      console.log('Request URL:', functionUrl);
      console.log('Request body:', requestBody);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Fetch response status:', response.status);
      console.log('Fetch response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Raw response data:', data);

      if (!data || !data.success) {
        console.error('Edge function returned error:', data);
        throw new Error(data?.error || 'فشل في تحميل البيانات');
      }

      const { student, notes: notesData, development_skills: skillsData, metadata } = data.data;
      
      console.log('Data received:', {
        studentName: student?.full_name,
        notesCount: notesData?.length || 0,
        skillsCount: skillsData?.length || 0,
        totalNotesEver: metadata?.totalNotesCount || 0,
        dateRangeNotesCount: metadata?.dateRangeNotesCount || 0
      });

      if (!student) {
        throw new Error('لم يتم العثور على بيانات الطالب');
      }

      setStudentInfo(student);
      setNotes(notesData || []);
      setDevelopmentSkills(skillsData || []);

      console.log('=== Data loading completed successfully ===');
      console.log('Final state - Student:', student.full_name, 'Notes:', notesData?.length || 0, 'Skills:', skillsData?.length || 0);

    } catch (err: any) {
      console.error('=== Error in loadNotesData ===', err);
      const errorMessage = err.message || 'حدث خطأ غير متوقع';
      setError(errorMessage);
      toast({
        title: "خطأ في التحميل",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('=== loadNotesData END ===');
    }
  };

  useEffect(() => {
    console.log('=== useEffect triggered ===');
    const isGuardianAccess = searchParams.get('guardian') === 'true';
    
    if (!studentId) {
      console.log('No studentId, stopping');
      setError('معرف الطالب مفقود');
      setLoading(false);
      return;
    }

    console.log('Loading notes data for studentId:', studentId);
    console.log('Guardian access:', isGuardianAccess);
    
    loadNotesData();
    
  }, [studentId, searchParams.get('guardian')]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              إعادة المحاولة
            </Button>
            <Button onClick={() => window.history.back()} variant="ghost" className="w-full">
              العودة
            </Button>
          </div>
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
        {notes.length === 0 && developmentSkills.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد ملاحظات أو مهارات</h3>
              <p className="text-gray-500">لم يتم تسجيل أي ملاحظات أو مهارات تطوير للطالب في هذه الفترة</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Development Skills Section */}
            {developmentSkills.length > 0 && (
              <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-3">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  مهارات التطوير
                  <Badge className="bg-green-100 text-green-800">
                    {developmentSkills.length}
                  </Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {developmentSkills.map((skill) => (
                    <Card key={skill.id} className="bg-white/90 backdrop-blur-sm">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            {skill.skill_name}
                          </CardTitle>
                          <Badge variant="outline" className="bg-purple-50 text-purple-700">
                            {skill.skill_category}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-5 w-5 ${
                                star <= skill.level
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-2 text-sm font-medium">{skill.level}/5</span>
                        </div>
                        {skill.notes && (
                          <p className="text-gray-600 mb-3 text-sm">{skill.notes}</p>
                        )}
                        <div className="text-xs text-gray-500">
                          تاريخ التقييم: {format(new Date(skill.assessment_date), 'dd MMM yyyy', { locale: ar })}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Notes Section */}
            {notes.length > 0 && Object.entries(groupedNotes).map(([noteType, typeNotes]) => (
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