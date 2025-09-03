import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, BookOpen, FileText, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AnalysisResult {
  analysis: string;
  suggestions: string;
  recommendations?: string;
}

interface AssignmentResult {
  assignment: string;
}

const DeepSeekAIAssistant: React.FC = () => {
  const [activeTab, setActiveTab] = useState('notes');
  
  // حالة تحليل الملاحظات
  const [noteContent, setNoteContent] = useState('');
  const [noteType, setNoteType] = useState('');
  const [studentAge, setStudentAge] = useState<number>(4);
  const [studentName, setStudentName] = useState('');
  const [noteContext, setNoteContext] = useState('');
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // حالة إنتاج الواجبات
  const [subject, setSubject] = useState('');
  const [grade, setGrade] = useState('');
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [assignmentResult, setAssignmentResult] = useState<AssignmentResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const noteTypes = [
    { value: 'academic', label: 'أكاديمية/تعليمية', color: 'bg-blue-500' },
    { value: 'behavioral', label: 'سلوكية', color: 'bg-yellow-500' },
    { value: 'social', label: 'اجتماعية', color: 'bg-green-500' },
    { value: 'health', label: 'صحية', color: 'bg-red-500' },
    { value: 'emotional', label: 'عاطفية/نفسية', color: 'bg-purple-500' },
    { value: 'motor', label: 'حركية', color: 'bg-orange-500' }
  ];

  const subjects = [
    'اللغة العربية',
    'الرياضيات', 
    'العلوم',
    'الفنون',
    'التربية الإسلامية',
    'اللغة الإنجليزية',
    'التربية البدنية',
    'المهارات الحياتية'
  ];

  const grades = [
    'روضة صغيرة (3-4 سنوات)',
    'روضة متوسطة (4-5 سنوات)',
    'روضة كبيرة (5-6 سنوات)',
    'تمهيدي أول',
    'تمهيدي ثاني'
  ];

  const difficulties = [
    { value: 'easy', label: 'سهل', color: 'text-green-600' },
    { value: 'medium', label: 'متوسط', color: 'text-yellow-600' },
    { value: 'hard', label: 'صعب', color: 'text-red-600' }
  ];

  const analyzeNote = async () => {
    if (!noteContent.trim() || !noteType) {
      toast.error('يرجى إدخال محتوى الملاحظة واختيار نوعها');
      return;
    }

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('assignments-ai', {
        body: {
          action: 'analyze_note',
          noteContent: noteContent.trim(),
          noteType,
          studentAge,
          studentName: studentName.trim() || undefined,
          context: noteContext.trim() || undefined
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAnalysisResult(data.data);
        toast.success('تم تحليل الملاحظة بنجاح باستخدام DeepSeek AI');
      } else {
        throw new Error(data?.error || 'فشل في تحليل الملاحظة');
      }
    } catch (err: any) {
      console.error('Error analyzing note:', err);
      toast.error('حدث خطأ في تحليل الملاحظة: ' + err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateAssignment = async () => {
    if (!subject || !grade || !topic.trim()) {
      toast.error('يرجى إدخال جميع معطيات الواجب');
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('assignments-ai', {
        body: {
          action: 'generate_assignment',
          subject,
          grade,
          topic: topic.trim(),
          difficulty
        }
      });

      if (error) throw error;

      if (data?.success) {
        setAssignmentResult(data.data);
        toast.success('تم إنتاج الواجب بنجاح باستخدام DeepSeek AI');
      } else {
        throw new Error(data?.error || 'فشل في إنتاج الواجب');
      }
    } catch (err: any) {
      console.error('Error generating assignment:', err);
      toast.error('حدث خطأ في إنتاج الواجب: ' + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const clearNoteForm = () => {
    setNoteContent('');
    setNoteType('');
    setStudentAge(4);
    setStudentName('');
    setNoteContext('');
    setAnalysisResult(null);
  };

  const clearAssignmentForm = () => {
    setSubject('');
    setGrade('');
    setTopic('');
    setDifficulty('medium');
    setAssignmentResult(null);
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">مساعد DeepSeek الذكي</h1>
          <Sparkles className="h-6 w-6 text-yellow-500" />
        </div>
        <p className="text-muted-foreground">
          تحليل ذكي للملاحظات وإنتاج واجبات مخصصة لرياض الأطفال السعودية
        </p>
        <Badge variant="secondary" className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          مدعوم بـ DeepSeek AI
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            تحليل الملاحظات
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            إنتاج الواجبات
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                تحليل الملاحظات التربوية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">اسم الطفل (اختياري)</label>
                  <Input
                    placeholder="أدخل اسم الطفل..."
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">عمر الطفل</label>
                  <Select value={studentAge.toString()} onValueChange={(value) => setStudentAge(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 سنوات</SelectItem>
                      <SelectItem value="4">4 سنوات</SelectItem>
                      <SelectItem value="5">5 سنوات</SelectItem>
                      <SelectItem value="6">6 سنوات</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">نوع الملاحظة</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {noteTypes.map((type) => (
                    <Button
                      key={type.value}
                      variant={noteType === type.value ? "default" : "outline"}
                      className={`h-auto p-3 ${noteType === type.value ? type.color : ''}`}
                      onClick={() => setNoteType(type.value)}
                    >
                      <div className="text-center">
                        <div className="text-sm font-medium">{type.label}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">محتوى الملاحظة</label>
                <Textarea
                  placeholder="أدخل تفاصيل الملاحظة التربوية هنا..."
                  value={noteContent}
                  onChange={(e) => setNoteContent(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">السياق الإضافي (اختياري)</label>
                <Textarea
                  placeholder="أي معلومات إضافية قد تساعد في التحليل..."
                  value={noteContext}
                  onChange={(e) => setNoteContext(e.target.value)}
                  rows={2}
                  className="resize-none"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={analyzeNote}
                  disabled={isAnalyzing || !noteContent.trim() || !noteType}
                  className="flex-1"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      جاري التحليل...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      تحليل ذكي بـ DeepSeek
                    </>
                  )}
                </Button>
                
                <Button variant="outline" onClick={clearNoteForm}>
                  مسح
                </Button>
              </div>
            </CardContent>
          </Card>

          {analysisResult && (
            <Card className="border-green-200 bg-green-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  نتيجة التحليل
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-green-800 mb-2">التحليل التربوي:</h4>
                  <p className="text-green-700 whitespace-pre-line bg-white p-3 rounded border">
                    {analysisResult.analysis}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-green-800 mb-2">الاقتراحات والتوصيات:</h4>
                  <p className="text-green-700 whitespace-pre-line bg-white p-3 rounded border">
                    {analysisResult.suggestions}
                  </p>
                </div>

                {analysisResult.recommendations && (
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">توصيات للأهل:</h4>
                    <p className="text-green-700 whitespace-pre-line bg-white p-3 rounded border">
                      {analysisResult.recommendations}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                إنتاج الواجبات التعليمية
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">المادة</label>
                  <Select value={subject} onValueChange={setSubject}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المادة" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subj) => (
                        <SelectItem key={subj} value={subj}>{subj}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">المستوى الدراسي</label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger>
                      <SelectValue placeholder="اختر المستوى" />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((gr) => (
                        <SelectItem key={gr} value={gr}>{gr}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">موضوع الواجب</label>
                <Input
                  placeholder="مثال: الحروف الهجائية، الأرقام، الألوان..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">مستوى الصعوبة</label>
                <div className="flex gap-2">
                  {difficulties.map((diff) => (
                    <Button
                      key={diff.value}
                      variant={difficulty === diff.value ? "default" : "outline"}
                      className={difficulty === diff.value ? diff.color : ''}
                      onClick={() => setDifficulty(diff.value)}
                    >
                      {diff.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={generateAssignment}
                  disabled={isGenerating || !subject || !grade || !topic.trim()}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      جاري الإنتاج...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      إنتاج واجب ذكي
                    </>
                  )}
                </Button>

                <Button variant="outline" onClick={clearAssignmentForm}>
                  مسح
                </Button>
              </div>
            </CardContent>
          </Card>

          {assignmentResult && (
            <Card className="border-blue-200 bg-blue-50/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <CheckCircle className="h-5 w-5" />
                  الواجب المُنتج
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-white p-4 rounded border whitespace-pre-line text-blue-700">
                  {assignmentResult.assignment}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DeepSeekAIAssistant;