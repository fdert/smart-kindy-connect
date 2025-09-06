import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import DemoAccountsManager from '@/components/DemoAccountsManager';
import TenantWhatsAppManager from '@/components/TenantWhatsAppManager';
import MarketingMessagesManager from '@/components/MarketingMessagesManager';
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
  AlertTriangle,
  Crown,
  Star,
  Zap,
  Trash2,
  Ban,
  MessageCircle,
  Key
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
  owner?: Array<{
    id: string;
    full_name: string;
    email: string;
    is_active: boolean;
  }>;
}

interface TenantSubscription {
  id: string;
  tenant_id: string;
  plan_type: string;
  start_date: string;
  end_date: string;
  status: string;
  price: number;
  features: any;
  tenant: {
    name: string;
  };
}

const SuperAdmin = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [subscriptions, setSubscriptions] = useState<TenantSubscription[]>([]);
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
      // Load tenants with owner info
      const { data: tenantsData, error: tenantsError } = await supabase
        .from('tenants')
        .select(`
          *,
          owner:users(
            id,
            full_name,
            email,
            is_active
          )
        `)
        .order('created_at', { ascending: false });

      if (tenantsError) throw tenantsError;
      setTenants(tenantsData || []);

      // Load tenant subscriptions
      const { data: subscriptionsData, error: subscriptionsError } = await supabase
        .from('tenant_subscriptions')
        .select(`
          *,
          tenant:tenants(name)
        `)
        .order('created_at', { ascending: false });

      if (subscriptionsError) throw subscriptionsError;
      setSubscriptions(subscriptionsData || []);

      // Calculate stats
      const totalTenants = tenantsData?.length || 0;
      const pendingTenants = tenantsData?.filter(t => t.status === 'pending').length || 0;
      const activeSubscriptions = subscriptionsData?.filter(s => s.status === 'active').length || 0;
      const monthlyRevenue = subscriptionsData?.reduce((sum, s) => 
        s.status === 'active' ? sum + Number(s.price) : sum, 0) || 0;

      setStats({
        totalTenants,
        pendingTenants,
        activeSubscriptions,
        monthlyRevenue
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
        title: approve ? t('superadmin.approved') : t('superadmin.cancelled'),
        description: approve ? t('superadmin.approve') + ' ' + t('common.success') : t('superadmin.reject') + ' ' + t('common.success'),
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

  const handleUserActivation = async (userId: string, activate: boolean) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({
          is_active: activate
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: activate ? "تم التفعيل" : "تم إلغاء التفعيل",
        description: activate ? "تم تفعيل حساب المدير بنجاح" : "تم إلغاء تفعيل حساب المدير",
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

  const handleDeleteTenant = async (tenantId: string, tenantName: string) => {
    if (!confirm(`هل أنت متأكد من حذف حضانة "${tenantName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: `تم حذف حضانة "${tenantName}" بنجاح`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSuspendTenant = async (tenantId: string, suspend: boolean) => {
    try {
      const { error } = await supabase
        .from('tenants')
        .update({
          status: suspend ? 'suspended' : 'approved'
        })
        .eq('id', tenantId);

      if (error) throw error;

      toast({
        title: suspend ? "تم الإيقاف" : "تم إلغاء الإيقاف",
        description: suspend ? "تم إيقاف الحضانة بنجاح" : "تم إلغاء إيقاف الحضانة",
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

  const handleSendLoginCredentials = async (tenantId: string, tenantName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-login-credentials', {
        body: { tenantId }
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: `تم إرسال بيانات تسجيل الدخول لحضانة "${tenantName}" عبر الواتساب`,
      });

    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "فشل في إرسال بيانات تسجيل الدخول",
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
              <h1 className="text-xl font-bold text-gray-900">{t('superadmin.title')}</h1>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  SA
                </AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-gray-700">{t('superadmin.admin')}</span>
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
                <CardTitle className="text-sm font-medium">{t('superadmin.total_tenants')}</CardTitle>
                <Building className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTenants}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('superadmin.pending_requests')}</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingTenants}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('superadmin.active_subscriptions')}</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{t('superadmin.monthly_revenue')}</CardTitle>
                <DollarSign className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.monthlyRevenue.toFixed(2)} {t('common.currency') || 'ر.س'}</div>
              </CardContent>
            </Card>
        </div>

        {/* التبويبات */}
        <Tabs defaultValue="tenants" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="tenants">{t('superadmin.tenants_management')}</TabsTrigger>
            <TabsTrigger value="subscriptions">{t('superadmin.subscriptions_management')}</TabsTrigger>
            <TabsTrigger value="payments">{t('superadmin.payments_reports')}</TabsTrigger>
            <TabsTrigger value="marketing">الرسائل التسويقية</TabsTrigger>
            <TabsTrigger value="settings">{t('superadmin.system_settings')}</TabsTrigger>
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
                        <TableHead>المدير</TableHead>
                        <TableHead>حالة الحضانة</TableHead>
                        <TableHead>حالة المدير</TableHead>
                        <TableHead>تاريخ التسجيل</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">{tenant.name}</TableCell>
                          <TableCell>{tenant.email}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{tenant.owner?.[0]?.full_name || 'غير محدد'}</span>
                              <span className="text-sm text-muted-foreground">{tenant.owner?.[0]?.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                          <TableCell>
                            {tenant.owner?.[0] && (
                              <Badge className={`${tenant.owner[0].is_active ? 'bg-green-500' : 'bg-red-500'} text-white`}>
                                {tenant.owner[0].is_active ? 'مفعل' : 'غير مفعل'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(tenant.created_at).toLocaleDateString('ar-SA')}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col space-y-2">
                              {/* إجراءات الحضانة */}
                              {tenant.status === 'pending' && (
                                <div className="flex flex-wrap gap-2">
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
                              
                              {/* إجراءات الحضانات المعتمدة */}
                              {tenant.status === 'approved' && (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSendLoginCredentials(tenant.id, tenant.name)}
                                    className="bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                                  >
                                    <Key className="h-4 w-4 ml-1" />
                                    إرسال بيانات الدخول
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSuspendTenant(tenant.id, true)}
                                    className="text-orange-600 border-orange-200 hover:bg-orange-50"
                                  >
                                    <Ban className="h-4 w-4 ml-1" />
                                    إيقاف مؤقت
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                                  >
                                    <Trash2 className="h-4 w-4 ml-1" />
                                    حذف
                                  </Button>
                                </div>
                              )}

                              {/* إجراءات الحضانات المعلقة */}
                              {tenant.status === 'suspended' && (
                                <div className="flex flex-wrap gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSuspendTenant(tenant.id, false)}
                                    className="bg-green-500 hover:bg-green-600"
                                  >
                                    <CheckCircle className="h-4 w-4 ml-1" />
                                    إلغاء الإيقاف
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleDeleteTenant(tenant.id, tenant.name)}
                                  >
                                    <Trash2 className="h-4 w-4 ml-1" />
                                    حذف
                                  </Button>
                                </div>
                              )}
                              
                              {/* إجراءات المدير */}
                              {tenant.owner?.[0] && tenant.status === 'approved' && (
                                <div className="flex flex-wrap gap-2 pt-2 border-t">
                                  {tenant.owner[0].is_active ? (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleUserActivation(tenant.owner[0].id, false)}
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                    >
                                      <AlertTriangle className="h-4 w-4 ml-1" />
                                      إلغاء تفعيل المدير
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      onClick={() => handleUserActivation(tenant.owner[0].id, true)}
                                      className="bg-blue-500 hover:bg-blue-600"
                                    >
                                      <CheckCircle className="h-4 w-4 ml-1" />
                                      تفعيل المدير
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
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
                        <TableHead>نوع الباقة</TableHead>
                        <TableHead>المبلغ</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ البداية</TableHead>
                        <TableHead>تاريخ الانتهاء</TableHead>
                        <TableHead>الإجراءات</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscriptions.map((subscription) => (
                      <TableRow key={subscription.id}>
                        <TableCell className="font-medium">
                          {subscription.tenant?.name}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-reverse space-x-2">
                            {subscription.plan_type === 'premium' ? (
                              <Crown className="h-4 w-4 text-purple-500" />
                            ) : subscription.plan_type === 'enterprise' ? (
                              <Zap className="h-4 w-4 text-yellow-500" />
                            ) : (
                              <Star className="h-4 w-4 text-blue-500" />
                            )}
                            <span>
                              {subscription.plan_type === 'premium' ? 'الباقة المميزة' 
                               : subscription.plan_type === 'enterprise' ? 'باقة المؤسسات'
                               : 'الباقة الأساسية'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{subscription.price} ر.س</TableCell>
                        <TableCell>{getStatusBadge(subscription.status)}</TableCell>
                        <TableCell>
                          {new Date(subscription.start_date).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          {new Date(subscription.end_date).toLocaleDateString('ar-SA')}
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-reverse space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                console.log('تجديد الاشتراك:', subscription.id);
                                toast({
                                  title: "تجديد الاشتراك",
                                  description: "سيتم إضافة هذه الميزة قريباً",
                                });
                              }}
                            >
                              تجديد
                            </Button>
                          </div>
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

          {/* تبويب الرسائل التسويقية */}
          <TabsContent value="marketing">
            <MarketingMessagesManager />
          </TabsContent>

          {/* تبويب الإعدادات */}
          <TabsContent value="settings">
            <div className="space-y-6">
              {/* إدارة الحسابات التجريبية */}
              <DemoAccountsManager />
              
              {/* إدارة إعدادات الواتساب للحضانات */}
              <TenantWhatsAppManager />
              
              <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                <CardHeader>
                  <CardTitle>إعدادات أخرى</CardTitle>
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
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SuperAdmin;