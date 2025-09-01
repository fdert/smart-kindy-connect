import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { 
  AlertCircle,
  BookOpen, 
  Users, 
  Heart, 
  Brain,
  Camera,
  TrendingUp,
  Award,
  Clock,
  CheckCircle,
  Activity,
  Stethoscope,
  UserCheck,
  Download,
  Share2,
  Star
} from 'lucide-react';

interface StudentReportData {
  student: {
    id: string;
    full_name: string;
    student_id: string;
    photo_url: string | null;
    date_of_birth: string;
    gender: string;
    class_name?: string;
    tenant_name?: string;
  };
  assignments: {
    total: number;
    completed: number;
    pending: number;
    score_average: number;
  };
  attendance: {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    attendance_rate: number;
  };
  rewards: Array<{
    id: string;
    title: string;
    type: string;
    points: number;
    awarded_at: string;
  }>;
  notes: Array<{
    id: string;
    title: string;
    content: string;
    note_type: string;
    severity: string;
    created_at: string;
  }>;
  health_checks: Array<{
    id: string;
    check_date: string;
    temperature?: number;
    weight?: number;
    height?: number;
    notes?: string;
  }>;
  media: Array<{
    id: string;
    file_name: string;
    file_path: string;
    caption?: string;
    album_date: string;
  }>;
  development_skills: Array<{
    id: string;
    skill_name: string;
    skill_category: string;
    level: number;
    assessment_date: string;
    notes?: string;
  }>;
}

