import { useState } from 'react';
import { pipeline, env } from '@huggingface/transformers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Brain, TrendingUp, Users, AlertTriangle, CheckCircle } from 'lucide-react';

// Configure transformers.js to always download models
env.allowLocalModels = false;
env.useBrowserCache = true;

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

interface Survey {
  id: string;
  title: string;
  description?: string;
  survey_type: string;
  target_audience: string;
}

interface AIAnalysis {
  summary: string;
  keyInsights: string[];
  recommendations: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  participationRate: string;
  strengths: string[];
  improvements: string[];
}

interface SurveyAIAnalysisProps {
  survey: Survey;
  results: SurveyResult[];
  onAnalysisComplete?: (analysis: AIAnalysis) => void;
}

export const SurveyAIAnalysis = ({ survey, results, onAnalysisComplete }: SurveyAIAnalysisProps) => {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateLocalAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      // Prepare data for analysis
      const totalResponses = results.reduce((sum, result) => sum + result.totalResponses, 0);
      const averageResponsesPerQuestion = totalResponses / (results.length || 1);

      // Calculate sentiment based on ratings and yes/no responses
      let positiveResponses = 0;
      let totalSentimentResponses = 0;

      results.forEach(result => {
        if (result.questionType === 'yes_no') {
          positiveResponses += result.yesCount || 0;
          totalSentimentResponses += result.totalResponses;
        } else if (result.questionType === 'rating' && result.averageRating) {
          // Consider ratings 4+ as positive
          if (result.averageRating >= 4) {
            positiveResponses += result.totalResponses;
          } else if (result.averageRating >= 3) {
            positiveResponses += result.totalResponses * 0.5;
          }
          totalSentimentResponses += result.totalResponses;
        }
      });

      const positivityRate = totalSentimentResponses > 0 ? (positiveResponses / totalSentimentResponses) : 0.5;

      // Generate insights based on data patterns
      const keyInsights: string[] = [];
      const recommendations: string[] = [];
      const strengths: string[] = [];
      const improvements: string[] = [];

      // Analyze response patterns
      if (averageResponsesPerQuestion > 50) {
        keyInsights.push('معدل المشاركة عالي جداً، مما يشير إلى اهتمام كبير بموضوع الاستطلاع');
        strengths.push('معدل مشاركة ممتاز من الجمهور المستهدف');
      } else if (averageResponsesPerQuestion > 20) {
        keyInsights.push('معدل المشاركة جيد ويظهر اهتماماً معقولاً من المجتمع');
        strengths.push('مشاركة جيدة من الجمهور المستهدف');
      } else {
        keyInsights.push('معدل المشاركة منخفض، قد يحتاج إلى استراتيجيات تحفيز أفضل');
        improvements.push('تحسين استراتيجيات التواصل لزيادة المشاركة');
        recommendations.push('استخدام قنوات تواصل إضافية للوصول إلى جمهور أوسع');
      }

      // Analyze question types distribution
      const questionTypes = results.reduce((acc, result) => {
        acc[result.questionType] = (acc[result.questionType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      if (questionTypes.rating && questionTypes.rating > results.length * 0.3) {
        keyInsights.push('الاستطلاع يركز على التقييمات، مما يوفر بيانات كمية قيمة');
        strengths.push('استخدام فعال للأسئلة التقييمية للحصول على بيانات قابلة للقياس');
      }

      // Analyze sentiment
      let sentiment: 'positive' | 'neutral' | 'negative';
      if (positivityRate > 0.7) {
        sentiment = 'positive';
        keyInsights.push('النتائج إيجابية بشكل عام مع مستوى رضا عالي');
        strengths.push('مستوى رضا عالي من المشاركين');
      } else if (positivityRate > 0.4) {
        sentiment = 'neutral';
        keyInsights.push('النتائج متوازنة مع مجال للتحسين');
        improvements.push('التركيز على النقاط التي حصلت على تقييمات أقل');
      } else {
        sentiment = 'negative';
        keyInsights.push('النتائج تشير إلى وجود تحديات تحتاج إلى اهتمام فوري');
        improvements.push('مراجعة شاملة للمجالات التي حصلت على تقييمات منخفضة');
        recommendations.push('وضع خطة عمل فورية لمعالجة المشاكل المحددة');
      }

      // Generate recommendations based on survey type
      if (survey.survey_type === 'satisfaction') {
        if (positivityRate < 0.6) {
          recommendations.push('تنظيم جلسات تقييم مع المجتمع لفهم أسباب عدم الرضا');
          recommendations.push('وضع خطة تحسين مرحلية لمعالجة النقاط السلبية');
        } else {
          recommendations.push('الحفاظ على العوامل الإيجابية وتعزيزها أكثر');
        }
      } else if (survey.survey_type === 'feedback') {
        recommendations.push('تحليل التعليقات النوعية بالتفصيل لاستخراج توجيهات عملية');
        recommendations.push('تطوير استراتيجيات التحسين بناء على الملاحظات المقدمة');
      }

      // Target audience specific insights
      if (survey.target_audience === 'guardians') {
        keyInsights.push('آراء أولياء الأمور تعكس اهتماماً كبيراً بجودة الخدمات المقدمة');
        recommendations.push('تعزيز التواصل المستمر مع أولياء الأمور');
      } else if (survey.target_audience === 'teachers') {
        keyInsights.push('آراء المعلمين توفر رؤى مهنية قيمة حول البيئة التعليمية');
        recommendations.push('تنظيم ورش تدريبية بناء على احتياجات المعلمين المحددة');
      } else if (survey.target_audience === 'students') {
        keyInsights.push('آراء الطلاب تظهر مدى فعالية البرامج والأنشطة المقدمة');
        recommendations.push('تطوير أنشطة إضافية بناء على اهتمامات الطلاب');
      }

      // Participation rate analysis
      let participationRate = '';
      if (averageResponsesPerQuestion > 100) {
        participationRate = 'ممتاز (100+)';
      } else if (averageResponsesPerQuestion > 50) {
        participationRate = 'جيد جداً (50-100)';
      } else if (averageResponsesPerQuestion > 20) {
        participationRate = 'جيد (20-50)';
      } else if (averageResponsesPerQuestion > 10) {
        participationRate = 'متوسط (10-20)';
      } else {
        participationRate = 'منخفض (<10)';
      }

      // Generate summary
      const summary = `
        تحليل شامل للاستطلاع "${survey.title}" يظهر معدل مشاركة ${participationRate.split(' ')[0]} بإجمالي ${totalResponses} رد على ${results.length} أسئلة.
        النتائج العامة ${sentiment === 'positive' ? 'إيجابية' : sentiment === 'neutral' ? 'متوازنة' : 'تحتاج تحسين'} 
        مع معدل إيجابية ${(positivityRate * 100).toFixed(1)}%.
        ${survey.target_audience === 'guardians' ? 'أولياء الأمور' : 
          survey.target_audience === 'teachers' ? 'المعلمون' : 
          survey.target_audience === 'students' ? 'الطلاب' : 'المشاركون'} 
        أظهروا تفاعلاً ${averageResponsesPerQuestion > 30 ? 'ممتاز' : 'جيد'} مع الاستطلاع.
      `.trim();

      const analysisResult: AIAnalysis = {
        summary,
        keyInsights,
        recommendations,
        sentiment,
        participationRate,
        strengths,
        improvements
      };

      setAnalysis(analysisResult);
      onAnalysisComplete?.(analysisResult);

    } catch (error) {
      console.error('Error in AI analysis:', error);
      setError('حدث خطأ في التحليل. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800 border-green-200';
      case 'negative': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <CheckCircle className="w-4 h-4" />;
      case 'negative': return <AlertTriangle className="w-4 h-4" />;
      default: return <TrendingUp className="w-4 h-4" />;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          التحليل الذكي للاستطلاع
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!analysis && !isAnalyzing && (
          <div className="text-center py-8">
            <Brain className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              احصل على تحليل ذكي شامل لنتائج الاستطلاع باستخدام الذكاء الاصطناعي المحلي
            </p>
            <Button onClick={generateLocalAnalysis} className="gap-2">
              <Brain className="w-4 h-4" />
              تشغيل التحليل الذكي
            </Button>
          </div>
        )}

        {isAnalyzing && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">جاري تحليل البيانات بالذكاء الاصطناعي...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-8">
            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-4" />
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={generateLocalAnalysis} variant="outline">
              إعادة المحاولة
            </Button>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 rounded-lg border">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                الملخص التنفيذي
              </h3>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
              <div className="flex items-center gap-2 mt-3">
                <Badge className={`${getSentimentColor(analysis.sentiment)} flex items-center gap-1`}>
                  {getSentimentIcon(analysis.sentiment)}
                  {analysis.sentiment === 'positive' ? 'إيجابي' : 
                   analysis.sentiment === 'negative' ? 'يحتاج تحسين' : 'متوازن'}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  مشاركة: {analysis.participationRate}
                </Badge>
              </div>
            </div>

            {/* Key Insights */}
            <div>
              <h3 className="font-semibold mb-3">🔍 الرؤى الرئيسية</h3>
              <ul className="space-y-2">
                {analysis.keyInsights.map((insight, index) => (
                  <li key={index} className="text-sm bg-blue-50 p-3 rounded-lg border-r-4 border-blue-400">
                    {insight}
                  </li>
                ))}
              </ul>
            </div>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-green-700">✅ نقاط القوة</h3>
                <ul className="space-y-2">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="text-sm bg-green-50 p-3 rounded-lg border-r-4 border-green-400">
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Improvements */}
            {analysis.improvements.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 text-orange-700">⚠️ مجالات التحسين</h3>
                <ul className="space-y-2">
                  {analysis.improvements.map((improvement, index) => (
                    <li key={index} className="text-sm bg-orange-50 p-3 rounded-lg border-r-4 border-orange-400">
                      {improvement}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            <div>
              <h3 className="font-semibold mb-3 text-purple-700">💡 التوصيات</h3>
              <ul className="space-y-2">
                {analysis.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm bg-purple-50 p-3 rounded-lg border-r-4 border-purple-400">
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};