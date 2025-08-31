import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, Loader2 } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { supabase } from '@/integrations/supabase/client';

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
  tenantInfo,
  onGenerateReport
}: SurveyPDFReportProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchSurveyResults = async (): Promise<SurveyResult[]> => {
    try {
      console.log('Fetching survey results directly for:', survey.id);
      
      const response = await fetch('https://ytjodudlnfamvnescumu.supabase.co/functions/v1/surveys-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'getResults',
          surveyId: survey.id
        })
      });

      const data = await response.json();
      console.log('Direct fetch results:', data);
      
      if (data.success && data.results) {
        return data.results;
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching survey results:', error);
      return [];
    }
  };

  const generateAIAnalysis = async (results: SurveyResult[]): Promise<AIAnalysisType | null> => {
    try {
      if (results.length === 0) return null;
      
      console.log('Generating AI analysis for results:', results);
      
      const response = await fetch('https://ytjodudlnfamvnescumu.supabase.co/functions/v1/surveys-api', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'generateAIAnalysis',
          surveyId: survey.id,
          results: results
        })
      });

      const data = await response.json();
      console.log('AI Analysis response:', data);
      
      if (data.success && data.analysis) {
        return data.analysis;
      }
      
      return null;
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      return null;
    }
  };

  const generatePDF = async () => {
    try {
      setIsGenerating(true);
      console.log('=== Starting PDF Generation ===');
      
      // Fetch fresh survey results
      const results = await fetchSurveyResults();
      console.log('Fresh results fetched:', results);
      
      // Generate AI analysis if we have results
      const aiAnalysis = results.length > 0 ? await generateAIAnalysis(results) : null;
      console.log('AI Analysis generated:', aiAnalysis);
      
      // Generate the report HTML with all data
      const htmlContent = generateReportHTML(results, aiAnalysis);
      console.log('HTML content generated, length:', htmlContent.length);
      
      // Create temporary container for rendering
      const container = document.createElement('div');
      container.innerHTML = htmlContent;
      container.style.cssText = `
        position: absolute;
        top: -20000px;
        left: -20000px;
        width: 794px;
        background: white;
        font-family: Arial, sans-serif;
        direction: rtl;
        line-height: 1.6;
        padding: 0;
        margin: 0;
      `;
      
      document.body.appendChild(container);
      
      try {
        // Wait for any images to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Generate canvas from HTML
        const canvas = await html2canvas(container, {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          width: 794,
          height: container.scrollHeight,
          scrollX: 0,
          scrollY: 0,
          logging: true
        });
        
        console.log('Canvas generated:', canvas.width, 'x', canvas.height);
        
        // Create PDF
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;
        
        // Add first page
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297; // A4 height in mm
        
        // Add additional pages if content is longer than one page
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= 297;
        }
        
        // Download PDF
        const fileName = `تقرير_${survey.title.replace(/[^\w\s]/gi, '')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);
        
        console.log('PDF generated and downloaded successfully');
      } finally {
        document.body.removeChild(container);
      }
    } catch (error) {
      console.error('خطأ في إنشاء التقرير:', error);
      alert('حدث خطأ في إنشاء التقرير. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateReportHTML = (results: SurveyResult[], aiAnalysis: AIAnalysisType | null): string => {
    console.log('=== Generating Report HTML ===');
    console.log('Results for HTML:', results);
    console.log('AI Analysis for HTML:', aiAnalysis);
    
    const totalResponses = results.reduce((sum, result) => sum + result.totalResponses, 0);
    const averageResponseRate = results.length > 0 ? (totalResponses / results.length) : 0;
    
    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const generateQuestionHTML = (result: SurveyResult): string => {
      console.log('Generating HTML for question:', result.questionText, 'Type:', result.questionType);
      
      if (result.questionType === 'yes_no' && result.totalResponses > 0) {
        const yesCount = result.yesCount || 0;
        const noCount = result.noCount || 0;
        const yesPercentage = result.yesPercentage || 0;
        const noPercentage = 100 - yesPercentage;
        
        return `
          <div style="margin: 30px 0; padding: 25px; border: 2px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
            <h4 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${result.questionText}</h4>
            
            <div style="margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="text-align: center; padding: 15px; background: #e8f5e8; border-radius: 8px; flex: 1; margin-left: 10px;">
                  <div style="font-size: 24px; font-weight: bold; color: #00C49F;">نعم</div>
                  <div style="font-size: 18px; color: #00C49F; margin: 5px 0;">${yesCount}</div>
                  <div style="font-size: 14px; color: #666;">${yesPercentage.toFixed(1)}%</div>
                </div>
                <div style="text-align: center; padding: 15px; background: #ffe8e8; border-radius: 8px; flex: 1;">
                  <div style="font-size: 24px; font-weight: bold; color: #FF8042;">لا</div>
                  <div style="font-size: 18px; color: #FF8042; margin: 5px 0;">${noCount}</div>
                  <div style="font-size: 14px; color: #666;">${noPercentage.toFixed(1)}%</div>
                </div>
              </div>
              
              <div style="height: 40px; border-radius: 20px; overflow: hidden; background: #f0f0f0; margin: 15px 0;">
                <div style="display: flex; height: 100%;">
                  <div style="background: linear-gradient(45deg, #00C49F, #00A085); width: ${yesPercentage}%; min-width: ${yesPercentage > 0 ? '10px' : '0'}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                    ${yesPercentage > 15 ? 'نعم' : ''}
                  </div>
                  <div style="background: linear-gradient(45deg, #FF8042, #FF6B2B); width: ${noPercentage}%; min-width: ${noPercentage > 0 ? '10px' : '0'}; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px;">
                    ${noPercentage > 15 ? 'لا' : ''}
                  </div>
                </div>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 15px; padding: 10px; background: white; border-radius: 6px;">
              <strong style="color: #0088FE;">إجمالي الردود: ${result.totalResponses}</strong>
            </div>
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
            <div style="margin: 12px 0; padding: 10px; background: white; border-radius: 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 14px; color: #333; font-weight: 500;">${option}</span>
                <span style="font-weight: bold; color: #0088FE; font-size: 14px;">${count} (${percentage.toFixed(1)}%)</span>
              </div>
              <div style="background: #e9ecef; height: 16px; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(45deg, #0088FE, #0066CC); height: 100%; width: ${barWidth}%; min-width: ${barWidth > 0 ? '15px' : '0'}; border-radius: 8px; transition: width 0.3s ease;"></div>
              </div>
            </div>
          `;
        }).join('');
        
        return `
          <div style="margin: 30px 0; padding: 25px; border: 2px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
            <h4 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${result.questionText}</h4>
            ${optionsHTML}
            <div style="text-align: center; margin-top: 15px; padding: 10px; background: white; border-radius: 6px;">
              <strong style="color: #0088FE;">إجمالي الردود: ${result.totalResponses}</strong>
            </div>
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
          const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
          
          return `
            <div style="margin: 12px 0; padding: 10px; background: white; border-radius: 6px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-size: 14px; color: #333; font-weight: 500;">${stars} (${rating} نجوم)</span>
                <span style="font-weight: bold; color: #FFBB28; font-size: 14px;">${count} (${percentage.toFixed(1)}%)</span>
              </div>
              <div style="background: #fff3cd; height: 16px; border-radius: 8px; overflow: hidden;">
                <div style="background: linear-gradient(45deg, #FFBB28, #FF9500); height: 100%; width: ${barWidth}%; min-width: ${barWidth > 0 ? '15px' : '0'}; border-radius: 8px;"></div>
              </div>
            </div>
          `;
        }).join('');
        
        return `
          <div style="margin: 30px 0; padding: 25px; border: 2px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
            <h4 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${result.questionText}</h4>
            ${ratingsHTML}
            <div style="text-align: center; margin-top: 15px; padding: 10px; background: white; border-radius: 6px;">
              <strong style="color: #0088FE;">إجمالي الردود: ${result.totalResponses} | متوسط التقييم: ${(result.averageRating || 0).toFixed(1)}/5</strong>
            </div>
          </div>
        `;
      }
      
      if (result.questionType === 'text') {
        return `
          <div style="margin: 30px 0; padding: 25px; border: 2px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
            <h4 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${result.questionText}</h4>
            <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; border: 2px dashed #ddd;">
              <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
              <p style="color: #666; margin: 0; font-size: 16px;">الردود النصية لا يمكن عرضها في شكل رسم بياني</p>
              <p style="color: #999; margin: 8px 0 0 0; font-size: 14px;">يمكنك تصدير النتائج لمراجعة الردود النصية</p>
              <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 4px;">
                <strong style="color: #0088FE;">إجمالي الردود: ${result.totalResponses}</strong>
              </div>
            </div>
          </div>
        `;
      }
      
      return `
        <div style="margin: 30px 0; padding: 25px; border: 2px solid #e0e0e0; border-radius: 12px; background: #fafafa;">
          <h4 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 18px; font-weight: bold;">${result.questionText}</h4>
          <div style="text-align: center; padding: 40px; background: white; border-radius: 8px; border: 2px dashed #ddd;">
            <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
            <p style="color: #666; margin: 0; font-size: 16px;">لا توجد ردود على هذا السؤال بعد</p>
          </div>
        </div>
      `;
    };

    const resultsHTML = results.map(result => generateQuestionHTML(result)).join('');
    
    const aiAnalysisHTML = aiAnalysis ? `
      <div style="margin: 40px 0; padding: 30px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 15px; border: 3px solid #0088FE;">
        <h3 style="margin: 0 0 25px 0; color: #0088FE; font-size: 24px; text-align: center; border-bottom: 2px solid #0088FE; padding-bottom: 15px;">
          🤖 التحليل الذكي للاستطلاع
        </h3>
        
        ${aiAnalysis.summary ? `
          <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 10px; border-right: 5px solid #28a745;">
            <h4 style="margin: 0 0 15px 0; color: #28a745; font-size: 18px; display: flex; align-items: center;">
              📋 ملخص النتائج
            </h4>
            <p style="margin: 0; line-height: 1.8; color: #333; font-size: 16px;">${aiAnalysis.summary}</p>
          </div>
        ` : ''}
        
        ${aiAnalysis.insights && aiAnalysis.insights.length > 0 ? `
          <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 10px; border-right: 5px solid #17a2b8;">
            <h4 style="margin: 0 0 15px 0; color: #17a2b8; font-size: 18px;">💡 الرؤى والاستنتاجات</h4>
            <ul style="margin: 0; padding-right: 25px; line-height: 1.8; color: #333;">
              ${aiAnalysis.insights.map(insight => `<li style="margin-bottom: 8px; font-size: 15px;">${insight}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${aiAnalysis.recommendations && aiAnalysis.recommendations.length > 0 ? `
          <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 10px; border-right: 5px solid #ffc107;">
            <h4 style="margin: 0 0 15px 0; color: #e67e22; font-size: 18px;">🎯 التوصيات</h4>
            <ul style="margin: 0; padding-right: 25px; line-height: 1.8; color: #333;">
              ${aiAnalysis.recommendations.map(rec => `<li style="margin-bottom: 8px; font-size: 15px;">${rec}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${aiAnalysis.strengths && aiAnalysis.strengths.length > 0 ? `
          <div style="margin-bottom: 25px; padding: 20px; background: white; border-radius: 10px; border-right: 5px solid #28a745;">
            <h4 style="margin: 0 0 15px 0; color: #28a745; font-size: 18px;">✅ نقاط القوة</h4>
            <ul style="margin: 0; padding-right: 25px; line-height: 1.8; color: #333;">
              ${aiAnalysis.strengths.map(strength => `<li style="margin-bottom: 8px; font-size: 15px;">${strength}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
        
        ${aiAnalysis.improvements && aiAnalysis.improvements.length > 0 ? `
          <div style="margin-bottom: 0; padding: 20px; background: white; border-radius: 10px; border-right: 5px solid #dc3545;">
            <h4 style="margin: 0 0 15px 0; color: #dc3545; font-size: 18px;">🔧 نقاط التحسين</h4>
            <ul style="margin: 0; padding-right: 25px; line-height: 1.8; color: #333;">
              ${aiAnalysis.improvements.map(improvement => `<li style="margin-bottom: 8px; font-size: 15px;">${improvement}</li>`).join('')}
            </ul>
          </div>
        ` : ''}
      </div>
    ` : '';

    return `
      <div style="width: 100%; max-width: 794px; margin: 0; padding: 30px; background: white; color: #333; font-family: Arial, sans-serif; direction: rtl; line-height: 1.6;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 40px; padding: 30px; background: linear-gradient(135deg, #0088FE, #0066CC); color: white; border-radius: 15px;">
          <h1 style="margin: 0 0 10px 0; font-size: 32px; font-weight: bold;">📊 تقرير الاستطلاع</h1>
          <h2 style="margin: 0 0 15px 0; font-size: 24px; opacity: 0.95;">${survey.title}</h2>
          ${survey.description ? `<p style="margin: 0 0 20px 0; font-size: 16px; opacity: 0.9; font-style: italic;">${survey.description}</p>` : ''}
          
          <div style="background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin-top: 20px;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; text-align: right; font-size: 14px;">
              <div><strong>المؤسسة:</strong> ${tenantInfo.name}</div>
              <div><strong>تاريخ الإنشاء:</strong> ${formatDate(survey.created_at)}</div>
              <div><strong>نوع الاستطلاع:</strong> ${survey.survey_type === 'feedback' ? 'استطلاع رأي' : survey.survey_type}</div>
              <div><strong>الجمهور المستهدف:</strong> ${survey.target_audience === 'guardians' ? 'أولياء الأمور' : survey.target_audience}</div>
            </div>
          </div>
        </div>

        <!-- Statistics Summary -->
        <div style="margin-bottom: 40px;">
          <h3 style="margin: 0 0 25px 0; color: #0088FE; font-size: 22px; border-bottom: 3px solid #0088FE; padding-bottom: 10px; text-align: center;">📈 ملخص الإحصائيات</h3>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
            <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #e8f4fd, #d1ecf1); border-radius: 12px; border: 2px solid #0088FE;">
              <div style="font-size: 36px; font-weight: bold; color: #0088FE; margin-bottom: 8px;">${totalResponses}</div>
              <div style="color: #0088FE; font-size: 16px; font-weight: 600;">إجمالي الردود</div>
            </div>
            <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #e8f5e8, #d4e6d4); border-radius: 12px; border: 2px solid #00C49F;">
              <div style="font-size: 36px; font-weight: bold; color: #00C49F; margin-bottom: 8px;">${results.length}</div>
              <div style="color: #00C49F; font-size: 16px; font-weight: 600;">عدد الأسئلة</div>
            </div>
            <div style="text-align: center; padding: 25px; background: linear-gradient(135deg, #fff8e1, #ffecb3); border-radius: 12px; border: 2px solid #FFBB28;">
              <div style="font-size: 36px; font-weight: bold; color: #FFBB28; margin-bottom: 8px;">${averageResponseRate.toFixed(1)}</div>
              <div style="color: #FFBB28; font-size: 16px; font-weight: 600;">متوسط الردود لكل سؤال</div>
            </div>
          </div>
        </div>

        <!-- AI Analysis -->
        ${aiAnalysisHTML}

        <!-- Detailed Results -->
        <div style="margin-bottom: 40px;">
          <h3 style="margin: 0 0 30px 0; color: #0088FE; font-size: 22px; border-bottom: 3px solid #0088FE; padding-bottom: 10px; text-align: center;">📊 النتائج التفصيلية</h3>
          ${results.length > 0 ? resultsHTML : `
            <div style="text-align: center; padding: 60px; background: linear-gradient(135deg, #f8f9fa, #e9ecef); border-radius: 15px; border: 3px dashed #ddd;">
              <div style="font-size: 64px; margin-bottom: 20px; opacity: 0.5;">📊</div>
              <p style="margin: 0; color: #666; font-size: 20px; font-weight: 600;">لا توجد نتائج متاحة لهذا الاستطلاع</p>
              <p style="margin: 15px 0 0 0; color: #999; font-size: 16px;">قد يكون الاستطلاع جديداً أو لم يتلق أي ردود بعد</p>
            </div>
          `}
        </div>

        <!-- Footer -->
        <div style="margin-top: 50px; padding: 25px; background: #f8f9fa; border-radius: 10px; text-align: center; color: #666; font-size: 14px; border-top: 3px solid #0088FE;">
          <p style="margin: 0; font-weight: 600;">تم إنشاء هذا التقرير في ${new Date().toLocaleDateString('ar-SA', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
          ${tenantInfo.email ? `<p style="margin: 8px 0 0 0;">للاستفسارات: ${tenantInfo.email}</p>` : ''}
          <p style="margin: 8px 0 0 0; font-style: italic; opacity: 0.8;">تم إنشاؤه بواسطة نظام إدارة الروضات</p>
        </div>
      </div>
    `;
  };

  return (
    <Button 
      onClick={generatePDF}
      disabled={isGenerating}
      className="flex items-center gap-2"
      size="sm"
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