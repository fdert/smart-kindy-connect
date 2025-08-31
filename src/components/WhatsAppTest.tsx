import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TestTube, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface DiagnosticResult {
  tenantId: string;
  tenantName: string;
  settings: {
    hasWebhookUrl: boolean;
    webhookUrl: string;
    hasSecret: boolean;
    hasTemplates: boolean;
    templatesCount: number;
    availableTemplates: string[];
  };
  guardians: {
    totalFound: number;
    hasTestGuardian: boolean;
    testNumber: string;
  };
  testResult?: {
    success: boolean;
    error?: string;
    result?: any;
  };
}

const WhatsAppTest = () => {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult | null>(null);
  const { toast } = useToast();

  const runDiagnostics = async (sendTest = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-whatsapp', {
        body: { sendTest }
      });

      if (error) throw error;

      setDiagnostics(data);
      
      if (sendTest) {
        toast({
          title: data.testResult?.success ? "نجح الاختبار" : "فشل الاختبار",
          description: data.testResult?.success ? 
            "تم إرسال رسالة اختبار بنجاح" : 
            `خطأ: ${data.testResult?.error}`,
          variant: data.testResult?.success ? "default" : "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "خطأ في التشخيص",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (condition: boolean) => {
    return condition ? 
      <CheckCircle className="h-4 w-4 text-green-500" /> : 
      <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"} className="flex items-center gap-1">
        {getStatusIcon(condition)}
        {condition ? trueText : falseText}
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          اختبار واتساب
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={() => runDiagnostics(false)} 
            disabled={loading}
            variant="outline"
          >
            {loading ? 'جاري التشخيص...' : 'تشخيص الإعدادات'}
          </Button>
          <Button 
            onClick={() => runDiagnostics(true)} 
            disabled={loading || !diagnostics?.guardians.hasTestGuardian}
          >
            {loading ? 'جاري الاختبار...' : 'اختبار الإرسال'}
          </Button>
        </div>

        {diagnostics && (
          <div className="space-y-4">
            {/* Tenant Info */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>المستأجر:</strong> {diagnostics.tenantName} ({diagnostics.tenantId})
              </AlertDescription>
            </Alert>

            {/* Settings Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">حالة الإعدادات</h4>
                <div className="space-y-1">
                  {getStatusBadge(diagnostics.settings.hasWebhookUrl, "Webhook URL موجود", "Webhook URL مفقود")}
                  {getStatusBadge(diagnostics.settings.hasSecret, "مفتاح الأمان موجود", "مفتاح الأمان مفقود")}
                  {getStatusBadge(diagnostics.settings.hasTemplates, "القوالب موجودة", "القوالب مفقودة")}
                </div>
                {diagnostics.settings.hasWebhookUrl && (
                  <p className="text-xs text-gray-600 break-all">
                    URL: {diagnostics.settings.webhookUrl}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">أولياء الأمور</h4>
                <div className="space-y-1">
                  {getStatusBadge(diagnostics.guardians.totalFound > 0, `${diagnostics.guardians.totalFound} ولي أمر`, "لا يوجد أولياء أمور")}
                  {getStatusBadge(diagnostics.guardians.hasTestGuardian, "يوجد رقم اختبار", "لا يوجد رقم اختبار")}
                </div>
                {diagnostics.guardians.testNumber && (
                  <p className="text-xs text-gray-600">
                    رقم الاختبار: {diagnostics.guardians.testNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Templates */}
            {diagnostics.settings.hasTemplates && (
              <div>
                <h4 className="font-medium mb-2">القوالب المتاحة ({diagnostics.settings.templatesCount})</h4>
                <div className="flex flex-wrap gap-1">
                  {diagnostics.settings.availableTemplates.map(template => (
                    <Badge key={template} variant="outline" className="text-xs">
                      {template}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Test Result */}
            {diagnostics.testResult && (
              <Alert variant={diagnostics.testResult.success ? "default" : "destructive"}>
                {diagnostics.testResult.success ? 
                  <CheckCircle className="h-4 w-4" /> : 
                  <XCircle className="h-4 w-4" />
                }
                <AlertDescription>
                  <strong>نتيجة الاختبار:</strong> {' '}
                  {diagnostics.testResult.success ? 
                    "تم إرسال الرسالة بنجاح!" : 
                    `خطأ: ${diagnostics.testResult.error}`
                  }
                </AlertDescription>
              </Alert>
            )}

            {/* Recommendations */}
            <div className="mt-4 p-3 bg-blue-50 rounded-md">
              <h4 className="font-medium text-blue-800 mb-2">التوصيات:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                {!diagnostics.settings.hasWebhookUrl && (
                  <li>• قم بإعداد Webhook URL في إعدادات واتساب</li>
                )}
                {!diagnostics.settings.hasTemplates && (
                  <li>• قم بإضافة قوالب الرسائل في إعدادات واتساب</li>
                )}
                {diagnostics.guardians.totalFound === 0 && (
                  <li>• قم بإضافة أرقام واتساب لأولياء الأمور</li>
                )}
                {diagnostics.settings.hasWebhookUrl && diagnostics.settings.hasTemplates && diagnostics.guardians.totalFound > 0 && (
                  <li>• الإعدادات سليمة، يمكنك تجربة إرسال رسالة اختبار</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppTest;