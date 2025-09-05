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
  DollarSign,
  TrendingUp,
  AlertCircle,
  Phone,
  BarChart3,
  PieChart
} from 'lucide-react';

const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    todayAttendance: 0,
    monthlyRevenue: 0,
    pendingFees: 0,
    weeklyRewards: 0,
    activePermissions: 0,
    activeSurveys: 0,
    mediaFiles: 0,
    studentNotes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant?.id && user?.id) {
      loadAdminStats();
    }
  }, [tenant, user]);

  const loadAdminStats = async () => {
    try {
      setLoading(true);
      
      // جلب إحصائيات الطلاب
      const { data: studentsData } = await supabase
        .from('students')
        .select('id, is_active')
        .eq('tenant_id', tenant?.id);

      // جلب إحصائيات المعلمين
      const { data: teachersData } = await supabase
        .from('users')
        .select('id, is_active')
        .eq('tenant_id', tenant?.id)
        .eq('role', 'teacher');

      // جلب إحصائيات الفصول
      const { data: classesData } = await supabase
        .from('classes')
        .select('id, is_active')
        .eq('tenant_id', tenant?.id);

      // جلب الحضور اليوم
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance_events')
        .select('student_id, status')
        .eq('tenant_id', tenant?.id)
        .eq('date', today);

      // جلب الرسوم المالية
      const { data: feesData } = await supabase
        .from('student_fees')
        .select('amount, status')
        .eq('tenant_id', tenant?.id);

      // جلب النجوم الأسبوعية
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('points')
        .eq('tenant_id', tenant?.id)
        .gte('awarded_at', weekStart.toISOString());

      // جلب الأذونات النشطة
      const { data: permissionsData } = await supabase
        .from('permissions')
        .select('id')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      // جلب الاستطلاعات النشطة
      const { data: surveysData } = await supabase
        .from('surveys')
        .select('id')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString());

      // جلب الملفات والألبوم
      const { data: mediaData } = await supabase
        .from('media')
        .select('id')
        .eq('tenant_id', tenant?.id);

      // جلب ملاحظات الطلاب
      const { data: notesData } = await supabase
        .from('student_notes')
        .select('id')
        .eq('tenant_id', tenant?.id);

      const totalStudents = studentsData?.length || 0;
      const activeStudents = studentsData?.filter(s => s.is_active).length || 0;
      const activeTeachers = teachersData?.filter(t => t.is_active).length || 0;
      const activeClasses = classesData?.filter(c => c.is_active).length || 0;
      const todayAttendance = attendanceData?.filter(a => a.status === 'present').length || 0;
      const monthlyRevenue = feesData?.filter(f => f.status === 'paid').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const pendingFees = feesData?.filter(f => f.status === 'pending').reduce((sum, f) => sum + Number(f.amount), 0) || 0;
      const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

      setStats({
        totalStudents,
        activeStudents,
        totalTeachers: activeTeachers,
        totalClasses: activeClasses,
        todayAttendance,
        monthlyRevenue,
        pendingFees,
        weeklyRewards,
        activePermissions: permissionsData?.length || 0,
        activeSurveys: surveysData?.length || 0,
        mediaFiles: mediaData?.length || 0,
        studentNotes: notesData?.length || 0
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

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || t('dashboard.welcome');

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-reverse space-x-4">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-lg font-bold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('dashboard.welcome')}، {fullName}</h1>
              <p className="text-lg text-gray-600">مدير الروضة - {tenant?.name || 'روضة غير محددة'}</p>
              <p className="text-sm text-gray-500">لوحة قيادة شاملة لإدارة الروضة</p>
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

        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* إجمالي الطلاب */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.activeStudents}</div>
                  <p className="text-xs text-muted-foreground">من أصل {stats.totalStudents} طالب</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* المعلمين */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المعلمين</CardTitle>
              <School className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                  <p className="text-xs text-muted-foreground">معلمين نشطين</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* الفصول */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الفصول</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">فصول نشطة</p>
                </>
              )}
            </CardContent>
          </Card>

          {/* الحضور اليوم */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">حضور اليوم</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.todayAttendance}</div>
                  <p className="text-xs text-muted-foreground">من {stats.activeStudents} طالب</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الإحصائيات المالية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.monthlyRevenue.toLocaleString()} ر.س</div>
                  <p className="text-xs text-muted-foreground">رسوم مدفوعة</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">رسوم معلقة</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.pendingFees.toLocaleString()} ر.س</div>
                  <p className="text-xs text-muted-foreground">رسوم غير مدفوعة</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النجوم هذا الأسبوع</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.weeklyRewards}</div>
                  <p className="text-xs text-muted-foreground">نجمة ممنوحة</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الملفات الإعلامية</CardTitle>
              <Image className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.mediaFiles}</div>
                  <p className="text-xs text-muted-foreground">صور وفيديوهات</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الإجراءات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* إدارة الطلاب */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/students')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Users className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">إدارة الطلاب</CardTitle>
              </div>
              <CardDescription>
                تسجيل وإدارة بيانات الطلاب والفصول
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                عرض الطلاب
              </Button>
            </CardContent>
          </Card>

          {/* إدارة المعلمين */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/teachers')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <School className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">إدارة المعلمين</CardTitle>
              </div>
              <CardDescription>
                إضافة وإدارة حسابات المعلمين والصلاحيات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                عرض المعلمين
              </Button>
            </CardContent>
          </Card>

          {/* التقارير والإحصائيات */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/reports')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <BarChart3 className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">التقارير والإحصائيات</CardTitle>
              </div>
              <CardDescription>
                عرض التقارير التفصيلية والإحصائيات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                عرض التقارير
              </Button>
            </CardContent>
          </Card>

          {/* النظام المالي */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/financial-system')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <DollarSign className="h-5 w-5 text-emerald-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">النظام المالي</CardTitle>
              </div>
              <CardDescription>
                إدارة الرسوم والمدفوعات والفواتير
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                النظام المالي
              </Button>
            </CardContent>
          </Card>

          {/* إدارة الحضور */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/attendance')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <UserCheck className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">متابعة الحضور</CardTitle>
              </div>
              <CardDescription>
                مراقبة الحضور والغياب والتأخير
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                عرض الحضور
              </Button>
            </CardContent>
          </Card>

          {/* إعدادات الروضة */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => navigate('/settings')}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Settings className="h-5 w-5 text-gray-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">إعدادات الروضة</CardTitle>
              </div>
              <CardDescription>
                إعدادات النظام والواتساب والاشتراك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                الإعدادات
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;