export default function StudentReport() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const { tenant } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    const isGuardianAccess = searchParams.get('guardian') === 'true';
    
    if (isGuardianAccess) {
      if (studentId) {
        loadReportData();
      }
    } else {
      if (tenant && studentId) {
        loadReportData();
      }
    }
  }, [tenant, studentId, dateRange, searchParams]);

  const loadReportData = async () => {
    if (!studentId) return;

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
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
      const isGuardianAccess = searchParams.get('guardian') === 'true';
      
      if (isGuardianAccess) {
        // Load student basic info without tenant restriction for guardian access
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            id,
            full_name,
            student_id,
            photo_url,
            date_of_birth,
            gender,
            tenant_id,
            classes (name),
            tenants (name)
          `)
          .eq('id', studentId)
          .single();

        if (studentError) {
          throw new Error('لم يتم العثور على بيانات الطالب');
        }

        const studentTenantId = studentData.tenant_id;
        await loadStudentReportData(studentId, studentTenantId, studentData);
        
      } else {
        if (!tenant?.id) {
          throw new Error('معرف الروضة غير صحيح');
        }

        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            id,
            full_name,
            student_id,
            photo_url,
            date_of_birth,
            gender,
            classes (name)
          `)
          .eq('id', studentId)
          .eq('tenant_id', tenant.id)
          .single();

        if (studentError) throw studentError;
        
        if (!studentData || studentData.id !== studentId) {
          throw new Error('لا يمكن العثور على بيانات الطالب أو ليس لديك صلاحية للوصول');
        }

        await loadStudentReportData(studentId, tenant.id, studentData);
      }

    } catch (error: any) {
      console.error('Error loading report data:', error);
      toast({
        title: "خطأ في التحميل",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentReportData = async (studentId: string, tenantId: string, studentData: any) => {
    try {
      // Load assignments data
      const { data: assignmentsData } = await supabase
        .from('assignment_evaluations')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('evaluated_at', dateRange.from.toISOString())
        .lte('evaluated_at', dateRange.to.toISOString());

      const assignmentStats = {
        total: assignmentsData?.length || 0,
        completed: assignmentsData?.filter(a => a.evaluation_status === 'completed').length || 0,
        pending: assignmentsData?.filter(a => a.evaluation_status === 'not_completed').length || 0,
        score_average: assignmentsData?.length ? 
          assignmentsData.reduce((sum, a) => sum + (a.evaluation_score || 0), 0) / assignmentsData.length : 0
      };

      // Load attendance data
      const { data: attendanceData } = await supabase
        .from('attendance_events')
        .select('status, date')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'));

      const attendanceStats = {
        total_days: attendanceData?.length || 0,
        present_days: attendanceData?.filter(a => a.status === 'present').length || 0,
        absent_days: attendanceData?.filter(a => a.status === 'absent').length || 0,
        late_days: attendanceData?.filter(a => a.status === 'late').length || 0,
        attendance_rate: attendanceData?.length ? 
          (attendanceData.filter(a => a.status === 'present').length / attendanceData.length) * 100 : 0
      };

      // Load rewards
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('awarded_at', dateRange.from.toISOString())
        .lte('awarded_at', dateRange.to.toISOString())
        .order('awarded_at', { ascending: false });

      // Load student notes
      const { data: notesData } = await supabase
        .from('student_notes')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('created_at', dateRange.from.toISOString())
        .lte('created_at', dateRange.to.toISOString())
        .order('created_at', { ascending: false });

      // Load health checks
      const { data: healthData } = await supabase
        .from('health_checks')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('check_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('check_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('check_date', { ascending: false });

      // Load media
      const { data: mediaLinks } = await supabase
        .from('media_student_links')
        .select(`
          media!inner (
            id,
            file_name,
            file_path,
            caption,
            album_date,
            tenant_id
          )
        `)
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId);

      const mediaFiles = mediaLinks
        ?.map(m => m.media)
        .filter(Boolean)
        .filter(media => {
          if (media.tenant_id !== tenantId) return false;
          const albumDate = new Date(media.album_date);
          return albumDate >= dateRange.from && albumDate <= dateRange.to;
        }) || [];

      // Load development skills
      const { data: skillsData } = await supabase
        .from('development_skills')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('assessment_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('assessment_date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('assessment_date', { ascending: false });

      setReportData({
        student: {
          ...studentData,
          class_name: studentData.classes?.name,
          tenant_name: studentData.tenants?.name
        },
        assignments: assignmentStats,
        attendance: attendanceStats,
        rewards: rewardsData || [],
        notes: notesData || [],
        health_checks: healthData || [],
        media: mediaFiles,
        development_skills: skillsData || []
      });
    } catch (error: any) {
      console.error('Error loading student report data:', error);
      throw error;
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'academic': return <BookOpen className="h-4 w-4" />;
      case 'behavioral': return <Heart className="h-4 w-4" />;
      case 'health': return <Stethoscope className="h-4 w-4" />;
      case 'social': return <Users className="h-4 w-4" />;
      default: return <Brain className="h-4 w-4" />;
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

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-500';
      case 'behavioral': return 'bg-green-500';
      case 'participation': return 'bg-purple-500';
      case 'creativity': return 'bg-pink-500';
      case 'leadership': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل التقرير...</p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">لم يتم العثور على بيانات الطالب</h2>
          <p className="text-gray-600">يرجى التأكد من صحة الرابط والمحاولة مرة أخرى</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Student Info */}
        <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white rounded-t-lg">
            <div className="flex items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-white">
                <AvatarImage src={reportData.student.photo_url || undefined} />
                <AvatarFallback className="text-2xl bg-white text-primary">
                  {reportData.student.full_name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-2">{reportData.student.full_name}</h1>
                <div className="flex flex-wrap gap-4 text-sm opacity-90">
                  <span>رقم الطالب: {reportData.student.student_id}</span>
                  <span>العمر: {calculateAge(reportData.student.date_of_birth)} سنوات</span>
                  {reportData.student.class_name && <span>الفصل: {reportData.student.class_name}</span>}
                  <span>الجنس: {reportData.student.gender === 'male' ? 'ذكر' : 'أنثى'}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  تحميل PDF
                </Button>
                <Button variant="secondary" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  مشاركة
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">الواجبات المنجزة</p>
                  <p className="text-3xl font-bold">{reportData.assignments.completed}/{reportData.assignments.total}</p>
                  <p className="text-blue-100 text-sm">
                    متوسط الدرجات: {reportData.assignments.score_average.toFixed(1)}
                  </p>
                </div>
                <CheckCircle className="h-10 w-10 text-blue-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">نسبة الحضور</p>
                  <p className="text-3xl font-bold">{reportData.attendance.attendance_rate.toFixed(1)}%</p>
                  <p className="text-green-100 text-sm">
                    {reportData.attendance.present_days} من أصل {reportData.attendance.total_days} يوم
                  </p>
                </div>
                <Clock className="h-10 w-10 text-green-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">إجمالي النقاط</p>
                  <p className="text-3xl font-bold">
                    {reportData.rewards.reduce((total, reward) => total + reward.points, 0)}
                  </p>
                  <p className="text-purple-100 text-sm">
                    من {reportData.rewards.length} إنجاز
                  </p>
                </div>
                <Award className="h-10 w-10 text-purple-100" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm font-medium">التقدم الإجمالي</p>
                  <p className="text-3xl font-bold">
                    {((reportData.assignments.completed / (reportData.assignments.total || 1)) * 100).toFixed(0)}%
                  </p>
                  <p className="text-orange-100 text-sm">تقييم شامل</p>
                </div>
                <TrendingUp className="h-10 w-10 text-orange-100" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm" onClick={() => navigate(`/student-attendance/${studentId}`)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserCheck className="h-5 w-5 text-green-600" />
                الحضور والغياب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">عرض سجل الحضور التفصيلي</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm" onClick={() => navigate(`/student-assignments/${studentId}`)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-blue-600" />
                الواجبات والمهام
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">عرض الواجبات والتقييمات</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm" onClick={() => navigate(`/student-rewards/${studentId}`)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Award className="h-5 w-5 text-purple-600" />
                الجوائز والإنجازات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">عرض الجوائز والمكافآت</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm" onClick={() => navigate(`/student-notes-detail/${studentId}`)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-orange-600" />
                الملاحظات والتطوير
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">عرض الملاحظات التفصيلية</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-white/80 backdrop-blur-sm" onClick={() => navigate(`/student-media/${studentId}`)}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-pink-600" />
                الصور والألبوم
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">عرض الصور والفيديوهات</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Assignments */}
        {reportData.assignments.total > 0 && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                الواجبات الأخيرة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-semibold">إجمالي الواجبات</h4>
                    <p className="text-sm text-muted-foreground">المكتملة: {reportData.assignments.completed} من {reportData.assignments.total}</p>
                  </div>
                  <Badge variant="secondary">
                    متوسط الدرجات: {reportData.assignments.score_average.toFixed(1)}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Attendance */}
        {reportData.attendance.total_days > 0 && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
                ملخص الحضور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{reportData.attendance.present_days}</p>
                  <p className="text-sm text-muted-foreground">أيام حضور</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">{reportData.attendance.absent_days}</p>
                  <p className="text-sm text-muted-foreground">أيام غياب</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">{reportData.attendance.late_days}</p>
                  <p className="text-sm text-muted-foreground">أيام تأخير</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{reportData.attendance.attendance_rate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">نسبة الحضور</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Rewards */}
        {reportData.rewards.length > 0 && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                الجوائز الأخيرة ({reportData.rewards.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.rewards.slice(0, 5).map((reward) => (
                  <div key={reward.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-3 h-3 rounded-full ${getRewardTypeColor(reward.type)}`}></div>
                    <div className="flex-1">
                      <p className="font-medium">{reward.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(reward.awarded_at), 'dd/MM/yyyy', { locale: ar })}
                      </p>
                    </div>
                    <Badge variant="outline">
                      <Star className="h-3 w-3 mr-1" />
                      {reward.points}
                    </Badge>
                  </div>
                ))}
                {reportData.rewards.length > 5 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => navigate(`/student-rewards/${studentId}`)}
                  >
                    عرض جميع الجوائز ({reportData.rewards.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Notes */}
        {reportData.notes.length > 0 && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                الملاحظات الأخيرة ({reportData.notes.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.notes.slice(0, 3).map((note) => (
                  <div key={note.id} className="p-4 border rounded-lg">
                    <div className="flex items-start gap-3 mb-2">
                      <Badge className={getNoteTypeColor(note.note_type)}>
                        {getNoteTypeIcon(note.note_type)}
                        <span className="mr-1">
                          {note.note_type === 'academic' ? 'أكاديمية' :
                           note.note_type === 'behavioral' ? 'سلوكية' :
                           note.note_type === 'health' ? 'صحية' :
                           note.note_type === 'social' ? 'اجتماعية' : note.note_type}
                        </span>
                      </Badge>
                      <Badge variant="outline">
                        {note.severity === 'high' ? 'عالية' :
                         note.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </Badge>
                    </div>
                    <h4 className="font-medium mb-1">{note.title}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{note.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(note.created_at), 'dd/MM/yyyy', { locale: ar })}
                    </p>
                  </div>
                ))}
                {reportData.notes.length > 3 && (
                  <Button 
                    variant="outline" 
                    className="w-full mt-3"
                    onClick={() => navigate(`/student-notes-detail/${studentId}`)}
                  >
                    عرض جميع الملاحظات ({reportData.notes.length})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Development Skills */}
        {reportData.development_skills.length > 0 && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                مهارات التطوير ({reportData.development_skills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.development_skills.map((skill) => (
                  <div key={skill.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{skill.skill_name}</p>
                      <Badge variant="outline" className="mt-1">{skill.skill_category}</Badge>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`h-4 w-4 ${
                              star <= skill.level
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(skill.assessment_date), 'dd/MM/yyyy', { locale: ar })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Checks */}
        {reportData.health_checks.length > 0 && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-red-600" />
                الفحوصات الصحية ({reportData.health_checks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reportData.health_checks.map((check) => (
                  <div key={check.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-medium">
                        {format(new Date(check.check_date), 'dd/MM/yyyy', { locale: ar })}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      {check.temperature && (
                        <div>
                          <span className="text-muted-foreground">الحرارة: </span>
                          <span>{check.temperature}°C</span>
                        </div>
                      )}
                      {check.weight && (
                        <div>
                          <span className="text-muted-foreground">الوزن: </span>
                          <span>{check.weight} كيلو</span>
                        </div>
                      )}
                      {check.height && (
                        <div>
                          <span className="text-muted-foreground">الطول: </span>
                          <span>{check.height} سم</span>
                        </div>
                      )}
                    </div>
                    {check.notes && (
                      <p className="text-sm text-muted-foreground mt-2">{check.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Gallery */}
        {reportData.media.length > 0 && (
          <Card className="mb-8 bg-white/90 backdrop-blur-sm border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-pink-600" />
                معرض الصور ({reportData.media.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {reportData.media.slice(0, 8).map((media) => (
                  <div key={media.id} className="relative group">
                    <img
                      src={`https://ytjodudlnfamvnescumu.supabase.co/storage/v1/object/public/media/${media.file_path}`}
                      alt={media.file_name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {media.caption && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{media.caption}</p>
                    )}
                  </div>
                ))}
              </div>
              {reportData.media.length > 8 && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate(`/student-media/${studentId}`)}
                >
                  عرض جميع الصور ({reportData.media.length})
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-gray-500">
          <p>تقرير شامل للطالب - تم إنشاؤه في {format(new Date(), 'dd MMMM yyyy', { locale: ar })}</p>
          <p className="text-sm mt-1">روضة {reportData.student.tenant_name || tenant?.name}</p>
        </div>
      </div>
    </div>
  );
}