import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, FileText, Star, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Survey {
  id: string;
  title: string;
  description: string | null;
  survey_type: string;
  expires_at: string;
  is_active: boolean;
  is_anonymous: boolean;
  tenant_id: string;
}

interface SurveyQuestion {
  id: string;
  question_text: string;
  question_type: string;
  options: any;
  is_required: boolean;
  sort_order: number;
}

interface TenantInfo {
  name: string;
  logo_url?: string;
}

const PublicSurvey = () => {
  const { surveyId } = useParams<{ surveyId: string }>();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    if (surveyId) {
      loadSurvey();
    }
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      // Load survey details (public access, no auth needed)
      const { data: surveyData, error: surveyError } = await supabase
        .from('surveys')
        .select(`
          *,
          tenants!inner(name, logo_url)
        `)
        .eq('id', surveyId)
        .eq('is_active', true)
        .single();

      if (surveyError || !surveyData) {
        throw new Error('الاستطلاع غير موجود أو غير نشط');
      }

      // Check if survey is expired
      if (new Date(surveyData.expires_at) < new Date()) {
        throw new Error('انتهت صلاحية هذا الاستطلاع');
      }

      setSurvey(surveyData);

      // Set tenant info from joined data
      if (surveyData.tenants) {
        setTenantInfo(surveyData.tenants);
      }

      // Load questions (public access)
      const { data: questionsData, error: questionsError } = await supabase
        .from('survey_questions')
        .select('*')
        .eq('survey_id', surveyId)
        .order('sort_order');

      if (questionsError) throw questionsError;
      // Process questions to ensure options is properly typed
      const processedQuestions = (questionsData || []).map(q => ({
        ...q,
        options: Array.isArray(q.options) ? q.options : (q.options ? [q.options] : [])
      }));
      setQuestions(processedQuestions);

    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الاستطلاع",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResponseChange = (questionId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: value
    }));
  };

  const handleSubmit = async () => {
    if (!survey) return;

    // Validate required questions
    const requiredQuestions = questions.filter(q => q.is_required);
    const missingAnswers = requiredQuestions.filter(q => !responses[q.id] || 
      (Array.isArray(responses[q.id]) && responses[q.id].length === 0) ||
      (typeof responses[q.id] === 'string' && responses[q.id].trim() === '')
    );

    if (missingAnswers.length > 0) {
      toast({
        title: "يرجى الإجابة على جميع الأسئلة المطلوبة",
        description: `هناك ${missingAnswers.length} أسئلة مطلوبة لم تتم الإجابة عليها`,
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Prepare responses for edge function
      const formattedResponses = questions.map(question => {
        const responseValue = responses[question.id];
        
        let responseText = null;
        let responseOptions = null;

        if (question.question_type === 'yes_no') {
          responseText = responseValue;
        } else if (question.question_type === 'single_choice') {
          responseText = responseValue;
        } else if (question.question_type === 'multiple_choice') {
          responseOptions = Array.isArray(responseValue) ? responseValue : [];
        } else if (question.question_type === 'text') {
          responseText = responseValue;
        } else if (question.question_type === 'rating') {
          responseText = responseValue?.toString();
        }

        return {
          questionId: question.id,
          responseText,
          responseOptions
        };
      }).filter(response => response.responseText !== null || response.responseOptions !== null);

      // Submit responses via edge function
      const { data, error } = await supabase.functions.invoke('surveys-api', {
        body: {
          action: 'publicResponse',
          surveyId: survey.id,
          responses: formattedResponses
        }
      });
      
      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "تم إرسال الردود بنجاح",
        description: "شكراً لك على مشاركتك في الاستطلاع",
      });

    } catch (error: any) {
      console.error('Error submitting survey responses:', error);
      toast({
        title: "خطأ في إرسال الردود",
        description: error.message || "حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const value = responses[question.id];

    switch (question.question_type) {
      case 'yes_no':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => handleResponseChange(question.id, val)}
          >
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="نعم" id={`${question.id}-yes`} />
              <Label htmlFor={`${question.id}-yes`}>نعم</Label>
            </div>
            <div className="flex items-center space-x-2 space-x-reverse">
              <RadioGroupItem value="لا" id={`${question.id}-no`} />
              <Label htmlFor={`${question.id}-no`}>لا</Label>
            </div>
          </RadioGroup>
        );

      case 'single_choice':
        return (
          <RadioGroup
            value={value || ''}
            onValueChange={(val) => handleResponseChange(question.id, val)}
          >
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 space-x-reverse">
                <RadioGroupItem value={option} id={`${question.id}-${index}`} />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'multiple_choice':
        return (
          <div className="space-y-2">
            {question.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2 space-x-reverse">
                <Checkbox
                  id={`${question.id}-${index}`}
                  checked={Array.isArray(value) && value.includes(option)}
                  onCheckedChange={(checked) => {
                    const currentValues = Array.isArray(value) ? value : [];
                    if (checked) {
                      handleResponseChange(question.id, [...currentValues, option]);
                    } else {
                      handleResponseChange(question.id, currentValues.filter(v => v !== option));
                    }
                  }}
                />
                <Label htmlFor={`${question.id}-${index}`}>{option}</Label>
              </div>
            ))}
          </div>
        );

      case 'text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => handleResponseChange(question.id, e.target.value)}
            placeholder="اكتب إجابتك هنا..."
            rows={3}
          />
        );

      case 'rating':
        return (
          <div className="flex items-center space-x-1 space-x-reverse">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                type="button"
                variant={value === rating ? "default" : "outline"}
                size="sm"
                onClick={() => handleResponseChange(question.id, rating)}
                className="p-2"
              >
                <Star className={`h-4 w-4 ${value >= rating ? 'fill-current' : ''}`} />
              </Button>
            ))}
            <span className="mr-2 text-sm text-muted-foreground">
              {value ? `${value}/5` : 'لم يتم التقييم'}
            </span>
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الاستطلاع...</p>
        </div>
      </div>
    );
  }

  if (!survey) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">الاستطلاع غير موجود</h2>
            <p className="text-muted-foreground">
              الاستطلاع المطلوب غير متاح أو انتهت صلاحيته
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">تم إرسال ردودك بنجاح</h2>
            <p className="text-muted-foreground mb-4">
              شكراً لك على مشاركتك في الاستطلاع. تم حفظ ردودك بنجاح.
            </p>
            <p className="text-sm text-muted-foreground">
              مقدم من: {tenantInfo?.name}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader className="text-center">
            {tenantInfo?.logo_url && (
              <img
                src={tenantInfo.logo_url}
                alt={tenantInfo.name}
                className="h-16 w-16 mx-auto mb-4 rounded-full object-cover"
              />
            )}
            <CardTitle className="text-2xl">{survey.title}</CardTitle>
            <CardDescription className="text-base">
              {survey.description}
            </CardDescription>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-4">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>ينتهي في {format(new Date(survey.expires_at), 'PPP', { locale: ar })}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{questions.length} سؤال</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              مقدم من: {tenantInfo?.name}
            </p>
          </CardHeader>
        </Card>

        {/* Questions */}
        <div className="space-y-6">
          {questions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <CardTitle className="text-lg flex items-start gap-2">
                  <span className="bg-primary text-primary-foreground text-sm rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  {question.question_text}
                  {question.is_required && (
                    <span className="text-red-500 text-base">*</span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {renderQuestion(question)}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Submit Button */}
        <div className="mt-8 text-center">
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            size="lg"
            className="px-8"
          >
            {submitting ? 'جاري الإرسال...' : 'إرسال الردود'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PublicSurvey;