import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Get API key from environment
const deepseekApiKey = Deno.env.get('DEEPSEEK_API_KEY')
console.log('🔍 DeepSeek API Key check:', deepseekApiKey ? '✅ Found' : '❌ Not found')
console.log('🚀 Function initialized at:', new Date().toISOString())

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

// تحليل الملاحظات باستخدام DeepSeek API
async function analyzeNote(content: string, type: string, studentAge?: number): Promise<{ analysis: string; suggestions: string }> {
  console.log('📝 Analyze note called for type:', type);
  
  if (!deepseekApiKey) {
    console.error('❌ DeepSeek API key not available');
    return { 
      analysis: 'خطأ: مفتاح DeepSeek API غير مُعد', 
      suggestions: 'يرجى إعداد مفتاح API للحصول على التحليل الذكي' 
    };
  }

  console.log('✅ API key available, making request to DeepSeek');

  const ageGroup = studentAge ? (studentAge <= 4 ? 'صغير (3-4 سنوات)' : studentAge <= 5 ? 'متوسط (4-5 سنوات)' : 'كبير (5-6 سنوات)') : 'متوسط (4-5 سنوات)';
  
  const typeText = {
    'academic': 'أكاديمية',
    'behavioral': 'سلوكية', 
    'social': 'اجتماعية',
    'health': 'صحية',
    'emotional': 'عاطفية'
  }[type] || type;

  const prompt = `أنت مختص في تربية الطفل ومناهج رياض الأطفال السعودية. قم بتحليل هذه الملاحظة ${typeText} لطفل في المرحلة العمرية ${ageGroup}:

"${content}"

المطلوب:
1. تحليل دقيق للملاحظة مع مراعاة المرحلة العمرية
2. اقتراحات عملية وقابلة للتطبيق مناسبة لرياض الأطفال السعودية
3. خطة عمل واضحة للمعلمة والأهل
4. أنشطة تربوية محددة

قدم الإجابة في شكل:
التحليل: [تحليل مفصل]
الاقتراحات: [اقتراحات عملية ومرقمة]`;

  try {
    console.log('🌐 Making API call to DeepSeek...');
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
            content: 'أنت مختص تربوي في رياض الأطفال السعودية، خبير في تحليل سلوك وتطور الأطفال من عمر 3-6 سنوات. تقدم نصائح عملية ومناسبة ثقافياً.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.7
      }),
    });

    console.log('📊 DeepSeek API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ DeepSeek API success');
    
    const aiResponse = data.choices[0]?.message?.content || '';
    
    // استخراج التحليل والاقتراحات من الرد
    const analysisMatch = aiResponse.match(/التحليل:\s*(.*?)(?=الاقتراحات:|$)/s);
    const suggestionsMatch = aiResponse.match(/الاقتراحات:\s*(.*?)$/s);
    
    return {
      analysis: analysisMatch ? analysisMatch[1].trim() : aiResponse.slice(0, 300) + '...',
      suggestions: suggestionsMatch ? suggestionsMatch[1].trim() : 'يرجى مراجعة المختص التربوي للحصول على اقتراحات مخصصة.'
    };
    
  } catch (error) {
    console.error('💥 Error calling DeepSeek API:', error);
    return {
      analysis: 'حدث خطأ في تحليل الملاحظة. يرجى المحاولة مرة أخرى.',
      suggestions: 'يرجى مراجعة المختص التربوي في الحضانة للحصول على التوجيه المناسب.'
    };
  }
}

