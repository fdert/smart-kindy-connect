import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/PageHeader';
import { 
  Users, 
  Calendar, 
  Star, 
  MessageCircle, 
  Settings, 
  LogOut,
  BookOpen,
  Clock,
  Award,
  Image,
  School,
  Building,
  UserCheck,
  Baby
} from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();
  const { tenant } = useTenant();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    totalAttendance: 0,
    weeklyRewards: 0,
    newMessages: 0,
    totalTenants: 0,
    myChildren: 0,
    myClasses: 0,
    presentToday: 0,
    totalClasses: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadUserRole();
    }
  }, [user]);

  useEffect(() => {
    if (userRole) {
      loadDashboardStats();
    }
  }, [userRole, tenant]);

  const loadUserRole = async () => {
    if (!user) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserRole(userData?.role);
    } catch (error: any) {
      console.error('Error loading user role:', error);
      setUserRole('guardian'); // default role
    }
  };

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      if (userRole === 'super_admin') {
        await loadSuperAdminStats();
      } else if (userRole === 'admin') {
        await loadAdminStats();
      } else if (userRole === 'teacher') {
        await loadTeacherStats();
      } else if (userRole === 'guardian') {
        await loadGuardianStats();
      }

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

  const loadSuperAdminStats = async () => {
    const { data: tenantsData } = await supabase
      .from('tenants')
      .select('id');

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, is_active');

    setStats({
      totalTenants: tenantsData?.length || 0,
      totalStudents: studentsData?.filter(s => s.is_active).length || 0,
      todayAttendance: 0,
      totalAttendance: studentsData?.length || 0,
      weeklyRewards: 0,
      newMessages: 0,
      myChildren: 0,
      myClasses: 0,
      presentToday: 0,
      totalClasses: 0
    });
  };

  const loadAdminStats = async () => {
    if (!tenant?.id) return;

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, is_active')
      .eq('tenant_id', tenant.id);

    const { data: classesData } = await supabase
      .from('classes')
      .select('id')
      .eq('tenant_id', tenant.id);

    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData } = await supabase
      .from('attendance_events')
      .select('student_id, status')
      .eq('tenant_id', tenant.id)
      .eq('date', today);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { data: rewardsData } = await supabase
      .from('rewards')
      .select('points')
      .eq('tenant_id', tenant.id)
      .gte('awarded_at', weekStart.toISOString());

    const totalStudents = studentsData?.length || 0;
    const activeStudents = studentsData?.filter(s => s.is_active).length || 0;
    const presentToday = attendanceData?.filter(a => a.status === 'present').length || 0;
    const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

    setStats({
      totalStudents: activeStudents,
      todayAttendance: presentToday,
      totalAttendance: totalStudents,
      weeklyRewards,
      newMessages: 0,
      totalTenants: 0,
      myChildren: 0,
      myClasses: 0,
      presentToday,
      totalClasses: classesData?.length || 0
    });
  };

  const loadTeacherStats = async () => {
    if (!tenant?.id || !user?.id) return;

    const { data: classesData } = await supabase
      .from('classes')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('teacher_id', user.id);

    const classIds = classesData?.map(c => c.id) || [];

    if (classIds.length === 0) {
      setStats({
        totalStudents: 0,
        todayAttendance: 0,
        totalAttendance: 0,
        weeklyRewards: 0,
        newMessages: 0,
        totalTenants: 0,
        myChildren: 0,
        myClasses: classesData?.length || 0,
        presentToday: 0,
        totalClasses: 0
      });
      return;
    }

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, is_active')
      .eq('tenant_id', tenant.id)
      .in('class_id', classIds);

    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData } = await supabase
      .from('attendance_events')
      .select('student_id, status')
      .eq('tenant_id', tenant.id)
      .eq('date', today)
      .in('class_id', classIds);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { data: rewardsData } = await supabase
      .from('rewards')
      .select('points')
      .eq('tenant_id', tenant.id)
      .gte('awarded_at', weekStart.toISOString())
      .in('student_id', studentsData?.map(s => s.id) || []);

    const totalStudents = studentsData?.length || 0;
    const activeStudents = studentsData?.filter(s => s.is_active).length || 0;
    const presentToday = attendanceData?.filter(a => a.status === 'present').length || 0;
    const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

    setStats({
      totalStudents: activeStudents,
      todayAttendance: presentToday,
      totalAttendance: totalStudents,
      weeklyRewards,
      newMessages: 0,
      totalTenants: 0,
      myChildren: 0,
      myClasses: classesData?.length || 0,
      presentToday,
      totalClasses: 0
    });
  };

  const loadGuardianStats = async () => {
    if (!user?.id) return;

    const { data: guardianData } = await supabase
      .from('guardians')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!guardianData) {
      setStats({
        totalStudents: 0,
        todayAttendance: 0,
        totalAttendance: 0,
        weeklyRewards: 0,
        newMessages: 0,
        totalTenants: 0,
        myChildren: 0,
        myClasses: 0,
        presentToday: 0,
        totalClasses: 0
      });
      return;
    }

    const { data: childrenLinks } = await supabase
      .from('guardian_student_links')
      .select('student_id')
      .eq('guardian_id', guardianData.id);

    const childrenIds = childrenLinks?.map(link => link.student_id) || [];

    if (childrenIds.length === 0) {
      setStats({
        totalStudents: 0,
        todayAttendance: 0,
        totalAttendance: 0,
        weeklyRewards: 0,
        newMessages: 0,
        totalTenants: 0,
        myChildren: 0,
        myClasses: 0,
        presentToday: 0,
        totalClasses: 0
      });
      return;
    }

    const { data: childrenData } = await supabase
      .from('students')
      .select('id, is_active')
      .in('id', childrenIds);

    const today = new Date().toISOString().split('T')[0];
    const { data: attendanceData } = await supabase
      .from('attendance_events')
      .select('student_id, status')
      .eq('date', today)
      .in('student_id', childrenIds);

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const { data: rewardsData } = await supabase
      .from('rewards')
      .select('points')
      .gte('awarded_at', weekStart.toISOString())
      .in('student_id', childrenIds);

    const myChildren = childrenData?.length || 0;
    const presentToday = attendanceData?.filter(a => a.status === 'present').length || 0;
    const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

    setStats({
      totalStudents: 0,
      todayAttendance: presentToday,
      totalAttendance: myChildren,
      weeklyRewards,
      newMessages: 0,
      totalTenants: 0,
      myChildren,
      myClasses: 0,
      presentToday,
      totalClasses: 0
    });
  };

  if (!user || !userRole) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || t('dashboard.welcome');

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'super_admin': return t('superadmin.admin');
      case 'admin': return t('superadmin.manager');
      case 'teacher': return t('teacher.dashboard');
      case 'guardian': return t('nav.guardians');
      default: return t('dashboard.welcome');
    }
  };

  const renderStatsCards = () => {
    if (userRole === 'super_admin') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('superadmin.total_tenants')}</CardTitle>
              <Building className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalTenants}</div>
                  <p className="text-xs text-muted-foreground">{t('superadmin.total_tenants')}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.total_students')}</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">{t('nav.students')}</p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      );
    }

    if (userRole === 'admin' || userRole === 'teacher') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.total_students')}</CardTitle>
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
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">{t('nav.students')}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.today_attendance')}</CardTitle>
              <Clock className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.presentToday}</div>
                  <p className="text-xs text-muted-foreground">{t('common.count')}: {stats.totalStudents}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('nav.classes')}</CardTitle>
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
                  <div className="text-2xl font-bold">{userRole === 'teacher' ? stats.myClasses : stats.totalClasses}</div>
                  <p className="text-xs text-muted-foreground">{t('nav.classes')}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.weekly_rewards')}</CardTitle>
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
                  <p className="text-xs text-muted-foreground">{t('dashboard.this_week')}</p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      );
    }

    if (userRole === 'guardian') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('nav.students')}</CardTitle>
              <Baby className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.myChildren}</div>
                  <p className="text-xs text-muted-foreground">{t('nav.students')}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.today_attendance')}</CardTitle>
              <UserCheck className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.presentToday}</div>
                  <p className="text-xs text-muted-foreground">{t('common.count')}: {stats.myChildren}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('dashboard.weekly_rewards')}</CardTitle>
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
                  <p className="text-xs text-muted-foreground">{t('dashboard.this_week')}</p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      );
    }
  };

  const renderQuickActions = () => {
    if (userRole === 'guardian') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => window.location.href = '/media'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Image className="h-5 w-5 text-pink-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('nav.media')}</CardTitle>
              </div>
              <CardDescription>
                {t('dashboard.view_media')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {t('dashboard.start_now')}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group" onClick={() => window.location.href = '/students'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Users className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">{t('nav.students')}</CardTitle>
              </div>
              <CardDescription>
                {t('dashboard.view_assignments')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                {t('dashboard.start_now')}
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title={`${t('dashboard.welcome')}، ${fullName}`}
          subtitle={`${getRoleTitle(userRole)} - ${tenant?.name || 'SmartKindy'}`}
          showBack={false}
        />

        {/* الإحصائيات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {renderStatsCards()}
        </div>

        {/* الإجراءات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderQuickActions()}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;