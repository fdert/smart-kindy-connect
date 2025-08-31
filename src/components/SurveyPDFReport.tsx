import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';

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
  aiAnalysis?: {
    summary: string;
    keyInsights: string[];
    recommendations: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    participationRate: string;
    strengths: string[];
    improvements: string[];
  };
}

export const SurveyPDFReport: React.FC<SurveyPDFReportProps> = ({
  survey,
  results,
  tenantInfo,
  onGenerateReport,
  aiAnalysis
}) => {
  const generatePDF = async () => {
    try {
      console.log('=== PDF Generation Started ===');
      console.log('Survey:', survey);
      console.log('Results count:', results.length);
      console.log('Results data:', results);
      console.log('AI Analysis:', aiAnalysis);
      console.log('Tenant Info:', tenantInfo);
      
      await onGenerateReport();
      
      // Create a temporary div for the report content
      const reportElement = document.createElement('div');
      reportElement.style.cssText = `
        width: 210mm;
        padding: 15mm;
        background: white;
        font-family: 'Arial', sans-serif;
        direction: rtl;
        position: absolute;
        top: -9999px;
        left: -9999px;
        overflow: visible;
        min-height: 297mm;
      `;
      
      // Generate report content with actual data
      const reportHTML = await generateReportHTML();
      console.log('Generated HTML length:', reportHTML.length);
      reportElement.innerHTML = reportHTML;
      document.body.appendChild(reportElement);

      // Wait for content to render and images to load
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Convert to canvas and generate multi-page PDF
      const canvas = await html2canvas(reportElement, {
        scale: 1.2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: true,
        height: reportElement.scrollHeight,
        width: reportElement.scrollWidth
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = 210; // A4 width in mm
      const pdfHeight = 297; // A4 height in mm
      
      // Calculate scaling
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;
      
      // If content fits in one page
      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight);
      } else {
        // Split into multiple pages
        let yPosition = 0;
        let pageCount = 0;
        
        while (yPosition < scaledHeight) {
          if (pageCount > 0) {
            pdf.addPage();
          }
          
          const srcY = (yPosition / ratio);
          const srcHeight = Math.min((pdfHeight / ratio), imgHeight - srcY);
          const destHeight = srcHeight * ratio;
          
          // Create a canvas for this page
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = imgWidth;
          pageCanvas.height = srcHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            pageCtx.drawImage(canvas, 0, -srcY);
            const pageImgData = pageCanvas.toDataURL('image/png');
            pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, destHeight);
          }
          
          yPosition += pdfHeight;
          pageCount++;
        }
      }
      
      // Save the PDF
      const fileName = `تقرير_استطلاع_${survey.title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      pdf.save(fileName);
      
      // Clean up
      document.body.removeChild(reportElement);
      console.log('PDF generated successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('حدث خطأ في إنتاج التقرير: ' + error.message);
    }
  };

  const generateReportHTML = async (): Promise<string> => {
    console.log('=== Generate Report HTML Started ===');
    const totalResponses = results.reduce((sum, result) => sum + result.totalResponses, 0);
    const averageResponseRate = results.length > 0 ? (totalResponses / results.length) : 0;
    
    console.log('Report data check:');
    console.log('- Results array length:', results.length);
    console.log('- Results data:', results);
    console.log('- Total responses:', totalResponses); 
    console.log('- Has AI Analysis:', !!aiAnalysis);
    console.log('- AI Analysis data:', aiAnalysis);
    
     // Generate charts as base64 images
    const charts = await generateCharts();
    console.log('Generated charts count:', charts.length);
    
    return `
      <div style="width: 100%; font-family: 'Arial', sans-serif; direction: rtl; background: white; color: #333; line-height: 1.6;">
        <!-- Header Section -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; margin-bottom: 30px; border-radius: 15px; text-align: center;">
          ${tenantInfo.logo_url ? `<img src="${tenantInfo.logo_url}" style="height: 60px; margin-bottom: 15px;" alt="الشعار" />` : ''}
          <h1 style="font-size: 32px; font-weight: bold; margin: 0 0 10px 0;">${tenantInfo.name}</h1>
          <h2 style="font-size: 24px; margin: 10px 0; opacity: 0.9;">تقرير تحليل الاستطلاع</h2>
          <div style="background: rgba(255,255,255,0.2); padding: 20px; border-radius: 10px; margin-top: 20px;">
            <h3 style="font-size: 28px; margin: 0 0 10px 0; font-weight: bold;">${survey.title}</h3>
            <p style="font-size: 16px; margin: 0; opacity: 0.9;">${survey.description || 'لا يوجد وصف'}</p>
          </div>
        </div>

        ${aiAnalysis ? `
          <!-- AI Analysis Section -->
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 25px; display: flex; align-items: center;">
              <span style="margin-left: 10px;">🤖</span> التحليل الذكي
            </h3>
            
            <!-- Summary -->
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
              <h4 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">الملخص التنفيذي</h4>
              <p style="font-size: 14px; line-height: 1.6; margin: 0;">${aiAnalysis.summary}</p>
              <div style="margin-top: 15px; display: flex; gap: 15px; flex-wrap: wrap;">
                <span style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 20px; font-size: 12px; display: inline-block;">
                  الإجمالي: ${aiAnalysis.sentiment === 'positive' ? '😊 إيجابي' : aiAnalysis.sentiment === 'negative' ? '😟 يحتاج تحسين' : '😐 متوازن'}
                </span>
                <span style="background: rgba(255,255,255,0.2); padding: 8px 15px; border-radius: 20px; font-size: 12px; display: inline-block;">
                  المشاركة: ${aiAnalysis.participationRate}
                </span>
              </div>
            </div>
            
            <!-- Key Insights -->
            <div style="margin-bottom: 20px;">
              <h4 style="color: #4299e1; font-size: 16px; font-weight: bold; margin-bottom: 15px;">🔍 الرؤى الرئيسية</h4>
              ${aiAnalysis.keyInsights.map(insight => `
                <div style="background: #ebf8ff; padding: 12px; margin-bottom: 8px; border-radius: 8px; border-right: 4px solid #4299e1;">
                  <p style="margin: 0; font-size: 13px; color: #2b6cb0;">${insight}</p>
                </div>
              `).join('')}
            </div>

            ${aiAnalysis.strengths.length > 0 ? `
              <!-- Strengths -->
              <div style="margin-bottom: 20px;">
                <h4 style="color: #48bb78; font-size: 16px; font-weight: bold; margin-bottom: 15px;">✅ نقاط القوة</h4>
                ${aiAnalysis.strengths.map(strength => `
                  <div style="background: #f0fff4; padding: 12px; margin-bottom: 8px; border-radius: 8px; border-right: 4px solid #48bb78;">
                    <p style="margin: 0; font-size: 13px; color: #2f855a;">${strength}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            ${aiAnalysis.improvements.length > 0 ? `
              <!-- Improvements -->
              <div style="margin-bottom: 20px;">
                <h4 style="color: #ed8936; font-size: 16px; font-weight: bold; margin-bottom: 15px;">⚠️ مجالات التحسين</h4>
                ${aiAnalysis.improvements.map(improvement => `
                  <div style="background: #fffaf0; padding: 12px; margin-bottom: 8px; border-radius: 8px; border-right: 4px solid #ed8936;">
                    <p style="margin: 0; font-size: 13px; color: #c05621;">${improvement}</p>
                  </div>
                `).join('')}
              </div>
            ` : ''}
            
            <!-- Recommendations -->
            <div>
              <h4 style="color: #805ad5; font-size: 16px; font-weight: bold; margin-bottom: 15px;">💡 التوصيات</h4>
              ${aiAnalysis.recommendations.map(rec => `
                <div style="background: #faf5ff; padding: 12px; margin-bottom: 8px; border-radius: 8px; border-right: 4px solid #805ad5;">
                  <p style="margin: 0; font-size: 13px; color: #553c9a;">${rec}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Summary Section -->
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 25px;">
            📊 ملخص تنفيذي
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

        ${charts.length > 0 ? `
          <!-- Charts Section -->
          <div style="background: white; border: 2px solid #e2e8f0; border-radius: 15px; padding: 30px; margin-bottom: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h3 style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 25px;">📈 الرسوم البيانية</h3>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px;">
              ${charts.map(chart => `
                <div style="text-align: center; page-break-inside: avoid;">
                  <img src="${chart.dataUrl}" style="max-width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px;" alt="${chart.title}" />
                  <p style="margin: 0; font-weight: bold; color: #4a5568; font-size: 14px;">${chart.title}</p>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- Detailed Results Section -->
        <div style="background: white; border: 2px solid #e2e8f0; border-radius: 15px; padding: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h3 style="color: #667eea; font-size: 24px; font-weight: bold; margin-bottom: 25px;">📋 تفاصيل النتائج</h3>
          
          ${results.map((result, index) => `
            <div style="border: 1px solid #e2e8f0; border-radius: 10px; padding: 20px; margin-bottom: 20px; background: ${index % 2 === 0 ? '#f8fafc' : 'white'}; page-break-inside: avoid;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <h4 style="color: #2d3748; font-size: 18px; font-weight: bold; margin: 0; flex: 1;">${result.questionText}</h4>
                <div style="background: #667eea; color: white; padding: 5px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-right: 15px;">
                  ${result.totalResponses} رد
                </div>
              </div>
              
              ${generateResultDetails(result)}
            </div>
          `).join('')}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 40px; padding: 20px; color: #4a5568; font-size: 12px; border-top: 1px solid #e2e8f0;">
          تم إنتاج هذا التقرير في ${format(new Date(), 'dd MMMM yyyy - HH:mm', { locale: ar })}
        </div>
      </div>
    `;
  };

  const generateCharts = async (): Promise<Array<{title: string, dataUrl: string}>> => {
    const charts: Array<{title: string, dataUrl: string}> = [];
    
    console.log('Generating charts for', results.length, 'results');
    
    for (const result of results) {
      if (result.totalResponses > 0) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 600;
          canvas.height = 400;
          const ctx = canvas.getContext('2d');
          
          if (ctx) {
            // Clear canvas with white background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Add border
            ctx.strokeStyle = '#e2e8f0';
            ctx.lineWidth = 2;
            ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
            
            // Title
            ctx.fillStyle = '#2d3748';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            const truncatedTitle = result.questionText.length > 40 
              ? result.questionText.substring(0, 40) + '...'
              : result.questionText;
            ctx.fillText(truncatedTitle, canvas.width / 2, 35);
            
            // Set up chart area
            const chartArea = { x: 80, y: 70, width: 440, height: 280 };
            
            if (result.questionType === 'yes_no') {
              const yesCount = result.yesCount || 0;
              const noCount = result.noCount || 0;
              const total = yesCount + noCount;
              
              if (total > 0) {
                // Pie chart for yes/no questions
                const centerX = chartArea.x + chartArea.width / 2;
                const centerY = chartArea.y + chartArea.height / 2 - 20;
                const radius = 80;
                
                const yesAngle = (yesCount / total) * 2 * Math.PI;
                
                // Yes slice
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + yesAngle);
                ctx.closePath();
                ctx.fillStyle = '#48bb78';
                ctx.fill();
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 3;
                ctx.stroke();
                
                // No slice  
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, -Math.PI / 2 + yesAngle, -Math.PI / 2 + 2 * Math.PI);
                ctx.closePath();
                ctx.fillStyle = '#e53e3e';
                ctx.fill();
                ctx.stroke();
                
                // Legend
                ctx.fillStyle = '#48bb78';
                ctx.fillRect(centerX - 120, centerY + 110, 15, 15);
                ctx.fillStyle = '#2d3748';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`نعم: ${yesCount} (${((yesCount/total)*100).toFixed(1)}%)`, centerX - 100, centerY + 122);
                
                ctx.fillStyle = '#e53e3e';
                ctx.fillRect(centerX + 20, centerY + 110, 15, 15);
                ctx.fillStyle = '#2d3748';
                ctx.fillText(`لا: ${noCount} (${((noCount/total)*100).toFixed(1)}%)`, centerX + 40, centerY + 122);
              }
              
            } else if (result.questionType === 'rating' && result.ratings) {
              // Bar chart for ratings
              const ratingCounts = [1, 2, 3, 4, 5].map(rating => 
                result.ratings?.filter(r => r === rating).length || 0
              );
              const maxCount = Math.max(...ratingCounts, 1);
              const barWidth = chartArea.width / 7;
              
              ratingCounts.forEach((count, index) => {
                const barHeight = (count / maxCount) * (chartArea.height - 60);
                const x = chartArea.x + (index + 1) * barWidth;
                const y = chartArea.y + chartArea.height - barHeight - 40;
                
                // Bar
                ctx.fillStyle = '#ffd700';
                ctx.fillRect(x - barWidth/3, y, barWidth*0.6, barHeight);
                ctx.strokeStyle = '#e2a610';
                ctx.lineWidth = 2;
                ctx.strokeRect(x - barWidth/3, y, barWidth*0.6, barHeight);
                
                // Value on top
                ctx.fillStyle = '#2d3748';
                ctx.font = 'bold 11px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${count}`, x, y - 5);
                
                // Label
                ctx.font = 'bold 10px Arial';
                ctx.fillText(`${index + 1}⭐`, x, chartArea.y + chartArea.height - 20);
              });
              
            } else if (result.optionCounts) {
              // Bar chart for options
              const options = Object.entries(result.optionCounts);
              const maxCount = Math.max(...options.map(([_, count]) => count), 1);
              const barHeight = Math.min(30, (chartArea.height - 40) / options.length);
              
              options.forEach(([option, count], index) => {
                const barWidth = (count / maxCount) * (chartArea.width * 0.7);
                const y = chartArea.y + 20 + index * (barHeight + 10);
                
                // Bar
                ctx.fillStyle = '#667eea';
                ctx.fillRect(chartArea.x, y, barWidth, barHeight);
                ctx.strokeStyle = '#553c9a';
                ctx.lineWidth = 1;
                ctx.strokeRect(chartArea.x, y, barWidth, barHeight);
                
                // Label
                ctx.fillStyle = '#2d3748';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'right';
                const shortOption = option.length > 25 ? option.substring(0, 25) + '...' : option;
                ctx.fillText(`${shortOption}: ${count}`, chartArea.x + chartArea.width - 10, y + barHeight/2 + 3);
              });
            }
          }
          
          const dataUrl = canvas.toDataURL('image/png', 1.0);
          charts.push({
            title: result.questionText.length > 30 ? result.questionText.substring(0, 30) + '...' : result.questionText,
            dataUrl
          });
          
          console.log('Generated chart for:', result.questionText);
        } catch (error) {
          console.warn('Error generating chart for question:', result.questionText, error);
        }
      }
    }
    
    console.log('Total charts generated:', charts.length);
    return charts;
  };

  const generateResultDetails = (result: SurveyResult): string => {
    if (result.questionType === 'yes_no') {
      const yesPercent = result.yesPercentage || 0;
      const noPercent = 100 - yesPercent;
      
      return `
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
          <div style="background: #f0fff4; padding: 15px; border-radius: 8px; border-right: 4px solid #48bb78;">
            <div style="font-size: 24px; font-weight: bold; color: #48bb78; margin-bottom: 5px;">${result.yesCount || 0}</div>
            <div style="font-size: 14px; color: #2f855a;">نعم (${yesPercent.toFixed(1)}%)</div>
          </div>
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; border-right: 4px solid #e53e3e;">
            <div style="font-size: 24px; font-weight: bold; color: #e53e3e; margin-bottom: 5px;">${result.noCount || 0}</div>
            <div style="font-size: 14px; color: #dc2626;">لا (${noPercent.toFixed(1)}%)</div>
          </div>
        </div>
      `;
    } else if (result.questionType === 'rating' && result.averageRating) {
      return `
        <div style="text-align: center; padding: 20px; background: #fffbeb; border-radius: 8px; border-right: 4px solid #fbbf24;">
          <div style="font-size: 32px; font-weight: bold; color: #d97706; margin-bottom: 10px;">
            ${result.averageRating.toFixed(1)}/5 ⭐
          </div>
          <div style="font-size: 14px; color: #92400e;">متوسط التقييم</div>
        </div>
      `;
    } else if (result.optionCounts) {
      const options = Object.entries(result.optionCounts);
      return `
        <div style="space-y: 8px;">
          ${options.map(([option, count]) => {
            const percentage = result.totalResponses > 0 ? (count / result.totalResponses) * 100 : 0;
            return `
              <div style="background: #f8fafc; padding: 10px; border-radius: 6px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                  <span style="font-size: 14px; color: #374151;">${option}</span>
                  <span style="font-size: 12px; font-weight: bold; color: #6b7280;">${count} (${percentage.toFixed(1)}%)</span>
                </div>
                <div style="background: #e5e7eb; height: 6px; border-radius: 3px; overflow: hidden;">
                  <div style="background: #667eea; height: 100%; width: ${percentage}%; transition: width 0.3s ease;"></div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `;
    } else if (result.questionType === 'text') {
      return `
        <div style="text-align: center; padding: 20px; background: #f3f4f6; border-radius: 8px;">
          <div style="font-size: 16px; color: #6b7280; margin-bottom: 5px;">ردود نصية</div>
          <div style="font-size: 14px; color: #9ca3af;">لمراجعة الردود النصية، يرجى الاطلاع على تفاصيل الاستطلاع</div>
        </div>
      `;
    }
    
    return `
      <div style="text-align: center; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <div style="font-size: 14px; color: #6b7280;">لا توجد بيانات متاحة لهذا السؤال</div>
      </div>
    `;
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
      teachers: 'المعلمات',
      both: 'الكل',
      public: 'عام'
    };
    return audiences[audience] || audience;
  };

  return (
    <Button 
      onClick={generatePDF}
      className="flex items-center gap-2"
      variant="default"
    >
      <Download className="h-4 w-4" />
      تحميل التقرير
    </Button>
  );
};