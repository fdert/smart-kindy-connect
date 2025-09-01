import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Activity,
  Stethoscope,
  UserCheck,
  Download,
  Share2,
  Star
} from 'lucide-react';
import { StudentReportHeader } from '@/components/StudentReportHeader';
import { StudentStatsCards } from '@/components/StudentStatsCards';

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
  console.log('StudentReport component is loading...');
  
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [reportData, setReportData] = useState<StudentReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const { tenant } = useTenant();
  const { toast } = useToast();

  // Get date filters from URL params if provided
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    
    if (fromParam && toParam) {
      setDateRange({
        from: new Date(fromParam),
        to: new Date(toParam)
      });
    }
  }, [searchParams]);

  useEffect(() => {
    // Check if this is guardian access or regular authenticated access
    const isGuardianAccess = searchParams.get('guardian') === 'true';
    
    if (isGuardianAccess) {
      // For guardian access, we only need studentId
      if (studentId) {
        loadReportData();
      }
    } else {
      // For regular access, we need both tenant and studentId
      if (tenant && studentId) {
        loadReportData();
      }
    }
  }, [tenant, studentId, dateRange, searchParams]);

  const loadReportData = async () => {
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
      // Check if this is a guardian access (public access)
      const isGuardianAccess = searchParams.get('guardian') === 'true';
      
      if (isGuardianAccess) {
        // For guardian access, we don't need tenant verification
        console.log('Guardian access mode - loading public report for student:', studentId);
        
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
          console.error('Student data error:', studentError);
          throw new Error('لم يتم العثور على بيانات الطالب');
        }

        // For guardian access, use the student's tenant_id
        const studentTenantId = studentData.tenant_id;
        
        // Load all data using the student's tenant_id
        await loadStudentReportData(studentId, studentTenantId, studentData);
        
      } else {
        // Regular authenticated access - require tenant
        if (!tenant?.id) {
          throw new Error('معرف الروضة غير صحيح');
        }

        // Load student basic info with tenant verification
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
        
        // Verify student belongs to current tenant
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
      // Load assignments data with better error handling
      const { data: assignmentsData } = await supabase
        .from('assignment_evaluations')
        .select(`
          id,
          evaluation_status,
          evaluation_score,
          evaluated_at,
          completion_date,
          teacher_feedback,
          assignment_id
        `)
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('evaluated_at', dateRange.from.toISOString())
        .lte('evaluated_at', dateRange.to.toISOString());

      // Get assignment details separately to avoid join issues
      const assignmentDetails = [];
      if (assignmentsData && assignmentsData.length > 0) {
        for (const evaluation of assignmentsData) {
          const { data: assignment } = await supabase
            .from('assignments')
            .select('title, assignment_type, due_date, priority')
            .eq('id', evaluation.assignment_id)
            .single();
          
          if (assignment) {
            assignmentDetails.push({
              ...evaluation,
              assignment: assignment
            });
          }
        }
      }

      // Calculate assignment stats using the combined data
      const assignmentStats = {
        total: assignmentDetails.length || 0,
        completed: assignmentDetails.filter(a => a.evaluation_status === 'completed').length || 0,
        pending: assignmentDetails.filter(a => a.evaluation_status === 'not_completed').length || 0,
        score_average: assignmentDetails.length ? 
          assignmentDetails.reduce((sum, a) => sum + (a.evaluation_score || 0), 0) / assignmentDetails.length : 0
      };

      // Load attendance data
      const { data: attendanceData } = await supabase
        .from('attendance_events')
        .select('status, date')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'));

      // Calculate attendance stats
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

      // Load student notes (include both private and public notes)
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

      // Load media with proper tenant and student filtering
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

      // Filter media by date range and ensure tenant isolation
      const mediaFiles = mediaLinks
        ?.map(m => m.media)
        .filter(Boolean)
        .filter(media => {
          // Double-check tenant isolation
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

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
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
        <StudentReportHeader 
          student={reportData.student} 
          calculateAge={calculateAge}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card 
            className="bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '&guardian=true' : '';
              navigate(`/student-attendance/${studentId}?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}${guardianParam}`);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل الحضور</CardTitle>
              <UserCheck className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.attendance.attendance_rate.toFixed(1)}%</div>
              <p className="text-xs opacity-80">
                {reportData.attendance.present_days} من {reportData.attendance.total_days} يوم
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '&guardian=true' : '';
              navigate(`/student-assignments/${studentId}?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}${guardianParam}`);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل الواجبات</CardTitle>
              <BookOpen className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.assignments.score_average.toFixed(1)}</div>
              <p className="text-xs opacity-80">
                {reportData.assignments.completed} مكتمل من {reportData.assignments.total}
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '&guardian=true' : '';
              navigate(`/student-rewards/${studentId}?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}${guardianParam}`);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المكافآت</CardTitle>
              <Award className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.rewards.length}</div>
              <p className="text-xs opacity-80">
                {reportData.rewards.reduce((sum, r) => sum + r.points, 0)} نقطة إجمالية
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-pink-500 to-pink-600 text-white cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '&guardian=true' : '';
              navigate(`/student-notes-detail/${studentId}?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}${guardianParam}`);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الملاحظات</CardTitle>
              <Activity className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.notes.length}</div>
              <p className="text-xs opacity-80">
                ملاحظات متنوعة
              </p>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white cursor-pointer hover:shadow-lg transform hover:scale-105 transition-all duration-200"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '&guardian=true' : '';
              navigate(`/student-media/${studentId}?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}${guardianParam}`);
            }}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">ألبوم الصور</CardTitle>
              <Camera className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reportData.media.length}</div>
              <p className="text-xs opacity-80">
                صور وأنشطة
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Academic Performance */}
          <Card 
            id="assignments-section"
            className="bg-white/90 backdrop-blur-sm"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                الأداء الأكاديمي
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <span>الواجبات المكتملة</span>
                  <span className="font-bold text-blue-600">
                    {reportData.assignments.completed}/{reportData.assignments.total}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span>المعدل العام</span>
                  <span className="font-bold text-green-600">
                    {reportData.assignments.score_average.toFixed(1)}%
                  </span>
                </div>
                {reportData.assignments.pending > 0 && (
                  <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                    <span>الواجبات المعلقة</span>
                    <span className="font-bold text-yellow-600">
                      {reportData.assignments.pending}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Attendance Details */}
          <Card 
            id="attendance-section"
            className="bg-white/90 backdrop-blur-sm"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-500" />
                تفاصيل الحضور
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span>أيام الحضور</span>
                  <span className="font-bold text-green-600">
                    {reportData.attendance.present_days}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                  <span>أيام الغياب</span>
                  <span className="font-bold text-red-600">
                    {reportData.attendance.absent_days}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <span>أيام التأخير</span>
                  <span className="font-bold text-yellow-600">
                    {reportData.attendance.late_days}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rewards Section */}
        {reportData.rewards.length > 0 && (
          <Card 
            id="rewards-section"
            className="mt-8 bg-white/90 backdrop-blur-sm"
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                المكافآت والإنجازات
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.rewards.map((reward) => (
                  <div
                    key={reward.id}
                    className="p-4 rounded-lg border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      const isGuardianAccess = searchParams.get('guardian') === 'true';
                      const guardianParam = isGuardianAccess ? '&guardian=true' : '';
                      navigate(`/student-rewards/${studentId}?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}${guardianParam}`);
                    }}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <div className={`w-3 h-3 rounded-full ${getRewardTypeColor(reward.type)}`}></div>
                      <h4 className="font-semibold text-gray-800">{reward.title}</h4>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{reward.points} نقطة</span>
                      <span>{format(new Date(reward.awarded_at), 'dd MMM yyyy', { locale: ar })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes Section */}
        {reportData.notes.length > 0 && (
          <Card 
            id="notes-section"
            className="mt-8 bg-white/90 backdrop-blur-sm cursor-pointer hover:shadow-lg transform hover:scale-102 transition-all duration-200"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '&guardian=true' : '';
              navigate(`/student-notes-detail/${studentId}?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}${guardianParam}`);
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-500" />
                الملاحظات والمتابعة
                <span className="text-sm text-muted-foreground mr-auto">اضغط للتفاصيل ←</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.notes.map((note) => (
                  <div 
                    key={note.id} 
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {getNoteTypeIcon(note.note_type)}
                      <Badge className={getNoteTypeColor(note.note_type)}>
                        {note.note_type === 'academic' ? 'أكاديمية' :
                         note.note_type === 'behavioral' ? 'سلوكية' :
                         note.note_type === 'health' ? 'صحية' :
                         note.note_type === 'social' ? 'اجتماعية' : note.note_type}
                      </Badge>
                      <Badge variant={note.severity === 'high' ? 'destructive' : 
                                    note.severity === 'medium' ? 'default' : 'secondary'}>
                        {note.severity === 'high' ? 'عالية' :
                         note.severity === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </Badge>
                    </div>
                    <h4 className="font-semibold mb-2">{note.title}</h4>
                    <p className="text-gray-700 mb-2">{note.content}</p>
                    <div className="text-sm text-gray-500">
                      {format(new Date(note.created_at), 'dd MMM yyyy', { locale: ar })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Development Skills */}
        {reportData.development_skills.length > 0 && (
          <Card className="mt-8 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                المهارات التنموية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportData.development_skills.map((skill) => (
                  <div key={skill.id} className="p-4 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold">{skill.skill_name}</h4>
                      <Badge variant="outline">{skill.skill_category}</Badge>
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600">المستوى:</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < skill.level ? 'text-yellow-400 fill-current' : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {skill.notes && (
                      <p className="text-sm text-gray-600 mb-2">{skill.notes}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      {format(new Date(skill.assessment_date), 'dd MMM yyyy', { locale: ar })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Health Checks */}
        {reportData.health_checks.length > 0 && (
          <Card className="mt-8 bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5 text-red-500" />
                الفحوصات الصحية
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reportData.health_checks.map((check) => (
                  <div key={check.id} className="p-4 border rounded-lg">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
                      {check.temperature && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">درجة الحرارة</div>
                          <div className="font-semibold">{check.temperature}°م</div>
                        </div>
                      )}
                      {check.weight && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">الوزن</div>
                          <div className="font-semibold">{check.weight} كغ</div>
                        </div>
                      )}
                      {check.height && (
                        <div className="text-center">
                          <div className="text-sm text-gray-600">الطول</div>
                          <div className="font-semibold">{check.height} سم</div>
                        </div>
                      )}
                      <div className="text-center">
                        <div className="text-sm text-gray-600">التاريخ</div>
                        <div className="font-semibold">
                          {format(new Date(check.check_date), 'dd MMM', { locale: ar })}
                        </div>
                      </div>
                    </div>
                    {check.notes && (
                      <p className="text-sm text-gray-700 mt-2">{check.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Media Gallery */}
        {reportData.media.length > 0 && (
          <Card 
            id="media-section"
            className="mt-8 bg-white/90 backdrop-blur-sm cursor-pointer hover:shadow-lg transform hover:scale-102 transition-all duration-200"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '&guardian=true' : '';
              navigate(`/student-media/${studentId}?from=${dateRange.from.toISOString().split('T')[0]}&to=${dateRange.to.toISOString().split('T')[0]}${guardianParam}`);
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5 text-indigo-500" />
                ألبوم الصور
                <span className="text-sm text-muted-foreground mr-auto">اضغط للتفاصيل ←</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {reportData.media.map((media) => (
                  <div 
                    key={media.id} 
                    className="group relative hover:shadow-lg transition-shadow"
                  >
                    <img
                      src={media.file_path}
                      alt={media.caption || media.file_name}
                      className="w-full h-32 object-cover rounded-lg border"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                      <Button variant="secondary" size="sm">
                        عرض
                      </Button>
                    </div>
                    {media.caption && (
                      <p className="text-xs text-gray-600 mt-1 truncate">{media.caption}</p>
                    )}
                  </div>
                ))}
              </div>
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