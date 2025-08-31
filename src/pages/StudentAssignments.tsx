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
import { BookOpen, CheckCircle, Clock, AlertCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface AssignmentData {
  id: string;
  evaluation_status: string;
  evaluation_score: number | null;
  teacher_feedback: string | null;
  completion_date: string | null;
  evaluated_at: string;
  assignments: {
    title: string;
    description: string;
    assignment_type: string;
    due_date: string;
    priority: string;
  };
}

export default function StudentAssignments() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [assignments, setAssignments] = useState<AssignmentData[]>([]);
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
      // Check if this is a guardian access (public access)
      const isGuardianAccess = searchParams.get('guardian') === 'true';
      let tenantId: string;

      if (isGuardianAccess) {
        // For guardian access, we don't need tenant verification
        console.log('Guardian access mode - loading assignments for student:', studentId);
        
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

      // Load assignments with evaluations and proper date filtering (matching StudentReport query)
      const { data: assignmentsData, error: assignmentsError } = await supabase
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
        .lte('evaluated_at', dateRange.to.toISOString())
        .order('evaluated_at', { ascending: false });

      if (assignmentsError) {
        throw assignmentsError;
      }

      // Get assignment details for each evaluation (matching StudentReport approach)
      const evaluationsWithAssignments = [];
      if (assignmentsData && assignmentsData.length > 0) {
        for (const evaluation of assignmentsData) {
          const { data: assignmentDetail } = await supabase
            .from('assignments')
            .select('title, description, assignment_type, due_date, priority')
            .eq('id', evaluation.assignment_id)
            .single();

          if (assignmentDetail) {
            evaluationsWithAssignments.push({
              ...evaluation,
              assignments: assignmentDetail
            });
          }
        }
      }

      setAssignments(evaluationsWithAssignments);

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
      case 'completed': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'not_completed': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <Clock className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'not_completed': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              واجبات الطالب: {studentInfo?.full_name}
            </h1>
            <p className="text-gray-600">
              الفترة: {format(dateRange.from, 'dd MMM yyyy', { locale: ar })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">إجمالي الواجبات</p>
                  <p className="text-3xl font-bold">{assignments.length}</p>
                </div>
                <BookOpen className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">المكتملة</p>
                  <p className="text-3xl font-bold">
                    {assignments.filter(a => a.evaluation_status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">المعدل العام</p>
                  <p className="text-3xl font-bold">
                    {assignments.length > 0 
                      ? (assignments.reduce((sum, a) => sum + (a.evaluation_score || 0), 0) / assignments.length).toFixed(1)
                      : '0'
                    }
                  </p>
                </div>
                <BookOpen className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.length === 0 ? (
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardContent className="p-12 text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد واجبات</h3>
                <p className="text-gray-500">لم يتم تسجيل أي واجبات للطالب في هذه الفترة</p>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment) => (
              <Card key={assignment.id} className="bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3">
                      {getStatusIcon(assignment.evaluation_status)}
                      {assignment.assignments.title}
                    </CardTitle>
                    <div className="flex gap-2">
                      <Badge className={getStatusColor(assignment.evaluation_status)}>
                        {assignment.evaluation_status === 'completed' ? 'مكتمل' : 'غير مكتمل'}
                      </Badge>
                      <Badge className={getPriorityColor(assignment.assignments.priority)}>
                        {assignment.assignments.priority === 'high' ? 'عالية' :
                         assignment.assignments.priority === 'medium' ? 'متوسطة' : 'منخفضة'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">تفاصيل الواجب</h4>
                      <p className="text-gray-600 mb-2">{assignment.assignments.description}</p>
                      <div className="space-y-1 text-sm text-gray-500">
                        <p>النوع: {assignment.assignments.assignment_type === 'homework' ? 'واجب منزلي' : 
                                   assignment.assignments.assignment_type === 'task' ? 'مهمة' :
                                   assignment.assignments.assignment_type === 'project' ? 'مشروع' : 'نشاط'}</p>
                        <p>موعد التسليم: {format(new Date(assignment.assignments.due_date), 'dd MMM yyyy', { locale: ar })}</p>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">التقييم</h4>
                      {assignment.evaluation_score && (
                        <p className="text-lg font-bold text-green-600 mb-2">
                          النتيجة: {assignment.evaluation_score}
                        </p>
                      )}
                      {assignment.teacher_feedback && (
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 mb-1">ملاحظات المعلمة:</p>
                          <p className="text-blue-700">{assignment.teacher_feedback}</p>
                        </div>
                      )}
                    </div>
                  </div>
                     <div className="text-sm text-gray-500 border-t pt-3">
                       <div className="flex justify-between">
                         <span>تاريخ التقييم: {format(new Date(assignment.evaluated_at), 'dd MMM yyyy', { locale: ar })}</span>
                         {assignment.completion_date && (
                           <span>تاريخ الإكمال: {format(new Date(assignment.completion_date), 'dd MMM yyyy', { locale: ar })}</span>
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