import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AnalyzeNoteRequest {
  noteContent: string;
  noteType: string;
  studentAge?: number;
}

interface GenerateAssignmentRequest {
  subject: string;
  grade: string;
  topic: string;
  difficulty: string;
}

// Free AI analysis using simple text processing
function analyzeNote(content: string, type: string): { analysis: string; suggestions: string } {
  const keywords = {
    academic: ['درجات', 'امتحان', 'واجب', 'تحسن', 'ضعف', 'ممتاز', 'جيد'],
    behavioral: ['سلوك', 'مشاكل', 'تصرف', 'انضباط', 'احترام', 'تعاون'],
    social: ['أصدقاء', 'تفاعل', 'خجل', 'اجتماعي', 'مشاركة', 'تواصل'],
    health: ['صحة', 'مرض', 'تعب', 'نوم', 'غذاء', 'نشاط']
  };

  const typeKeywords = keywords[type as keyof typeof keywords] || [];
  const foundKeywords = typeKeywords.filter(keyword => content.includes(keyword));

  let analysis = '';
  let suggestions = '';

  if (type === 'academic') {
    if (foundKeywords.includes('ضعف') || foundKeywords.includes('تحسن')) {
      analysis = 'يحتاج الطالب إلى دعم إضافي في المجال الأكاديمي';
      suggestions = 'اقتراح جلسات تقوية إضافية، التواصل مع الأهل، وضع خطة دراسية مخصصة';
    } else if (foundKeywords.includes('ممتاز') || foundKeywords.includes('جيد')) {
      analysis = 'أداء الطالب مميز ويظهر تقدماً جيداً';
      suggestions = 'تشجيع الطالب، إعطاء مهام متقدمة، اختيار الطالب لمساعدة زملائه';
    } else {
      analysis = 'الطالب يحتاج إلى متابعة مستمرة لتقييم أدائه الأكاديمي';
      suggestions = 'مراقبة دورية للأداء، تقييم منتظم، التواصل مع الأهل';
    }
  } else if (type === 'behavioral') {
    if (foundKeywords.includes('مشاكل') || foundKeywords.includes('انضباط')) {
      analysis = 'يواجه الطالب تحديات سلوكية تحتاج إلى تدخل';
      suggestions = 'وضع خطة سلوكية، التواصل مع الأهل، جلسات إرشادية';
    } else {
      analysis = 'السلوك العام للطالب يحتاج إلى ملاحظة ومتابعة';
      suggestions = 'تعزيز السلوك الإيجابي، وضع قواعد واضحة، نظام مكافآت';
    }
  } else if (type === 'social') {
    analysis = 'التفاعل الاجتماعي للطالب يحتاج إلى تطوير';
    suggestions = 'تشجيع الأنشطة الجماعية، تطوير المهارات الاجتماعية، إشراك الطالب في الفعاليات';
  } else if (type === 'health') {
    analysis = 'الحالة الصحية للطالب تحتاج إلى متابعة';
    suggestions = 'التواصل مع الأهل، استشارة طبية إذا لزم الأمر، متابعة الحالة العامة';
  }

  return { analysis, suggestions };
}

function generateAssignment(subject: string, grade: string, topic: string, difficulty: string): string {
  const templates = {
    'رياضيات': {
      easy: `واجب في ${topic}:
1. حل 5 مسائل بسيطة في ${topic}
2. راجع الأمثلة في الكتاب صفحة ___
3. اكتب خطوات الحل بوضوح`,
      medium: `واجب في ${topic}:
1. حل 8 مسائل متنوعة في ${topic}
2. اشرح طريقة الحل لمسألتين
3. ابحث عن مثال إضافي من الحياة العملية`,
      hard: `واجب متقدم في ${topic}:
1. حل 10 مسائل متدرجة الصعوبة
2. اكتب تقرير مختصر عن تطبيقات ${topic} في الحياة
3. ابتكر مسألة جديدة وقدم حلها`
    },
    'علوم': {
      easy: `واجب في ${topic}:
1. اقرأ الدرس واكتب 3 معلومات مهمة
2. ارسم مخطط بسيط للموضوع
3. أجب على أسئلة نهاية الفصل`,
      medium: `واجب في ${topic}:
1. اكتب تلخيص للدرس (200 كلمة)
2. اربط الموضوع بالحياة اليومية (3 أمثلة)
3. ابحث عن معلومة إضافية حول ${topic}`,
      hard: `مشروع في ${topic}:
1. اعد تقرير شامل عن ${topic} (500 كلمة)
2. قم بتجربة عملية بسيطة وسجل النتائج
3. اقترح حلول لمشكلة متعلقة بالموضوع`
    },
    'لغة عربية': {
      easy: `واجب في ${topic}:
1. اقرأ النص واستخرج 5 كلمات جديدة
2. اكتب معاني الكلمات الجديدة
3. كون 3 جمل باستخدام الكلمات الجديدة`,
      medium: `واجب في ${topic}:
1. اقرأ النص وحلل الأفكار الرئيسية
2. اكتب فقرة تعبيرية (150 كلمة) عن الموضوع
3. ابحث عن شاعر أو كاتب متعلق بالموضوع`,
      hard: `مشروع في ${topic}:
1. اكتب مقال تحليلي عن ${topic} (400 كلمة)
2. اربط النص بالواقع المعاصر
3. اعد عرض تقديمي للصف عن الموضوع`
    }
  };

  const subjectTemplates = templates[subject as keyof typeof templates];
  if (subjectTemplates) {
    return subjectTemplates[difficulty as keyof typeof subjectTemplates] || 
           `واجب في ${subject} - ${topic}\n\nالمهام:\n1. دراسة الموضوع\n2. حل التمارين\n3. المراجعة`;
  }

  return `واجب في ${subject} - ${topic}
  
المطلوب:
1. دراسة الموضوع من الكتاب المدرسي
2. حل التمارين المطلوبة
3. تحضير للدرس القادم
  
ملاحظات:
- سلم الواجب في الموعد المحدد
- اكتب بخط واضح ومرتب
- لا تتردد في السؤال عند الحاجة`;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { action, ...requestData } = await req.json();

    if (action === 'analyze_note') {
      const { noteContent, noteType } = requestData as AnalyzeNoteRequest;
      
      if (!noteContent || !noteType) {
        return new Response(
          JSON.stringify({ error: 'Missing noteContent or noteType' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = analyzeNote(noteContent, noteType);
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_assignment') {
      const { subject, grade, topic, difficulty } = requestData as GenerateAssignmentRequest;
      
      if (!subject || !topic) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const assignmentContent = generateAssignment(subject, grade || 'عام', topic, difficulty || 'medium');
      
      return new Response(
        JSON.stringify({ assignment: assignmentContent }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assignments-ai function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});