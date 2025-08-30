import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, Users, TrendingUp, BarChart3, PieChart, User } from 'lucide-react';

interface ReportData {
  attendance: {
    totalDays: number;
    presentDays: number;
    absentDays: number;
    lateDays: number;
    attendanceRate: number;
  };
  students: {
    totalStudents: number;
    activeStudents: number;
    maleStudents: number;
    femaleStudents: number;
  };
  rewards: {
    totalRewards: number;
    totalPoints: number;
    topStudents: Array<{
      name: string;
      points: number;
      rewards: number;
    }>;
  };
  classes: {
    totalClasses: number;
    activeClasses: number;
    totalCapacity: number;
    occupancyRate: number;
  };
}

const Reports = () => {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    to: new Date()
  });
  const [reportType, setReportType] = useState('all');
  const [selectedClass, setSelectedClass] = useState('all');
  const [classes, setClasses] = useState<any[]>([]);
  const { tenant } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    if (tenant) {
      loadClasses();
      generateReport();
    }
  }, [tenant, dateRange, reportType, selectedClass]);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true);

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error('Error loading classes:', error);
    }
  };

  const generateReport = async () => {
    if (!tenant) return;

    try {
      setLoading(true);

      // Get attendance data
      const attendanceQuery = supabase
        .from('attendance_events')
        .select('*')
        .eq('tenant_id', tenant.id)
        .gte('date', dateRange.from.toISOString().split('T')[0])
        .lte('date', dateRange.to.toISOString().split('T')[0]);

      if (selectedClass !== 'all') {
        attendanceQuery.eq('class_id', selectedClass);
      }

      const { data: attendanceData, error: attendanceError } = await attendanceQuery;
      if (attendanceError) throw attendanceError;

      // Get students data
      const studentsQuery = supabase
        .from('students')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('is_active', true);

      if (selectedClass !== 'all') {
        studentsQuery.eq('class_id', selectedClass);
      }

      const { data: studentsData, error: studentsError } = await studentsQuery;
      if (studentsError) throw studentsError;

      // Get rewards data
      const rewardsQuery = supabase
        .from('rewards')
        .select(`
          *,
          students (full_name)
        `)
        .eq('tenant_id', tenant.id)
        .gte('awarded_at', dateRange.from.toISOString())
        .lte('awarded_at', dateRange.to.toISOString());

      const { data: rewardsData, error: rewardsError } = await rewardsQuery;
      if (rewardsError) throw rewardsError;

      // Get classes data
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .eq('tenant_id', tenant.id);

      if (classesError) throw classesError;

      // Process data
      const processedData: ReportData = {
        attendance: {
          totalDays: Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)),
          presentDays: attendanceData?.filter(a => a.status === 'present').length || 0,
          absentDays: attendanceData?.filter(a => a.status === 'absent').length || 0,
          lateDays: attendanceData?.filter(a => a.status === 'late').length || 0,
          attendanceRate: attendanceData && attendanceData.length > 0 
            ? Math.round(((attendanceData.filter(a => a.status === 'present' || a.status === 'late').length) / attendanceData.length) * 100)
            : 0
        },
        students: {
          totalStudents: studentsData?.length || 0,
          activeStudents: studentsData?.filter(s => s.is_active).length || 0,
          maleStudents: studentsData?.filter(s => s.gender === 'male').length || 0,
          femaleStudents: studentsData?.filter(s => s.gender === 'female').length || 0,
        },
        rewards: {
          totalRewards: rewardsData?.length || 0,
          totalPoints: rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0,
          topStudents: getTopStudents(rewardsData || [])
        },
        classes: {
          totalClasses: classesData?.length || 0,
          activeClasses: classesData?.filter(c => c.is_active).length || 0,
          totalCapacity: classesData?.reduce((sum, c) => sum + c.capacity, 0) || 0,
          occupancyRate: calculateOccupancyRate(classesData || [], studentsData || [])
        }
      };

      setReportData(processedData);
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTopStudents = (rewardsData: any[]) => {
    const studentsMap = new Map();
    
    rewardsData.forEach(reward => {
      const studentId = reward.student_id;
      const studentName = reward.students?.full_name || 'غير محدد';
      
      if (!studentsMap.has(studentId)) {
        studentsMap.set(studentId, {
          name: studentName,
          points: 0,
          rewards: 0
        });
      }
      
      const student = studentsMap.get(studentId);
      student.points += reward.points;
      student.rewards += 1;
    });
    
    return Array.from(studentsMap.values())
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  };

  const calculateOccupancyRate = (classesData: any[], studentsData: any[]) => {
    const totalCapacity = classesData.reduce((sum, c) => sum + c.capacity, 0);
    const totalStudents = studentsData.length;
    
    return totalCapacity > 0 ? Math.round((totalStudents / totalCapacity) * 100) : 0;
  };

  const exportReport = async () => {
    if (!reportData) return;

    try {
      // In a real implementation, this would generate a PDF or Excel file
      const reportContent = `
تقرير SmartKindy
===============

فترة التقرير: ${dateRange.from.toLocaleDateString('ar-SA')} - ${dateRange.to.toLocaleDateString('ar-SA')}

الحضور والغياب:
- إجمالي الأيام: ${reportData.attendance.totalDays}
- أيام الحضور: ${reportData.attendance.presentDays}
- أيام الغياب: ${reportData.attendance.absentDays}
- أيام التأخير: ${reportData.attendance.lateDays}
- معدل الحضور: ${reportData.attendance.attendanceRate}%

الطلاب:
- إجمالي الطلاب: ${reportData.students.totalStudents}
- الطلاب النشطون: ${reportData.students.activeStudents}
- الذكور: ${reportData.students.maleStudents}
- الإناث: ${reportData.students.femaleStudents}

الجوائز:
- إجمالي الجوائز: ${reportData.rewards.totalRewards}
- إجمالي النقاط: ${reportData.rewards.totalPoints}

الفصول:
- إجمالي الفصول: ${reportData.classes.totalClasses}
- الفصول النشطة: ${reportData.classes.activeClasses}
- السعة الإجمالية: ${reportData.classes.totalCapacity}
- معدل الإشغال: ${reportData.classes.occupancyRate}%

أفضل الطلاب:
${reportData.rewards.topStudents.map((student, index) => 
  `${index + 1}. ${student.name} - ${student.points} نقطة`
).join('\n')}
      `;

      // Create and download the file
      const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `تقرير-${dateRange.from.toLocaleDateString('ar-SA')}-${dateRange.to.toLocaleDateString('ar-SA')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "تم تصدير التقرير",
        description: "تم تنزيل التقرير بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تصدير التقرير",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري إنشاء التقرير...</p>
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
              <FileText className="h-8 w-8 text-primary" />
              التقارير والإحصائيات
            </h1>
            <p className="text-gray-600 mt-1">تقارير شاملة عن أداء الحضانة</p>
          </div>
          <Button onClick={exportReport} disabled={!reportData} className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            تصدير التقرير
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>فلاتر التقرير</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="from_date">من تاريخ</Label>
                <Input
                  id="from_date"
                  type="date"
                  value={dateRange.from.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: new Date(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="to_date">إلى تاريخ</Label>
                <Input
                  id="to_date"
                  type="date"
                  value={dateRange.to.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: new Date(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="report_type">نوع التقرير</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر نوع التقرير" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">تقرير شامل</SelectItem>
                    <SelectItem value="attendance">الحضور والغياب</SelectItem>
                    <SelectItem value="students">الطلاب</SelectItem>
                    <SelectItem value="rewards">الجوائز</SelectItem>
                    <SelectItem value="classes">الفصول</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="class_filter">الفصل</Label>
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

        {reportData && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل الحضور</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{reportData.attendance.attendanceRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.attendance.presentDays + reportData.attendance.lateDays} من {reportData.attendance.totalDays} يوم
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
                  <Users className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.students.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.students.maleStudents} ذكور، {reportData.students.femaleStudents} إناث
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">إجمالي الجوائز</CardTitle>
                  <BarChart3 className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.rewards.totalRewards}</div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.rewards.totalPoints} نقطة إجمالية
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">معدل الإشغال</CardTitle>
                  <PieChart className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{reportData.classes.occupancyRate}%</div>
                  <p className="text-xs text-muted-foreground">
                    {reportData.students.totalStudents} من {reportData.classes.totalCapacity}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Reports */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Attendance Report */}
              {(reportType === 'all' || reportType === 'attendance') && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-green-500" />
                      تقرير الحضور والغياب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>أيام الحضور:</span>
                        <span className="font-bold text-green-600">{reportData.attendance.presentDays}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>أيام التأخير:</span>
                        <span className="font-bold text-yellow-600">{reportData.attendance.lateDays}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>أيام الغياب:</span>
                        <span className="font-bold text-red-600">{reportData.attendance.absentDays}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">معدل الحضور:</span>
                          <span className="font-bold text-lg text-primary">{reportData.attendance.attendanceRate}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Students Report */}
              {(reportType === 'all' || reportType === 'students') && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-blue-500" />
                      تقرير الطلاب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>إجمالي الطلاب:</span>
                        <span className="font-bold">{reportData.students.totalStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الطلاب النشطون:</span>
                        <span className="font-bold text-green-600">{reportData.students.activeStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الذكور:</span>
                        <span className="font-bold text-blue-600">{reportData.students.maleStudents}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الإناث:</span>
                        <span className="font-bold text-pink-600">{reportData.students.femaleStudents}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rewards Report */}
              {(reportType === 'all' || reportType === 'rewards') && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-yellow-500" />
                      تقرير الجوائز
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>إجمالي الجوائز:</span>
                        <span className="font-bold">{reportData.rewards.totalRewards}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>إجمالي النقاط:</span>
                        <span className="font-bold text-yellow-600">{reportData.rewards.totalPoints}</span>
                      </div>
                      <div className="border-t pt-2">
                        <h4 className="font-semibold mb-2">أفضل الطلاب:</h4>
                        <div className="space-y-1">
                          {reportData.rewards.topStudents.slice(0, 3).map((student, index) => (
                            <div key={index} className="flex justify-between items-center text-sm">
                              <span className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                                  {index + 1}
                                </span>
                                {student.name}
                              </span>
                              <span className="font-medium">{student.points} نقطة</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Classes Report */}
              {(reportType === 'all' || reportType === 'classes') && (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChart className="h-5 w-5 text-purple-500" />
                      تقرير الفصول
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>إجمالي الفصول:</span>
                        <span className="font-bold">{reportData.classes.totalClasses}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>الفصول النشطة:</span>
                        <span className="font-bold text-green-600">{reportData.classes.activeClasses}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>السعة الإجمالية:</span>
                        <span className="font-bold">{reportData.classes.totalCapacity}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold">معدل الإشغال:</span>
                          <span className="font-bold text-lg text-primary">{reportData.classes.occupancyRate}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </>
        )}

        {!reportData && !loading && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد بيانات للتقرير</h3>
              <p className="text-muted-foreground text-center">
                يرجى تعديل الفلاتر أو إضافة بيانات للحصول على تقرير
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Reports;