import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { formatSaudiPhoneNumber, displaySaudiPhoneNumber } from '@/lib/phoneUtils';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import WhatsAppSettings from '@/components/WhatsAppSettings';
import { Settings as SettingsIcon, Building, Bell, MessageCircle, Shield, Palette, Clock } from 'lucide-react';

interface TenantInfo {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  logo_url: string | null;
}

const Settings = () => {
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { tenant, settings, updateSetting } = useTenant();
  const { toast } = useToast();

  const [generalSettings, setGeneralSettings] = useState({
    notifications_enabled: true,
    email_notifications: true,
    sms_notifications: false,
    whatsapp_notifications: true,
    daily_reports: true,
    weekly_reports: false,
    attendance_reminders: true,
    late_arrival_alerts: true,
    pickup_notifications: true,
    reward_notifications: true,
    media_sharing_enabled: true,
    public_album_default: false,
    auto_backup: true,
    session_timeout: 60,
    theme: 'light',
    language: 'ar'
  });

  useEffect(() => {
    if (tenant) {
      loadTenantInfo();
      loadSettings();
    }
  }, [tenant, settings]);

  const loadTenantInfo = async () => {
    if (!tenant) return;

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('*')
        .eq('id', tenant.id)
        .single();

      if (error) throw error;
      setTenantInfo(data);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل معلومات المؤسسة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = () => {
    // Load settings from tenant settings
    setGeneralSettings(prev => ({
      ...prev,
      ...settings
    }));
  };

  const handleTenantInfoUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantInfo || !tenant) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('tenants')
        .update({
          name: tenantInfo.name,
          email: tenantInfo.email,
          phone: tenantInfo.phone,
          address: tenantInfo.address,
          logo_url: tenantInfo.logo_url
        })
        .eq('id', tenant.id);

      if (error) throw error;

      toast({
        title: "تم تحديث معلومات المؤسسة",
        description: "تم حفظ التغييرات بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث المعلومات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = async (key: string, value: any) => {
    try {
      await updateSetting(key, value);
      setGeneralSettings(prev => ({ ...prev, [key]: value }));
      
      toast({
        title: "تم تحديث الإعداد",
        description: "تم حفظ التغيير بنجاح",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الإعداد",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الإعدادات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            الإعدادات
          </h1>
          <p className="text-gray-600 mt-1">إدارة إعدادات الحضانة والنظام</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="general">عام</TabsTrigger>
            <TabsTrigger value="notifications">الإشعارات</TabsTrigger>
            <TabsTrigger value="whatsapp">واتساب</TabsTrigger>
            <TabsTrigger value="security">الأمان</TabsTrigger>
            <TabsTrigger value="tenant">المؤسسة</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  الإعدادات العامة
                </CardTitle>
                <CardDescription>
                  إعدادات النظام الأساسية والتفضيلات العامة
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تفعيل النسخ الاحتياطي التلقائي</Label>
                        <p className="text-sm text-muted-foreground">نسخ احتياطي يومي للبيانات</p>
                      </div>
                      <Switch
                        checked={generalSettings.auto_backup}
                        onCheckedChange={(checked) => handleSettingChange('auto_backup', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>مشاركة الوسائط</Label>
                        <p className="text-sm text-muted-foreground">السماح بمشاركة الصور والفيديوهات</p>
                      </div>
                      <Switch
                        checked={generalSettings.media_sharing_enabled}
                        onCheckedChange={(checked) => handleSettingChange('media_sharing_enabled', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>الألبوم العام افتراضياً</Label>
                        <p className="text-sm text-muted-foreground">جعل الصور عامة بشكل افتراضي</p>
                      </div>
                      <Switch
                        checked={generalSettings.public_album_default}
                        onCheckedChange={(checked) => handleSettingChange('public_album_default', checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="session_timeout">مهلة انتهاء الجلسة (دقيقة)</Label>
                      <Input
                        id="session_timeout"
                        type="number"
                        min="15"
                        max="480"
                        value={generalSettings.session_timeout}
                        onChange={(e) => handleSettingChange('session_timeout', parseInt(e.target.value))}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="theme">المظهر</Label>
                      <select
                        id="theme"
                        value={generalSettings.theme}
                        onChange={(e) => handleSettingChange('theme', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="light">فاتح</option>
                        <option value="dark">داكن</option>
                        <option value="auto">تلقائي</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="language">اللغة</Label>
                      <select
                        id="language"
                        value={generalSettings.language}
                        onChange={(e) => handleSettingChange('language', e.target.value)}
                        className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background"
                      >
                        <option value="ar">العربية</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  إعدادات الإشعارات
                </CardTitle>
                <CardDescription>
                  تخصيص أنواع الإشعارات وطرق الإرسال
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>تفعيل الإشعارات</Label>
                      <p className="text-sm text-muted-foreground">تفعيل/إلغاء جميع الإشعارات</p>
                    </div>
                    <Switch
                      checked={generalSettings.notifications_enabled}
                      onCheckedChange={(checked) => handleSettingChange('notifications_enabled', checked)}
                    />
                  </div>

                  <Separator />
                  
                  <h4 className="text-lg font-semibold">طرق الإرسال</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>البريد الإلكتروني</Label>
                        <p className="text-xs text-muted-foreground">إشعارات عبر الإيميل</p>
                      </div>
                      <Switch
                        checked={generalSettings.email_notifications}
                        onCheckedChange={(checked) => handleSettingChange('email_notifications', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>الرسائل النصية</Label>
                        <p className="text-xs text-muted-foreground">إشعارات عبر SMS</p>
                      </div>
                      <Switch
                        checked={generalSettings.sms_notifications}
                        onCheckedChange={(checked) => handleSettingChange('sms_notifications', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>واتساب</Label>
                        <p className="text-xs text-muted-foreground">إشعارات عبر WhatsApp</p>
                      </div>
                      <Switch
                        checked={generalSettings.whatsapp_notifications}
                        onCheckedChange={(checked) => handleSettingChange('whatsapp_notifications', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                  </div>

                  <Separator />
                  
                  <h4 className="text-lg font-semibold">أنواع الإشعارات</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تذكير الحضور</Label>
                        <p className="text-xs text-muted-foreground">تذكير بتسجيل الحضور</p>
                      </div>
                      <Switch
                        checked={generalSettings.attendance_reminders}
                        onCheckedChange={(checked) => handleSettingChange('attendance_reminders', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تنبيه التأخير</Label>
                        <p className="text-xs text-muted-foreground">تنبيه عند تأخر الطلاب</p>
                      </div>
                      <Switch
                        checked={generalSettings.late_arrival_alerts}
                        onCheckedChange={(checked) => handleSettingChange('late_arrival_alerts', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>إشعارات الاستلام</Label>
                        <p className="text-xs text-muted-foreground">تأكيد استلام الطلاب</p>
                      </div>
                      <Switch
                        checked={generalSettings.pickup_notifications}
                        onCheckedChange={(checked) => handleSettingChange('pickup_notifications', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>إشعارات الجوائز</Label>
                        <p className="text-xs text-muted-foreground">إشعار عند منح جوائز</p>
                      </div>
                      <Switch
                        checked={generalSettings.reward_notifications}
                        onCheckedChange={(checked) => handleSettingChange('reward_notifications', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                  </div>

                  <Separator />
                  
                  <h4 className="text-lg font-semibold">التقارير الدورية</h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>التقارير اليومية</Label>
                        <p className="text-xs text-muted-foreground">تقرير يومي عن النشاطات</p>
                      </div>
                      <Switch
                        checked={generalSettings.daily_reports}
                        onCheckedChange={(checked) => handleSettingChange('daily_reports', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>التقارير الأسبوعية</Label>
                        <p className="text-xs text-muted-foreground">تقرير أسبوعي شامل</p>
                      </div>
                      <Switch
                        checked={generalSettings.weekly_reports}
                        onCheckedChange={(checked) => handleSettingChange('weekly_reports', checked)}
                        disabled={!generalSettings.notifications_enabled}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* WhatsApp Settings */}
          <TabsContent value="whatsapp">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  إعدادات واتساب
                </CardTitle>
                <CardDescription>
                  تكوين اتصال واتساب وإعداد الرسائل التلقائية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <WhatsAppSettings />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  إعدادات الأمان
                </CardTitle>
                <CardDescription>
                  إعدادات الحماية والأمان للنظام
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">كلمات المرور</h4>
                    <div>
                      <Label>الحد الأدنى لطول كلمة المرور</Label>
                      <Input
                        type="number"
                        min="6"
                        max="32"
                        defaultValue="8"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>طلب أحرف خاصة</Label>
                        <p className="text-sm text-muted-foreground">@#$%^&* في كلمة المرور</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>طلب أرقام</Label>
                        <p className="text-sm text-muted-foreground">رقم واحد على الأقل</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">الجلسات</h4>
                    <div>
                      <Label>عدد محاولات تسجيل الدخول</Label>
                      <Input
                        type="number"
                        min="3"
                        max="10"
                        defaultValue="5"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>مدة القفل بعد المحاولات الفاشلة (دقيقة)</Label>
                      <Input
                        type="number"
                        min="5"
                        max="60"
                        defaultValue="15"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>إنهاء الجلسات عند عدم النشاط</Label>
                        <p className="text-sm text-muted-foreground">إنهاء تلقائي للجلسات الخاملة</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className="text-lg font-semibold mb-4">سجل النشاطات</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تسجيل عمليات تسجيل الدخول</Label>
                        <p className="text-sm text-muted-foreground">حفظ معلومات تسجيل الدخول</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label>تسجيل التغييرات</Label>
                        <p className="text-sm text-muted-foreground">حفظ سجل بجميع التعديلات</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tenant Information */}
          <TabsContent value="tenant">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  معلومات المؤسسة
                </CardTitle>
                <CardDescription>
                  تحديث المعلومات الأساسية للحضانة أو المؤسسة
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tenantInfo && (
                  <form onSubmit={handleTenantInfoUpdate} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tenant_name">اسم المؤسسة</Label>
                        <Input
                          id="tenant_name"
                          value={tenantInfo.name}
                          onChange={(e) => setTenantInfo(prev => prev ? { ...prev, name: e.target.value } : null)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="tenant_email">البريد الإلكتروني</Label>
                        <Input
                          id="tenant_email"
                          type="email"
                          value={tenantInfo.email}
                          onChange={(e) => setTenantInfo(prev => prev ? { ...prev, email: e.target.value } : null)}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="tenant_phone">رقم الهاتف</Label>
                        <Input
                          id="tenant_phone"
                          value={displaySaudiPhoneNumber(tenantInfo.phone || '')}
                          onChange={(e) => {
                            const formatted = formatSaudiPhoneNumber(e.target.value);
                            setTenantInfo(prev => prev ? { ...prev, phone: formatted } : null);
                          }}
                        />
                      </div>
                      <div>
                        <Label htmlFor="tenant_logo">رابط الشعار</Label>
                        <Input
                          id="tenant_logo"
                          type="url"
                          value={tenantInfo.logo_url || ''}
                          onChange={(e) => setTenantInfo(prev => prev ? { ...prev, logo_url: e.target.value } : null)}
                          placeholder="https://example.com/logo.png"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="tenant_address">العنوان</Label>
                      <Textarea
                        id="tenant_address"
                        value={tenantInfo.address || ''}
                        onChange={(e) => setTenantInfo(prev => prev ? { ...prev, address: e.target.value } : null)}
                        rows={3}
                        placeholder="العنوان الكامل للمؤسسة..."
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={saving}>
                        {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;