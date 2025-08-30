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
  Image
} from 'lucide-react';

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayAttendance: 0,
    totalAttendance: 0,
    weeklyRewards: 0,
    newMessages: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (tenant) {
      loadDashboardStats();
    }
  }, [tenant]);

  const loadDashboardStats = async () => {
    try {
      setLoading(true);
      
      // Load students count
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, is_active')
        .eq('tenant_id', tenant?.id);

      if (studentsError) throw studentsError;

      // Load today's attendance
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance_events')
        .select('student_id, status')
        .eq('tenant_id', tenant?.id)
        .eq('date', today);

      if (attendanceError) throw attendanceError;

      // Load this week's rewards
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: rewardsData, error: rewardsError } = await supabase
        .from('rewards')
        .select('points')
        .eq('tenant_id', tenant?.id)
        .gte('awarded_at', weekStart.toISOString());

      if (rewardsError) throw rewardsError;

      // Load messages count (placeholder for now)
      const { data: messagesData, error: messagesError } = await supabase
        .from('wa_messages')
        .select('id')
        .eq('tenant_id', tenant?.id)
        .eq('direction', 'inbound')
        .eq('processed', false);

      if (messagesError) throw messagesError;

      const totalStudents = studentsData?.length || 0;
      const activeStudents = studentsData?.filter(s => s.is_active).length || 0;
      const todayAttendance = attendanceData?.filter(a => a.status === 'present').length || 0;
      const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;
      const newMessages = messagesData?.length || 0;

      setStats({
        totalStudents: activeStudents,
        todayAttendance,
        totalAttendance: totalStudents,
        weeklyRewards,
        newMessages
      });

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

  if (!user) {
    return null;
  }

  // استخراج الأحرف الأولى من الاسم للأفاتار
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'مستخدم';

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
            مرحباً بك في لوحة تحكم SmartKindy. ابدأ بإدارة حضانتك بكل سهولة.
          </p>
        </div>

        {/* البطاقات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                  <p className="text-xs text-muted-foreground">
                    {stats.totalStudents > 0 ? 'طالب نشط' : 'لم يتم إضافة طلاب بعد'}
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    من أصل {stats.totalAttendance} طالب
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    هذا الأسبوع
                  </p>
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
                  <p className="text-xs text-muted-foreground">
                    رسائل جديدة
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الإجراءات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-start space-x-reverse space-x-2">
                <BookOpen className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <span>إدارة شاملة للطلاب والفصول</span>
              </div>
              <div className="flex items-start space-x-reverse space-x-2">
                <Clock className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>تتبع الحضور والغياب بكل سهولة</span>
              </div>
              <div className="flex items-start space-x-reverse space-x-2">
                <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>نظام تحفيز متقدم للطلاب</span>
              </div>
              <div className="flex items-start space-x-reverse space-x-2">
                <MessageCircle className="h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                <span>تكامل مع واتساب للتواصل</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;