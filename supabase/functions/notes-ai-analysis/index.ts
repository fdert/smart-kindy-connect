import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
console.log('DeepSeek API Key status:', deepseekApiKey ? 'configured ✅' : 'not configured ❌')
console.log('Function updated at:', new Date().toISOString())

interface NoteAnalysisRequest {
  noteContent: string;
  noteType: string;
  studentAge?: number;
  studentName?: string;
  context?: string;
}

interface GenerateNoteRequest {
  studentName: string;
  studentAge: number;
  observationType: string;
  observations: string;
  context?: string;
}

// تحليل الملاحظات الذكي باستخدام DeepSeek
async function analyzeStudentNote(
  content: string, 
  type: string, 
  studentAge?: number, 
  studentName?: string,
  context?: string
): Promise<{ analysis: string; suggestions: string; recommendations: string }> {
  
  console.log('=== ANALYZE STUDENT NOTE FUNCTION CALLED ===');
  console.log('DeepSeek API key exists:', !!deepseekApiKey);
  console.log('DeepSeek API key length:', deepseekApiKey ? deepseekApiKey.length : 0);
  
  if (!deepseekApiKey) {
    console.error('DeepSeek API key not configured - returning error');
    return { 
      analysis: 'خطأ: مفتاح DeepSeek API غير مُعد', 
      suggestions: 'يرجى إعداد مفتاح API للحصول على التحليل الذكي',
      recommendations: 'تواصل مع الإدارة التقنية'
    };
  }

  const ageGroup = studentAge ? (studentAge <= 4 ? 'صغير (3-4 سنوات)' : studentAge <= 5 ? 'متوسط (4-5 سنوات)' : 'كبير (5-6 سنوات)') : 'متوسط (4-5 سنوات)';
  
  const typeText = {
    'academic': 'أكاديمية/تعليمية',
    'behavioral': 'سلوكية', 
    'social': 'اجتماعية',
    'health': 'صحية',
    'emotional': 'عاطفية/نفسية',
    'motor': 'حركية'
  }[type] || type;

  const studentInfo = studentName ? `الطفل ${studentName}` : 'الطفل';
  const contextInfo = context ? `\nالسياق الإضافي: ${context}` : '';

  const prompt = `أنت مختص في علم نفس الطفل وتربية رياض الأطفال السعودية. قم بتحليل هذه الملاحظة ${typeText} عن ${studentInfo} في المرحلة العمرية ${ageGroup}:

الملاحظة: "${content}"${contextInfo}

المطلوب تحليل شامل يتضمن:

1. التحليل النفسي والتربوي:
- تفسير السلوك أو الموقف حسب علم نفس الطفل
- ربط الملاحظة بالتطور الطبيعي لهذا العمر
- تقييم مدى طبيعية أو استثنائية الملاحظة

2. الاقتراحات العملية:
- خطوات محددة للمعلمة في الفصل
- أنشطة تربوية مناسبة
- استراتيجيات تعديل السلوك إن لزم
- طرق التشجيع والتحفيز

3. التوصيات للأهل:
- كيفية التعامل مع الموقف في المنزل
- أنشطة أسرية مساعدة
- علامات تستدعي استشارة مختص
- طرق المتابعة والتقييم

يرجى مراعاة:
- المنهج التربوي الإسلامي
- الثقافة السعودية
- خصائص النمو في رياض الأطفال
- الأساليب التربوية الحديثة

قدم الإجابة بتنسيق واضح ومرقم.`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'أنت خبير في علم نفس الطفل وتربية رياض الأطفال، متخصص في تحليل سلوك الأطفال السعوديين من عمر 3-6 سنوات. تقدم تحليلات علمية ونصائح عملية مناسبة ثقافياً ودينياً.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';
    
    // تقسيم الرد إلى أقسام
    const analysisMatch = aiResponse.match(/التحليل النفسي والتربوي:(.*?)(?=الاقتراحات العملية:|$)/s);
    const suggestionsMatch = aiResponse.match(/الاقتراحات العملية:(.*?)(?=التوصيات للأهل:|$)/s);
    const recommendationsMatch = aiResponse.match(/التوصيات للأهل:(.*?)$/s);
    
    return {
      analysis: analysisMatch ? analysisMatch[1].trim() : aiResponse.slice(0, 400) + '...',
      suggestions: suggestionsMatch ? suggestionsMatch[1].trim() : 'يرجى مراجعة المختص التربوي للحصول على اقتراحات مخصصة.',
      recommendations: recommendationsMatch ? recommendationsMatch[1].trim() : 'تواصل مع أولياء الأمور ومتابعة الحالة.'
    };
    
  } catch (error) {
    console.error('Error calling DeepSeek API:', error);
    return {
      analysis: 'حدث خطأ في تحليل الملاحظة. يرجى المحاولة مرة أخرى لاحقاً.',
      suggestions: 'يرجى مراجعة المختص التربوي في الحضانة للحصول على التوجيه المناسب.',
      recommendations: 'في حالة استمرار المشكلة، يُنصح بالتواصل مع مختص نفسي للأطفال.'
    };
  }
}

