import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Building, 
  Users, 
  CreditCard, 
  FileText, 
  Settings,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'pending' | 'approved' | 'suspended' | 'cancelled';
  created_at: string;
  owner_id: string;
}

interface Subscription {
  id: string;
  tenant: {
    name: string;
  };
  plan: {
    name: string;
    name_ar: string;
  };
  status: 'active' | 'past_due' | 'cancelled' | 'suspended';
  amount: number;
  current_period_end: string;
}

const SuperAdmin = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTenants: 0,
    pendingTenants: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load tenants
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select('*')
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Load subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          tenant:tenants(name),
          plan:plans(name, name_ar)
        `)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;
      setSubscriptions(subscriptionsData || []);

      // Calculate stats
      const totalTenants = tenantsData?.length || 0;
      const pendingTenants = tenantsData?.filter(t => t.status === 'pending').length || 0;
      const activeSubscriptions = subscriptionsData?.filter(s => s.status === 'active').length || 0;
      const monthlyRevenue = subscriptionsData?.reduce((sum, s) => 
        s.status === 'active' ? sum + Number(s.amount) : sum, 0) || 0;

      setStats({
        totalTenants,
        pendingTenants,
        activeSubscriptions,
        monthlyRevenue
      });

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTenantApproval = async (tenantId: string, approve: boolean) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          status: approve ? 'approved' : 'cancelled',
          approved_at: approve ? new Date().toISOString() : null,
          approved_by: user?.id
        })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: approve ? "تم الاعتماد" : "تم الرفض",
        description: approve ? "تم اعتماد الحضانة بنجاح" : "تم رفض طلب التسجيل",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', color: 'bg-yellow-500' },
      approved: { label: 'مُعتمد', color: 'bg-green-500' },
      suspended: { label: 'مُعلق', color: 'bg-orange-500' },
      cancelled: { label: 'مُلغى', color: 'bg-red-500' },
      active: { label: 'نشط', color: 'bg-green-500' },
      past_due: { label: 'متأخر', color: 'bg-red-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config?.color} text-white`}>
        {config?.label || status}
      </Badge>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* شريط التنقل العلوي */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-4">
              <h1 className="text-xl font-bold text-gray-900">SmartKindy - لوحة الإدارة العامة</h1>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  SA
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">مدير عام</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الحضانات</CardTitle>
              <Building className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTenants}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">طلبات الانتظار</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingTenants}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الاشتراكات النشطة</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإيرادات الشهرية</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} ر.س</div>
            </CardContent>
          </Card>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="tenants" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="tenants">الحضانات</TabsTrigger>
            <TabsTrigger value="subscriptions">الاشتراكات</TabsTrigger>
            <TabsTrigger value="payments">المدفوعات</TabsTrigger>
            <TabsTrigger value="settings">الإعدادات</TabsTrigger>
          </TabsList>

          {/* تبويب الحضانات */}
          <TabsContent value="tenants">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader>
                <CardTitle>إدارة الحضانات</CardTitle>
                <CardDescription>
                  مراجعة طلبات التسجيل وإدارة الحضانات المسجلة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-muted-foreground mt-2">جاري التحميل...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>اسم الحضانة</TableHead>
                        <TableHead>البريد الإلكتروني</TableHead>
                        <TableHead>الهاتف</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ التسجيل</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell>{tenant.email}</TableCell>
                          <TableCell>{tenant.phone}</TableCell>
                          <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                          <TableCell>
                            {new Date(tenant.created_at).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            {tenant.status === 'pending' && (
                              <div className="flex space-x-reverse space-x-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleTenantApproval(tenant.id, true)}
                                  className="bg-green-500 hover:bg-green-600"
                                >
                                  <CheckCircle className="h-4 w-4 ml-1" />
                                  اعتماد
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleTenantApproval(tenant.id, false)}
                                >
                                  <XCircle className="h-4 w-4 ml-1" />
                                  رفض
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الاشتراكات */}
          <TabsContent value="subscriptions">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader>
                <CardTitle>إدارة الاشتراكات</CardTitle>
                <CardDescription>
                  متابعة اشتراكات الحضانات والخطط
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>اسم الحضانة</TableHead>
                      <TableHead>الخطة</TableHead>
                      <TableHead>المبلغ</TableHead>
                      <TableHead>الحالة</TableHead>
                      <TableHead>تاريخ الانتهاء</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          {subscription.tenant?.name}
                        </TableCell>
                        <TableCell>
                          {subscription.plan?.name_ar || subscription.plan?.name}
                        </TableCell>
                        <TableCell>{subscription.amount} ر.س</TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          {new Date(subscription.current_period_end).toLocaleDateString('ar-SA')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب المدفوعات */}
          <TabsContent value="payments">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader>
                <CardTitle>تقارير المدفوعات</CardTitle>
                <CardDescription>
                  متابعة المدفوعات والإيرادات
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">قريباً - تقارير المدفوعات التفصيلية</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب الإعدادات */}
          <TabsContent value="settings">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader>
                <CardTitle>إعدادات المنصة</CardTitle>
                <CardDescription>
                  إدارة الخطط والأسعار وإعدادات النظام
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-muted-foreground">قريباً - إعدادات النظام وإدارة المحتوى</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdmin;