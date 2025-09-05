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
  Settings,
  LogOut,
  Users,
  Building2,
  Database,
  Shield,
  Activity,
  BarChart3,
  Server,
  Mail,
  Globe,
  Zap,
  Monitor,
  FileText,
  Cog,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp
} from 'lucide-react';

const DemoSystemAdminDashboard = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalTenants: 0,
    activeTenants: 0,
    totalUsers: 0,
    activeUsers: 0,
    systemHealth: 98.5,
    todayLogins: 0,
    pendingRegistrations: 0,
    systemAlerts: 2
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSystemStats();
  }, []);

  const loadSystemStats = async () => {
    try {
      setLoading(true);
      
      // جلب إحصائيات الحضانات
      const { data: tenantsData } = await supabase
        .from('tenants')
        .select('id, status');

      // جلب إحصائيات المستخدمين
      const { data: usersData } = await supabase
        .from('users')
        .select('id, is_active');

      // جلب الحضانات المعلقة
      const { data: pendingData } = await supabase
        .from('tenants')
        .select('id')
        .eq('status', 'pending');

      const totalTenants = tenantsData?.length || 0;
      const activeTenants = tenantsData?.filter(t => t.status === 'approved').length || 0;
      const totalUsers = usersData?.length || 0;
      const activeUsers = usersData?.filter(u => u.is_active).length || 0;
      const pendingRegistrations = pendingData?.length || 0;

      setStats({
        totalTenants,
        activeTenants,
        totalUsers,
        activeUsers,
        systemHealth: 98.5,
        todayLogins: Math.floor(Math.random() * 150) + 50,
        pendingRegistrations,
        systemAlerts: 2
      });

    } catch (error: any) {
      toast({
        title: 'خطأ',
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

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'مدير النظام';

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error: any) {
      toast({
        title: 'خطأ',
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-reverse space-x-4">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              <AvatarFallback className="bg-gradient-to-br from-red-500 to-orange-500 text-white text-lg font-bold">
                {getInitials(fullName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-white">مرحباً، {fullName}</h1>
              <p className="text-lg text-blue-200">لوحة تحكم مدير النظام التجريبي</p>
              <p className="text-sm text-blue-300">إدارة وإشراف شامل على النظام</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <Settings className="h-4 w-4" />
              الإعدادات
            </Button>
            <Button 
              variant="outline" 
              onClick={handleSignOut}
              className="flex items-center gap-2 bg-red-500/20 border-red-400/30 text-red-200 hover:bg-red-500/30"
            >
              <LogOut className="h-4 w-4" />
              تسجيل الخروج
            </Button>
          </div>
        </div>

        {/* عنوان النظام */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2 text-white">
            <Monitor className="h-6 w-6 text-blue-400" />
            إحصائيات النظام العامة
          </h2>
        </div>
        
        {/* الإحصائيات الرئيسية */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-600 to-blue-700 border-0 shadow-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الحضانات</CardTitle>
              <Building2 className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-blue-400/20 rounded mb-2"></div>
                  <div className="h-4 bg-blue-400/20 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats.totalTenants}</div>
                  <p className="text-xs text-blue-200 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {stats.activeTenants} نشطة
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-600 to-green-700 border-0 shadow-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي المستخدمين</CardTitle>
              <Users className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-green-400/20 rounded mb-2"></div>
                  <div className="h-4 bg-green-400/20 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats.totalUsers}</div>
                  <p className="text-xs text-green-200 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    {stats.activeUsers} نشط
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600 to-purple-700 border-0 shadow-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">صحة النظام</CardTitle>
              <Server className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-purple-400/20 rounded mb-2"></div>
                  <div className="h-4 bg-purple-400/20 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats.systemHealth}%</div>
                  <p className="text-xs text-purple-200 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    ممتازة
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-600 to-orange-700 border-0 shadow-xl text-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">تسجيلات اليوم</CardTitle>
              <Clock className="h-5 w-5 text-orange-200" />
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="animate-pulse">
                  <div className="h-8 bg-orange-400/20 rounded mb-2"></div>
                  <div className="h-4 bg-orange-400/20 rounded w-3/4"></div>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold">{stats.todayLogins}</div>
                  <p className="text-xs text-orange-200 flex items-center gap-1">
                    <Activity className="h-3 w-3" />
                    دخول جديد
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* أدوات الإدارة */}
        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-white">
            <Cog className="h-5 w-5 text-blue-400" />
            أدوات الإدارة والتحكم
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
          {/* إدارة الحضانات */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl hover:bg-white/20 transition-all cursor-pointer group text-white" onClick={() => navigate('/super-admin')}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <Building2 className="h-6 w-6 text-blue-300 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base">إدارة الحضانات</CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-300">
                الموافقة على التسجيلات وإدارة الحضانات
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-blue-300 mb-1">{stats.pendingRegistrations}</div>
              <div className="text-xs text-gray-300">طلب معلق</div>
            </CardContent>
          </Card>

          {/* إدارة المستخدمين */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl hover:bg-white/20 transition-all cursor-pointer group text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <Users className="h-6 w-6 text-green-300 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base">إدارة المستخدمين</CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-300">
                إدارة حسابات المستخدمين والصلاحيات
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="secondary" size="sm" className="w-full">
                عرض المستخدمين
              </Button>
            </CardContent>
          </Card>

          {/* إعدادات النظام */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl hover:bg-white/20 transition-all cursor-pointer group text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <Settings className="h-6 w-6 text-purple-300 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base">إعدادات النظام</CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-300">
                تكوين الإعدادات العامة للنظام
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="secondary" size="sm" className="w-full">
                الإعدادات
              </Button>
            </CardContent>
          </Card>

          {/* مراقبة النظام */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl hover:bg-white/20 transition-all cursor-pointer group text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <Monitor className="h-6 w-6 text-orange-300 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base">مراقبة النظام</CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-300">
                مراقبة الأداء والأمان
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold text-orange-300 mb-1">{stats.systemAlerts}</div>
              <div className="text-xs text-gray-300">تنبيه نشط</div>
            </CardContent>
          </Card>

          {/* إدارة قاعدة البيانات */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl hover:bg-white/20 transition-all cursor-pointer group text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <Database className="h-6 w-6 text-teal-300 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base">قاعدة البيانات</CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-300">
                إدارة وصيانة قاعدة البيانات
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="secondary" size="sm" className="w-full">
                عرض الحالة
              </Button>
            </CardContent>
          </Card>

          {/* الأمان والحماية */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl hover:bg-white/20 transition-all cursor-pointer group text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <Shield className="h-6 w-6 text-red-300 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base">الأمان والحماية</CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-300">
                إعدادات الأمان وسجلات الوصول
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="secondary" size="sm" className="w-full">
                سجل الأمان
              </Button>
            </CardContent>
          </Card>

          {/* التقارير والإحصائيات */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl hover:bg-white/20 transition-all cursor-pointer group text-white">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <BarChart3 className="h-6 w-6 text-indigo-300 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base">التقارير</CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-300">
                تقارير شاملة عن النظام
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="secondary" size="sm" className="w-full">
                عرض التقارير
              </Button>
            </CardContent>
          </Card>

          {/* إدارة المحتوى */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-xl hover:bg-white/20 transition-all cursor-pointer group text-white" onClick={() => navigate('/cms-management')}>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-reverse space-x-2">
                <Globe className="h-6 w-6 text-cyan-300 group-hover:scale-110 transition-transform" />
                <CardTitle className="text-base">إدارة المحتوى</CardTitle>
              </div>
              <CardDescription className="text-xs text-gray-300">
                إدارة محتوى الموقع والصفحات
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button variant="secondary" size="sm" className="w-full">
                إدارة المحتوى
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* لوحة المعلومات السريعة */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* إحصائيات النشاط */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-300" />
                نشاط النظام (آخر 24 ساعة)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-300" />
                    <span className="text-sm">تسجيلات دخول جديدة</span>
                  </div>
                  <span className="text-sm font-bold">{stats.todayLogins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-blue-300" />
                    <span className="text-sm">حضانات جديدة</span>
                  </div>
                  <span className="text-sm font-bold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-300" />
                    <span className="text-sm">تنبيهات النظام</span>
                  </div>
                  <span className="text-sm font-bold">{stats.systemAlerts}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-300" />
                    <span className="text-sm">حالة الخوادم</span>
                  </div>
                  <span className="text-sm font-bold text-green-300">ممتازة</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* إجراءات سريعة */}
          <Card className="bg-white/10 backdrop-blur-sm border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-300" />
                إجراءات سريعة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
                  onClick={() => navigate('/super-admin')}
                >
                  <Building2 className="h-4 w-4" />
                  الموافقة على حضانة جديدة
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <Users className="h-4 w-4" />
                  إضافة مستخدم جديد
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <FileText className="h-4 w-4" />
                  إنشاء تقرير شامل
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2 bg-white/10 border-white/30 text-white hover:bg-white/20"
                >
                  <Mail className="h-4 w-4" />
                  إرسال إشعار عام
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DemoSystemAdminDashboard;