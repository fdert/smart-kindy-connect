import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { BarChart3, Plus, Eye, CalendarIcon, Trash2, Users, PieChart, Link, Copy, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { SurveyResultsChart } from '@/components/SurveyResultsChart';
import SurveyDashboard from '@/components/SurveyDashboard';
import SurveyLinkShare from '@/components/SurveyLinkShare';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  survey_type: string;
  target_audience: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
  is_anonymous: boolean;
  questions?: SurveyQuestion[];
}

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: string[] | null;
  is_required: boolean;
  sort_order: number;
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

const Surveys = () => {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [surveyResults, setSurveyResults] = useState<SurveyResult[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResultsDialog, setShowResultsDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    surveyType: 'general',
    targetAudience: 'guardians',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isAnonymous: false,
    questions: [] as Array<{
      questionText: string;
      questionType: string;
      options: string[];
      isRequired: boolean;
    }>
  });

  const { tenant } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    // Super admins can view all data, regular users need a tenant
    loadSurveys();
  }, [tenant]);

  const loadSurveys = async () => {
    try {
      let query = supabase
        .from('surveys')
        .select(`
          *,
          survey_questions(*)
        `);
      
      // Filter by tenant only if user has a tenant (not super admin)
      if (tenant?.id) {
        query = query.eq('tenant_id', tenant.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setSurveys(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الاستطلاعات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || formData.questions.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى إضافة سؤال واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      
      const { data, error } = await supabase.functions.invoke('surveys-api', {
        body: {
          title: formData.title,
          description: formData.description,
          surveyType: formData.surveyType,
          targetAudience: formData.targetAudience,
          expiresAt: formData.expiresAt.toISOString(),
          isAnonymous: formData.isAnonymous,
          questions: formData.questions
        }
      });

      if (error) throw error;

      toast({
        title: "تم إنشاء الاستطلاع",
        description: "تم إنشاء استطلاع جديد بنجاح",
      });

      setShowCreateDialog(false);
      resetForm();
      loadSurveys();
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الاستطلاع",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      surveyType: 'general',
      targetAudience: 'guardians',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isAnonymous: false,
      questions: []
    });
  };

  const generateSurveyLink = (surveyId: string) => {
    return `${window.location.origin}/survey/${surveyId}`;
  };

  const copySurveyLink = async (surveyId: string) => {
    const link = generateSurveyLink(surveyId);
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "تم نسخ الرابط",
        description: "تم نسخ رابط الاستطلاع إلى الحافظة",
      });
    } catch (error) {
      toast({
        title: "خطأ في النسخ",
        description: "فشل في نسخ الرابط",
        variant: "destructive",
      });
    }
  };

  const openSurveyLink = (surveyId: string) => {
    const link = generateSurveyLink(surveyId);
    window.open(link, '_blank');
  };

  const handleViewResults = async (survey: Survey) => {
    try {
      setSelectedSurvey(survey);
      
      const { data, error } = await supabase.functions.invoke('surveys-api', {
        body: {
          action: 'getResults',
          surveyId: survey.id
        }
      });

      if (error) throw error;
      
      setSurveyResults(data?.results || []);
      setShowResultsDialog(true);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل النتائج",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          questionText: '',
          questionType: 'yes_no',
          options: [],
          isRequired: true
        }
      ]
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) => 
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const addOption = (questionIndex: number) => {
    const question = formData.questions[questionIndex];
    updateQuestion(questionIndex, 'options', [...question.options, '']);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const question = formData.questions[questionIndex];
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateQuestion(questionIndex, 'options', newOptions);
  };

  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = formData.questions[questionIndex];
    const newOptions = question.options.filter((_, i) => i !== optionIndex);
    updateQuestion(questionIndex, 'options', newOptions);
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
      both: 'الكل'
    };
    return audiences[audience] || audience;
  };

  const getQuestionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      yes_no: 'نعم/لا',
      single_choice: 'اختيار واحد',
      multiple_choice: 'اختيارات متعددة',
      text: 'نص حر',
      rating: 'تقييم'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الاستطلاعات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-8 w-8 text-primary" />
              الاستطلاعات
            </h1>
            <p className="text-gray-600 mt-1">إدارة استطلاعات الرأي وجمع التقييمات عبر الروابط الإلكترونية</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إنشاء استطلاع جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء استطلاع جديد</DialogTitle>
                <DialogDescription>
                  إنشاء استطلاع رأي جديد لجمع التقييمات والتغذية الراجعة
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateSurvey} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">عنوان الاستطلاع</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="مثال: استطلاع رضا أولياء الأمور"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>نوع الاستطلاع</Label>
                    <Select
                      value={formData.surveyType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, surveyType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">عام</SelectItem>
                        <SelectItem value="satisfaction">رضا</SelectItem>
                        <SelectItem value="feedback">تقييم</SelectItem>
                        <SelectItem value="evaluation">تقويم</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف الاستطلاع وهدفه..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>الجمهور المستهدف</Label>
                    <Select
                      value={formData.targetAudience}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, targetAudience: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guardians">أولياء الأمور</SelectItem>
                        <SelectItem value="teachers">المعلمات</SelectItem>
                        <SelectItem value="both">الكل</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>تاريخ الانتهاء</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.expiresAt, 'PPP', { locale: ar })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.expiresAt}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, expiresAt: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="anonymous"
                      checked={formData.isAnonymous}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isAnonymous: checked }))}
                    />
                    <Label htmlFor="anonymous">استطلاع مجهول</Label>
                  </div>
                </div>
                
                {/* Questions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold">الأسئلة</Label>
                    <Button type="button" onClick={addQuestion} size="sm" variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      إضافة سؤال
                    </Button>
                  </div>
                  
                  {formData.questions.map((question, questionIndex) => (
                    <Card key={questionIndex} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <Input
                              value={question.questionText}
                              onChange={(e) => updateQuestion(questionIndex, 'questionText', e.target.value)}
                              placeholder="نص السؤال..."
                              required
                            />
                          </div>
                          <Select
                            value={question.questionType}
                            onValueChange={(value) => {
                              updateQuestion(questionIndex, 'questionType', value);
                              if (value === 'single_choice' || value === 'multiple_choice') {
                                updateQuestion(questionIndex, 'options', ['']);
                              } else {
                                updateQuestion(questionIndex, 'options', []);
                              }
                            }}
                          >
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="yes_no">نعم/لا</SelectItem>
                              <SelectItem value="single_choice">اختيار واحد</SelectItem>
                              <SelectItem value="multiple_choice">اختيارات متعددة</SelectItem>
                              <SelectItem value="text">نص حر</SelectItem>
                              <SelectItem value="rating">تقييم (1-5)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            onClick={() => removeQuestion(questionIndex)}
                            size="sm"
                            variant="destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {/* Options for choice questions */}
                        {(question.questionType === 'single_choice' || question.questionType === 'multiple_choice') && (
                          <div className="space-y-2">
                            <Label className="text-sm">الخيارات:</Label>
                            {question.options.map((option, optionIndex) => (
                              <div key={optionIndex} className="flex items-center gap-2">
                                <Input
                                  value={option}
                                  onChange={(e) => updateOption(questionIndex, optionIndex, e.target.value)}
                                  placeholder={`الخيار ${optionIndex + 1}`}
                                />
                                <Button
                                  type="button"
                                  onClick={() => removeOption(questionIndex, optionIndex)}
                                  size="sm"
                                  variant="outline"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                            <Button
                              type="button"
                              onClick={() => addOption(questionIndex)}
                              size="sm"
                              variant="outline"
                            >
                              إضافة خيار
                            </Button>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={question.isRequired}
                            onCheckedChange={(checked) => updateQuestion(questionIndex, 'isRequired', checked)}
                          />
                          <Label>سؤال إجباري</Label>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'جاري الإنشاء...' : 'إنشاء الاستطلاع'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Dashboard */}
        <div className="mb-8">
          <SurveyDashboard />
        </div>

        {/* Surveys List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-gray-800">إدارة الاستطلاعات</h2>
          <div className="grid gap-4">
          {surveys.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BarChart3 className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد استطلاعات</h3>
                <p className="text-gray-500 text-center mb-4">ابدأ بإنشاء استطلاع جديد لجمع آراء وتقييمات المستخدمين</p>
                <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إنشاء استطلاع جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            surveys.map((survey) => (
              <Card key={survey.id} className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {survey.title}
                        <Badge variant="outline">
                          {getSurveyTypeLabel(survey.survey_type)}
                        </Badge>
                        <Badge variant="secondary">
                          {getTargetAudienceLabel(survey.target_audience)}
                        </Badge>
                        {survey.is_anonymous && (
                          <Badge variant="outline">مجهول</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {survey.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResults(survey)}
                        className="flex items-center gap-1"
                      >
                        <PieChart className="h-4 w-4" />
                        النتائج
                      </Button>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SurveyLinkShare survey={survey} />
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => handleViewResults(survey)}
                          className="flex items-center gap-2 w-full mb-2"
                        >
                          <Eye className="h-4 w-4" />
                          عرض النتائج
                        </Button>
                        <div className="text-sm text-gray-600">
                          <div>الردود: {/* يمكن إضافة عداد الردود هنا */}</div>
                          <div>آخر تحديث: {format(new Date(survey.created_at), 'PPP', { locale: ar })}</div>
                        </div>
                      </div>
                    </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span>الأسئلة: {survey.questions?.length || 0}</span>
                        <span>تاريخ الإنشاء: {format(new Date(survey.created_at), 'PPP', { locale: ar })}</span>
                        <span>ينتهي في: {format(new Date(survey.expires_at), 'PPP', { locale: ar })}</span>
                      </div>
                      <Badge variant={survey.is_active ? 'default' : 'secondary'}>
                        {survey.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                    
                    {/* Survey Link Display */}
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <Label className="text-sm font-medium text-gray-700 mb-2 block">رابط الاستطلاع:</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          value={generateSurveyLink(survey.id)}
                          readOnly
                          className="text-sm bg-white"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copySurveyLink(survey.id)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openSurveyLink(survey.id)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          </div>
        </div>

        {/* Results Dialog */}
        <Dialog open={showResultsDialog} onOpenChange={setShowResultsDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>نتائج الاستطلاع</DialogTitle>
              <DialogDescription>
                {selectedSurvey?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {surveyResults.map((result) => (
                <Card key={result.questionId}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {result.questionText}
                      <Badge variant="outline">
                        {getQuestionTypeLabel(result.questionType)}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      إجمالي الردود: {result.totalResponses}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.questionType === 'yes_no' && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span>نعم</span>
                          <span>{result.yesCount} ({result.yesPercentage?.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${result.yesPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          <span>لا</span>
                          <span>{result.noCount} ({(100 - (result.yesPercentage || 0)).toFixed(1)}%)</span>
                        </div>
                      </div>
                    )}
                    
                    {(result.questionType === 'single_choice' || result.questionType === 'multiple_choice') && result.optionCounts && (
                      <div className="space-y-2">
                        {Object.entries(result.optionCounts).map(([option, count]) => (
                          <div key={option} className="flex justify-between items-center">
                            <span>{option}</span>
                            <span>{count} ({((count / result.totalResponses) * 100).toFixed(1)}%)</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {result.questionType === 'rating' && result.averageRating !== undefined && (
                      <div className="space-y-2">
                        <div className="text-lg font-semibold">
                          متوسط التقييم: {result.averageRating.toFixed(1)} / 5
                        </div>
                        <div className="text-sm text-gray-600">
                          عدد التقييمات: {result.ratings?.length || 0}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Surveys;