// إنتاج ملاحظات مهنية باستخدام الذكاء الاصطناعي
async function generateProfessionalNote(
  studentName: string,
  studentAge: number,
  observationType: string,
  observations: string,
  context?: string
): Promise<string> {
  
  if (!deepseekApiKey) {
    return `ملاحظة عن ${studentName}:

${observations}

يُنصح بمتابعة الحالة مع المختص التربوي.`;
  }

  const ageGroup = studentAge <= 4 ? 'الروضة الصغيرة (3-4 سنوات)' : 
                   studentAge <= 5 ? 'الروضة المتوسطة (4-5 سنوات)' : 
                   'الروضة الكبيرة (5-6 سنوات)';

  const contextInfo = context ? `\nالسياق: ${context}` : '';

  const prompt = `أنت معلمة رياض أطفال مهنية في المملكة العربية السعودية. قم بصياغة ملاحظة تربوية مهنية عن:

الطفل: ${studentName}
العمر: ${studentAge} سنوات (${ageGroup})
نوع الملاحظة: ${observationType}
الملاحظات الأولية: ${observations}${contextInfo}

المطلوب:
1. صياغة الملاحظة بلغة مهنية ومناسبة
2. تركيز على السلوك/الموقف الملاحظ
3. تجنب الأحكام الشخصية
4. اقتراح خطوات متابعة إن لزم
5. استخدام المصطلحات التربوية المناسبة

الملاحظة يجب أن تكون:
- موضوعية وواقعية
- مفيدة للأهل والمعلمات
- محترمة ومشجعة
- تراعي خصوصية الطفل

قدم الملاحظة في فقرات منظمة ولا تزيد عن 200 كلمة.`;

  try {
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${deepseekApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'أنت معلمة رياض أطفال محترفة في السعودية، خبيرة في كتابة الملاحظات التربوية المهنية. تكتبين بلغة مهنية واضحة ومحترمة.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.6
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || `ملاحظة عن ${studentName}:

${observations}

تم رصد هذه الملاحظة كجزء من المتابعة التربوية الشاملة للطفل.`;
    
  } catch (error) {
    console.error('Error generating professional note:', error);
    return `ملاحظة عن ${studentName}:

${observations}

يُنصح بمتابعة هذه الملاحظة مع فريق المختصين في الحضانة لضمان التطور الأمثل للطفل.`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...requestData } = await req.json();

    switch (action) {
      case 'analyze_note': {
        const { noteContent, noteType, studentAge, studentName, context } = requestData as NoteAnalysisRequest;
        
        if (!noteContent || !noteType) {
          return new Response(
            JSON.stringify({ error: 'معطيات الملاحظة مطلوبة' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Analyzing note with DeepSeek:', { noteType, studentAge, studentName });
        
        const result = await analyzeStudentNote(noteContent, noteType, studentAge, studentName, context);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'generate_note': {
        const { studentName, studentAge, observationType, observations, context } = requestData as GenerateNoteRequest;
        
        if (!studentName || !studentAge || !observationType || !observations) {
          return new Response(
            JSON.stringify({ error: 'جميع معطيات الطفل والملاحظة مطلوبة' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('Generating professional note with DeepSeek:', { studentName, observationType });
        
        const note = await generateProfessionalNote(studentName, studentAge, observationType, observations, context);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { note } 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'إجراء غير صالح' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in notes-ai-analysis function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'حدث خطأ في معالجة الطلب', 
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
        status: 500 
      }
    );
  }
});