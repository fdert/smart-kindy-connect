import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { 
  MessageCircle, 
  Upload, 
  Send, 
  Users, 
  CheckCircle, 
  XCircle, 
  Clock,
  FileSpreadsheet,
  Copy,
  Trash2,
  Play,
  Eye
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Campaign {
  id: string;
  campaign_name: string;
  message_content: string;
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  status: string;
  webhook_url?: string;
  webhook_secret?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  scheduled_at?: string;
  created_by: string;
  updated_at: string;
  phone_numbers: any;
}

const MarketingMessagesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  
  // نموذج إنشاء حملة جديدة
  const [newCampaign, setNewCampaign] = useState({
    campaign_name: '',
    message_content: '',
    phone_numbers: [] as string[],
    webhook_url: '',
    webhook_secret: ''
  });

  const [phoneInput, setPhoneInput] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل الحملات التسويقية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        // استخراج أرقام الهواتف من العمود الأول
        const phoneNumbers: string[] = [];
        jsonData.forEach((row: any) => {
          if (row[0] && typeof row[0] === 'string') {
            const phone = row[0].toString().trim();
            if (phone && phone.length > 8) {
              phoneNumbers.push(formatPhoneNumber(phone));
            }
          }
        });

        setNewCampaign(prev => ({
          ...prev,
          phone_numbers: [...new Set([...prev.phone_numbers, ...phoneNumbers])]
        }));

        toast({
          title: "تم التحميل بنجاح",
          description: `تم استيراد ${phoneNumbers.length} رقم هاتف`,
        });

      } catch (error) {
        toast({
          title: "خطأ في التحميل",
          description: "فشل في قراءة ملف Excel",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const formatPhoneNumber = (phone: string): string => {
    // إزالة جميع الرموز غير الرقمية
    let cleaned = phone.replace(/\D/g, '');
    
    // إضافة 966 إذا لم يكن موجود
    if (cleaned.startsWith('05')) {
      cleaned = '966' + cleaned.substring(1);
    } else if (cleaned.startsWith('5') && cleaned.length === 9) {
      cleaned = '966' + cleaned;
    }
    
    // إضافة + في البداية
    return '+' + cleaned;
  };

  const handlePhoneInputPaste = () => {
    const phones = phoneInput
      .split(/[\n,;\s]+/)
      .map(phone => phone.trim())
      .filter(phone => phone && phone.length > 8)
      .map(formatPhoneNumber);

    setNewCampaign(prev => ({
      ...prev,
      phone_numbers: [...new Set([...prev.phone_numbers, ...phones])]
    }));

    setPhoneInput('');
    toast({
      title: "تم الإضافة",
      description: `تم إضافة ${phones.length} رقم هاتف`,
    });
  };

  const removePhoneNumber = (index: number) => {
    setNewCampaign(prev => ({
      ...prev,
      phone_numbers: prev.phone_numbers.filter((_, i) => i !== index)
    }));
  };

  const createCampaign = async () => {
    if (!newCampaign.campaign_name || !newCampaign.message_content || newCampaign.phone_numbers.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى ملء جميع الحقول المطلوبة وإضافة أرقام الهواتف",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          created_by: user?.id,
          campaign_name: newCampaign.campaign_name,
          message_content: newCampaign.message_content,
          phone_numbers: newCampaign.phone_numbers,
          total_recipients: newCampaign.phone_numbers.length,
          webhook_url: newCampaign.webhook_url,
          webhook_secret: newCampaign.webhook_secret,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "تم الإنشاء بنجاح",
        description: "تم إنشاء الحملة التسويقية بنجاح",
      });

      setNewCampaign({
        campaign_name: '',
        message_content: '',
        phone_numbers: [],
        webhook_url: '',
        webhook_secret: ''
      });
      setShowCreateForm(false);
      fetchCampaigns();

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في إنشاء الحملة: " + error.message,
        variant: "destructive",
      });
    }
  };

  const sendCampaign = async (campaignId: string) => {
    setSending(campaignId);
    try {
      const { data, error } = await supabase.functions.invoke('send-marketing-messages', {
        body: { campaignId }
      });

      if (error) throw error;

      toast({
        title: "تم بدء الإرسال",
        description: "تم بدء إرسال الرسائل التسويقية",
      });

      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "فشل في إرسال الرسائل",
        variant: "destructive",
      });
    } finally {
      setSending(null);
    }
  };

  const deleteCampaign = async (campaignId: string, campaignName: string) => {
    if (!confirm(`هل أنت متأكد من حذف الحملة "${campaignName}"؟`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('marketing_campaigns')
        .delete()
        .eq('id', campaignId);

      if (error) throw error;

      toast({
        title: "تم الحذف",
        description: "تم حذف الحملة بنجاح",
      });

      fetchCampaigns();
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في حذف الحملة",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'مسودة', color: 'bg-gray-500' },
      sending: { label: 'جاري الإرسال', color: 'bg-blue-500' },
      completed: { label: 'مكتمل', color: 'bg-green-500' },
      failed: { label: 'فشل', color: 'bg-red-500' },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    return (
      <Badge className={`${config?.color} text-white`}>
        {config?.label || status}
      </Badge>
    );
  };

  const messageTemplate = `🌟 رسالة تسويقية خاصة من SmartKindy

السلام عليكم ورحمة الله وبركاته

🎯 عرض خاص لإدارة رياض الأطفال والحضانات!

✨ نظام SmartKindy - الحل الأمثل لإدارة حضانتك:

🔹 إدارة الطلاب والحضور
🔹 تواصل مع أولياء الأمور
🔹 التقارير والإحصائيات
🔹 النظام المالي المتكامل
🔹 تطبيق موبايل سهل الاستخدام

💰 عرض خاص: خصم 50% على الباقة الأولى
📞 للاستفسار: 920012345
🌐 www.smartkindy.com

🎁 احجز عرضك التوضيحي المجاني اليوم!

مع أطيب التحيات
فريق SmartKindy 💝`;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">جاري التحميل...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">الرسائل التسويقية</h2>
          <p className="text-muted-foreground">إرسال رسائل واتساب تسويقية للعملاء المحتملين</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <MessageCircle className="h-4 w-4 ml-2" />
          حملة جديدة
        </Button>
      </div>

      {/* نموذج إنشاء حملة جديدة */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>إنشاء حملة تسويقية جديدة</CardTitle>
            <CardDescription>
              قم بإنشاء حملة واتساب تسويقية واستيراد أرقام الهواتف
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* اسم الحملة */}
            <div>
              <Label htmlFor="campaign-name">اسم الحملة</Label>
              <Input
                id="campaign-name"
                value={newCampaign.campaign_name}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, campaign_name: e.target.value }))}
                placeholder="مثال: حملة العروض الشتوية 2024"
              />
            </div>

            {/* رسالة الحملة */}
            <div>
              <Label htmlFor="message-content">نص الرسالة</Label>
              <Textarea
                id="message-content"
                value={newCampaign.message_content}
                onChange={(e) => setNewCampaign(prev => ({ ...prev, message_content: e.target.value }))}
                placeholder="اكتب نص الرسالة التسويقية هنا..."
                rows={8}
              />
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">
                  عدد الأحرف: {newCampaign.message_content.length}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewCampaign(prev => ({ ...prev, message_content: messageTemplate }))}
                >
                  استخدام القالب الافتراضي
                </Button>
              </div>
            </div>

            {/* إضافة أرقام الهواتف */}
            <div className="space-y-4">
              <Label>أرقام الهواتف ({newCampaign.phone_numbers.length} رقم)</Label>
              
              {/* رفع ملف Excel */}
              <div className="flex items-center space-x-reverse space-x-4">
                <div className="flex-1">
                  <Label htmlFor="excel-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                      <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">انقر لرفع ملف Excel</span>
                      <p className="text-xs text-gray-500 mt-1">يجب أن تكون أرقام الهواتف في العمود الأول</p>
                    </div>
                  </Label>
                  <Input
                    id="excel-upload"
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>

              {/* إدخال أرقام يدوياً */}
              <div className="space-y-2">
                <Label htmlFor="phone-input">أو أدخل الأرقام يدوياً (رقم واحد في كل سطر)</Label>
                <Textarea
                  id="phone-input"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="0501234567&#10;0509876543&#10;أو انسخ والصق قائمة من الأرقام"
                  rows={4}
                />
                <Button
                  variant="outline"
                  onClick={handlePhoneInputPaste}
                  disabled={!phoneInput.trim()}
                >
                  <Copy className="h-4 w-4 ml-2" />
                  إضافة الأرقام
                </Button>
              </div>

              {/* عرض الأرقام المضافة */}
              {newCampaign.phone_numbers.length > 0 && (
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                  <div className="flex flex-wrap gap-2">
                    {newCampaign.phone_numbers.map((phone, index) => (
                      <Badge key={index} variant="secondary" className="flex items-center">
                        {phone}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-4 w-4 p-0 ml-1"
                          onClick={() => removePhoneNumber(index)}
                        >
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* إعدادات الويب هوك */}
            <div className="space-y-4">
              <Label>إعدادات الويب هوك (اختياري)</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="webhook-url">رابط الويب هوك</Label>
                  <Input
                    id="webhook-url"
                    value={newCampaign.webhook_url}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, webhook_url: e.target.value }))}
                    placeholder="https://your-webhook-url.com"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
                <div>
                  <Label htmlFor="webhook-secret">مفتاح الأمان</Label>
                  <Input
                    id="webhook-secret"
                    value={newCampaign.webhook_secret}
                    onChange={(e) => setNewCampaign(prev => ({ ...prev, webhook_secret: e.target.value }))}
                    placeholder="webhook secret"
                    dir="ltr"
                    className="text-left"
                  />
                </div>
              </div>
            </div>

            {/* أزرار الإجراءات */}
            <div className="flex space-x-reverse space-x-4">
              <Button onClick={createCampaign}>
                <MessageCircle className="h-4 w-4 ml-2" />
                إنشاء الحملة
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* جدول الحملات */}
      <Card>
        <CardHeader>
          <CardTitle>الحملات التسويقية</CardTitle>
          <CardDescription>
            إدارة ومتابعة الحملات التسويقية عبر الواتساب
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">لا توجد حملات تسويقية بعد</p>
              <p className="text-sm text-gray-400">ابدأ بإنشاء حملتك الأولى</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>اسم الحملة</TableHead>
                  <TableHead>عدد المستلمين</TableHead>
                  <TableHead>تم الإرسال</TableHead>
                  <TableHead>فشل</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead>تاريخ الإنشاء</TableHead>
                  <TableHead>الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.campaign_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 ml-1 text-gray-400" />
                        {campaign.total_recipients}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 ml-1 text-green-500" />
                        {campaign.sent_count}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <XCircle className="h-4 w-4 ml-1 text-red-500" />
                        {campaign.failed_count}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell>
                      {new Date(campaign.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-reverse space-x-2">
                        {campaign.status === 'draft' && (
                          <Button
                            size="sm"
                            onClick={() => sendCampaign(campaign.id)}
                            disabled={sending === campaign.id}
                          >
                            {sending === campaign.id ? (
                              <Clock className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteCampaign(campaign.id, campaign.campaign_name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingMessagesManager;