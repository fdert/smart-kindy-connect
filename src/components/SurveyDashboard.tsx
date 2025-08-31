import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  PieChart,
  Calendar,
  Target
} from 'lucide-react';
import { SurveyResultsChart } from './SurveyResultsChart';
import { SurveyPDFReport } from './SurveyPDFReport';

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

interface DashboardStats {
  totalSurveys: number;
  activeSurveys: number;
  totalResponses: number;
  averageResponseRate: number;
  respondentsByType: Record<string, number>;
  responsesByDate: Array<{ date: string; responses: number }>;
  surveysByType: Record<string, number>;
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

const SurveyDashboard = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([]);
  const [loading, setLoading] = useState(true);
  const { tenant } = useTenant();

  useEffect(() => {
    loadDashboardData();
  }, [tenant]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        loadSurveys(),
        loadStats()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSurveys = async () => {
    let query = supabase
      .from('surveys')
      .select('*');
    
    if (tenant?.id) {
      query = query.eq('tenant_id', tenant.id);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    setSurveys(data || []);
  };

  const loadStats = async () => {
    // Get basic survey stats
    let surveysQuery = supabase
      .from('surveys')
      .select('id, survey_type, target_audience, is_active');
    
    if (tenant?.id) {
      surveysQuery = surveysQuery.eq('tenant_id', tenant.id);
    }
    
    const { data: surveysData } = await surveysQuery;
    
    // Get responses stats
    let responsesQuery = supabase
      .from('survey_responses')
      .select('respondent_type, created_at');
    
    if (tenant?.id) {
      responsesQuery = responsesQuery.eq('tenant_id', tenant.id);
    }
    
    const { data: responsesData } = await responsesQuery;

    if (surveysData && responsesData) {
      const totalSurveys = surveysData.length;
      const activeSurveys = surveysData.filter(s => s.is_active).length;
      const totalResponses = responsesData.length;

      // Group responses by type
      const respondentsByType = responsesData.reduce((acc, response) => {
        const type = response.respondent_type || 'غير محدد';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group surveys by type
      const surveysByType = surveysData.reduce((acc, survey) => {
        const type = survey.survey_type || 'عام';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Group responses by date (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const responsesByDate = last7Days.map(date => ({
        date,
        responses: responsesData.filter(r => 
          r.created_at?.startsWith(date)
        ).length
      }));

      const averageResponseRate = totalSurveys > 0 ? totalResponses / totalSurveys : 0;

      setStats({
        totalSurveys,
        activeSurveys,
        totalResponses,
        averageResponseRate,
        respondentsByType,
        responsesByDate,
        surveysByType
      });
    }
  };

  const loadSurveyResults = async (survey: Survey) => {
    try {
      console.log('Loading survey results for:', survey.id);
      const { data, error } = await supabase.functions.invoke('surveys-api', {
        body: {
          action: 'getResults',
          surveyId: survey.id
        }
      });

      console.log('Survey results response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.success) {
        setSurveyResults(data?.results || []);
        console.log('Survey results loaded successfully:', data.results);
      } else {
        console.error('API returned non-success:', data);
        throw new Error(data?.error || 'Failed to load results');
      }
    } catch (error: any) {
      console.error('Error loading survey results:', error);
      // Show user-friendly error message
      alert('حدث خطأ في تحميل النتائج: ' + (error.message || 'خطأ غير معروف'));
    }
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

  const getStatusColor = (survey: Survey) => {
    if (!survey.is_active) return 'bg-gray-500';
    const expiresAt = new Date(survey.expires_at);
    const now = new Date();
    if (expiresAt < now) return 'bg-red-500';
    return 'bg-green-500';
  };

  const getStatusText = (survey: Survey) => {
    if (!survey.is_active) return 'غير نشط';
    const expiresAt = new Date(survey.expires_at);
    const now = new Date();
    if (expiresAt < now) return 'منتهي';
    return 'نشط';
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الاستطلاعات</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalSurveys || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.activeSurveys || 0} نشط حالياً
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">إجمالي الردود</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalResponses || 0}</div>
            <p className="text-xs text-muted-foreground">
              معدل {stats?.averageResponseRate.toFixed(1) || 0} رد لكل استطلاع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">الاستطلاعات النشطة</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.activeSurveys || 0}</div>
            <p className="text-xs text-muted-foreground">
              من أصل {stats?.totalSurveys || 0} استطلاع
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">معدل المشاركة</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.averageResponseRate ? `${(stats.averageResponseRate * 100 / Math.max(stats.totalSurveys, 1)).toFixed(1)}%` : '0%'}
            </div>
            <p className="text-xs text-muted-foreground">
              آخر 7 أيام: {stats?.responsesByDate.reduce((sum, day) => sum + day.responses, 0) || 0} رد
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
          <TabsTrigger value="surveys">الاستطلاعات</TabsTrigger>
          <TabsTrigger value="responses">الردود</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  الاستطلاعات حسب النوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats?.surveysByType || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{getSurveyTypeLabel(type)}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  الردود حسب المشاركين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats?.respondentsByType || {}).map(([type, count]) => (
                    <div key={type} className="flex justify-between items-center">
                      <span className="text-sm">{getTargetAudienceLabel(type)}</span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="surveys" className="space-y-4">
          <div className="grid gap-4">
            {surveys.map((survey) => (
              <Card 
                key={survey.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedSurvey(survey);
                  loadSurveyResults(survey);
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{survey.title}</CardTitle>
                      <CardDescription className="flex items-center gap-4 mt-1">
                        <span>{getSurveyTypeLabel(survey.survey_type)}</span>
                        <span>•</span>
                        <span>{getTargetAudienceLabel(survey.target_audience)}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(survey.created_at).toLocaleDateString('ar-SA')}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(survey)}`}></div>
                      <Badge variant={survey.is_active ? "default" : "secondary"}>
                        {getStatusText(survey)}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="responses" className="space-y-4">
          {selectedSurvey ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{selectedSurvey.title} - تفاصيل الردود</h3>
                <div className="flex items-center gap-3">
                  <SurveyPDFReport 
                    survey={selectedSurvey}
                    results={surveyResults}
                    tenantInfo={tenant || { name: 'المؤسسة' }}
                    onGenerateReport={async () => {
                      await loadSurveyResults(selectedSurvey);
                    }}
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedSurvey(null)}
                  >
                    العودة للقائمة
                  </Button>
                </div>
              </div>
              
              {surveyResults.length > 0 ? (
                <div className="space-y-4">
                  {surveyResults.map((result) => (
                    <SurveyResultsChart key={result.questionId} result={result} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">لا توجد ردود على هذا الاستطلاع بعد</p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">اختر استطلاعاً من تبويب "الاستطلاعات" لعرض تفاصيل الردود</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SurveyDashboard;