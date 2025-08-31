import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  Copy, 
  ExternalLink, 
  QrCode, 
  Mail, 
  MessageSquare, 
  Share2,
  Download,
  Link as LinkIcon
} from 'lucide-react';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  expires_at: string;
}

interface SurveyLinkShareProps {
  survey: Survey;
}

const SurveyLinkShare = ({ survey }: SurveyLinkShareProps) => {
  const [showQR, setShowQR] = useState(false);
  const { toast } = useToast();

  const surveyLink = `${window.location.origin}/survey/${survey.id}`;
  
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(surveyLink);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط الاستطلاع إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "فشل في نسخ الرابط",
        variant: "destructive",
      });
    }
  };

  const openInNewTab = () => {
    window.open(surveyLink, '_blank');
  };

  const shareViaWhatsApp = () => {
    const message = `مرحباً، يسعدنا دعوتكم للمشاركة في استطلاع: ${survey.title}\n\nوصف الاستطلاع: ${survey.description || 'لا يوجد وصف'}\n\nيمكنكم المشاركة عبر الرابط التالي:\n${surveyLink}\n\nشكراً لتعاونكم معنا`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const shareViaEmail = () => {
    const subject = `دعوة للمشاركة في استطلاع: ${survey.title}`;
    const body = `مرحباً،

يسعدنا دعوتكم للمشاركة في استطلاع الرأي التالي:

العنوان: ${survey.title}
الوصف: ${survey.description || 'لا يوجد وصف'}
ينتهي في: ${new Date(survey.expires_at).toLocaleDateString('ar-SA')}

يمكنكم المشاركة عبر الرابط التالي:
${surveyLink}

نقدر مشاركتكم وآرائكم القيمة.

مع تحياتنا`;

    const emailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(emailUrl);
  };

  const generateQRCode = () => {
    // Using QR Server API for QR code generation
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(surveyLink)}`;
  };

  const downloadQRCode = async () => {
    try {
      const qrCodeUrl = generateQRCode();
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `survey-qr-${survey.id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "تم تحميل رمز QR",
        description: "تم تحميل رمز QR للاستطلاع بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ في التحميل",
        description: "فشل في تحميل رمز QR",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          مشاركة رابط الاستطلاع
        </CardTitle>
        <CardDescription>
          شارك رابط الاستطلاع مع المشاركين المستهدفين
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Survey Link Display */}
        <div>
          <Label className="text-sm font-medium mb-2 block">رابط الاستطلاع:</Label>
          <div className="flex gap-2">
            <Input 
              value={surveyLink} 
              readOnly 
              className="font-mono text-sm"
            />
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={openInNewTab}>
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <Label className="text-sm font-medium mb-2 block">مشاركة سريعة:</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={shareViaWhatsApp}
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              واتساب
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={shareViaEmail}
              className="flex items-center gap-2"
            >
              <Mail className="h-4 w-4" />
              بريد إلكتروني
            </Button>
            
            <Dialog open={showQR} onOpenChange={setShowQR}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <QrCode className="h-4 w-4" />
                  رمز QR
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm">
                <DialogHeader>
                  <DialogTitle>رمز QR للاستطلاع</DialogTitle>
                  <DialogDescription>
                    اسمح للمشاركين بمسح الرمز للوصول المباشر للاستطلاع
                  </DialogDescription>
                </DialogHeader>
                <div className="text-center space-y-4">
                  <img 
                    src={generateQRCode()} 
                    alt="QR Code" 
                    className="mx-auto border rounded-lg"
                  />
                  <Button onClick={downloadQRCode} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    تحميل رمز QR
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Survey Info */}
        <div className="bg-muted/50 p-3 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h4 className="font-medium">{survey.title}</h4>
              {survey.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {survey.description}
                </p>
              )}
            </div>
            <Badge variant="outline">
              ينتهي {new Date(survey.expires_at).toLocaleDateString('ar-SA')}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <LinkIcon className="h-3 w-3" />
            <span>الرابط صالح حتى تاريخ انتهاء الاستطلاع</span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-sm">
          <h5 className="font-medium text-blue-800 mb-1">طرق المشاركة:</h5>
          <ul className="text-blue-700 space-y-1 text-xs">
            <li>• انسخ الرابط وشاركه في مجموعات واتساب</li>
            <li>• أرسل الرابط عبر البريد الإلكتروني</li>
            <li>• استخدم رمز QR للطباعة أو العرض</li>
            <li>• شارك الرابط في وسائل التواصل الاجتماعي</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};

export default SurveyLinkShare;