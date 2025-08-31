import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Calendar, Users, TrendingUp, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_id: string | null;
  classes?: {
    name: string;
  };
}

interface Class {
  id: string;
  name: string;
}

interface AttendanceReport {
  student_id: string;
  student_name: string;
  student_code: string;
  class_name: string;
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  excused_days: number;
  attendance_rate: number;
}

interface MonthlyStats {
  month: string;
  total_students: number;
  avg_attendance_rate: number;
  total_absences: number;
}

const AttendanceReportsManager = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [reportData, setReportData] = useState<AttendanceReport[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('all');
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [reportType, setReportType] = useState<'monthly' | 'yearly' | 'range'>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState((new Date().getMonth() + 1).toString().padStart(2, '0'));
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const { tenant } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    if (tenant) {
      loadInitialData();
    }
  }, [tenant]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStudents(),
        loadClasses()
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

  const generateReport = async () => {
    if (!tenant) return;

    try {
      setLoading(true);
      
      let dateFilter = '';
      let params: any[] = [tenant.id];

      if (reportType === 'monthly') {
        dateFilter = `
          AND EXTRACT(YEAR FROM ae.date) = $2 
          AND EXTRACT(MONTH FROM ae.date) = $3
        `;
        params.push(parseInt(selectedYear), parseInt(selectedMonth));
      } else if (reportType === 'yearly') {
        dateFilter = 'AND EXTRACT(YEAR FROM ae.date) = $2';
        params.push(parseInt(selectedYear));
      } else if (reportType === 'range' && startDate && endDate) {
        dateFilter = 'AND ae.date >= $2 AND ae.date <= $3';
        params.push(startDate, endDate);
      }

      let studentFilter = '';
      if (selectedStudent !== 'all') {
        studentFilter = 'AND s.id = $' + (params.length + 1);
        params.push(selectedStudent);
      }

      let classFilter = '';
      if (selectedClass !== 'all') {
        classFilter = 'AND s.class_id = $' + (params.length + 1);
        params.push(selectedClass);
      }

      let statusFilter = '';
      if (selectedStatus !== 'all') {
        statusFilter = 'AND ae.status = $' + (params.length + 1);
        params.push(selectedStatus);
      }

      const query = `
        SELECT 
          s.id as student_id,
          s.full_name as student_name,
          s.student_id as student_code,
          COALESCE(c.name, 'غير محدد') as class_name,
          COUNT(ae.id) as total_days,
          COUNT(CASE WHEN ae.status = 'present' THEN 1 END) as present_days,
          COUNT(CASE WHEN ae.status = 'absent' THEN 1 END) as absent_days,
          COUNT(CASE WHEN ae.status = 'late' THEN 1 END) as late_days,
          COUNT(CASE WHEN ae.status = 'excused' THEN 1 END) as excused_days,
          ROUND(
            (COUNT(CASE WHEN ae.status IN ('present', 'late') THEN 1 END) * 100.0 / 
            NULLIF(COUNT(ae.id), 0)), 2
          ) as attendance_rate
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN attendance_events ae ON s.id = ae.student_id
        WHERE s.tenant_id = $1 
          AND s.is_active = true
          ${dateFilter}
          ${studentFilter}
          ${classFilter}
          ${statusFilter}
        GROUP BY s.id, s.full_name, s.student_id, c.name
        ORDER BY s.full_name
      `;

      // Execute the query using direct database access
      const { data, error } = await supabase
        .from('attendance_events')
        .select(`
          student_id,
          status,
          date,
          students!inner (
            id,
            full_name,
            student_id,
            classes (name)
          )
        `)
        .eq('tenant_id', tenant.id)
        .gte('date', reportType === 'yearly' ? `${selectedYear}-01-01` : 
             reportType === 'monthly' ? `${selectedYear}-${selectedMonth}-01` : startDate)
        .lte('date', reportType === 'yearly' ? `${selectedYear}-12-31` : 
             reportType === 'monthly' ? `${selectedYear}-${selectedMonth}-31` : endDate);

      if (error) throw error;

      // Process the data to create report format
      const studentStats = new Map<string, AttendanceReport>();
      
      data?.forEach((record: any) => {
        const studentId = record.student_id;
        const student = record.students;
        
        if (!studentStats.has(studentId)) {
          studentStats.set(studentId, {
            student_id: studentId,
            student_name: student.full_name,
            student_code: student.student_id,
            class_name: student.classes?.name || 'غير محدد',
            total_days: 0,
            present_days: 0,
            absent_days: 0,
            late_days: 0,
            excused_days: 0,
            attendance_rate: 0
          });
        }

        const stats = studentStats.get(studentId)!;
        stats.total_days++;
        
        switch (record.status) {
          case 'present':
            stats.present_days++;
            break;
          case 'absent':
            stats.absent_days++;
            break;
          case 'late':
            stats.late_days++;
            break;
          case 'excused':
            stats.excused_days++;
            break;
        }
        
        stats.attendance_rate = stats.total_days > 0 ? 
          Math.round(((stats.present_days + stats.late_days) / stats.total_days) * 100) : 0;
      });

      const reportArray = Array.from(studentStats.values());
      
      // Apply filters
      let filteredData = reportArray;
      
      if (selectedStudent !== 'all') {
        filteredData = filteredData.filter(item => item.student_id === selectedStudent);
      }
      
      if (selectedStatus !== 'all') {
        filteredData = filteredData.filter(item => {
          switch (selectedStatus) {
            case 'present': return item.present_days > 0;
            case 'absent': return item.absent_days > 0;
            case 'late': return item.late_days > 0;
            case 'excused': return item.excused_days > 0;
            default: return true;
          }
        });
      }

      setReportData(filteredData);

      toast({
        title: "تم إنشاء التقرير",
        description: `تم إنشاء تقرير الحضور بنجاح`,
      });
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

  const exportReport = () => {
    if (reportData.length === 0) {
      toast({
        title: "لا توجد بيانات للتصدير",
        description: "يرجى إنشاء التقرير أولاً",
        variant: "destructive",
      });
      return;
    }

    const csvData = [
      ['اسم الطالب', 'رقم الطالب', 'الفصل', 'إجمالي الأيام', 'الحضور', 'الغياب', 'التأخير', 'المعذور', 'معدل الحضور%'],
      ...reportData.map(item => [
        item.student_name,
        item.student_code,
        item.class_name,
        item.total_days,
        item.present_days,
        item.absent_days,
        item.late_days,
        item.excused_days,
        item.attendance_rate
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `تقرير_الحضور_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم تصدير التقرير",
      description: "تم تصدير التقرير بصيغة CSV بنجاح",
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'present':
        return <Badge className="bg-green-100 text-green-800">حاضر</Badge>;
      case 'absent':
        return <Badge className="bg-red-100 text-red-800">غائب</Badge>;
      case 'late':
        return <Badge className="bg-yellow-100 text-yellow-800">متأخر</Badge>;
      case 'excused':
        return <Badge className="bg-blue-100 text-blue-800">معذور</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">غير محدد</Badge>;
    }
  };

  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return 'text-green-600';
    if (rate >= 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" />
            تقارير الحضور والغياب
          </h2>
          <p className="text-gray-600 mt-1">إنشاء وتصدير تقارير الحضور المفصلة</p>
        </div>
      </div>

      <Tabs defaultValue="reports" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="reports">تقارير الحضور</TabsTrigger>
          <TabsTrigger value="alerts">التنبيهات والإشعارات</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-6">
          {/* Filters Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                فلاتر التقرير
              </CardTitle>
              <CardDescription>
                اختر المعايير لإنشاء التقرير المطلوب
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Report Type */}
                <div className="space-y-2">
                  <Label htmlFor="reportType">نوع التقرير</Label>
                  <Select value={reportType} onValueChange={(value: 'monthly' | 'yearly' | 'range') => setReportType(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر نوع التقرير" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">شهري</SelectItem>
                      <SelectItem value="yearly">سنوي</SelectItem>
                      <SelectItem value="range">فترة محددة</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Year Selection */}
                {(reportType === 'monthly' || reportType === 'yearly') && (
                  <div className="space-y-2">
                    <Label htmlFor="year">السنة</Label>
                    <Select value={selectedYear} onValueChange={setSelectedYear}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر السنة" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 5 }, (_, i) => {
                          const year = new Date().getFullYear() - i;
                          return (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Month Selection */}
                {reportType === 'monthly' && (
                  <div className="space-y-2">
                    <Label htmlFor="month">الشهر</Label>
                    <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الشهر" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => {
                          const month = (i + 1).toString().padStart(2, '0');
                          const monthNames = [
                            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
                            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
                          ];
                          return (
                            <SelectItem key={month} value={month}>
                              {monthNames[i]}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Date Range */}
                {reportType === 'range' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="startDate">من تاريخ</Label>
                      <Input
                        id="startDate"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="endDate">إلى تاريخ</Label>
                      <Input
                        id="endDate"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </>
                )}

                {/* Student Filter */}
                <div className="space-y-2">
                  <Label htmlFor="student">الطالب</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطالب" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الطلاب</SelectItem>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.full_name} - {student.student_id}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Class Filter */}
                <div className="space-y-2">
                  <Label htmlFor="class">الفصل</Label>
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

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label htmlFor="status">حالة الحضور</Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الحالة" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">جميع الحالات</SelectItem>
                      <SelectItem value="present">حاضر</SelectItem>
                      <SelectItem value="absent">غائب</SelectItem>
                      <SelectItem value="late">متأخر</SelectItem>
                      <SelectItem value="excused">معذور</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button 
                  onClick={generateReport} 
                  disabled={loading || (reportType === 'range' && (!startDate || !endDate))}
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  {loading ? 'جاري إنشاء التقرير...' : 'إنشاء التقرير'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={exportReport}
                  disabled={reportData.length === 0}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  تصدير CSV
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Report Results */}
          {reportData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  نتائج التقرير
                </CardTitle>
                <CardDescription>
                  إجمالي {reportData.length} طالب
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 px-4 py-2 text-right">اسم الطالب</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">رقم الطالب</th>
                        <th className="border border-gray-300 px-4 py-2 text-right">الفصل</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">إجمالي الأيام</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">الحضور</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">الغياب</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">التأخير</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">المعذور</th>
                        <th className="border border-gray-300 px-4 py-2 text-center">معدل الحضور</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-2">{item.student_name}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.student_code}</td>
                          <td className="border border-gray-300 px-4 py-2">{item.class_name}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center">{item.total_days}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center text-green-600">{item.present_days}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center text-red-600">{item.absent_days}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center text-yellow-600">{item.late_days}</td>
                          <td className="border border-gray-300 px-4 py-2 text-center text-blue-600">{item.excused_days}</td>
                          <td className={`border border-gray-300 px-4 py-2 text-center font-semibold ${getAttendanceColor(item.attendance_rate)}`}>
                            {item.attendance_rate}%
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                إعدادات التنبيهات
              </CardTitle>
              <CardDescription>
                تم تفعيل التنبيهات التلقائية للحالات التالية:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h3 className="font-semibold text-yellow-800">الغياب المتتالي</h3>
                  </div>
                  <p className="text-sm text-yellow-700">
                    يتم إرسال تنبيه عند غياب الطالب لأكثر من يومين متتاليين
                  </p>
                </div>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                    <h3 className="font-semibold text-red-800">الغياب المتفرق</h3>
                  </div>
                  <p className="text-sm text-red-700">
                    يتم إرسال تنبيه عند تجاوز 5 أيام غياب في الشهر الواحد
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    <h3 className="font-semibold text-blue-800">إشعارات أولياء الأمور</h3>
                  </div>
                  <p className="text-sm text-blue-700">
                    يتم إرسال إشعار واتساب فوري عند تسجيل الحضور أو الغياب
                  </p>
                </div>
                
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <h3 className="font-semibold text-green-800">تقارير دورية</h3>
                  </div>
                  <p className="text-sm text-green-700">
                    يتم إنشاء التقارير تلقائياً وإرسالها للمديرين والمعلمين
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AttendanceReportsManager;