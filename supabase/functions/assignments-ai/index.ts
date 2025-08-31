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

// تحسين تحليل الملاحظات باستخدام مناهج رياض الأطفال السعودية
function analyzeNote(content: string, type: string, studentAge?: number): { analysis: string; suggestions: string } {
  const ageGroup = studentAge ? (studentAge <= 4 ? 'صغير' : studentAge <= 5 ? 'متوسط' : 'كبير') : 'متوسط';
  
  const keywords = {
    academic: {
      positive: ['متميز', 'ممتاز', 'تقدم', 'نجح', 'أتقن', 'تحسن', 'مبدع', 'متفوق'],
      negative: ['صعوبة', 'ضعف', 'لم يتقن', 'يحتاج مساعدة', 'متأخر', 'لم يفهم'],
      neutral: ['يتعلم', 'في تطور', 'يحاول', 'يشارك']
    },
    behavioral: {
      positive: ['مؤدب', 'منضبط', 'متعاون', 'هادئ', 'محترم', 'يساعد الآخرين'],
      negative: ['عدواني', 'مشاغب', 'لا يستمع', 'يضرب', 'يصرخ', 'لا يطيع'],
      neutral: ['نشيط', 'حيوي', 'يحتاج توجيه']
    },
    social: {
      positive: ['اجتماعي', 'يتفاعل', 'له أصدقاء', 'يشارك', 'متعاون'],
      negative: ['خجول', 'منطوي', 'لا يتفاعل', 'وحيد', 'يتجنب الآخرين'],
      neutral: ['يراقب', 'يتعلم التفاعل', 'بحاجة تشجيع']
    },
    health: {
      positive: ['صحي', 'نشيط', 'قوي البنية', 'جيد الشهية'],
      negative: ['مريض', 'ضعيف', 'متعب', 'لا يأكل', 'شاحب'],
      neutral: ['يحتاج متابعة', 'تحت المراقبة']
    }
  };

  const typeKeywords = keywords[type as keyof typeof keywords] || { positive: [], negative: [], neutral: [] };
  const positiveFound = typeKeywords.positive.filter(keyword => content.includes(keyword));
  const negativeFound = typeKeywords.negative.filter(keyword => content.includes(keyword));
  const neutralFound = typeKeywords.neutral.filter(keyword => content.includes(keyword));

  let analysis = '';
  let suggestions = '';

  if (type === 'academic') {
    if (negativeFound.length > 0) {
      analysis = `الطالب يواجه تحديات أكاديمية تتطلب تدخل تعليمي مناسب لعمر ${ageGroup} في رياض الأطفال. `;
      if (ageGroup === 'صغير') {
        analysis += 'في هذا العمر، التعلم يتم من خلال اللعب والأنشطة الحسية.';
        suggestions = `حلول مقترحة لطفل ${ageGroup}:
• استخدام الألعاب التعليمية والأنشطة الحركية
• تعلم الحروف والأرقام من خلال الأغاني والقصص
• أنشطة فنية لتطوير المهارات الحركية الدقيقة
• وقت إضافي للتكرار والممارسة بطريقة ممتعة
• تعزيز إيجابي فوري عند أي تقدم
• التواصل مع الأهل لتطبيق نفس الأنشطة في المنزل`;
      } else if (ageGroup === 'متوسط') {
        analysis += 'في هذا العمر، يمكن دمج التعلم الهادف مع اللعب.';
        suggestions = `حلول مقترحة لطفل ${ageGroup}:
• أنشطة تعليمية منظمة مع عنصر اللعب
• استخدام القصص التفاعلية لتعليم المفاهيم
• أنشطة جماعية صغيرة لتشجيع التعلم التشاركي
• جلسات قراءة يومية مع الصور
• ألعاب رياضية منتظمة مع المفاهيم التعليمية
• برنامج تعزيز سلوكي بالنجوم والمكافآت`;
      } else {
        analysis += 'في هذا العمر، الطفل مستعد لأنشطة تعليمية أكثر تنظيماً.';
        suggestions = `حلول مقترحة لطفل ${ageGroup}:
• أنشطة تحضيرية للمدرسة الابتدائية
• تطوير مهارات الكتابة والقراءة المبكرة
• أنشطة حل المشكلات البسيطة
• مشاريع فنية وعلمية صغيرة
• تعلم القواعد الأساسية للسلوك الاجتماعي
• تقييم مستمر مع التغذية الراجعة الإيجابية`;
      }
    } else if (positiveFound.length > 0) {
      analysis = `أداء الطالب متميز ويُظهر استعداداً جيداً للتطور في المرحلة العمرية ${ageGroup}.`;
      suggestions = `خطة تطويرية لطفل متميز ${ageGroup}:
• أنشطة إثرائية تحدي قدراته
• دور قيادي في الأنشطة الجماعية
• مشاريع إبداعية متقدمة
• مساعدة الأطفال الآخرين (التعلم بالتعليم)
• تطوير مواهب خاصة (فن، موسيقى، رياضة)
• إعداد للمرحلة التالية بأنشطة متقدمة`;
    } else {
      analysis = `الطالب في مرحلة تطوير طبيعية لعمر ${ageGroup} ويحتاج لمتابعة مستمرة.`;
      suggestions = `برنامج تطوير شامل لطفل ${ageGroup}:
• تقييم دوري للمهارات الأساسية
• أنشطة متنوعة تناسب نمط تعلمه
• تعزيز الثقة بالنفس من خلال النجاحات الصغيرة
• دمج اللعب والتعلم بطريقة متوازنة
• التواصل المنتظم مع الأهل`;
    }
  } else if (type === 'behavioral') {
    if (negativeFound.length > 0) {
      analysis = `يواجه الطالب تحديات سلوكية تحتاج لتدخل تربوي مناسب لطفل ${ageGroup}.`;
      suggestions = `خطة تعديل السلوك لطفل ${ageGroup}:
• وضع قوانين واضحة وبسيطة مناسبة للعمر
• نظام تعزيز إيجابي فوري (ملصقات، مكافآت صغيرة)
• تعليم مهارات التحكم في الغضب بطرق مناسبة للأطفال
• أنشطة تفريغ الطاقة (ألعاب حركية، رياضة)
• تعلم التعبير عن المشاعر بالكلمات بدلاً من السلوك
• جلسات إرشادية مع المختص النفسي
• برنامج تدريب الأهل على التعامل مع السلوك
• قصص تعليمية عن السلوك المرغوب`;
    } else if (positiveFound.length > 0) {
      analysis = `سلوك الطالب إيجابي ومناسب لعمر ${ageGroup}.`;
      suggestions = `تعزيز السلوك الإيجابي:
• الاستمرار في نظام التعزيز الحالي
• اختيار الطفل كقدوة للآخرين
• إعطاء مسؤوليات صغيرة مناسبة للعمر
• مدح السلوك أمام الآخرين
• تطوير المهارات القيادية`;
    } else {
      analysis = `السلوك العام يحتاج توجيه وتطوير مناسب لعمر ${ageGroup}.`;
      suggestions = `برنامج تطوير السلوك:
• وضع روتين يومي واضح
• تعليم آداب التعامل مع الآخرين
• أنشطة تطوير المهارات الاجتماعية
• لعب الأدوار لتعلم السلوك المناسب
• قصص تربوية هادفة`;
    }
  } else if (type === 'social') {
    if (negativeFound.length > 0) {
      analysis = `يحتاج الطالب لدعم في تطوير المهارات الاجتماعية المناسبة لعمر ${ageGroup}.`;
      suggestions = `برنامج تطوير المهارات الاجتماعية:
• أنشطة جماعية صغيرة (2-3 أطفال)
• ألعاب تشاركية تشجع التفاعل
• تعلم كلمات التحية والشكر والاعتذار
• قصص عن الصداقة والتعاون
• تدريب على المشاركة من خلال اللعب
• دعوة أطفال آخرين للعب معه
• تعزيز أي محاولة للتفاعل الاجتماعي`;
    } else if (positiveFound.length > 0) {
      analysis = `مهارات الطفل الاجتماعية جيدة ومناسبة لعمر ${ageGroup}.`;
      suggestions = `تطوير المهارات الاجتماعية المتقدمة:
• دور قيادي في الأنشطة الجماعية
• تعليم الآخرين المهارات الاجتماعية
• مشاريع تعاونية
• تطوير مهارات حل النزاعات
• أنشطة خدمة المجتمع المناسبة للعمر`;
    } else {
      analysis = `التطور الاجتماعي طبيعي لعمر ${ageGroup} مع الحاجة للتشجيع.`;
      suggestions = `برنامج التطوير الاجتماعي:
• تشجيع المبادرة في التفاعل
• أنشطة ترفيهية جماعية
• تعلم مهارات الاستماع
• العاب الأدوار الاجتماعية
• احتفالات جماعية وأنشطة خاصة`;
    }
  } else if (type === 'health') {
    analysis = `الحالة الصحية للطالب تتطلب متابعة خاصة مناسبة لعمر ${ageGroup}.`;
    if (negativeFound.length > 0) {
      suggestions = `خطة الرعاية الصحية:
• استشارة طبية عاجلة
• التواصل المستمر مع الأهل
• مراقبة يومية للحالة الصحية
• تعديل النشاطات حسب الحالة الصحية
• توفير بيئة صحية آمنة
• برنامج غذائي خاص إذا لزم الأمر
• متابعة مع الممرضة المدرسية`;
    } else {
      suggestions = `برنامج الصحة الوقائية:
• فحوصات دورية منتظمة
• تعزيز العادات الصحية
• أنشطة رياضية مناسبة للعمر
• تعليم النظافة الشخصية
• برنامج غذائي متوازن
• تثقيف صحي مناسب للطفل`;
    }
  }

  return { analysis, suggestions };
}

