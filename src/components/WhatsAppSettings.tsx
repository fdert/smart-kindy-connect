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
  wa_api_base: string;
  wa_api_key: string;
  wa_webhook_secret: string;
  wa_session_id: string;
  wa_templates_json: string;
}

const WhatsAppSettings = () => {
  const { tenant, settings, updateSetting } = useTenant();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  const [config, setConfig] = useState<WhatsAppConfig>({
    wa_provider: 'wasender',
    wa_api_base: 'https://www.wasenderapi.com',
    wa_api_key: '',
    wa_webhook_secret: '',
    wa_session_id: '',
    wa_templates_json: JSON.stringify({
      attendance_present: 'تم وصول {{studentName}} إلى الحضانة في تمام الساعة {{time}}. نتمنى لهم يوماً سعيداً! 🌟',
      attendance_absent: 'نود إعلامكم أن {{studentName}} لم يحضر اليوم. نأمل أن يكون بخير. إذا كان هناك عذر، يرجى إبلاغنا.',
      dismissal_approved_pin: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nرمز الاستلام: {{pin}}\n\nيرجى إظهار هذا الرمز عند الاستلام.',
      dismissal_approved_qr: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nيرجى إظهار رمز QR المرفق عند الاستلام.',
      album_shared: 'ألبوم {{studentName}} لليوم {{date}} متاح الآن! 📸\n\n{{mediaLinks}}\n\nستنتهي صلاحية الروابط خلال 24 ساعة.',
      general_notification: 'إشعار من {{nurseryName}}:\n\n{{message}}'
    }, null, 2)
  });

  useEffect(() => {
    // Load existing settings
    setConfig(prev => ({
      ...prev,
      wa_provider: settings.wa_provider || 'wasender',
      wa_api_base: settings.wa_api_base || 'https://www.wasenderapi.com',
      wa_api_key: settings.wa_api_key || '',
      wa_webhook_secret: settings.wa_webhook_secret || '',
      wa_session_id: settings.wa_session_id || '',
      wa_templates_json: settings.wa_templates_json ? 
        JSON.stringify(settings.wa_templates_json, null, 2) : 
        JSON.stringify({
          attendance_present: 'تم وصول {{studentName}} إلى الحضانة في تمام الساعة {{time}}. نتمنى لهم يوماً سعيداً! 🌟',
          attendance_absent: 'نود إعلامكم أن {{studentName}} لم يحضر اليوم. نأمل أن يكون بخير. إذا كان هناك عذر، يرجى إبلاغنا.',
          dismissal_approved_pin: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nرمز الاستلام: {{pin}}\n\nيرجى إظهار هذا الرمز عند الاستلام.',
          dismissal_approved_qr: 'تم اعتماد خروج {{studentName}} في تمام الساعة {{time}}.\n\nيرجى إظهار رمز QR المرفق عند الاستلام.',
          album_shared: 'ألبوم {{studentName}} لليوم {{date}} متاح الآن! 📸\n\n{{mediaLinks}}\n\nستنتهي صلاحية الروابط خلال 24 ساعة.',
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

      // Save all settings
      await Promise.all([
        updateSetting('wa_provider', config.wa_provider),
        updateSetting('wa_api_base', config.wa_api_base),
        updateSetting('wa_api_key', config.wa_api_key),
        updateSetting('wa_webhook_secret', config.wa_webhook_secret),
        updateSetting('wa_session_id', config.wa_session_id),
        updateSetting('wa_templates_json', templatesJson)
      ]);

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
    if (!config.wa_api_key) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال مفتاح API أولاً",
        variant: "destructive",
      });
      return;
    }

    setTestLoading(true);
    try {
      const response = await fetch(`${config.wa_api_base}/api/status`, {
        headers: {
          'Authorization': `Bearer ${config.wa_api_key}`,
        }
      });

      if (response.ok) {
        setConnectionStatus('connected');
        toast({
          title: "تم الاتصال بنجاح",
          description: "تم الاتصال بـ WhatSender بنجاح",
        });
      } else {
        setConnectionStatus('disconnected');
        toast({
          title: "فشل الاتصال",
          description: "تحقق من صحة المفتاح ورابط API",
          variant: "destructive",
        });
      }
    } catch (error) {
      setConnectionStatus('disconnected');
      toast({
        title: "خطأ في الاتصال",
        description: "تعذر الاتصال بخدمة واتساب",
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
            إعداد تكامل واتساب مع WhatSender/WasenderApi لإرسال الإشعارات
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

          {/* إعدادات API */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="wa_api_base">رابط API</Label>
              <Input
                id="wa_api_base"
                value={config.wa_api_base}
                onChange={(e) => setConfig(prev => ({ ...prev, wa_api_base: e.target.value }))}
                placeholder="https://www.wasenderapi.com"
                dir="ltr"
                className="text-left"
              />
            </div>

            <div>
              <Label htmlFor="wa_api_key">مفتاح API</Label>
              <Input
                id="wa_api_key"
                type="password"
                value={config.wa_api_key}
                onChange={(e) => setConfig(prev => ({ ...prev, wa_api_key: e.target.value }))}
                placeholder="أدخل مفتاح API من WhatSender"
                dir="ltr"
                className="text-left"
              />
              <p className="text-xs text-gray-500 mt-1">
                احصل على مفتاح API من لوحة تحكم WhatSender
              </p>
            </div>

            <div>
              <Label htmlFor="wa_session_id">معرف الجلسة (اختياري)</Label>
              <Input
                id="wa_session_id"
                value={config.wa_session_id}
                onChange={(e) => setConfig(prev => ({ ...prev, wa_session_id: e.target.value }))}
                placeholder="معرف جلسة واتساب"
                dir="ltr"
                className="text-left"
              />
            </div>
          </div>

          {/* إعدادات Webhook */}
          <div className="border-t pt-4">
            <h4 className="font-semibold mb-3 flex items-center">
              <Webhook className="h-4 w-4 ml-2" />
              إعدادات Webhook
            </h4>
            <div className="space-y-4">
              <div>
                <Label htmlFor="webhook_url">رابط Webhook (للإعداد في WhatSender)</Label>
                <Input
                  id="webhook_url"
                  value={`https://ytjodudlnfamvnescumu.supabase.co/functions/v1/whatsapp-inbound`}
                  readOnly
                  dir="ltr"
                  className="text-left bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">
                  استخدم هذا الرابط في إعدادات Webhook في WhatSender
                </p>
              </div>

              <div>
                <Label htmlFor="wa_webhook_secret">مفتاح التحقق من Webhook</Label>
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
                  استخدم نفس المفتاح في إعدادات Webhook في WhatSender
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
                يمكنك استخدام المتغيرات التالية: {'{studentName}, {time}, {date}, {pin}, {nurseryName}, {message}'}
              </p>
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