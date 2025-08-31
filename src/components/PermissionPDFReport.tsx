import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Permission {
  id: string;
  title: string;
  description: string | null;
  permission_type: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

interface PermissionResponse {
  id: string;
  response: string;
  responded_at: string | null;
  notes: string | null;
  guardians: {
    full_name: string;
    whatsapp_number: string;
  };
  students: {
    full_name: string;
  };
}

interface PermissionPDFReportProps {
  permission: Permission;
  responses: PermissionResponse[];
}

export const PermissionPDFReport = ({ permission, responses }: PermissionPDFReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const { toast } = useToast();

  const getPermissionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      activity: 'نشاط',
      trip: 'رحلة',
      medical: 'طبي',
      event: 'فعالية',
      other: 'أخرى'
    };
    return types[type] || type;
  };

  const getResponseStats = () => {
    const total = responses.length;
    const approved = responses.filter(r => r.response === 'موافق' || r.response === 'approved').length;
    const declined = responses.filter(r => r.response === 'غير موافق' || r.response === 'declined').length;
    const pending = responses.filter(r => r.response === 'pending').length;
    
    return {
      total,
      approved,
      declined,
      pending,
      approvedPercentage: total > 0 ? Math.round((approved / total) * 100) : 0,
      declinedPercentage: total > 0 ? Math.round((declined / total) * 100) : 0,
      pendingPercentage: total > 0 ? Math.round((pending / total) * 100) : 0
    };
  };

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      const stats = getResponseStats();
      
      // Use built-in fonts with Unicode support
      doc.setFont('helvetica');
      
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      
      // Title - centered
      doc.setFontSize(20);
      doc.text('تقرير ردود الأذونات', pageWidth / 2, 30, { align: 'center' });
      
      
      // Permission details section
      doc.setFontSize(16);
      doc.text('تفاصيل الطلب', pageWidth / 2, 50, { align: 'center' });
      
      doc.setFontSize(12);
      let yPosition = 65;
      
      // Permission info helper function
      const addText = (label: string, value: string, y: number) => {
        const text = `${label}: ${value}`;
        doc.text(text, pageWidth / 2, y, { align: 'center' });
        return y + 8;
      };
      
      yPosition = addText('عنوان الطلب', permission.title, yPosition);
      yPosition = addText('نوع الطلب', getPermissionTypeLabel(permission.permission_type), yPosition);
      
      if (permission.description) {
        yPosition = addText('الوصف', permission.description, yPosition);
      }
      
      yPosition = addText('تاريخ الإنشاء', format(new Date(permission.created_at), 'PPP', { locale: ar }), yPosition);
      yPosition = addText('تاريخ الانتهاء', format(new Date(permission.expires_at), 'PPP', { locale: ar }), yPosition);
      yPosition += 15;
      
      // Statistics section
      doc.setFontSize(16);
      doc.text('إحصائيات الردود', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      doc.setFontSize(12);
      yPosition = addText('إجمالي الردود المرسلة', stats.total.toString(), yPosition);
      yPosition = addText('الردود بالموافقة', `${stats.approved} (${stats.approvedPercentage}%)`, yPosition);
      yPosition = addText('الردود بالرفض', `${stats.declined} (${stats.declinedPercentage}%)`, yPosition);
      yPosition = addText('الردود المعلقة', `${stats.pending} (${stats.pendingPercentage}%)`, yPosition);
      yPosition += 15;
      
      // Responses details section
      doc.setFontSize(16);
      doc.text('تفاصيل الردود', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;
      
      doc.setFontSize(10);
      
      responses.forEach((response, index) => {
        if (yPosition > 250) {
          doc.addPage();
          yPosition = 30;
        }
        
        // Response details
        doc.text(`${index + 1}. ${response.guardians.full_name}`, margin, yPosition);
        yPosition += 6;
        doc.text(`   الطالب: ${response.students.full_name}`, margin + 5, yPosition);
        yPosition += 6;
        doc.text(`   الرد: ${response.response}`, margin + 5, yPosition);
        yPosition += 6;
        
        if (response.responded_at) {
          doc.text(`   تاريخ الرد: ${format(new Date(response.responded_at), 'PPP p', { locale: ar })}`, margin + 5, yPosition);
        } else {
          doc.text('   حالة الرد: لم يرد بعد', margin + 5, yPosition);
        }
        yPosition += 6;
        
        if (response.notes) {
          doc.text(`   ملاحظات: ${response.notes}`, margin + 5, yPosition);
          yPosition += 6;
        }
        
        doc.text(`   رقم الواتساب: ${response.guardians.whatsapp_number}`, margin + 5, yPosition);
        yPosition += 10;
      });
      
      
      // Non-respondents section
      const nonRespondents = responses.filter(r => r.response === 'pending');
      if (nonRespondents.length > 0) {
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 30;
        }
        
        doc.setFontSize(16);
        doc.text('قائمة من لم يرد', pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;
        
        doc.setFontSize(10);
        
        nonRespondents.forEach((response, index) => {
          if (yPosition > 250) {
            doc.addPage();
            yPosition = 30;
          }
          
          const text = `${index + 1}. ${response.guardians.full_name} - ${response.students.full_name} - ${response.guardians.whatsapp_number}`;
          doc.text(text, margin, yPosition);
          yPosition += 8;
        });
      }
      
      
      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.text(`تم إنشاء التقرير في: ${format(new Date(), 'PPP p', { locale: ar })}`, pageWidth / 2, 285, { align: 'center' });
        doc.text(`صفحة ${i} من ${pageCount}`, pageWidth - margin, 285, { align: 'right' });
      }
      
      // Save the PDF
      const fileName = `تقرير_ردود_الاذونات_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);
      
      toast({
        title: "تم إنشاء التقرير",
        description: "تم تحميل تقرير PDF بنجاح",
      });
      
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء التقرير",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const stats = getResponseStats();

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={generatePDF}
        disabled={isGenerating}
        className="flex items-center gap-2"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <FileText className="h-4 w-4" />
        )}
        {isGenerating ? 'جاري الإنشاء...' : 'تقرير PDF'}
      </Button>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            معاينة التقرير
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>معاينة تقرير الردود</DialogTitle>
            <DialogDescription>
              معاينة تقرير الردود لطلب: {permission.title}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 p-4">
            {/* Permission Details */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">تفاصيل الطلب</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p><strong>عنوان الطلب:</strong> {permission.title}</p>
                  <p><strong>نوع الطلب:</strong> {getPermissionTypeLabel(permission.permission_type)}</p>
                  {permission.description && (
                    <p><strong>الوصف:</strong> {permission.description}</p>
                  )}
                </div>
                <div>
                  <p><strong>تاريخ الإنشاء:</strong> {format(new Date(permission.created_at), 'PPP', { locale: ar })}</p>
                  <p><strong>تاريخ الانتهاء:</strong> {format(new Date(permission.expires_at), 'PPP', { locale: ar })}</p>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">إحصائيات الردود</h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-sm text-gray-600">إجمالي الردود</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
                  <div className="text-sm text-gray-600">موافق ({stats.approvedPercentage}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
                  <div className="text-sm text-gray-600">مرفوض ({stats.declinedPercentage}%)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                  <div className="text-sm text-gray-600">معلق ({stats.pendingPercentage}%)</div>
                </div>
              </div>
            </div>

            {/* Responses List */}
            <div>
              <h3 className="text-lg font-semibold mb-3">تفاصيل الردود</h3>
              <div className="space-y-3">
                {responses.map((response, index) => (
                  <div key={response.id} className="border p-3 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{response.guardians.full_name}</h4>
                        <p className="text-sm text-gray-600">ولي أمر: {response.students.full_name}</p>
                      </div>
                      <Badge 
                        variant={
                          response.response === 'موافق' || response.response === 'approved' ? 'default' :
                          response.response === 'غير موافق' || response.response === 'declined' ? 'destructive' :
                          'secondary'
                        }
                      >
                        {response.response}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      <p>رقم الواتساب: {response.guardians.whatsapp_number}</p>
                      {response.responded_at ? (
                        <p>تاريخ الرد: {format(new Date(response.responded_at), 'PPP p', { locale: ar })}</p>
                      ) : (
                        <p>لم يرد بعد</p>
                      )}
                      {response.notes && <p>ملاحظات: {response.notes}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Non-respondents */}
            {stats.pending > 0 && (
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">قائمة من لم يرد ({stats.pending})</h3>
                <div className="space-y-2">
                  {responses
                    .filter(r => r.response === 'pending')
                    .map((response, index) => (
                      <div key={response.id} className="text-sm">
                        {index + 1}. {response.guardians.full_name} - {response.students.full_name} - {response.guardians.whatsapp_number}
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <Button onClick={generatePDF} disabled={isGenerating} className="flex items-center gap-2">
                {isGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                {isGenerating ? 'جاري الإنشاء...' : 'تحميل PDF'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};