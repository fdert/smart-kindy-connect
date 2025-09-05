import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Calendar, 
  Star, 
  BookOpen,
  Clock,
  Image,
  FileText,
  MessageCircle,
  ClipboardCheck,
  CheckSquare,
  Settings,
  LogOut,
  NotebookPen,
  Award,
  UserCheck,
  School,
  MessageSquare,
  Clipboard,
  Building,
  Heart
} from 'lucide-react';

const TeacherDashboard = () => {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    totalAttendance: 0,
    weeklyRewards: 0,
    myClasses: 0,
    pendingAssignments: 0,
    activePermissions: 0,
    activeSurveys: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant?.id && user?.id) {
      loadTeacherStats();
    }
  }, [tenant, user]);

  const loadTeacherStats = async () => {
    try {
      setLoading(true);
      
      // جلب الفصول الخاصة بالمعلمة
      const { data: classesData } = await supabase
        .from('classes')
        .select('id')
        .eq('tenant_id', tenant?.id)
        .eq('teacher_id', user?.id);

      const classIds = classesData?.map(c => c.id) || [];

      if (classIds.length === 0) {
        setStats({
          totalStudents: 0,
          todayAttendance: 0,
          totalAttendance: 0,
          weeklyRewards: 0,
          myClasses: 0,
          pendingAssignments: 0,
          activePermissions: 0,
          activeSurveys: 0
        });
        setLoading(false);
        return;
      }

      // جلب الطلاب
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, is_active')
        .eq('tenant_id', tenant?.id)
        .in('class_id', classIds);

      // جلب الحضور اليوم
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance_events')
        .select('student_id, status')
        .eq('tenant_id', tenant?.id)
        .eq('date', today)
        .in('class_id', classIds);

      // جلب النجوم الأسبوعية
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('points')
        .eq('tenant_id', tenant?.id)
        .eq('awarded_by', user?.id)
        .gte('awarded_at', weekStart.toISOString());

      // جلب الواجبات المعلقة
      const { data: assignmentsData } = await supabase
        .from('assignments')
        .select('id')
        .eq('tenant_id', tenant?.id)
        .eq('teacher_id', user?.id)
        .eq('status', 'assigned');

      // جلب الأذونات النشطة
      const { data: permissionsData } = await supabase
        .from('permissions')
        .select('id')
        .eq('tenant_id', tenant?.id)
        .eq('created_by', user?.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      // جلب الاستطلاعات النشطة
      const { data: surveysData } = await supabase
        .from('surveys')
        .select('id')
        .eq('tenant_id', tenant?.id)
        .eq('created_by', user?.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      const totalStudents = studentsData?.length || 0;
      const activeStudents = studentsData?.filter(s => s.is_active).length || 0;
      const todayAttendance = attendanceData?.filter(a => a.status === 'present').length || 0;
      const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

      setStats({
        totalStudents: activeStudents,
        todayAttendance,
        totalAttendance: totalStudents,
        weeklyRewards,
        myClasses: classesData?.length || 0,
        pendingAssignments: assignmentsData?.length || 0,
        activePermissions: permissionsData?.length || 0,
        activeSurveys: surveysData?.length || 0
      });

    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  // استخراج الأحرف الأولى من الاسم للأفاتار
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || t('teacher.dashboard');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: t('common.error'),
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-reverse space-x-4">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg font-bold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.welcome')}، {fullName}</h1>
              <p className="text-lg text-gray-600">{t('teacher.dashboard')} - {tenant?.name || 'روضة غير محددة'}</p>
              <p className="text-sm text-gray-500">{t('teacher.dashboard')}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              {t('nav.settings')}
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              {t('nav.logout')}
            </Button>
          </div>
        </div>

        {/* لوحة المعلمة الأكاديمية */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <School className="h-6 w-6 text-blue-500" />
            إدارة التعليم والأنشطة
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">فصولي الدراسية</CardTitle>
              <BookOpen className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-600">{stats.myClasses}</div>
                  <p className="text-xs text-blue-700 flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    فصل تحت إشرافي
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-700">طلابي الأعزاء</CardTitle>
              <Users className="h-5 w-5 text-green-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-green-600">{stats.totalStudents}</div>
                  <p className="text-xs text-green-700 flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    طالب في فصولي
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">حضور اليوم</CardTitle>
              <Clock className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-amber-600">{stats.todayAttendance}</div>
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    من أصل {stats.totalAttendance} طالب
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-l-4 border-l-purple-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">نجوم التحفيز</CardTitle>
              <Star className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-purple-600">{stats.weeklyRewards}</div>
                  <p className="text-xs text-purple-700 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    نجمة منحتها هذا الأسبوع
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* {t('teacher.quick_actions')} */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* الطلاب */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/students')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Users className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('nav.students')}</CardTitle>
              </div>
              <CardDescription>
                {t('students.subtitle')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>

          {/* الحضور والغياب */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/attendance')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <UserCheck className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('nav.attendance')}</CardTitle>
              </div>
              <CardDescription>
                {t('teacher.mark_attendance')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>

          {/* الواجبات */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/assignments')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <FileText className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('teacher.recent_assignments')}</CardTitle>
              </div>
              <CardDescription>
                {t('teacher.add_assignment')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{t('superadmin.pending')}:</span>
                <span className="text-sm font-bold">{stats.pendingAssignments}</span>
              </div>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>

          {/* ملاحظات الطلاب */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/student-notes')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <NotebookPen className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('teacher.student_notes')}</CardTitle>
              </div>
              <CardDescription>
                {t('teacher.add_note')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>

          {/* نظام التحفيز */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/rewards')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Award className="h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('nav.rewards')}</CardTitle>
              </div>
              <CardDescription>
                {t('teacher.give_reward')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>

          {/* الفصول */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/classes')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <School className="h-5 w-5 text-cyan-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('nav.classes')}</CardTitle>
              </div>
              <CardDescription>
                {t('teacher.view_all_classes')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>

          {/* الألبوم اليومي */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/media')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Image className="h-5 w-5 text-pink-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('nav.media')}</CardTitle>
              </div>
              <CardDescription>
                {t('common.view')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>

          {/* الأذونات */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/permissions')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <CheckSquare className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('common.actions')}</CardTitle>
              </div>
              <CardDescription>
                {t('common.view')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{t('superadmin.active')}:</span>
                <span className="text-sm font-bold">{stats.activePermissions}</span>
              </div>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>

          {/* الاستطلاعات */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/surveys')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <MessageSquare className="h-5 w-5 text-violet-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('common.view')}</CardTitle>
              </div>
              <CardDescription>
                {t('common.view')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm">{t('superadmin.active')}:</span>
                <span className="text-sm font-bold">{stats.activeSurveys}</span>
              </div>
              <Button className="w-full">
                {t('common.view')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;