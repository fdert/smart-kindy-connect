import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { PageHeader } from '@/components/PageHeader';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  Play, 
  Pause, 
  Volume2,
  VolumeX,
  School,
  Users, 
  Calendar, 
  Star, 
  BookOpen,
  Image,
  UserCheck,
  FileText,
  Settings,
  Brain,
  Award,
  NotebookPen,
  DollarSign,
  BarChart3,
  Shield,
  Video,
  Camera,
  MessageSquare,
  ClipboardList,
  PenTool,
  ChevronRight,
  Lightbulb,
  Target,
  CheckCircle2,
  PlayCircle,
  Headphones,
  Download,
  ExternalLink
} from 'lucide-react';

// Import tour images
import tourDashboard from '@/assets/tour-dashboard.jpg';
import tourAttendance from '@/assets/tour-attendance.jpg';
import tourMedia from '@/assets/tour-media.jpg';
import tourReports from '@/assets/tour-reports.jpg';
import tourRewards from '@/assets/tour-rewards.jpg';
import tourWhatsApp from '@/assets/tour-whatsapp.jpg';

interface AudioState {
  isPlaying: boolean;
  currentAudio: HTMLAudioElement | null;
  isLoading: boolean;
  error: string | null;
}

interface GuideSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  color: string;
  image?: string;
  steps: Array<{
    title: string;
    description: string;
    details: string[];
    tips?: string[];
  }>;
  audioText?: string;
}

