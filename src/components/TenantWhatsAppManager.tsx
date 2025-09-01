import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle, Settings, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface Tenant {
  id: string;
  name: string;
  status: string;
}

interface WebhookConfig {
  tenantId: string;
  webhookUrl: string;
  webhookSecret: string;
}

const TenantWhatsAppManager = () => {
  const { toast } = useToast();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<string>('');
  const [webhookConfig, setWebhookConfig] = useState<WebhookConfig>({
    tenantId: '',
    webhookUrl: '',
    webhookSecret: ''
  });
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (selectedTenant) {
      fetchTenantWebhookSettings(selectedTenant);
    }
  }, [selectedTenant]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id, name, status')
        .eq('status', 'approved')
        .order('name');

      if (error) throw error;
      setTenants(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل قائمة الحضانات",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTenantWebhookSettings = async (tenantId: string) => {
    try {
      const { data, error } = await supabase
        .from('tenant_settings')
        .select('key, value')
        .eq('tenant_id', tenantId)
        .in('key', ['wa_webhook_url', 'wa_webhook_secret']);

      if (error) throw error;

      const settingsMap = data?.reduce((acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      }, {} as Record<string, any>) || {};

      setWebhookConfig({
        tenantId,
        webhookUrl: settingsMap.wa_webhook_url || '',
        webhookSecret: settingsMap.wa_webhook_secret || ''
      });
      setConnectionStatus('unknown');
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل إعدادات الواتساب",
        variant: "destructive",
      });
    }
  };

  const createDefaultTemplates = async (tenantId: string) => {
    const defaultTemplates = {
      login_credentials: "🔐 بيانات تسجيل الدخول - SmartKindy\n\n🏛️ حضانة: {{nurseryName}}\n\n👤 اسم المستخدم:\n📧 {{email}}\n\n🔐 كلمة المرور:\n🔑 {{tempPassword}}\n\n🌐 رابط تسجيل الدخول:\nhttps://smartkindy.com/auth\n\n⚠️ ملاحظة هامة:\n• كلمة المرور صالحة لمدة 24 ساعة\n• مطلوب تغيير كلمة المرور عند أول تسجيل دخول\n• احتفظ بهذه البيانات في مكان آمن\n\n📞 للدعم الفني: 920012345\n🌟 SmartKindy - منصة إدارة رياض الأطفال الذكية",
      permission_request: "🔔 طلب إذن جديد\n\nعزيز/ة {{guardianName}} ✨\n\nيطلب منكم الموافقة على: {{permissionTitle}}\n\n📝 التفاصيل: {{permissionDescription}}\n\nللطالب/ة: {{studentName}}\n📅 ينتهي الطلب في: {{expiresAt}}\n\n🔗 للرد على الطلب انقر الرابط:\n{{permissionLink}}\n\n🙏 نقدر تعاونكم معنا\n\nمع أطيب التحيات\n{{nurseryName}}",
      survey_notification: "📊 استطلاع رأي جديد\n\nالسلام عليكم {{guardianName}} ✨\n\n📋 ندعوكم للمشاركة في استطلاع: {{surveyTitle}}\n\n📝 الوصف: {{surveyDescription}}\n\n🔗 للمشاركة في الاستطلاع انقر الرابط:\n{{surveyLink}}\n\n{{surveyQuestions}}\n\n🙏 نقدر وقتكم ومشاركتكم في تحسين خدماتنا\n\nمع أطيب التحيات 💝\n{{nurseryName}}",
      reward_notification: "🎉 تهنئة خاصة\n\nمبروك {{studentName}}!\n\nحصلت على: {{rewardTitle}}\n{{rewardDescription}}\n\nنقاط التحفيز: {{points}} ⭐\n\n{{nurseryName}} فخورة بك!\n\nمع أجمل التهاني 💝",
      attendance_present: "تم وصول {{studentName}} إلى الحضانة في تمام الساعة {{time}}. نتمنى لهم يوماً سعيداً! 🌟",
      attendance_absent: "نود إعلامكم أن {{studentName}} لم يحضر اليوم. نأمل أن يكون بخير. إذا كان هناك عذر، يرجى إبلاغنا.",
      general_notification: "إشعار من {{nurseryName}}:\n\n{{message}}"
    };

    const { error } = await supabase
      .from('tenant_settings')
      .upsert({
        tenant_id: tenantId,
        key: 'wa_templates_json',
        value: defaultTemplates,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  };

  const saveWebhookSettings = async () => {
    if (!selectedTenant || !webhookConfig.webhookUrl) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار حضانة وإدخال رابط الـ webhook",
        variant: "destructive",
      });
      return;
    }

    setSaveLoading(true);
    try {
      // حفظ إعدادات الـ webhook
      const settings = [
        { tenant_id: selectedTenant, key: 'wa_provider', value: 'n8n' },
        { tenant_id: selectedTenant, key: 'wa_webhook_url', value: webhookConfig.webhookUrl },
        { tenant_id: selectedTenant, key: 'wa_webhook_secret', value: webhookConfig.webhookSecret }
      ];

      for (const setting of settings) {
        const { error } = await supabase
          .from('tenant_settings')
          .upsert({
            ...setting,
            updated_at: new Date().toISOString()
          });
        
        if (error) throw error;
      }

      // إنشاء القوالب الافتراضية
      await createDefaultTemplates(selectedTenant);

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات الواتساب والقوالب الافتراضية",
      });

      setConnectionStatus('unknown');
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في حفظ الإعدادات: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const testConnection = async () => {
    if (!webhookConfig.webhookUrl) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط الـ webhook أولاً",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'اختبار اتصال من نظام إدارة الحضانة - Super Admin'
      };

      const response = await fetch(webhookConfig.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        setConnectionStatus('connected');
        toast({
          title: "تم الاتصال بنجاح",
          description: "تم الاتصال بـ webhook بنجاح",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "فشل الاتصال",
          description: "تحقق من صحة رابط الـ webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بـ webhook",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const generateWebhookSecret = () => {
    const secret = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setWebhookConfig(prev => ({ ...prev, webhookSecret: secret }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 ml-2" />
            إدارة إعدادات الواتساب للحضانات
          </CardTitle>
          <CardDescription>
            إعداد وإدارة إعدادات الواتساب لكل حضانة على حدة
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* اختيار الحضانة */}
          <div className="space-y-2">
            <Label htmlFor="tenant-select">اختيار الحضانة</Label>
            {loading ? (
              <div className="flex items-center space-x-2 space-x-reverse">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-gray-500">جاري تحميل الحضانات...</span>
              </div>
            ) : (
              <Select value={selectedTenant} onValueChange={setSelectedTenant}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر حضانة لإعداد الواتساب لها" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((tenant) => (
                    <SelectItem key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {selectedTenant && (
            <>
              {/* حالة الاتصال */}
              <div className="flex items-center justify-between">
                <Label>حالة الاتصال</Label>
                <div className="flex items-center space-x-reverse space-x-2">
                  {connectionStatus === 'connected' && (
                    <Badge className="bg-green-500">
                      <CheckCircle className="h-3 w-3 ml-1" />
                      متصل
                    </Badge>
                  )}
                  {connectionStatus === 'disconnected' && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 ml-1" />
                      غير متصل
                    </Badge>
                  )}
                  {connectionStatus === 'unknown' && (
                    <Badge variant="secondary">غير محدد</Badge>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={testConnection}
                    disabled={testLoading || !webhookConfig.webhookUrl}
                  >
                    {testLoading ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin ml-1" />
                        اختبار...
                      </>
                    ) : (
                      'اختبار الاتصال'
                    )}
                  </Button>
                </div>
              </div>

              {/* إعدادات الـ webhook */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="webhook-url">رابط Webhook</Label>
                  <Input
                    id="webhook-url"
                    value={webhookConfig.webhookUrl}
                    onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://your-n8n-instance.com/webhook/whatsapp"
                    dir="ltr"
                    className="text-left"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    رابط الـ webhook الخاص بإرسال رسائل الواتساب لهذه الحضانة
                  </p>
                </div>

                <div>
                  <Label htmlFor="webhook-secret">مفتاح الأمان (اختياري)</Label>
                  <div className="flex space-x-reverse space-x-2">
                    <Input
                      id="webhook-secret"
                      value={webhookConfig.webhookSecret}
                      onChange={(e) => setWebhookConfig(prev => ({ ...prev, webhookSecret: e.target.value }))}
                      placeholder="مفتاح سري للتحقق من صحة الرسائل"
                      dir="ltr"
                      className="text-left flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateWebhookSecret}
                    >
                      توليد
                    </Button>
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex space-x-reverse space-x-4">
                <Button 
                  onClick={saveWebhookSettings} 
                  disabled={saveLoading || !webhookConfig.webhookUrl}
                >
                  {saveLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 ml-2" />
                      حفظ الإعدادات
                    </>
                  )}
                </Button>
              </div>

              {/* معلومات القوالب */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-800 mb-2">
                  <MessageCircle className="h-4 w-4 inline ml-1" />
                  القوالب المشتركة
                </h4>
                <p className="text-sm text-blue-700">
                  سيتم إنشاء القوالب الافتراضية تلقائياً عند حفظ الإعدادات. القوالب مشتركة بين جميع الحضانات وتشمل:
                </p>
                <ul className="text-xs text-blue-600 mt-2 list-disc list-inside space-y-1">
                  <li>قالب بيانات تسجيل الدخول</li>
                  <li>قالب طلبات الأذونات</li>
                  <li>قالب الاستطلاعات</li>
                  <li>قالب تهنئة الطلاب</li>
                  <li>قالب الحضور والغياب</li>
                  <li>قالب الإشعارات العامة</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantWhatsAppManager;