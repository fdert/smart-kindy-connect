import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Clock, Calendar, Users, CheckCircle, XCircle, AlertCircle, Search, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_id: string | null;
  classes?: {
    name: string;
  };
}

interface AttendanceEvent {
  id: string;
  student_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  check_in_time: string | null;
  check_out_time: string | null;
  late_minutes: number | null;
  notes: string | null;
  students: {
    full_name: string;
    student_id: string;
  };
}

interface Class {
  id: string;
  name: string;
}

const Attendance = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [attendanceEvents, setAttendanceEvents] = useState<AttendanceEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { tenant } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    if (tenant) {
      loadData();
    }
  }, [tenant, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStudents(),
        loadClasses(),
        loadAttendance()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (name)
        `)
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الطلاب",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الفصول",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance_events')
        .select(`
          *,
          students (full_name, student_id)
        `)
        .eq('tenant_id', tenant?.id)
        .eq('date', selectedDate);

      if (error) throw error;
      setAttendanceEvents(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل بيانات الحضور",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markAttendance = async (studentId: string, status: 'present' | 'absent' | 'late' | 'excused', notes?: string) => {
    if (!tenant) return;

    try {
      const now = new Date();
      const currentTime = now.toTimeString().split(' ')[0];
      
      // Check if attendance already exists
      const existingAttendance = attendanceEvents.find(a => a.student_id === studentId);
      
      const attendanceData = {
        student_id: studentId,
        tenant_id: tenant.id,
        date: selectedDate,
        status,
        check_in_time: status === 'present' || status === 'late' ? `${selectedDate}T${currentTime}Z` : null,
        check_out_time: null,
        late_minutes: status === 'late' ? 15 : 0, // Default to 15 minutes late
        notes: notes || null,
        class_id: students.find(s => s.id === studentId)?.class_id || null,
        recorded_by: null // Will be set by RLS automatically
      };

      if (existingAttendance) {
        const { error } = await supabase
          .from('attendance_events')
          .update(attendanceData)
          .eq('id', existingAttendance.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('attendance_events')
          .insert(attendanceData);

        if (error) throw error;
      }

      // Send notifications via Edge Function
      try {
        await supabase.functions.invoke('attendance-notifications', {
          body: {
            tenantId: tenant.id,
            studentId,
            status,
            date: selectedDate,
            notificationType: 'attendance'
          }
        });
      } catch (notificationError) {
        console.error('Notification error:', notificationError);
        // Don't fail the attendance marking if notification fails
      }

      await loadAttendance();
      
      const student = students.find(s => s.id === studentId);
      toast({
        title: "تم تسجيل الحضور",
        description: `تم تسجيل ${getStatusText(status)} للطالب ${student?.full_name}`,
      });
    } catch (error: any) {
      console.error('Attendance marking error:', error);
      toast({
        title: "خطأ في تسجيل الحضور",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markAllPresent = async () => {
    if (!confirm('هل أنت متأكد من تسجيل حضور جميع الطلاب؟')) return;

    try {
      const promises = filteredStudents
        .filter(student => !getStudentAttendance(student.id))
        .map(student => markAttendance(student.id, 'present'));

      await Promise.all(promises);
      
      toast({
        title: "تم تسجيل الحضور للجميع",
        description: "تم تسجيل حضور جميع الطلاب الغير مسجلين",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الحضور الجماعي",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStudentAttendance = (studentId: string) => {
    return attendanceEvents.find(a => a.student_id === studentId);
  };

  const getStatusText = (status: 'present' | 'absent' | 'late' | 'excused') => {
    switch (status) {
      case 'present': return 'حاضر';
      case 'absent': return 'غائب';
      case 'late': return 'متأخر';
      case 'excused': return 'معذور';
      default: return 'غير محدد';
    }
  };

  const getStatusColor = (status: 'present' | 'absent' | 'late' | 'excused') => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-100';
      case 'absent': return 'text-red-600 bg-red-100';
      case 'late': return 'text-yellow-600 bg-yellow-100';
      case 'excused': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: 'present' | 'absent' | 'late' | 'excused') => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'late': return <AlertCircle className="h-4 w-4" />;
      case 'excused': return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.student_id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'all' || student.class_id === selectedClass;
    return matchesSearch && matchesClass;
  });

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Statistics for the selected date
  const totalStudents = filteredStudents.length;
  const presentCount = attendanceEvents.filter(a => a.status === 'present').length;
  const absentCount = attendanceEvents.filter(a => a.status === 'absent').length;
  const lateCount = attendanceEvents.filter(a => a.status === 'late').length;
  const attendanceRate = totalStudents > 0 ? Math.round((presentCount + lateCount) / totalStudents * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل بيانات الحضور...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="h-8 w-8 text-primary" />
              الحضور والغياب
            </h1>
            <p className="text-gray-600 mt-1">تسجيل ومتابعة حضور الطلاب يومياً</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="date">التاريخ:</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={markAllPresent} disabled={totalStudents === 0}>
                تسجيل حضور للجميع
              </Button>
              <Link to="/reports">
                <Button variant="outline" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  التقارير
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحاضرون</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{presentCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المتأخرون</CardTitle>
              <AlertCircle className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{lateCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الغائبون</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{absentCount}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">معدل الحضور</CardTitle>
              <Calendar className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">{attendanceRate}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث عن طالب بالاسم أو رقم الطالب..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفصل" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الفصول</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Students Attendance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const attendance = getStudentAttendance(student.id);
            
            return (
              <Card key={student.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center space-x-reverse space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(student.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{student.full_name}</h3>
                      <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
                      <p className="text-sm text-muted-foreground">الفصل: {student.classes?.name || 'غير محدد'}</p>
                    </div>
                    {attendance && (
                      <Badge className={`${getStatusColor(attendance.status)} border-0`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(attendance.status)}
                          {getStatusText(attendance.status)}
                        </div>
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {attendance ? (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">الحالة:</span>
                        <span className="text-sm font-medium">{getStatusText(attendance.status)}</span>
                      </div>
                      {attendance.check_in_time && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">وقت الوصول:</span>
                          <span className="text-sm font-medium">
                            {new Date(attendance.check_in_time).toLocaleTimeString('ar-SA', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                      {attendance.late_minutes && attendance.late_minutes > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">دقائق التأخير:</span>
                          <span className="text-sm font-medium">{attendance.late_minutes} دقيقة</span>
                        </div>
                      )}
                      {attendance.notes && (
                        <div className="mt-2">
                          <span className="text-sm text-muted-foreground">ملاحظات:</span>
                          <p className="text-sm mt-1 p-2 bg-gray-50 rounded">{attendance.notes}</p>
                        </div>
                      )}
                      <div className="flex gap-2 mt-4">
                        <Button
                          size="sm"
                          variant={attendance.status === 'present' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'present')}
                          className="flex-1"
                        >
                          حاضر
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance.status === 'late' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'late')}
                          className="flex-1"
                        >
                          متأخر
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance.status === 'absent' ? 'default' : 'outline'}
                          onClick={() => markAttendance(student.id, 'absent')}
                          className="flex-1"
                        >
                          غائب
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center text-muted-foreground">
                        لم يتم تسجيل الحضور بعد
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => markAttendance(student.id, 'present')}
                          className="flex-1"
                        >
                          <CheckCircle className="h-4 w-4 ml-1" />
                          حاضر
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAttendance(student.id, 'late')}
                          className="flex-1"
                        >
                          <AlertCircle className="h-4 w-4 ml-1" />
                          متأخر
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAttendance(student.id, 'absent')}
                          className="flex-1"
                        >
                          <XCircle className="h-4 w-4 ml-1" />
                          غائب
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredStudents.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد طلاب</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || selectedClass !== 'all' 
                  ? 'لم يتم العثور على طلاب مطابقين للفلاتر المحددة' 
                  : 'لم يتم إضافة أي طلاب بعد'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Attendance;