const TeacherGuide = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentAudio: null,
    isLoading: false,
    error: null
  });

  const guideData: GuideSection[] = [
    {
      id: 'dashboard',
      title: 'لوحة التحكم الرئيسية',
      description: 'نظرة عامة على أداء فصلك وطلابك',
      icon: School,
      color: 'bg-blue-500',
      image: tourDashboard,
      steps: [
        {
          title: 'بطاقات الإحصائيات',
          description: 'عرض ملخص سريع لأهم المؤشرات',
          details: [
            'عدد الفصول المخصصة لك',
            'عدد الطلاب في فصولك',
            'معدل الحضور اليومي',
            'النجوم الممنوحة هذا الأسبوع'
          ],
          tips: [
            'تحديث الإحصائيات تلقائياً كل دقيقة',
            'اضغط على أي بطاقة للانتقال للتفاصيل'
          ]
        },
        {
          title: 'أدوات سريعة',
          description: 'الوصول المباشر لأهم الوظائف',
          details: [
            'إدارة الطلاب والفصول',
            'تسجيل الحضور والغياب',
            'إنشاء واجبات جديدة',
            'منح المكافآت والنجوم'
          ]
        }
      ],
      audioText: 'مرحباً بك في دليل لوحة التحكم الخاصة بالمعلم. لوحة التحكم هي المركز الرئيسي للتحكم في فصلك وإدارة طلابك. من خلالها يمكنك مراقبة الأداء العام والوصول لجميع الأدوات بسهولة.'
    },
    {
      id: 'students',
      title: 'إدارة الطلاب',
      description: 'عرض وتحرير بيانات الطلاب وملفاتهم',
      icon: Users,
      color: 'bg-green-500',
      steps: [
        {
          title: 'عرض قائمة الطلاب',
          description: 'استعراض جميع الطلاب في فصولك',
          details: [
            'عرض البيانات الأساسية لكل طالب',
            'حالة نشاط الطالب',
            'معلومات التواصل مع الأهل',
            'الفصل المسجل به الطالب'
          ]
        },
        {
          title: 'إدارة ملفات الطلاب',
          description: 'تحديث وتعديل بيانات الطلاب',
          details: [
            'تعديل البيانات الشخصية',
            'إضافة ملاحظات خاصة',
            'رفع الصور والمستندات',
            'تتبع سجل الحضور والأداء'
          ]
        }
      ],
      audioText: 'إدارة الطلاب هي إحدى أهم الأدوات في النظام. من خلالها يمكنك الاطلاع على جميع المعلومات المتعلقة بطلابك وإدارة ملفاتهم الشخصية بكل سهولة.'
    },
    {
      id: 'attendance',
      title: 'الحضور والغياب',
      description: 'تسجيل ومتابعة حضور الطلاب يومياً',
      icon: UserCheck,
      color: 'bg-orange-500',
      image: tourAttendance,
      steps: [
        {
          title: 'تسجيل الحضور اليومي',
          description: 'تسجيل حضور وغياب الطلاب',
          details: [
            'تحديد حالة كل طالب (حاضر/غائب/متأخر)',
            'إضافة ملاحظات للغياب',
            'إرسال تنبيهات للأهل',
            'طباعة تقرير الحضور اليومي'
          ]
        },
        {
          title: 'تقارير الحضور',
          description: 'عرض إحصائيات وتقارير مفصلة',
          details: [
            'تقارير أسبوعية وشهرية',
            'معدل حضور كل طالب',
            'أكثر أيام الغياب',
            'إحصائيات عامة للفصل'
          ]
        }
      ],
      audioText: 'نظام الحضور والغياب يساعدك في متابعة حضور طلابك بدقة. يمكنك تسجيل الحضور بسرعة وإرسال تقارير للأهل تلقائياً.'
    },
    {
      id: 'assignments',
      title: 'إدارة الواجبات',
      description: 'إنشاء وتقييم واجبات الطلاب',
      icon: FileText,
      color: 'bg-purple-500',
      steps: [
        {
          title: 'إنشاء واجبات جديدة',
          description: 'إضافة واجبات وأنشطة للطلاب',
          details: [
            'تحديد عنوان ووصف الواجب',
            'رفع ملفات مرفقة',
            'تحديد تاريخ التسليم',
            'اختيار الطلاب المستهدفين'
          ]
        },
        {
          title: 'تقييم الواجبات',
          description: 'مراجعة وتقييم إجابات الطلاب',
          details: [
            'عرض إجابات الطلاب',
            'إضافة درجات وتقييمات',
            'كتابة تعليقات وملاحظات',
            'إرسال النتائج للأهل'
          ]
        }
      ],
      audioText: 'إدارة الواجبات تتيح لك إنشاء واجبات متنوعة وتقييمها بسهولة. يمكنك متابعة تقدم الطلاب وإرسال التقييمات للأهل مباشرة.'
    },
    {
      id: 'rewards',
      title: 'نظام المكافآت',
      description: 'منح النجوم والمكافآت للطلاب المميزين',
      icon: Award,
      color: 'bg-yellow-500',
      image: tourRewards,
      steps: [
        {
          title: 'منح النجوم',
          description: 'تحفيز الطلاب بنظام النقاط',
          details: [
            'منح نجوم للسلوك الإيجابي',
            'تحديد سبب منح النجمة',
            'عرض رصيد كل طالب',
            'إحصائيات النجوم الممنوحة'
          ]
        },
        {
          title: 'إدارة المكافآت',
          description: 'تنظيم نظام المكافآت والجوائز',
          details: [
            'تحديد أنواع المكافآت المتاحة',
            'تسجيل استبدال النجوم بالجوائز',
            'تقارير المكافآت الممنوحة',
            'تحفيز المنافسة الإيجابية'
          ]
        }
      ],
      audioText: 'نظام المكافآت أداة قوية لتحفيز الطلاب وتشجيعهم على السلوك الإيجابي. يمكنك منح النجوم فوراً ومتابعة تقدم الطلاب.'
    },
    {
      id: 'media',
      title: 'الملفات الإعلامية',
      description: 'مشاركة الصور والفيديوهات مع الأهل',
      icon: Image,
      color: 'bg-pink-500',
      image: tourMedia,
      steps: [
        {
          title: 'رفع الصور والفيديوهات',
          description: 'توثيق أنشطة الطلاب',
          details: [
            'رفع صور من كاميرا الجهاز',
            'تحديد الطلاب الظاهرين في الصورة',
            'إضافة وصف أو تعليق',
            'تنظيم الملفات بالتواريخ'
          ]
        },
        {
          title: 'مشاركة المحتوى',
          description: 'إرسال الملفات للأهل تلقائياً',
          details: [
            'إرسال تلقائي عبر الواتساب',
            'تقارير مصورة للأنشطة',
            'ألبومات خاصة بكل طالب',
            'حفظ الذكريات طوال العام'
          ]
        }
      ],
      audioText: 'الملفات الإعلامية تساعدك في توثيق لحظات مميزة من يوم طلابك ومشاركتها مع الأهل، مما يعزز التواصل والثقة.'
    },
    {
      id: 'notes',
      title: 'ملاحظات الطلاب',
      description: 'كتابة وإدارة ملاحظات تطور الطلاب',
      icon: NotebookPen,
      color: 'bg-indigo-500',
      steps: [
        {
          title: 'كتابة الملاحظات',
          description: 'توثيق تطور وسلوك الطلاب',
          details: [
            'ملاحظات السلوك اليومي',
            'تقييم الأداء الأكاديمي',
            'ملاحظات التطور الاجتماعي',
            'توصيات للأهل'
          ]
        },
        {
          title: 'تتبع التطور',
          description: 'متابعة تقدم الطلاب عبر الزمن',
          details: [
            'سجل تاريخي لكل طالب',
            'مقارنة التطور بالفترات السابقة',
            'تقارير دورية للأهل',
            'خطط تحسين مخصصة'
          ]
        }
      ],
      audioText: 'ملاحظات الطلاب تساعدك في توثيق رحلة تطور كل طالب وإبقاء الأهل على اطلاع دائم بتقدم أطفالهم.'
    },
    {
      id: 'ai-assistant',
      title: 'المساعد الذكي',
      description: 'الحصول على مساعدة ذكية في المهام التعليمية',
      icon: Brain,
      color: 'bg-cyan-500',
      steps: [
        {
          title: 'تحليل الأداء',
          description: 'تحليل ذكي لأداء الطلاب',
          details: [
            'تحليل نمط الحضور والغياب',
            'اقتراحات تحسين الأداء',
            'تحديد الطلاب المحتاجين لمساعدة',
            'توقعات مبنية على البيانات'
          ]
        },
        {
          title: 'مساعدة في التخطيط',
          description: 'اقتراحات لتحسين العملية التعليمية',
          details: [
            'أفكار للأنشطة التعليمية',
            'استراتيجيات لإدارة الفصل',
            'نصائح للتعامل مع التحديات',
            'خطط تعليمية مخصصة'
          ]
        }
      ],
      audioText: 'المساعد الذكي يوفر لك تحليلات متقدمة واقتراحات مفيدة لتحسين تجربة التعلم وإدارة الفصل بكفاءة أكبر.'
    }
  ];

  // ElevenLabs TTS function
  const playTextToSpeech = async (text: string) => {
    setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // For demo purposes, using Web Speech API
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        utterance.rate = 0.8;
        utterance.pitch = 1;
        
        utterance.onstart = () => {
          setAudioState(prev => ({ 
            ...prev, 
            isPlaying: true, 
            isLoading: false 
          }));
        };
        
        utterance.onend = () => {
          setAudioState(prev => ({ 
            ...prev, 
            isPlaying: false, 
            currentAudio: null 
          }));
        };
        
        utterance.onerror = () => {
          setAudioState(prev => ({ 
            ...prev, 
            isPlaying: false, 
            isLoading: false,
            error: 'حدث خطأ في تشغيل الصوت'
          }));
        };
        
        speechSynthesis.speak(utterance);
      } else {
        throw new Error('المتصفح لا يدعم تشغيل النص الصوتي');
      }
    } catch (error) {
      setAudioState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: 'حدث خطأ في تشغيل الصوت' 
      }));
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setAudioState({
      isPlaying: false,
      currentAudio: null,
      isLoading: false,
      error: null
    });
  };

  const currentSection = guideData.find(section => section.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="دليل المعلم التفاعلي"
          subtitle="شرح شامل ومفصل لجميع أدوات لوحة التحكم الخاصة بالمعلم"
          backTo="/teacher-dashboard"
          className="mb-8"
        >
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open('/standalone-tour', '_blank')}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              جولة تفاعلية
            </Button>
            {currentSection && (
              <Button
                variant={audioState.isPlaying ? "destructive" : "default"}
                size="sm"
                onClick={() => audioState.isPlaying ? stopAudio() : playTextToSpeech(currentSection.audioText || currentSection.description)}
                disabled={audioState.isLoading}
                className="flex items-center gap-2"
              >
                {audioState.isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : audioState.isPlaying ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Headphones className="h-4 w-4" />
                )}
                {audioState.isLoading ? 'جاري التحميل...' : audioState.isPlaying ? 'إيقاف الصوت' : 'شرح صوتي'}
              </Button>
            )}
          </div>
        </PageHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm p-2">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8 gap-1">
              <TabsTrigger value="overview" className="text-xs">
                نظرة عامة
              </TabsTrigger>
              {guideData.map((section) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger 
                    key={section.id} 
                    value={section.id}
                    className="flex flex-col items-center gap-1 text-xs p-2"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:block">{section.title}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Lightbulb className="h-6 w-6" />
                  مرحباً بك في دليل المعلم الشامل
                </CardTitle>
                <CardDescription className="text-blue-100">
                  هذا الدليل سيساعدك في إتقان جميع أدوات النظام لإدارة فصلك بكفاءة عالية
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-300" />
                    <span>شرح تفاعلي مفصل</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-5 w-5 text-green-300" />
                    <span>شرح صوتي لكل قسم</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-300" />
                    <span>أمثلة عملية واضحة</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {guideData.map((section) => {
                const Icon = section.icon;
                return (
                  <Card 
                    key={section.id}
                    className="cursor-pointer hover:shadow-lg transition-all duration-200 group"
                    onClick={() => setActiveTab(section.id)}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 rounded-lg ${section.color} text-white group-hover:scale-110 transition-transform`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{section.title}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {section.steps.length} خطوات
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{section.description}</CardDescription>
                    </CardHeader>
                    {section.image && (
                      <CardContent className="pt-0">
                        <img 
                          src={section.image} 
                          alt={section.title}
                          className="w-full h-32 object-cover rounded-md"
                        />
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Individual Section Tabs */}
          {guideData.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-6">
              {/* Section Header */}
              <Card className="bg-gradient-to-r from-white to-gray-50 border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-lg ${section.color} text-white`}>
                        <section.icon className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{section.title}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {section.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant={audioState.isPlaying ? "destructive" : "default"}
                      size="sm"
                      onClick={() => audioState.isPlaying ? stopAudio() : playTextToSpeech(section.audioText || section.description)}
                      disabled={audioState.isLoading}
                    >
                      {audioState.isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : audioState.isPlaying ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {section.image && (
                  <CardContent>
                    <img 
                      src={section.image} 
                      alt={section.title}
                      className="w-full max-w-2xl mx-auto rounded-lg shadow-sm"
                    />
                  </CardContent>
                )}
              </Card>

              {/* Steps Accordion */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    خطوات التنفيذ التفصيلية
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Accordion type="multiple" className="w-full">
                    {section.steps.map((step, index) => (
                      <AccordionItem key={index} value={`step-${index}`}>
                        <AccordionTrigger className="text-right">
                          <div className="flex items-center gap-3">
                            <div className="bg-blue-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <span className="font-medium">{step.title}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="space-y-4 pr-9">
                          <p className="text-gray-600">{step.description}</p>
                          
                          <div className="space-y-2">
                            <h4 className="font-medium text-gray-900">التفاصيل:</h4>
                            <ul className="space-y-1">
                              {step.details.map((detail, detailIndex) => (
                                <li key={detailIndex} className="flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                  <span className="text-gray-700">{detail}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {step.tips && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                              <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
                                <Lightbulb className="h-4 w-4" />
                                نصائح مفيدة:
                              </h4>
                              <ul className="space-y-1">
                                {step.tips.map((tip, tipIndex) => (
                                  <li key={tipIndex} className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                    <span className="text-yellow-800">{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>

        {/* Audio Error Toast */}
        {audioState.error && (
          <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg">
            {audioState.error}
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherGuide;