import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { 
  Baby, 
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
  Heart,
  TrendingUp,
  AlertCircle,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

interface Child {
  id: string;
  full_name: string;
  student_id: string;
  photo_url?: string;
  class_name?: string;
}

const GuardianDashboard = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [children, setChildren] = useState<Child[]>([]);
  const [stats, setStats] = useState({
    totalChildren: 0,
    presentToday: 0,
    absentToday: 0,
    weeklyRewards: 0,
    unreadMessages: 0,
    upcomingEvents: 0,
    recentNotes: 0,
    pendingPermissions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadGuardianData();
    }
  }, [user]);

  const loadGuardianData = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات ولي الأمر
      const { data: guardianData } = await supabase
        .from('guardians')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!guardianData) {
        toast({
          title: "خطأ",
          description: "لا يمكن العثور على بيانات ولي الأمر",
          variant: "destructive",
        });
        return;
      }

      // جلب الأطفال المرتبطين بولي الأمر
      const { data: childrenLinks } = await supabase
        .from('guardian_student_links')
        .select(`
          student_id,
          students!inner(
            id,
            full_name,
            student_id,
            photo_url,
            is_active,
            classes(name)
          )
        `)
        .eq('guardian_id', guardianData.id);

      const childrenData: Child[] = childrenLinks?.map(link => ({
        id: link.students.id,
        full_name: link.students.full_name,
        student_id: link.students.student_id,
        photo_url: link.students.photo_url,
        class_name: link.students.classes?.name || 'غير محدد'
      })) || [];

      setChildren(childrenData);

      if (childrenData.length === 0) {
        setStats({
          totalChildren: 0,
          presentToday: 0,
          absentToday: 0,
          weeklyRewards: 0,
          unreadMessages: 0,
          upcomingEvents: 0,
          recentNotes: 0,
          pendingPermissions: 0
        });
        setLoading(false);
        return;
      }

      const childrenIds = childrenData.map(child => child.id);

      // جلب الحضور اليوم
      const today = new Date().toISOString().split('T')[0];
      const { data: attendanceData } = await supabase
        .from('attendance_events')
        .select('student_id, status')
        .eq('date', today)
        .in('student_id', childrenIds);

      // جلب النجوم الأسبوعية
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const { data: rewardsData } = await supabase
        .from('rewards')
        .select('points')
        .gte('awarded_at', weekStart.toISOString())
        .in('student_id', childrenIds);

      // جلب الملاحظات الحديثة (آخر أسبوع)
      const { data: notesData } = await supabase
        .from('student_notes')
        .select('id')
        .eq('is_private', false)
        .gte('created_at', weekStart.toISOString())
        .in('student_id', childrenIds);

      // جلب الأذونات المعلقة
      const { data: permissionsData } = await supabase
        .from('permission_responses')
        .select('permission_id')
        .eq('guardian_id', guardianData.id)
        .is('responded_at', null);

      const presentToday = attendanceData?.filter(a => a.status === 'present').length || 0;
      const absentToday = attendanceData?.filter(a => a.status === 'absent').length || 0;
      const weeklyRewards = rewardsData?.reduce((sum, r) => sum + r.points, 0) || 0;

      setStats({
        totalChildren: childrenData.length,
        presentToday,
        absentToday,
        weeklyRewards,
        unreadMessages: 0, // يمكن تطويرها لاحقاً
        upcomingEvents: 0, // يمكن تطويرها لاحقاً
        recentNotes: notesData?.length || 0,
        pendingPermissions: permissionsData?.length || 0
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

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'ولي الأمر';

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-rose-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-reverse space-x-4">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-pink-500 to-purple-500 text-white text-lg font-bold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">أهلاً وسهلاً، {fullName}</h1>
              <p className="text-lg text-gray-600">ولي أمر محب ومتابع</p>
              <p className="text-sm text-gray-500">متابعة أطفالكم بكل حب واهتمام</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              الإعدادات
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center gap-2 hover:bg-red-50 hover:border-red-200 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" />
              تسجيل خروج
            </Button>
          </div>
        </div>

        {/* أطفالي */}
        {children.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
              <Heart className="h-6 w-6 text-pink-500" />
              أطفالي الأعزاء
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {children.map((child) => (
                <Card key={child.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer" 
                      onClick={() => navigate(`/student-report/${child.id}`)}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-reverse space-x-4">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-400 text-white">
                          {getInitials(child.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{child.full_name}</h3>
                        <p className="text-sm text-gray-600">رقم الطالب: {child.student_id}</p>
                        <p className="text-xs text-gray-500">الفصل: {child.class_name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* متابعة يومية شاملة */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Heart className="h-6 w-6 text-pink-500" />
            متابعة أطفالي اليومية
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* عدد الأطفال */}
          <Card className="bg-gradient-to-br from-pink-50 to-rose-50 border-l-4 border-l-pink-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-pink-700">أطفالي الأحباء</CardTitle>
              <Baby className="h-5 w-5 text-pink-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-pink-600">{stats.totalChildren}</div>
                  <p className="text-xs text-pink-700 flex items-center gap-1">
                    <Heart className="h-3 w-3" />
                    طفل عزيز ومتابع
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* حضور اليوم */}
          <Card className="bg-gradient-to-br from-emerald-50 to-green-50 border-l-4 border-l-emerald-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-emerald-700">حضور اليوم</CardTitle>
              <Clock className="h-5 w-5 text-emerald-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-emerald-600">{stats.presentToday}</div>
                  <p className="text-xs text-emerald-700 flex items-center gap-1">
                    <UserCheck className="h-3 w-3" />
                    من أصل {stats.totalChildren} طفل
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* النجوم والإنجازات */}
          <Card className="bg-gradient-to-br from-amber-50 to-yellow-50 border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-amber-700">نجوم الأسبوع</CardTitle>
              <Star className="h-5 w-5 text-amber-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-amber-600">{stats.weeklyRewards}</div>
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    نجمة تحفيزية رائعة
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {/* التقارير والملاحظات */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">تقارير جديدة</CardTitle>
              <NotebookPen className="h-5 w-5 text-blue-600" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-blue-600">{stats.recentNotes}</div>
                  <p className="text-xs text-blue-700 flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    تقرير ومتابعة جديدة
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* الخدمات السريعة */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* تقارير الأطفال */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <FileText className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">تقارير الأطفال</CardTitle>
              </div>
              <CardDescription>
                مراجعة التقارير التفصيلية لأطفالكم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate(`/student-report/${child.id}`)}
                  >
                    تقرير {child.full_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* حضور الأطفال */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <UserCheck className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">متابعة الحضور</CardTitle>
              </div>
              <CardDescription>
                مراقبة حضور وغياب أطفالكم يومياً
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate(`/student-attendance/${child.id}`)}
                  >
                    حضور {child.full_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* نجوم التحفيز */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Award className="h-5 w-5 text-yellow-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">نجوم التحفيز</CardTitle>
              </div>
              <CardDescription>
                شاهدوا النجوم التي حصل عليها أطفالكم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate(`/student-rewards/${child.id}`)}
                  >
                    نجوم {child.full_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* الألبوم اليومي */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <Image className="h-5 w-5 text-pink-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">الألبوم اليومي</CardTitle>
              </div>
              <CardDescription>
                مشاهدة صور وأنشطة أطفالكم اليومية
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate(`/student-media/${child.id}`)}
                  >
                    ألبوم {child.full_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ملاحظات المعلمة */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <NotebookPen className="h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">ملاحظات المعلمة</CardTitle>
              </div>
              <CardDescription>
                قراءة ملاحظات المعلمة عن أطفالكم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate(`/student-notes/${child.id}`)}
                  >
                    ملاحظات {child.full_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* الواجبات */}
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-all cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-reverse space-x-2">
                <BookOpen className="h-5 w-5 text-indigo-500 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-lg">الواجبات</CardTitle>
              </div>
              <CardDescription>
                متابعة واجبات وأنشطة أطفالكم
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {children.map((child) => (
                  <Button
                    key={child.id}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => navigate(`/student-assignments/${child.id}`)}
                  >
                    واجبات {child.full_name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* رسالة ترحيبية إذا لم يكن لديه أطفال */}
        {children.length === 0 && !loading && (
          <div className="text-center py-12">
            <Baby className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">مرحباً بك في SmartKindy</h3>
            <p className="text-gray-500 mb-4">لا يوجد أطفال مسجلين تحت حسابك حالياً</p>
            <p className="text-sm text-gray-400">يرجى التواصل مع إدارة الروضة لربط أطفالك بحسابك</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuardianDashboard;