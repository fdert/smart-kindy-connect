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
import { UserCheck, Clock, AlertCircle, ArrowLeft, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AttendanceData {
  id: string;
  status: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  late_minutes: number | null;
  notes: string | null;
}

export default function StudentAttendance() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [attendance, setAttendance] = useState<AttendanceData[]>([]);
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
      let tenantId: string;

      if (isGuardianAccess) {
        // For guardian access, get student data without tenant restriction
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            full_name,
            student_id,
            photo_url,
            tenant_id,
            classes (name)
          `)
          .eq('id', studentId)
          .maybeSingle();

        if (studentError) throw studentError;
        if (!studentData) {
          throw new Error('لم يتم العثور على بيانات الطالب');
        }
        
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
        if (!studentData) {
          throw new Error('لم يتم العثور على بيانات الطالب');
        }
        
        setStudentInfo(studentData);
        tenantId = tenant.id;
      }

      // Load attendance data
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_events')
        .select('*')
        .eq('student_id', studentId)
        .eq('tenant_id', tenantId)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'))
        .order('date', { ascending: false });

      if (attendanceError) throw attendanceError;
      setAttendance(attendanceData || []);

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <UserCheck className="h-5 w-5 text-green-500" />;
      case 'absent': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'late': return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'excused': return <Calendar className="h-5 w-5 text-blue-500" />;
      default: return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-100 text-green-800';
      case 'absent': return 'bg-red-100 text-red-800';
      case 'late': return 'bg-yellow-100 text-yellow-800';
      case 'excused': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غائب';
      case 'late': return 'متأخر';
      case 'excused': return 'معذور';
      default: return 'غير محدد';
    }
  };

  const calculateStats = () => {
    const total = attendance.length;
    const present = attendance.filter(a => a.status === 'present').length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const late = attendance.filter(a => a.status === 'late').length;
    const excused = attendance.filter(a => a.status === 'excused').length;
    const attendanceRate = total > 0 ? (present / total) * 100 : 0;

    return { total, present, absent, late, excused, attendanceRate };
  };

  const stats = calculateStats();

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
              سجل حضور الطالب: {studentInfo?.full_name}
            </h1>
            <p className="text-gray-600">
              الفترة: {format(dateRange.from, 'dd MMM yyyy', { locale: ar })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm opacity-90">إجمالي الأيام</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.present}</p>
                <p className="text-sm opacity-90">حاضر</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.absent}</p>
                <p className="text-sm opacity-90">غائب</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.late}</p>
                <p className="text-sm opacity-90">متأخر</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-4">
              <div className="text-center">
                <p className="text-2xl font-bold">{stats.attendanceRate.toFixed(1)}%</p>
                <p className="text-sm opacity-90">معدل الحضور</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance List */}
        <div className="space-y-4">
          {attendance.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد سجلات حضور</h3>
                <p className="text-gray-500">لم يتم تسجيل أي حضور للطالب في هذه الفترة</p>
              </CardContent>
            </Card>
          ) : (
            attendance.map((record) => (
              <Card key={record.id} className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(record.status)}
                      <div>
                        <h3 className="font-semibold text-lg">
                          {format(new Date(record.date), 'EEEE, dd MMMM yyyy', { locale: ar })}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          {record.check_in_time && (
                            <span>دخول: {format(new Date(record.check_in_time), 'HH:mm')}</span>
                          )}
                          {record.check_out_time && (
                            <span>خروج: {format(new Date(record.check_out_time), 'HH:mm')}</span>
                          )}
                          {record.late_minutes && record.late_minutes > 0 && (
                            <span className="text-yellow-600">تأخير: {record.late_minutes} دقيقة</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={getStatusColor(record.status)}>
                        {getStatusText(record.status)}
                      </Badge>
                      {record.notes && (
                        <p className="text-sm text-gray-500 mt-2 max-w-xs">
                          {record.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}