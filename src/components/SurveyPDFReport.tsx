import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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

interface AIAnalysisType {
  summary?: string;
  insights?: string[];
  recommendations?: string[];
  strengths?: string[];
  improvements?: string[];
}

interface SurveyPDFReportProps {
  survey: {
    id: string;
    title: string;
    description?: string;
    created_at: string;
    survey_type: string;
    target_audience: string;
  };
  results: SurveyResult[];
  tenantInfo: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  aiAnalysis?: AIAnalysisType;
  onGenerateReport: () => Promise<void>;
}

export const SurveyPDFReport = ({
  survey,
  results: initialResults,
  tenantInfo,
  aiAnalysis,
  onGenerateReport
}: SurveyPDFReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentResults, setCurrentResults] = useState<SurveyResult[]>(initialResults);

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      console.log('=== PDF Generation Started ===');
      console.log('Survey:', survey);
      console.log('Initial Results count:', initialResults.length);
      console.log('Current Results count:', currentResults.length);
      console.log('AI Analysis:', aiAnalysis);
      
      // Always reload results to ensure we have latest data
      await onGenerateReport();
      
      // Wait for results to be updated
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Use the latest results passed as props
      const resultsToUse = initialResults.length > 0 ? initialResults : currentResults;
      console.log('Results to use for PDF:', resultsToUse);
      
      if (resultsToUse.length === 0) {
        console.warn('No results available for PDF generation');
      }
      
      const htmlContent = generateReportHTML(resultsToUse);
      console.log('Generated HTML content length:', htmlContent.length);
      
      // Create temporary container
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.cssText = `
        position: absolute;
        top: -10000px;
        left: -10000px;
        width: 794px;
        background: white;
        font-family: Arial, sans-serif;
        direction: rtl;
        line-height: 1.6;
      `;
      
      document.body.appendChild(container);
      
      try {
        // Generate canvas from HTML
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794,
          scrollX: 0,
          scrollY: 0,
        });
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add first page
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297; // A4 height
        
        // Add additional pages if needed
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= 297;
        }
        
        // Download PDF
        const fileName = `تقرير_${survey.title.replace(/[^\w\s]/gi, '')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        console.log('PDF generated successfully');
      } finally {
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportHTML = (results: SurveyResult[]): string => {
    console.log('=== Generate Report HTML Started ===');
    console.log('Results for HTML generation:', results);
    
    const totalResponses = results.reduce((sum, result) => sum + result.totalResponses, 0);
    const averageResponseRate = results.length > 0 ? (totalResponses / results.length) : 0;
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const generateQuestionChart = (result: SurveyResult): string => {
      console.log('Generating chart for question:', result.questionText);
      
      if (result.questionType === 'yes_no' && result.totalResponses > 0) {
        const yesCount = result.yesCount || 0;
        const noCount = result.noCount || 0;
        const yesPercentage = result.yesPercentage || 0;
        const noPercentage = 100 - yesPercentage;
        
        return `
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">${result.questionText}</h4>
            <div style="margin: 10px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span style="color: #00C49F; font-weight: bold;">نعم: ${yesCount} (${yesPercentage.toFixed(1)}%)</span>
                <span style="color: #FF8042; font-weight: bold;">لا: ${noCount} (${noPercentage.toFixed(1)}%)</span>
              </div>
              <div style="display: flex; height: 20px; border-radius: 10px; overflow: hidden; background: #f0f0f0;">
                <div style="background: #00C49F; width: ${yesPercentage}%; min-width: ${yesPercentage > 0 ? '5px' : '0'}"></div>
                <div style="background: #FF8042; width: ${noPercentage}%; min-width: ${noPercentage > 0 ? '5px' : '0'}"></div>
              </div>
            </div>
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">إجمالي الردود: ${result.totalResponses}</p>
          </div>
        `;
      }
      
      if ((result.questionType === 'single_choice' || result.questionType === 'multiple_choice') && result.optionCounts) {
        const options = Object.entries(result.optionCounts);
        const maxCount = Math.max(...options.map(([, count]) => count));
        
        const optionsHTML = options.map(([option, count]) => {
          const percentage = result.totalResponses > 0 ? (count / result.totalResponses * 100) : 0;
          const barWidth = maxCount > 0 ? (count / maxCount * 100) : 0;
          
          return `
            <div style="margin: 8px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-size: 14px; color: #333;">${option}</span>
                <span style="font-weight: bold; color: #0088FE;">${count} (${percentage.toFixed(1)}%)</span>
              </div>
              <div style="background: #f0f0f0; height: 12px; border-radius: 6px; overflow: hidden;">
                <div style="background: #0088FE; height: 100%; width: ${barWidth}%; min-width: ${barWidth > 0 ? '5px' : '0'}; border-radius: 6px;"></div>
              </div>
            </div>
          `;
        }).join('');
        
        return `
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">${result.questionText}</h4>
            ${optionsHTML}
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">إجمالي الردود: ${result.totalResponses}</p>
          </div>
        `;
      }
      
      if (result.questionType === 'rating' && result.ratings && result.ratings.length > 0) {
        const ratingCounts = [1, 2, 3, 4, 5].map(rating => {
          const count = result.ratings?.filter(r => r === rating).length || 0;
          const percentage = result.totalResponses > 0 ? (count / result.totalResponses * 100) : 0;
          return { rating, count, percentage };
        });
        
        const maxCount = Math.max(...ratingCounts.map(r => r.count));
        
        const ratingsHTML = ratingCounts.map(({ rating, count, percentage }) => {
          const barWidth = maxCount > 0 ? (count / maxCount * 100) : 0;
          
          return `
            <div style="margin: 8px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                <span style="font-size: 14px; color: #333;">${rating} نجوم</span>
                <span style="font-weight: bold; color: #FFBB28;">${count} (${percentage.toFixed(1)}%)</span>
              </div>
              <div style="background: #f0f0f0; height: 12px; border-radius: 6px; overflow: hidden;">
                <div style="background: #FFBB28; height: 100%; width: ${barWidth}%; min-width: ${barWidth > 0 ? '5px' : '0'}; border-radius: 6px;"></div>
              </div>
            </div>
          `;
        }).join('');
        
        return `
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">${result.questionText}</h4>
            ${ratingsHTML}
            <p style="margin: 10px 0 0 0; color: #666; font-size: 14px;">إجمالي الردود: ${result.totalResponses} | متوسط التقييم: ${(result.averageRating || 0).toFixed(1)}/5</p>
          </div>
        `;
      }
      
      if (result.questionType === 'text') {
        return `
          <div style="margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">${result.questionText}</h4>
            <div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 6px;">
              <p style="color: #666; margin: 0;">الردود النصية لا يمكن عرضها في شكل رسم بياني</p>
              <p style="color: #666; margin: 5px 0 0 0;">يمكنك تصدير النتائج لمراجعة الردود النصية</p>
              <p style="margin: 10px 0 0 0; color: #333; font-weight: bold;">إجمالي الردود: ${result.totalResponses}</p>
            </div>
          </div>
        `;
      }
      
      return `
        <div style="margin: 20px 0; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h4 style="margin: 0 0 15px 0; color: #333; font-size: 16px;">${result.questionText}</h4>
          <div style="text-align: center; padding: 30px; background: #f8f9fa; border-radius: 6px;">
            <p style="color: #666; margin: 0;">لا توجد ردود على هذا السؤال بعد</p>
          </div>
        </div>
      `;
    };

    const resultsHTML = results.map(result => generateQuestionChart(result)).join('');
    
    const aiAnalysisHTML = aiAnalysis ? `
      <div style="margin: 30px 0; padding: 25px; background: #f8f9fa; border-radius: 10px; border-right: 4px solid #0088FE;">
        <h3 style="margin: 0 0 20px 0; color: #0088FE; font-size: 20px;">📊 التحليل الذكي للاستطلاع</h3>
        
        ${aiAnalysis.summary ? `
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">📋 ملخص النتائج</h4>
            <p style="margin: 0; line-height: 1.8; color: #555;">${aiAnalysis.summary}</p>
          </div>
        ` : ''}
        
        ${aiAnalysis.insights && aiAnalysis.insights.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">💡 الرؤى والاستنتاجات</h4>
            <ul style="margin: 0; padding-right: 20px; line-height: 1.8; color: #555;">
              ${aiAnalysis.insights.map(insight => `<li style="margin-bottom: 5px;">${insight}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">🎯 التوصيات</h4>
            <ul style="margin: 0; padding-right: 20px; line-height: 1.8; color: #555;">
              ${aiAnalysis.recommendations.map(rec => `<li style="margin-bottom: 5px;">${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${aiAnalysis.strengths && aiAnalysis.strengths.length > 0 ? `
          <div style="margin-bottom: 20px;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">✅ نقاط القوة</h4>
            <ul style="margin: 0; padding-right: 20px; line-height: 1.8; color: #555;">
              ${aiAnalysis.strengths.map(strength => `<li style="margin-bottom: 5px;">${strength}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${aiAnalysis.improvements && aiAnalysis.improvements.length > 0 ? `
          <div style="margin-bottom: 0;">
            <h4 style="margin: 0 0 10px 0; color: #333; font-size: 16px;">🔧 نقاط التحسين</h4>
            <ul style="margin: 0; padding-right: 20px; line-height: 1.8; color: #555;">
              ${aiAnalysis.improvements.map(improvement => `<li style="margin-bottom: 5px;">${improvement}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    ` : '';

    return `
      <div style="width: 100%; max-width: 794px; margin: 0 auto; padding: 40px; background: white; color: #333; font-family: Arial, sans-serif; direction: rtl; line-height: 1.6;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 2px solid #0088FE; padding-bottom: 30px;">
          <h1 style="margin: 0 0 15px 0; color: #0088FE; font-size: 28px; font-weight: bold;">📊 تقرير الاستطلاع</h1>
          <h2 style="margin: 0 0 20px 0; color: #333; font-size: 22px;">${survey.title}</h2>
          ${survey.description ? `<p style="margin: 0 0 15px 0; color: #666; font-size: 16px; font-style: italic;">${survey.description}</p>` : ''}
          <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-top: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; text-align: right;">
              <div>
                <strong style="color: #0088FE;">المؤسسة:</strong> ${tenantInfo.name}
              </div>
              <div>
                <strong style="color: #0088FE;">تاريخ الإنشاء:</strong> ${formatDate(survey.created_at)}
              </div>
              <div>
                <strong style="color: #0088FE;">نوع الاستطلاع:</strong> ${survey.survey_type === 'feedback' ? 'استطلاع رأي' : survey.survey_type}
              </div>
              <div>
                <strong style="color: #0088FE;">الجمهور المستهدف:</strong> ${survey.target_audience === 'guardians' ? 'أولياء الأمور' : survey.target_audience}
              </div>
            </div>
          </div>
        </div>

        <!-- Statistics Summary -->
        <div style="margin-bottom: 40px;">
          <h3 style="margin: 0 0 20px 0; color: #0088FE; font-size: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">📈 ملخص الإحصائيات</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div style="text-align: center; padding: 20px; background: #e8f4fd; border-radius: 10px;">
              <div style="font-size: 32px; font-weight: bold; color: #0088FE; margin-bottom: 5px;">${totalResponses}</div>
              <div style="color: #666; font-size: 14px;">إجمالي الردود</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #f0f9ff; border-radius: 10px;">
              <div style="font-size: 32px; font-weight: bold; color: #00C49F; margin-bottom: 5px;">${results.length}</div>
              <div style="color: #666; font-size: 14px;">عدد الأسئلة</div>
            </div>
            <div style="text-align: center; padding: 20px; background: #fff7ed; border-radius: 10px;">
              <div style="font-size: 32px; font-weight: bold; color: #FFBB28; margin-bottom: 5px;">${averageResponseRate.toFixed(1)}</div>
              <div style="color: #666; font-size: 14px;">متوسط الردود لكل سؤال</div>
            </div>
          </div>
        </div>

        <!-- AI Analysis -->
        ${aiAnalysisHTML}

        <!-- Detailed Results -->
        <div style="margin-bottom: 40px;">
          <h3 style="margin: 0 0 25px 0; color: #0088FE; font-size: 20px; border-bottom: 1px solid #e0e0e0; padding-bottom: 10px;">📊 النتائج التفصيلية</h3>
          ${results.length > 0 ? resultsHTML : `
            <div style="text-align: center; padding: 50px; background: #f8f9fa; border-radius: 10px; border: 2px dashed #ddd;">
              <p style="margin: 0; color: #666; font-size: 18px;">لا توجد نتائج متاحة لهذا الاستطلاع</p>
              <p style="margin: 10px 0 0 0; color: #999; font-size: 14px;">قد يكون الاستطلاع جديداً أو لم يتلق أي ردود بعد</p>
            </div>
          `}
        </div>

        <!-- Footer -->
        <div style="margin-top: 50px; padding-top: 30px; border-top: 2px solid #e0e0e0; text-align: center; color: #666; font-size: 12px;">
          <p style="margin: 0;">تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          ${tenantInfo.email ? `<p style="margin: 5px 0 0 0;">للاستفسارات: ${tenantInfo.email}</p>` : ''}
        </div>
      </div>
    `;
  };

  return (
    <Button 
      onClick={generatePDF}
      disabled={isGenerating}
      className="flex items-center gap-2"
    >
      {isGenerating ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileDown className="h-4 w-4" />
      )}
      {isGenerating ? 'جاري إنشاء التقرير...' : 'تصدير تقرير PDF'}
    </Button>
  );
};