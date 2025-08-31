import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Key, Webhook, TestTube, CheckCircle, XCircle } from 'lucide-react';

interface WhatsAppConfig {
  wa_provider: string;
  wa_webhook_url: string;
  wa_webhook_secret: string;
  wa_templates_json: string;
}

const WhatsAppSettings = () => {
  const { tenant, settings, updateSetting } = useTenant();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  const [config, setConfig] = useState<WhatsAppConfig>({
    wa_provider: 'n8n',
    wa_webhook_url: '',
    wa_webhook_secret: '',
    wa_templates_json: JSON.stringify({
      attendance_present: 'تم وصول {{studentName}} إلى الحضانة في تمام الساعة {{time}}. نتمنى لهم يوماً سعيداً! 🌟',
      attendance_absent: 'نود إعلامكم أن {{studentName}} لم يحضر اليوم. نأمل أن يكون بخير. إذا كان هناك عذر، يرجى إبلاغنا.',
      dismissal_approved_pin: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nرمز الاستلام: {{pin}}\n\nيرجى إظهار هذا الرمز عند الاستلام.',
      dismissal_approved_qr: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nيرجى إظهار رمز QR المرفق عند الاستلام.',
      album_shared: 'ألبوم {{studentName}} لليوم {{date}} متاح الآن! 📸\n\n{{mediaLinks}}\n\nستنتهي صلاحية الروابط خلال 24 ساعة.',
      album_report: 'تقرير ألبوم {{studentName}} لليوم {{date}} 📸\n\nاسم الطالب: {{studentName}}\nالفصل: {{className}}\nالروضة: {{nurseryName}}\nعدد الصور: {{photoCount}}\nعدد الفيديوهات: {{videoCount}}\n\nالألبوم متاح للعرض.',
      reward_notification: '🎉 تهانينا! حصل {{studentName}} على {{rewardType}} جديدة!\n\nعزيز/ة {{guardianName}}\n\nيسعدنا إخباركم أن {{studentName}} حصل/ت على:\n🏆 {{rewardTitle}}\n📝 {{rewardDescription}}\n⭐ النقاط: {{points}}\n\nنفخر بإنجازات طفلكم ونتطلع لمزيد من التميز!\n\nمع أطيب التحيات\n{{nurseryName}}',
      permission_request: '📋 طلب إذن من {{nurseryName}}\n\nعزيز/ة {{guardianName}}\n\nنطلب موافقتكم على:\n📝 {{permissionTitle}}\n🔍 {{permissionDescription}}\n👤 الطالب: {{studentName}}\n⏰ ينتهي في: {{expiresAt}}\n\nرمز التأكيد: {{otpToken}}\n\nيرجى الرد بـ "موافق" أو "غير موافق" مع رمز التأكيد.',
      survey_notification: '📊 استطلاع رأي من {{nurseryName}}\n\nعزيز/ة {{guardianName}}\n\nندعوكم للمشاركة في:\n📋 {{surveyTitle}}\n📄 {{surveyDescription}}\n\nرأيكم يهمنا لتحسين خدماتنا!\n\nشكراً لتعاونكم.',
      general_notification: 'إشعار من {{nurseryName}}:\n\n{{message}}'
    }, null, 2)
  });

  useEffect(() => {
    // Load existing settings
    setConfig(prev => ({
      ...prev,
      wa_provider: settings.wa_provider || 'n8n',
      wa_webhook_url: settings.wa_webhook_url || '',
      wa_webhook_secret: settings.wa_webhook_secret || '',
      wa_templates_json: settings.wa_templates_json ? 
        JSON.stringify(settings.wa_templates_json, null, 2) : 
        JSON.stringify({
          attendance_present: 'تم وصول {{studentName}} إلى الحضانة في تمام الساعة {{time}}. نتمنى لهم يوماً سعيداً! 🌟',
          attendance_absent: 'نود إعلامكم أن {{studentName}} لم يحضر اليوم. نأمل أن يكون بخير. إذا كان هناك عذر، يرجى إبلاغنا.',
          dismissal_approved_pin: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nرمز الاستلام: {{pin}}\n\nيرجى إظهار هذا الرمز عند الاستلام.',
          dismissal_approved_qr: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nيرجى إظهار رمز QR المرفق عند الاستلام.',
          album_shared: 'ألبوم {{studentName}} لليوم {{date}} متاح الآن! 📸\n\n{{mediaLinks}}\n\nستنتهي صلاحية الروابط خلال 24 ساعة.',
          album_report: 'تقرير ألبوم {{studentName}} لليوم {{date}} 📸\n\nاسم الطالب: {{studentName}}\nالفصل: {{className}}\nالروضة: {{nurseryName}}\nعدد الصور: {{photoCount}}\nعدد الفيديوهات: {{videoCount}}\n\nالألبوم متاح للعرض.',
          reward_notification: '🎉 تهانينا! حصل {{studentName}} على {{rewardType}} جديدة!\n\nعزيز/ة {{guardianName}}\n\nيسعدنا إخباركم أن {{studentName}} حصل/ت على:\n🏆 {{rewardTitle}}\n📝 {{rewardDescription}}\n⭐ النقاط: {{points}}\n\nنفخر بإنجازات طفلكم ونتطلع لمزيد من التميز!\n\nمع أطيب التحيات\n{{nurseryName}}',
          permission_request: '📋 طلب إذن من {{nurseryName}}\n\nعزيز/ة {{guardianName}}\n\nنطلب موافقتكم على:\n📝 {{permissionTitle}}\n🔍 {{permissionDescription}}\n👤 الطالب: {{studentName}}\n⏰ ينتهي في: {{expiresAt}}\n\nرمز التأكيد: {{otpToken}}\n\nيرجى الرد بـ "موافق" أو "غير موافق" مع رمز التأكيد.',
          survey_notification: '📊 استطلاع رأي من {{nurseryName}}\n\nعزيز/ة {{guardianName}}\n\nندعوكم للمشاركة في:\n📋 {{surveyTitle}}\n📄 {{surveyDescription}}\n\nرأيكم يهمنا لتحسين خدماتنا!\n\nشكراً لتعاونكم.',
          general_notification: 'إشعار من {{nurseryName}}:\n\n{{message}}'
        }, null, 2)
    }));
  }, [settings]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // Validate JSON templates
      let templatesJson;
      try {
        templatesJson = JSON.parse(config.wa_templates_json);
      } catch (error) {
        throw new Error('قوالب الرسائل يجب أن تكون بصيغة JSON صحيحة');
      }

      // Save settings one by one to avoid race condition
      await updateSetting('wa_provider', config.wa_provider);
      await updateSetting('wa_webhook_url', config.wa_webhook_url);
      await updateSetting('wa_webhook_secret', config.wa_webhook_secret);
      await updateSetting('wa_templates_json', templatesJson);

      toast({
        title: "تم الحفظ",
        description: "تم حفظ إعدادات واتساب بنجاح",
      });

      setConnectionStatus('unknown');
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

  const testConnection = async () => {
    if (!config.wa_webhook_url) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال رابط N8N Webhook أولاً",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    try {
      const testPayload = {
        test: true,
        timestamp: new Date().toISOString(),
        message: 'اختبار اتصال من نظام إدارة الحضانة'
      };

      const response = await fetch(config.wa_webhook_url, {
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
          description: "تم الاتصال بـ N8N Webhook بنجاح",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "فشل الاتصال",
          description: "تحقق من صحة رابط N8N Webhook",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بـ N8N Webhook",
        variant: "destructive",
      });
    } finally {
      setTestLoading(false);
    }
  };

  const generateWebhookSecret = () => {
    const secret = Math.random().toString(36).substring(2) + Date.now().toString(36);
    setConfig(prev => ({ ...prev, wa_webhook_secret: secret }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageCircle className="h-5 w-5 ml-2" />
            إعدادات واتساب
          </CardTitle>
          <CardDescription>
            إعداد تكامل واتساب مع N8N لإرسال الإشعارات عبر الويب هوك
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
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
                disabled={testLoading}
              >
                {testLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current ml-1"></div>
                    اختبار...
                  </>
                ) : (
                  <>
                    <TestTube className="h-3 w-3 ml-1" />
                    اختبار الاتصال
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* إعدادات N8N Webhook */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="wa_webhook_url">رابط N8N Webhook</Label>
              <Input
                id="wa_webhook_url"
                value={config.wa_webhook_url}
                onChange={(e) => setConfig(prev => ({ ...prev, wa_webhook_url: e.target.value }))}
                placeholder="https://your-n8n-instance.com/webhook/whatsapp"
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-gray-500 mt-1">
                رابط الويب هوك الخاص بـ N8N لإرسال رسائل الواتساب
              </p>
            </div>
          </div>

          {/* إعدادات الأمان */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Webhook className="h-4 w-4 ml-2" />
              إعدادات الأمان
            </h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="inbound_webhook_url">رابط Webhook الواردة (للإعداد في N8N)</Label>
                <Input
                  id="inbound_webhook_url"
                  value={`https://ytjodudlnfamvnescumu.supabase.co/functions/v1/whatsapp-inbound`}
                  readOnly
                  dir="ltr"
                  className="text-left bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  استخدم هذا الرابط في N8N لاستقبال الرسائل الواردة
                </p>
              </div>

              <div>
                <Label htmlFor="wa_webhook_secret">مفتاح التحقق من الأمان (اختياري)</Label>
                <div className="flex space-x-reverse space-x-2">
                  <Input
                    id="wa_webhook_secret"
                    value={config.wa_webhook_secret}
                    onChange={(e) => setConfig(prev => ({ ...prev, wa_webhook_secret: e.target.value }))}
                    placeholder="مفتاح سري للتحقق من صحة الرسائل"
                    dir="ltr"
                    className="text-left flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateWebhookSecret}
                  >
                    <Key className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  مفتاح سري للتأكد من أن الرسائل تأتي من مصدر موثوق
                </p>
              </div>
            </div>
          </div>

          {/* قوالب الرسائل */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3">قوالب الرسائل</h4>
            <div>
              <Label htmlFor="wa_templates_json">قوالب الرسائل (JSON)</Label>
              <Textarea
                id="wa_templates_json"
                value={config.wa_templates_json}
                onChange={(e) => setConfig(prev => ({ ...prev, wa_templates_json: e.target.value }))}
                rows={15}
                dir="ltr"
                className="text-left font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                يمكنك استخدام المتغيرات التالية: {'{studentName}, {guardianName}, {permissionTitle}, {permissionDescription}, {otpToken}, {expiresAt}, {nurseryName}, {time}, {date}, {pin}, {message}, {className}, {photoCount}, {videoCount}'}
              </p>
              <div className="mt-2 p-3 bg-blue-50 rounded-md">
                <p className="text-xs font-medium text-blue-800 mb-2">أمثلة على تمبلت الرسائل:</p>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-blue-700">رسالة الأذونات:</p>
                    <pre className="text-xs text-blue-600 whitespace-pre-wrap">{`"permission_request": "🔔 طلب إذن جديد\\n\\nعزيز/ة {{guardianName}}\\n\\nيطلب منكم الموافقة على: {{permissionTitle}}\\n\\nالتفاصيل: {{permissionDescription}}\\n\\nللطالب/ة: {{studentName}}\\n\\nينتهي الطلب في: {{expiresAt}}\\n\\nللموافقة أرسل: نعم {{otpToken}}\\nللرفض أرسل: لا {{otpToken}}\\n\\nمع تحيات\\n{{nurseryName}}"`}</pre>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-blue-700">رسالة الاستطلاعات:</p>
                    <pre className="text-xs text-blue-600 whitespace-pre-wrap">{`"survey_notification": "📊 استطلاع رأي جديد\\n\\nعزيز/ة {{guardianName}}\\n\\nدعوة للمشاركة في: {{surveyTitle}}\\n\\nالوصف: {{surveyDescription}}\\n\\nنقدر مشاركتكم في تحسين خدماتنا\\n\\nمع تحيات\\n{{nurseryName}}"`}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex space-x-reverse space-x-4">
            <Button onClick={handleSave} disabled={loading}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                  جاري الحفظ...
                </>
              ) : (
                'حفظ الإعدادات'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WhatsAppSettings;