import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  BarChart3,
  Download,
  X,
  Phone,
  MessageSquare
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
  phone_numbers: any;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface MessageLog {
  id: string;
  campaign_id: string;
  recipient_phone: string;
  status: string;
  created_at: string;
  sent_at?: string;
  error_message?: string;
}

interface MarketingCampaignReportProps {
  campaignId: string;
  onClose: () => void;
}

const MarketingCampaignReport = ({ campaignId, onClose }: MarketingCampaignReportProps) => {
  const { toast } = useToast();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [messageLogs, setMessageLogs] = useState<MessageLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCampaignData();
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      setLoading(true);
      
      // جلب بيانات الحملة
      const { data: campaignData, error: campaignError } = await supabase
        .from('marketing_campaigns')
        .select('*')
        .eq('id', campaignId)
        .single();

      if (campaignError) throw campaignError;
      setCampaign(campaignData);

      // جلب سجلات الرسائل
      const { data: logsData, error: logsError } = await supabase
        .from('marketing_message_logs')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: false });

      if (logsError) throw logsError;
      setMessageLogs(logsData || []);

    } catch (error: any) {
      toast({
        title: "خطأ",
        description: "فشل في تحميل تقرير الحملة: " + error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: 'في الانتظار', color: 'bg-yellow-500', icon: Clock },
      sent: { label: 'تم الإرسال', color: 'bg-green-500', icon: CheckCircle },
      failed: { label: 'فشل', color: 'bg-red-500', icon: XCircle },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || AlertTriangle;
    
    return (
      <Badge className={`${config?.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config?.label || status}
      </Badge>
    );
  };

  const exportToExcel = () => {
    if (!campaign || messageLogs.length === 0) {
      toast({
        title: "لا توجد بيانات",
        description: "لا توجد بيانات للتصدير",
        variant: "destructive",
      });
      return;
    }

    const exportData = messageLogs.map(log => ({
      'رقم الهاتف': log.recipient_phone,
      'الحالة': log.status === 'sent' ? 'تم الإرسال' : log.status === 'failed' ? 'فشل' : 'في الانتظار',
      'تاريخ الإنشاء': new Date(log.created_at).toLocaleString('ar-SA'),
      'تاريخ الإرسال': log.sent_at ? new Date(log.sent_at).toLocaleString('ar-SA') : '-',
      'سبب الفشل': log.error_message || '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'تقرير الحملة');
    
    XLSX.writeFile(wb, `تقرير_حملة_${campaign.campaign_name}_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "تم التصدير بنجاح",
      description: "تم تصدير التقرير إلى ملف Excel",
    });
  };

  const getUnsentNumbers = () => {
    if (!campaign) return [];
    
    const sentNumbers = messageLogs
      .filter(log => log.status === 'sent')
      .map(log => log.recipient_phone);
    
    const phoneNumbers = Array.isArray(campaign.phone_numbers) ? campaign.phone_numbers : [];
    return phoneNumbers.filter(phone => !sentNumbers.includes(phone));
  };

  const getFailedLogs = () => {
    return messageLogs.filter(log => log.status === 'failed');
  };

  const getPendingLogs = () => {
    return messageLogs.filter(log => log.status === 'pending');
  };

  const getSentLogs = () => {
    return messageLogs.filter(log => log.status === 'sent');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>جاري تحميل التقرير...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <p>لم يتم العثور على الحملة</p>
            <Button onClick={onClose} className="mt-4">إغلاق</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const unsentNumbers = getUnsentNumbers();
  const failedLogs = getFailedLogs();
  const pendingLogs = getPendingLogs();
  const sentLogs = getSentLogs();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              تقرير الحملة: {campaign.campaign_name}
            </CardTitle>
            <CardDescription>
              إحصائيات مفصلة عن حالة إرسال الرسائل
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportToExcel}>
              <Download className="h-4 w-4 ml-2" />
              تصدير Excel
            </Button>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-6 max-h-[70vh] overflow-y-auto">
          {/* إحصائيات عامة */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <Phone className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold">{campaign.total_recipients}</div>
                <div className="text-sm text-muted-foreground">إجمالي الأرقام</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{sentLogs.length}</div>
                <div className="text-sm text-muted-foreground">تم الإرسال</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{failedLogs.length}</div>
                <div className="text-sm text-muted-foreground">فشل الإرسال</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-yellow-600">{pendingLogs.length + unsentNumbers.length}</div>
                <div className="text-sm text-muted-foreground">لم يتم الإرسال</div>
              </CardContent>
            </Card>
          </div>

          {/* جدول سجلات الرسائل */}
          <div className="space-y-6">
            {/* الرسائل المرسلة بنجاح */}
            {sentLogs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-600 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  الرسائل المرسلة بنجاح ({sentLogs.length})
                </h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الهاتف</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الإرسال</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sentLogs.slice(0, 10).map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono">{log.recipient_phone}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {log.sent_at ? new Date(log.sent_at).toLocaleString('ar-SA') : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {sentLogs.length > 10 && (
                    <div className="p-3 text-center text-sm text-muted-foreground border-t">
                      وعرض {sentLogs.length - 10} رسالة أخرى...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* الرسائل الفاشلة */}
            {failedLogs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-600 flex items-center gap-2">
                  <XCircle className="h-5 w-5" />
                  الرسائل الفاشلة ({failedLogs.length})
                </h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الهاتف</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>سبب الفشل</TableHead>
                        <TableHead>التاريخ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono">{log.recipient_phone}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-red-600 text-sm">
                            {log.error_message || 'غير محدد'}
                          </TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString('ar-SA')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* الرسائل المعلقة */}
            {pendingLogs.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-yellow-600 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  رسائل في الانتظار ({pendingLogs.length})
                </h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>رقم الهاتف</TableHead>
                        <TableHead>الحالة</TableHead>
                        <TableHead>تاريخ الإنشاء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pendingLogs.map(log => (
                        <TableRow key={log.id}>
                          <TableCell className="font-mono">{log.recipient_phone}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            {new Date(log.created_at).toLocaleString('ar-SA')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* الأرقام غير المرسل لها */}
            {unsentNumbers.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  أرقام لم يتم إرسال الرسائل لها ({unsentNumbers.length})
                </h3>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-3">
                      هذه الأرقام موجودة في قائمة الحملة لكن لم يتم إنشاء سجلات إرسال لها بعد
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {unsentNumbers.map((phone, index) => (
                        <Badge key={index} variant="outline" className="font-mono">
                          {phone}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketingCampaignReport;