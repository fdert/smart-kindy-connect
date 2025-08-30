import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
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
    myClasses: 0
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
        title: "خطأ في تحميل الإحصائيات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSuperAdminStats = async () => {
    // إحصائيات المدير العام - جميع الروضات
    const { data: tenantsData } = await supabase
      .from('tenants')
      .select('id');

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, is_active');

    const { data: messagesData } = await supabase
      .from('wa_messages')
      .select('id')
      .eq('direction', 'inbound')
      .eq('processed', false);

    setStats({
      totalTenants: tenantsData?.length || 0,
      totalStudents: studentsData?.filter(s => s.is_active).length || 0,
      todayAttendance: 0,
      totalAttendance: studentsData?.length || 0,
      weeklyRewards: 0,
      newMessages: messagesData?.length || 0,
      myChildren: 0,
      myClasses: 0
    });
  };

  const loadAdminStats = async () => {
    // إحصائيات مدير الروضة - روضته فقط
    if (!tenant?.id) return;

    const { data: studentsData } = await supabase
      .from('students')
      .select('id, is_active')
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

    const { data: messagesData } = await supabase
      .from('wa_messages')
      .select('id')
      .eq('tenant_id', tenant.id)
      .eq('direction', 'inbound')
      .eq('processed', false);

    const totalStudents = studentsData?.length || 0;
    const activeStudents = studentsData?.filter(s => s.is_active).length || 0;
    const todayAttendance = attendanceData?.filter(a => a.status === 'present').length || 0;
    const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

    setStats({
      totalStudents: activeStudents,
      todayAttendance,
      totalAttendance: totalStudents,
      weeklyRewards,
      newMessages: messagesData?.length || 0,
      totalTenants: 0,
      myChildren: 0,
      myClasses: 0
    });
  };

  const loadTeacherStats = async () => {
    // إحصائيات المعلمة - فصولها فقط
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
        myClasses: classesData?.length || 0
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
    const todayAttendance = attendanceData?.filter(a => a.status === 'present').length || 0;
    const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

    setStats({
      totalStudents: activeStudents,
      todayAttendance,
      totalAttendance: totalStudents,
      weeklyRewards,
      newMessages: 0,
      totalTenants: 0,
      myChildren: 0,
      myClasses: classesData?.length || 0
    });
  };

  const loadGuardianStats = async () => {
    // إحصائيات ولي الأمر - أطفاله فقط
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
        myClasses: 0
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
        myClasses: 0
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
    const todayAttendance = attendanceData?.filter(a => a.status === 'present').length || 0;
    const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

    setStats({
      totalStudents: 0,
      todayAttendance,
      totalAttendance: myChildren,
      weeklyRewards,
      newMessages: 0,
      totalTenants: 0,
      myChildren,
      myClasses: 0
    });
  };

  if (!user || !userRole) {
    return null;
  }

  // استخراج الأحرف الأولى من الاسم للأفاتار
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم';

  const getRoleTitle = (role: string) => {
    switch (role) {
      case 'super_admin': return 'مدير عام النظام';
      case 'admin': return 'مدير الروضة';
      case 'teacher': return 'معلمة';
      case 'guardian': return 'ولي أمر';
      default: return 'مستخدم';
    }
  };

  const renderStatsCards = () => {
    if (userRole === 'super_admin') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الروضات</CardTitle>
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
                  <p className="text-xs text-muted-foreground">روضة مسجلة</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
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
                  <p className="text-xs text-muted-foreground">طالب نشط</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرسائل</CardTitle>
              <MessageCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.newMessages}</div>
                  <p className="text-xs text-muted-foreground">رسائل جديدة</p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      );
    }

    if (userRole === 'admin') {
      return (
        <>
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
                  <div className="text-2xl font-bold">{stats.totalStudents}</div>
                  <p className="text-xs text-muted-foreground">طالب نشط</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحضور اليوم</CardTitle>
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
                  <div className="text-2xl font-bold">{stats.todayAttendance}</div>
                  <p className="text-xs text-muted-foreground">من أصل {stats.totalAttendance} طالب</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النجوم الممنوحة</CardTitle>
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
                  <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الرسائل</CardTitle>
              <MessageCircle className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.newMessages}</div>
                  <p className="text-xs text-muted-foreground">رسائل جديدة</p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      );
    }

    if (userRole === 'teacher') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">فصولي</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-2xl font-bold">{stats.myClasses}</div>
                  <p className="text-xs text-muted-foreground">فصل دراسي</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلابي</CardTitle>
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
                  <p className="text-xs text-muted-foreground">طالب في فصولي</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحضور اليوم</CardTitle>
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
                  <p className="text-xs text-muted-foreground">من أصل {stats.totalAttendance} طالب</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النجوم الممنوحة</CardTitle>
              <Star className="h-4 w-4 text-purple-500" />
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
                  <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
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
              <CardTitle className="text-sm font-medium">أطفالي</CardTitle>
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
                  <p className="text-xs text-muted-foreground">طفل مسجل</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الحضور اليوم</CardTitle>
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
                  <div className="text-2xl font-bold">{stats.todayAttendance}</div>
                  <p className="text-xs text-muted-foreground">من أصل {stats.myChildren} طفل</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">النجوم المكتسبة</CardTitle>
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
                  <p className="text-xs text-muted-foreground">هذا الأسبوع</p>
                </>
              )}
            </CardContent>
          </Card>
        </>
      );
    }
  };

  const renderQuickActions = () => {
    if (userRole === 'super_admin') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/super-admin'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Settings className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">إدارة النظام</CardTitle>
              </div>
              <CardDescription>
                إدارة الروضات والمستخدمين والاشتراكات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Building className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">الروضات</CardTitle>
              </div>
              <CardDescription>
                مراجعة وإدارة جميع الروضات المسجلة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Users className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">المستخدمين</CardTitle>
              </div>
              <CardDescription>
                إدارة حسابات المستخدمين والصلاحيات
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }

    if (userRole === 'admin') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/students'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Users className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">إدارة الطلاب</CardTitle>
              </div>
              <CardDescription>
                إضافة وإدارة معلومات الطلاب والفصول
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/attendance'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Calendar className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">الحضور والغياب</CardTitle>
              </div>
              <CardDescription>
                تسجيل وتتبع حضور الطلاب يومياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/rewards'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">نظام التحفيز</CardTitle>
              </div>
              <CardDescription>
                منح النجوم والأوسمة للطلاب المتميزين
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/media'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Image className="h-5 w-5 text-pink-500" />
                <CardTitle className="text-lg">الألبوم اليومي</CardTitle>
              </div>
              <CardDescription>
                مشاركة صور وأنشطة الطلاب مع الأولياء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/classes'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-lg">الفصول</CardTitle>
              </div>
              <CardDescription>
                إنشاء وإدارة الفصول الدراسية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <MessageCircle className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">واتساب</CardTitle>
              </div>
              <CardDescription>
                إرسال الإشعارات والرسائل للأولياء
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                قريباً
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }

    if (userRole === 'teacher') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/classes'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">فصولي</CardTitle>
              </div>
              <CardDescription>
                إدارة الفصول والطلاب المكلفة بهم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/attendance'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <UserCheck className="h-5 w-5 text-green-500" />
                <CardTitle className="text-lg">الحضور والغياب</CardTitle>
              </div>
              <CardDescription>
                تسجيل حضور طلاب فصولي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/rewards'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Star className="h-5 w-5 text-yellow-500" />
                <CardTitle className="text-lg">تحفيز الطلاب</CardTitle>
              </div>
              <CardDescription>
                منح النجوم والأوسمة لطلابي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }

    if (userRole === 'guardian') {
      return (
        <>
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Baby className="h-5 w-5 text-blue-500" />
                <CardTitle className="text-lg">أطفالي</CardTitle>
              </div>
              <CardDescription>
                عرض معلومات وإنجازات أطفالي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" onClick={() => window.location.href = '/media'}>
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Image className="h-5 w-5 text-pink-500" />
                <CardTitle className="text-lg">الألبوم اليومي</CardTitle>
              </div>
              <CardDescription>
                مشاهدة صور وأنشطة أطفالي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                ابدأ الآن
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <MessageCircle className="h-5 w-5 text-purple-500" />
                <CardTitle className="text-lg">الإشعارات</CardTitle>
              </div>
              <CardDescription>
                تلقي التحديثات عن أطفالي
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" disabled>
                قريباً
              </Button>
            </CardContent>
          </Card>
        </>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <Navigation />
      {/* المحتوى الرئيسي */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ترحيب */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            مرحباً بك، {fullName}
          </h2>
          <p className="text-gray-600">
            مرحباً بك في لوحة تحكم SmartKindy - {getRoleTitle(userRole)}
          </p>
        </div>

        {/* البطاقات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {renderStatsCards()}
        </div>

        {/* الإجراءات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {renderQuickActions()}
        </div>

        {/* رسالة ترحيبية */}
        <Card className="mt-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-0">
          <CardHeader>
            <CardTitle className="text-xl flex items-center space-x-reverse space-x-2">
              <Award className="h-6 w-6 text-primary" />
              <span>مرحباً بك في SmartKindy!</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              نحن سعداء لانضمامك إلى منصة SmartKindy. هذه المنصة قيد التطوير وستكون جاهزة قريباً بجميع الميزات المطلوبة لإدارة حضانتك بكل سهولة وفعالية.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;