// إنتاج الواجبات باستخدام DeepSeek API
async function generateAssignment(subject: string, grade: string, topic: string, difficulty: string): Promise<string> {
  console.log('📚 Generate assignment called for subject:', subject);
  
  if (!deepseekApiKey) {
    console.error('❌ DeepSeek API key not available');
    return 'خطأ: مفتاح DeepSeek API غير مُعد. يرجى إعداد المفتاح للحصول على الواجبات الذكية.';
  }

  console.log('✅ API key available, making request to DeepSeek');

  const gradeLevel = grade.includes('تمهيدي') || grade.includes('روضة') ? 
                    (grade.includes('أول') || grade.includes('صغير') ? 'الروضة الصغيرة (3-4 سنوات)' : 
                     grade.includes('ثاني') || grade.includes('متوسط') ? 'الروضة المتوسطة (4-5 سنوات)' : 'الروضة الكبيرة (5-6 سنوات)') : 'الروضة المتوسطة (4-5 سنوات)';

  const difficultyText = {
    'easy': 'سهل ومناسب للمبتدئين',
    'medium': 'متوسط مع تحدي مناسب',
    'hard': 'صعب ومتقدم'
  }[difficulty] || 'متوسط';

  const prompt = `أنت مختص في مناهج رياض الأطفال السعودية ومطور مناهج تعليمية. قم بإنشاء واجب تعليمي مفصل:

المادة: ${subject}
المستوى: ${gradeLevel}  
الموضوع: ${topic}
مستوى الصعوبة: ${difficultyText}

متطلبات الواجب:
1. يجب أن يكون مناسباً لمناهج رياض الأطفال السعودية
2. أنشطة تفاعلية ومرحة مناسبة للعمر
3. أهداف تعليمية واضحة ومحددة
4. تعليمات واضحة للطفل والأهل
5. طرق تقييم بسيطة ومناسبة
6. ربط بالقيم الإسلامية والثقافة السعودية
7. أنشطة عملية يمكن تطبيقها في المنزل

قدم الواجب في تنسيق منظم مع:
- العنوان
- الأهداف التعليمية (3-4 أهداف)
- الأنشطة المطلوبة (مرقمة)
- دور الأهل والمشاركة الأسرية
- طريقة التقييم
- المدة الزمنية المقترحة`;

  try {
    console.log('🌐 Making API call to DeepSeek...');
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
            content: 'أنت خبير مناهج رياض الأطفال السعودية، متخصص في تطوير الأنشطة التعليمية المناسبة للأطفال من عمر 3-6 سنوات. تركز على التعلم من خلال اللعب والأنشطة التفاعلية.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1200,
        temperature: 0.8
      }),
    });

    console.log('📊 DeepSeek API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ DeepSeek API error:', response.status, errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ DeepSeek API success');
    
    const assignment = data.choices[0]?.message?.content || '';
    
    if (assignment.trim()) {
      return assignment;
    } else {
      return `واجب ${subject} - ${topic}

🎯 الأهداف التعليمية:
• تطوير المهارات الأساسية في ${subject}
• تعزيز فهم موضوع ${topic}
• تنمية قدرات الطفل المعرفية

📚 الأنشطة المطلوبة:
1. نشاط تعليمي تفاعلي حول ${topic}
2. رسم أو تلوين متعلق بالموضوع  
3. مشاركة ما تعلم مع الأسرة

🏠 دور الأهل:
• مساعدة الطفل في تنفيذ الأنشطة
• تشجيع الطفل ومدح جهوده

⏰ المدة المقترحة: 15-20 دقيقة يومياً`;
    }
    
  } catch (error) {
    console.error('💥 Error calling DeepSeek API:', error);
    return `خطأ في إنتاج الواجب: ${error.message}

واجب ${subject} - ${topic} (نسخة احتياطية)

🎯 الأهداف:
• التعلم والممارسة في موضوع ${topic}
• تطوير المهارات الأساسية

📚 المطلوب:
1. مراجعة الموضوع مع المعلمة
2. أداء نشاط بسيط متعلق بالموضوع
3. مشاركة التعلم مع الأهل

🏠 المساعدة الأسرية مطلوبة`;
  }
}

serve(async (req) => {
  console.log('🔄 Request received:', req.method, req.url);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...requestData } = await req.json();
    console.log('📝 Action requested:', action);

    switch (action) {
      case 'analyze_note': {
        const { noteContent, noteType, studentAge } = requestData as AnalyzeNoteRequest;
        
        if (!noteContent || !noteType) {
          return new Response(
            JSON.stringify({ error: 'محتوى الملاحظة ونوعها مطلوبان' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('🔍 Analyzing note:', { noteType, studentAge });
        
        const result = await analyzeNote(noteContent, noteType, studentAge);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: result 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'generate_assignment': {
        const { subject, grade, topic, difficulty } = requestData as GenerateAssignmentRequest;
        
        if (!subject || !grade || !topic || !difficulty) {
          return new Response(
            JSON.stringify({ error: 'جميع معطيات الواجب مطلوبة' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
          );
        }

        console.log('📚 Generating assignment:', { subject, grade, topic, difficulty });
        
        const assignment = await generateAssignment(subject, grade, topic, difficulty);
        
        return new Response(
          JSON.stringify({ 
            success: true, 
            data: { assignment } 
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
    console.error('💥 Error in assignments-ai function:', error);
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