// تطوير مولد الواجبات لمناهج رياض الأطفال السعودية
function generateAssignment(subject: string, grade: string, topic: string, difficulty: string): string {
  const gradeLevel = grade.includes('تمهيدي') || grade.includes('روضة') ? 
                    (grade.includes('أول') || grade.includes('صغير') ? 'صغير' : 
                     grade.includes('ثاني') || grade.includes('متوسط') ? 'متوسط' : 'كبير') : 'متوسط';

  // مناهج رياض الأطفال السعودية المعتمدة
  const saudiKindergartenCurriculum = {
    'اللغة العربية': {
      'صغير': {
        easy: `نشاط لغوي في ${topic} - الروضة الصغيرة

🎯 الأهداف التعليمية:
• التعرف على الحروف والأصوات
• تطوير المفردات البسيطة
• تنمية مهارات الاستماع

📚 الأنشطة المطلوبة:
1. الاستماع لقصة قصيرة عن ${topic}
2. تلوين الحروف المتعلقة بالموضوع
3. ترديد أغنية تعليمية
4. التعرف على 3 كلمات جديدة

🏠 المشاركة مع الأهل:
• قراءة القصة مع الطفل قبل النوم
• تكرار الكلمات الجديدة أثناء اللعب`,

        medium: `مشروع لغوي في ${topic} - الروضة الصغيرة

🎯 الأهداف:
• تطوير مهارات التواصل اللفظي
• بناء المفردات الأساسية
• تعزيز حب اللغة العربية

📚 المهام:
1. حفظ 3 أبيات شعر بسيطة عن ${topic}
2. رسم صورة وتسمية الأشياء فيها
3. سرد قصة قصيرة بالصور
4. لعبة الحروف والكلمات
5. زيارة المكتبة مع الأهل

🏠 التعاون الأسري:
• ممارسة المحادثة اليومية باللغة العربية
• قراءة كتاب أطفال أسبوعياً`,

        hard: `برنامج لغوي متكامل في ${topic}

🎯 أهداف متقدمة:
• إتقان نطق الحروف وتمييزها
• تكوين جمل بسيطة
• فهم النصوص القصيرة

📚 الأنشطة:
1. إنشاء كتاب صغير عن ${topic}
2. تمثيل قصة قصيرة
3. كتابة الحروف في الرمل/الطحين
4. لعبة البحث عن الكلمات
5. إعداد عرض تقديمي بسيط

🏠 الشراكة التعليمية:
• زيارة أماكن متعلقة بالموضوع
• تطبيق ما تعلم في الحياة اليومية`
      },
      'متوسط': {
        easy: `نشاط القراءة والكتابة - ${topic}

🎯 مهارات الروضة المتوسطة:
• قراءة الكلمات البسيطة
• كتابة الحروف بشكل صحيح
• فهم المعاني الأساسية

📝 المطلوب:
1. قراءة 5 كلمات متعلقة بـ ${topic}
2. كتابة الحروف الأولى من كل كلمة
3. رسم صورة تعبر عن كل كلمة
4. حفظ دعاء أو آية قرآنية قصيرة

🏠 الواجب المنزلي:
• قراءة يومية 10 دقائق
• كتابة اسم الطفل 3 مرات يومياً`,

        medium: `مشروع اللغة العربية - ${topic}

🎯 المهارات المستهدفة:
• القراءة الجهرية البسيطة
• الكتابة المنقولة
• التعبير الشفهي

📖 الأنشطة:
1. قراءة قصة من 3 صفحات عن ${topic}
2. إعادة سرد القصة بكلمات الطفل
3. كتابة 3 جمل بسيطة
4. رسم أحداث القصة بالترتيب
5. تحضير عرض للفصل

🏠 المتابعة الأسرية:
• مناقشة القصة مع الطفل
• تشجيع الطفل على القراءة`,

        hard: `برنامج اللغة العربية المتقدم - ${topic}

🎯 إتقان مهارات الروضة:
• القراءة السليمة مع الفهم
• الكتابة الإبداعية البسيطة
• التحدث بثقة

📚 المشروع الشامل:
1. كتابة قصة قصيرة (5 جمل) عن ${topic}
2. إلقاء القصة أمام الفصل
3. رسم شخصيات القصة
4. حفظ 5 أبيات شعر
5. تأليف أغنية بسيطة

🏠 الإثراء المنزلي:
• إنشاء مكتبة صغيرة للطفل
• مشاهدة برامج تعليمية باللغة العربية`
      }
    },
    'الرياضيات': {
      'صغير': {
        easy: `أساسيات الأرقام - ${topic}

🔢 أهداف الرياضيات للصغار:
• التعرف على الأرقام 1-5
• مفهوم العد البسيط
• التمييز بين الأشكال الأساسية

🎲 الأنشطة:
1. عد الألعاب في الصف (1-5)
2. تلوين الأرقام وتتبع شكلها
3. ترتيب الأشياء حسب الحجم
4. لعبة مطابقة الرقم بالعدد

🏠 الممارسة المنزلية:
• عد الأشياء في المنزل يومياً
• غناء أغاني الأرقام`,

        medium: `استكشاف الأرقام - ${topic}

🔢 تطوير المفاهيم الرياضية:
• الأرقام من 1-10
• العمليات البسيطة (جمع بصري)
• المقارنة والترتيب

🎯 المهام:
1. بناء أبراج من المكعبات (1-10)
2. لعبة الجمع بالألعاب
3. رسم الأشكال الهندسية
4. قياس الأشياء بوحدات بسيطة
5. حل الألغاز الرياضية المصورة

🏠 التطبيق العملي:
• استخدام الأرقام في الطبخ
• عد النقود الورقية البسيطة`,

        hard: `الرياضيات التطبيقية - ${topic}

🔢 مهارات متقدمة للروضة:
• الأرقام حتى 20
• عمليات الجمع والطرح البسيطة
• حل المسائل اللفظية

📊 المشروع:
1. إنشاء متجر صغير واللعب بالنقود
2. قياس وزن الأشياء بالميزان
3. رسم جداول بسيطة
4. حل مسائل من الحياة اليومية
5. تصميم أشكال هندسية بالمكعبات

🏠 الرياضيات في البيت:
• مشاركة الطفل في التسوق والحساب
• ألعاب الذكاء الرياضي`
      }
    },
    'العلوم': {
      'صغير': {
        easy: `اكتشاف العالم - ${topic}

🔬 علوم الطبيعة للصغار:
• مراقبة الطبيعة
• التعرف على الكائنات الحية
• فهم الظواهر البسيطة

🌱 الأنشطة:
1. زراعة بذرة ومراقبة نموها
2. رسم الحيوانات والنباتات
3. تجربة الطفو والغوص
4. مراقبة الطقس يومياً

🏠 الاستكشاف المنزلي:
• جمع أوراق الشجر والزهور
• مراقبة الحشرات في الحديقة`,

        medium: `عالم الاكتشافات - ${topic}

🔬 التفكير العلمي:
• طرح الأسئلة العلمية
• الملاحظة والتسجيل
• التجارب البسيطة

🧪 المشروع العلمي:
1. تجربة خلط الألوان
2. صناعة قوس قزح بالماء
3. زراعة حديقة صغيرة
4. مراقبة دورة الماء
5. تصنيف الكائنات الحية

🏠 العلوم في المنزل:
• تجارب المطبخ الآمنة
• مراقبة النجوم والقمر`,

        hard: `مشروع العالم الصغير - ${topic}

🔬 البحث العلمي للأطفال:
• إجراء تجارب منهجية
• توثيق النتائج بالرسم
• تفسير الظواهر ببساطة

🧬 المشروع الشامل:
1. إنشاء معرض علمي صغير
2. تجارب الكثافة والحجم
3. بناء نموذج للنظام الشمسي
4. دراسة دورة حياة الفراشة
5. تقديم عرض علمي للعائلة

🏠 مختبر المنزل:
• إنشاء ركن علمي في المنزل
• زيارة المتاحف العلمية`
      }
    }
  };

  const curriculum = saudiKindergartenCurriculum[subject as keyof typeof saudiKindergartenCurriculum];
  if (curriculum) {
    const gradeCurriculum = curriculum[gradeLevel as keyof typeof curriculum];
    if (gradeCurriculum && gradeCurriculum[difficulty as keyof typeof gradeCurriculum]) {
      return gradeCurriculum[difficulty as keyof typeof gradeCurriculum];
    }
  }

  // النموذج الافتراضي للمناهج السعودية
  return `واجب منهج رياض الأطفال السعودي - ${subject}
الموضوع: ${topic}

🇸🇦 وفقاً لمعايير التعليم في المملكة العربية السعودية

🎯 الأهداف التعليمية:
• تنمية المهارات الأساسية للطفل السعودي
• ربط التعلم بالثقافة والقيم الإسلامية
• تطوير شخصية الطفل المتوازنة

📚 الأنشطة المطلوبة:
1. نشاط تفاعلي يربط ${topic} بالبيئة السعودية
2. تطبيق عملي في الحياة اليومية
3. قصة أو أغنية تعليمية باللهجة المحلية
4. نشاط فني يعبر عن الموضوع

🏠 المشاركة الأسرية:
• تفعيل دور الأسرة في التعلم
• ربط الدرس بالقيم الإسلامية والوطنية

💡 ملاحظات للمعلمة:
• مراعاة الفروق الفردية
• استخدام التعزيز الإيجابي
• التنويع في طرق التدريس`;
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
    console.log('AI Request received:', action, requestData);

    if (action === 'analyze_note') {
      const { noteContent, noteType, studentAge } = requestData as AnalyzeNoteRequest;
      
      if (!noteContent || !noteType) {
        return new Response(
          JSON.stringify({ error: 'Missing noteContent or noteType' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Analyzing note:', { noteType, studentAge, contentLength: noteContent.length });
      const result = analyzeNote(noteContent, noteType, studentAge);
      console.log('Analysis result generated successfully');
      
      return new Response(
        JSON.stringify(result),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'generate_assignment') {
      const { subject, grade, topic, difficulty } = requestData as GenerateAssignmentRequest;
      
      if (!subject || !topic) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: subject and topic' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log('Generating assignment:', { subject, grade, topic, difficulty });
      const assignmentContent = generateAssignment(subject, grade || 'روضة متوسط', topic, difficulty || 'medium');
      console.log('Assignment generated successfully');
      
      return new Response(
        JSON.stringify({ assignment: assignmentContent }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use "analyze_note" or "generate_assignment"' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in assignments-ai function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
})