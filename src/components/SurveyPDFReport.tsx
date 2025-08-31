import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, PieChart, TrendingUp, Users, Calendar, Target } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface Survey {
  id: string;
  title: string;
  description?: string;
  survey_type: string;
  target_audience: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
}

interface SurveyResult {
  questionId: string;
  questionText: string;
  questionType: string;
  totalResponses: number;
  yesCount?: number;
  noCount?: number;
  yesPercentage?: number;
  optionCounts?: Record<string, number>;
  averageRating?: number;
  ratings?: number[];
}

interface TenantInfo {
  name: string;
  logo_url?: string;
}

interface SurveyPDFReportProps {
  survey: Survey;
  results: SurveyResult[];
  tenantInfo: TenantInfo;
  onGenerateReport: () => Promise<void>;
}

export const SurveyPDFReport: React.FC<SurveyPDFReportProps> = ({
  survey,
  results,
  tenantInfo,
  onGenerateReport
}) => {
  const generatePDF = async () => {
    try {
      await onGenerateReport();
      
      // Create a temporary div for the report content
      const reportElement = document.createElement('div');
      reportElement.style.cssText = `
        width: 210mm;
        min-height: 297mm;
        padding: 20mm;
        background: white;
        font-family: 'Arial', sans-serif;
        direction: rtl;
        position: absolute;
        top: -9999px;
        left: -9999px;
      `;
      
      // Generate report content
      reportElement.innerHTML = await generateReportHTML();
      document.body.appendChild(reportElement);

      // Convert to canvas and generate PDF
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        width: 794, // A4 width in pixels at 96 DPI
        height: 1123 // A4 height in pixels at 96 DPI
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      // Add the image to PDF
      pdf.addImage(imgData, 'PNG', 0, 0, 210, 297);
      
      // Save the PDF
      const fileName = `تقرير_استطلاع_${survey.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      // Clean up
      document.body.removeChild(reportElement);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ في إنتاج التقرير');
    }
  };

  const generateReportHTML = async (): Promise<string> => {
    const totalResponses = results.reduce((sum, result) => sum + result.totalResponses, 0);
    const averageResponseRate = results.length > 0 ? (totalResponses / results.length) : 0;
    
    // Generate charts as base64 images
    const charts = await generateCharts();
    
    return `
      <div style="width: 100%; min-height: 100vh; padding: 30px; font-family: 'Arial', sans-serif; direction: rtl; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #333;">
        <!-- Header Section -->
        <div style="background: white; border-radius: 15px; padding: 40px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <div style="text-align: center; border-bottom: 3px solid #667eea; padding-bottom: 20px; margin-bottom: 30px;">
            ${tenantInfo.logo_url ? `<img src="${tenantInfo.logo_url}" style="height: 60px; margin-bottom: 15px;" alt="الشعار" />` : ''}
            <h1 style="color: #667eea; font-size: 32px; font-weight: bold; margin: 0;">${tenantInfo.name}</h1>
            <h2 style="color: #4a5568; font-size: 24px; margin: 10px 0 0 0;">تقرير تحليل الاستطلاع</h2>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 25px; border-radius: 10px; text-align: center;">
            <h3 style="font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">${survey.title}</h3>
            <p style="font-size: 16px; margin: 0; opacity: 0.9;">${survey.description || 'لا يوجد وصف'}</p>
          </div>
        </div>

        <!-- Summary Section -->
        <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 25px; display: flex; align-items: center;">
            <span style="margin-left: 10px;">📊</span> ملخص تنفيذي
          </h3>
          
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 25px;">
            <div style="background: linear-gradient(135deg, #48bb78, #38a169); color: white; padding: 20px; border-radius: 10px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${results.length}</div>
              <div style="font-size: 14px; opacity: 0.9;">إجمالي الأسئلة</div>
            </div>
            <div style="background: linear-gradient(135deg, #4299e1, #3182ce); color: white; padding: 20px; border-radius: 10px; text-align: center;">
              <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${totalResponses}</div>
              <div style="font-size: 14px; opacity: 0.9;">إجمالي الردود</div>
            </div>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;">
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-right: 4px solid #667eea;">
              <div style="font-size: 14px; color: #4a5568; margin-bottom: 5px;">نوع الاستطلاع</div>
              <div style="font-weight: bold; color: #667eea;">${getSurveyTypeLabel(survey.survey_type)}</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-right: 4px solid #48bb78;">
              <div style="font-size: 14px; color: #4a5568; margin-bottom: 5px;">الجمهور المستهدف</div>
              <div style="font-weight: bold; color: #48bb78;">${getTargetAudienceLabel(survey.target_audience)}</div>
            </div>
            <div style="background: #f7fafc; padding: 15px; border-radius: 8px; border-right: 4px solid #ed8936;">
              <div style="font-size: 14px; color: #4a5568; margin-bottom: 5px;">معدل الاستجابة</div>
              <div style="font-weight: bold; color: #ed8936;">${averageResponseRate.toFixed(1)} رد/سؤال</div>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding: 15px; background: #edf2f7; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #4a5568;">تاريخ الإنشاء:</span>
              <span style="font-weight: bold;">${format(new Date(survey.created_at), 'dd MMMM yyyy', { locale: ar })}</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
              <span style="color: #4a5568;">تاريخ الانتهاء:</span>
              <span style="font-weight: bold;">${format(new Date(survey.expires_at), 'dd MMMM yyyy', { locale: ar })}</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span style="color: #4a5568;">حالة الاستطلاع:</span>
              <span style="font-weight: bold; color: ${survey.is_active ? '#48bb78' : '#e53e3e'};">${survey.is_active ? 'نشط' : 'غير نشط'}</span>
            </div>
          </div>
        </div>

        <!-- Charts Section -->
        ${charts.length > 0 ? `
          <div style="background: white; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 25px;">📈 الرسوم البيانية</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px;">
              ${charts.map(chart => `
                <div style="text-align: center;">
                  <img src="${chart.dataUrl}" style="max-width: 100%; height: auto; border-radius: 8px;" alt="${chart.title}" />
                  <p style="margin: 10px 0 0 0; font-weight: bold; color: #4a5568;">${chart.title}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Detailed Results Section -->
        <div style="background: white; border-radius: 15px; padding: 30px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 25px;">📋 تفاصيل النتائج</h3>
          
          ${results.map((result, index) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 20px; background: ${index % 2 === 0 ? '#f8fafc' : 'white'};">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #2d3748; font-size: 18px; font-weight: bold; margin: 0;">${result.questionText}</h4>
                <div style="background: #667eea; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
                  ${result.totalResponses} رد
                </div>
              </div>
              
              ${generateResultDetails(result)}
            </div>
          `).join('')}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; color: white; font-size: 12px;">
          تم إنتاج هذا التقرير في ${format(new Date(), 'dd MMMM yyyy - HH:mm', { locale: ar })}
        </div>
      </div>
    `;
  };

  const generateCharts = async (): Promise<Array<{title: string, dataUrl: string}>> => {
    const charts: Array<{title: string, dataUrl: string}> = [];
    
    // Create a simple placeholder chart for demonstration
    // In a real implementation, you would use Chart.js to render actual charts
    for (const result of results.slice(0, 4)) { // Limit to 4 charts for layout
      if (result.totalResponses > 0) {
        // Create a simple data URL for demonstration
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 200;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Simple bar chart simulation
          ctx.fillStyle = '#667eea';
          ctx.fillRect(50, 150, 80, -result.totalResponses * 10);
          ctx.fillStyle = '#48bb78';
          if (result.yesCount) {
            ctx.fillRect(150, 150, 80, -result.yesCount * 15);
          }
          
          // Add title
          ctx.fillStyle = '#333';
          ctx.font = '14px Arial';
          ctx.textAlign = 'center';
          ctx.fillText(result.questionText.substring(0, 20) + '...', 150, 190);
        }
        
        const dataUrl = canvas.toDataURL();
        charts.push({
          title: result.questionText.length > 30 ? result.questionText.substring(0, 30) + '...' : result.questionText,
          dataUrl
        });
      }
    }
    
    return charts;
  };

  const generateResultDetails = (result: SurveyResult): string => {
    if (result.questionType === 'yes_no') {
      const yesPercent = result.yesPercentage || 0;
      const noPercent = 100 - yesPercent;
      
      return `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div style="background: #48bb78; color: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${result.yesCount || 0}</div>
            <div style="font-size: 14px; margin: 5px 0;">نعم (${yesPercent.toFixed(1)}%)</div>
            <div style="background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; margin-top: 10px;">
              <div style="background: white; height: 100%; width: ${yesPercent}%; border-radius: 2px;"></div>
            </div>
          </div>
          <div style="background: #e53e3e; color: white; padding: 15px; border-radius: 8px; text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${result.noCount || 0}</div>
            <div style="font-size: 14px; margin: 5px 0;">لا (${noPercent.toFixed(1)}%)</div>
            <div style="background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; margin-top: 10px;">
              <div style="background: white; height: 100%; width: ${noPercent}%; border-radius: 2px;"></div>
            </div>
          </div>
        </div>
      `;
    } else if (result.questionType === 'rating' && result.averageRating !== undefined) {
      return `
        <div style="background: #667eea; color: white; padding: 20px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; font-weight: bold; margin-bottom: 5px;">${result.averageRating.toFixed(1)}</div>
          <div style="font-size: 16px;">متوسط التقييم</div>
          <div style="margin-top: 15px; display: flex; justify-content: center; gap: 5px;">
            ${Array.from({length: 5}, (_, i) => `
              <span style="font-size: 20px; color: ${i < Math.round(result.averageRating!) ? '#ffd700' : 'rgba(255,255,255,0.3)'};">★</span>
            `).join('')}
          </div>
        </div>
      `;
    } else if (result.optionCounts) {
      const options = Object.entries(result.optionCounts);
      const maxCount = Math.max(...options.map(([_, count]) => count));
      
      return `
        <div style="space-y: 10px;">
          ${options.map(([option, count]) => {
            const percentage = result.totalResponses > 0 ? (count / result.totalResponses * 100) : 0;
            const width = maxCount > 0 ? (count / maxCount * 100) : 0;
            
            return `
              <div style="margin-bottom: 10px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                  <span style="font-weight: bold;">${option}</span>
                  <span style="color: #4a5568;">${count} (${percentage.toFixed(1)}%)</span>
                </div>
                <div style="background: #e2e8f0; height: 8px; border-radius: 4px;">
                  <div style="background: #667eea; height: 100%; width: ${width}%; border-radius: 4px;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    }
    
    return `<p style="color: #4a5568; font-style: italic;">لا توجد بيانات كافية للعرض</p>`;
  };

  const getSurveyTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      general: 'عام',
      satisfaction: 'رضا',
      feedback: 'تقييم',
      evaluation: 'تقويم'
    };
    return types[type] || type;
  };

  const getTargetAudienceLabel = (audience: string) => {
    const audiences: Record<string, string> = {
      guardians: 'أولياء الأمور',
      teachers: 'المعلمين',
      students: 'الطلاب',
      all: 'الجميع'
    };
    return audiences[audience] || audience;
  };

  return (
    <button
      onClick={generatePDF}
      className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      تحميل تقرير PDF
    </button>
  );
};