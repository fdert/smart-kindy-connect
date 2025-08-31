import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { FileText, Download, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
      
      const stats = getResponseStats();
      
      // Create HTML content with proper Arabic support
      const htmlContent = `
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="UTF-8">
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;700&display=swap');
            
            body {
              font-family: 'Noto Sans Arabic', Arial, sans-serif;
              direction: rtl;
              text-align: right;
              padding: 20px;
              line-height: 1.6;
              background: white;
              color: #333;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 20px;
            }
            
            .title {
              font-size: 24px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 10px;
            }
            
            .section {
              margin-bottom: 25px;
              background: #f8fafc;
              padding: 15px;
              border-radius: 8px;
              border-right: 4px solid #2563eb;
            }
            
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #1e40af;
              margin-bottom: 15px;
              text-align: center;
            }
            
            .info-row {
              margin-bottom: 8px;
              padding: 5px 0;
            }
            
            .label {
              font-weight: bold;
              color: #374151;
            }
            
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin: 15px 0;
            }
            
            .stat-card {
              background: white;
              padding: 15px;
              text-align: center;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            
            .stat-number {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
            }
            
            .stat-label {
              font-size: 12px;
              color: #6b7280;
              margin-top: 5px;
            }
            
            .response-item {
              background: white;
              margin-bottom: 10px;
              padding: 15px;
              border-radius: 8px;
              border: 1px solid #e5e7eb;
            }
            
            .response-header {
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
            }
            
            .response-details {
              font-size: 14px;
              color: #6b7280;
              margin: 5px 0;
            }
            
            .badge {
              display: inline-block;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: bold;
            }
            
            .badge-approved { background: #dcfce7; color: #166534; }
            .badge-declined { background: #fef2f2; color: #dc2626; }
            .badge-pending { background: #f3f4f6; color: #374151; }
            
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 12px;
              color: #6b7280;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">تقرير ردود الأذونات</div>
          </div>
          
          <div class="section">
            <div class="section-title">تفاصيل الطلب</div>
            <div class="info-row">
              <span class="label">عنوان الطلب:</span> ${permission.title}
            </div>
            <div class="info-row">
              <span class="label">نوع الطلب:</span> ${getPermissionTypeLabel(permission.permission_type)}
            </div>
            ${permission.description ? `
            <div class="info-row">
              <span class="label">الوصف:</span> ${permission.description}
            </div>
            ` : ''}
            <div class="info-row">
              <span class="label">تاريخ الإنشاء:</span> ${format(new Date(permission.created_at), 'PPP', { locale: ar })}
            </div>
            <div class="info-row">
              <span class="label">تاريخ الانتهاء:</span> ${format(new Date(permission.expires_at), 'PPP', { locale: ar })}
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">إحصائيات الردود</div>
            <div class="stats-grid">
              <div class="stat-card">
                <div class="stat-number">${stats.total}</div>
                <div class="stat-label">إجمالي الردود</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.approved}</div>
                <div class="stat-label">موافق (${stats.approvedPercentage}%)</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.declined}</div>
                <div class="stat-label">مرفوض (${stats.declinedPercentage}%)</div>
              </div>
              <div class="stat-card">
                <div class="stat-number">${stats.pending}</div>
                <div class="stat-label">معلق (${stats.pendingPercentage}%)</div>
              </div>
            </div>
          </div>
          
          <div class="section">
            <div class="section-title">تفاصيل الردود</div>
            ${responses.map((response, index) => `
              <div class="response-item">
                <div class="response-header">
                  ${index + 1}. ${response.guardians.full_name}
                  <span class="badge ${
                    response.response === 'موافق' || response.response === 'approved' ? 'badge-approved' :
                    response.response === 'غير موافق' || response.response === 'declined' ? 'badge-declined' :
                    'badge-pending'
                  }">${response.response}</span>
                </div>
                <div class="response-details">الطالب: ${response.students.full_name}</div>
                <div class="response-details">
                  ${response.responded_at ? 
                    `تاريخ الرد: ${format(new Date(response.responded_at), 'PPP p', { locale: ar })}` : 
                    'لم يرد بعد'
                  }
                </div>
                ${response.notes ? `<div class="response-details">ملاحظات: ${response.notes}</div>` : ''}
                <div class="response-details">رقم الواتساب: ${response.guardians.whatsapp_number}</div>
              </div>
            `).join('')}
          </div>
          
          ${stats.pending > 0 ? `
          <div class="section">
            <div class="section-title">قائمة من لم يرد (${stats.pending})</div>
            ${responses
              .filter(r => r.response === 'pending')
              .map((response, index) => `
                <div class="info-row">
                  ${index + 1}. ${response.guardians.full_name} - ${response.students.full_name} - ${response.guardians.whatsapp_number}
                </div>
              `).join('')}
          </div>
          ` : ''}
          
          <div class="footer">
            تم إنشاء التقرير في: ${format(new Date(), 'PPP p', { locale: ar })}
          </div>
        </body>
        </html>
      `;
      
      // Create a temporary div to render HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.width = '794px'; // A4 width in pixels
      document.body.appendChild(tempDiv);
      
      // Wait for fonts to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate canvas from HTML
      const canvas = await html2canvas(tempDiv, {
        width: 794,
        height: 1123,
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Remove temporary div
      document.body.removeChild(tempDiv);
      
      // Create PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 0;
      
      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
      
      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      
      // Save PDF
      const fileName = `تقرير_ردود_الاذونات_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
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