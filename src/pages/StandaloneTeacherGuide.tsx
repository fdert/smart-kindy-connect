import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
  ExternalLink,
  ArrowLeft,
  Home
} from 'lucide-react';

// Import real system images
import realDashboard from '@/assets/real-dashboard.jpg';
import realStudents from '@/assets/real-students.jpg';
import realClasses from '@/assets/real-classes.jpg';
import realAttendance from '@/assets/real-attendance.jpg';
import realAssignments from '@/assets/real-assignments.jpg';
import realRewards from '@/assets/real-rewards.jpg';
import realMedia from '@/assets/real-media.jpg';
import realNotes from '@/assets/real-notes.jpg';
import realAiAssistant from '@/assets/real-ai-assistant.jpg';
import realPermissions from '@/assets/real-permissions.jpg';
import realSurveys from '@/assets/real-surveys.jpg';
import realStudentReports from '@/assets/real-student-reports.jpg';

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

const StandaloneTeacherGuide = () => {
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
      description: 'نظرة عامة شاملة على أداء فصلك وطلابك مع إحصائيات مباشرة',
      icon: School,
      color: 'bg-blue-500',
      image: realDashboard,
      steps: [
        {
          title: 'بطاقات الإحصائيات التفاعلية',
          description: 'عرض ملخص تفصيلي ومباشر لأهم المؤشرات التعليمية',
          details: [
            'عدد الفصول المخصصة لك مع تفاصيل كل فصل',
            'إجمالي عدد الطلاب النشطين في جميع فصولك',
            'معدل الحضور اليومي بالنسبة المئوية',
            'عدد النجوم الممنوحة خلال الأسبوع الحالي',
            'الواجبات المعلقة التي تحتاج متابعة',
            'الأذونات والاستطلاعات النشطة'
          ],
          tips: [
            'تحديث الإحصائيات تلقائياً كل دقيقة لضمان دقة البيانات',
            'اضغط على أي بطاقة للانتقال مباشرة للتفاصيل الكاملة',
            'استخدم الألوان المختلفة لفهم الحالة سريعاً (أخضر=ممتاز، أصفر=يحتاج انتباه)'
          ]
        },
        {
          title: 'أدوات الوصول السريع',
          description: 'الانتقال المباشر لأهم الوظائف اليومية',
          details: [
            'إدارة ملفات الطلاب وبياناتهم الشخصية',
            'إعداد وتنظيم الفصول الدراسية',
            'تسجيل الحضور والغياب اليومي',
            'إنشاء وإدارة الواجبات والأنشطة',
            'منح المكافآت والنجوم للطلاب المميزين',
            'عرض وإدارة الملفات الإعلامية'
          ]
        }
      ],
      audioText: 'مرحباً بك في دليل لوحة التحكم الخاصة بالمعلم. لوحة التحكم هي قلب النظام النابض، وهي المركز الرئيسي للتحكم الكامل في فصلك وإدارة طلابك بكفاءة عالية.'
    },
    {
      id: 'students',
      title: 'إدارة الطلاب',
      description: 'نظام شامل لإدارة ملفات الطلاب وبياناتهم التعليمية والشخصية',
      icon: Users,
      color: 'bg-green-500',
      image: realStudents,
      steps: [
        {
          title: 'عرض وإدارة قائمة الطلاب',
          description: 'استعراض شامل لجميع الطلاب في فصولك مع إمكانية البحث والفلترة',
          details: [
            'عرض البيانات الأساسية: الاسم الكامل، العمر، تاريخ الميلاد',
            'صورة شخصية لكل طالب لسهولة التعرف',
            'حالة نشاط الطالب (نشط/غير نشط/معلق)',
            'معلومات التواصل مع الأهل (هاتف، واتساب، إيميل)',
            'الفصل المسجل به الطالب مع إمكانية النقل',
            'تاريخ التسجيل ومدة الدراسة بالروضة'
          ]
        }
      ],
      audioText: 'إدارة الطلاب هي القلب النابض للنظام التعليمي وإحدى أهم الأدوات التي ستستخدمينها يومياً.'
    },
    {
      id: 'attendance',
      title: 'الحضور والغياب',
      description: 'نظام متطور لتسجيل ومتابعة حضور الطلاب مع التنبيهات التلقائية',
      icon: UserCheck,
      color: 'bg-orange-500',
      image: realAttendance,
      steps: [
        {
          title: 'تسجيل الحضور اليومي السريع',
          description: 'تسجيل حضور وغياب جميع الطلاب بطريقة سريعة وفعالة',
          details: [
            'عرض قائمة جميع طلاب الفصل مع صورهم',
            'تحديد حالة كل طالب: حاضر، غائب، متأخر، خروج مبكر',
            'تسجيل وقت الوصول والمغادرة بدقة',
            'إضافة ملاحظات تفصيلية لحالات الغياب أو التأخير',
            'إرسال إشعارات فورية للأهل عبر الواتساب'
          ]
        }
      ],
      audioText: 'نظام الحضور والغياب هو أحد أهم الأدوات لضمان متابعة دقيقة لحضور طلابك.'
    },
    {
      id: 'assignments',
      title: 'إدارة الواجبات والأنشطة',
      description: 'نظام شامل لإنشاء وإدارة وتقييم الواجبات والأنشطة التعليمية',
      icon: FileText,
      color: 'bg-purple-500',
      image: realAssignments,
      steps: [
        {
          title: 'إنشاء واجبات وأنشطة متنوعة',
          description: 'تصميم واجبات تفاعلية ومتنوعة تناسب جميع المستويات',
          details: [
            'إنشاء واجبات تعليمية بعنوان ووصف مفصل',
            'تحديد نوع النشاط: واجب منزلي، نشاط صفي، مشروع جماعي',
            'رفع ملفات مرفقة: صور، مستندات، ملفات صوتية',
            'تحديد تاريخ الاستحقاق ووقت التسليم بدقة'
          ]
        }
      ],
      audioText: 'نظام إدارة الواجبات والأنشطة يوفر منصة شاملة لتصميم وإدارة التكليفات التعليمية.'
    },
    {
      id: 'rewards',
      title: 'نظام المكافآت والتحفيز',
      description: 'أدوات متقدمة لتحفيز الطلاب ومكافأتهم على إنجازاتهم المتميزة',
      icon: Award,
      color: 'bg-yellow-500',
      image: realRewards,
      steps: [
        {
          title: 'منح المكافآت والنجوم',
          description: 'تحفيز الطلاب من خلال نظام مكافآت متنوع وجذاب',
          details: [
            'منح نجوم فورية للسلوكيات الإيجابية',
            'إنشاء مكافآت مخصصة حسب الإنجاز',
            'تصميم شهادات تقدير رقمية',
            'نظام نقاط تراكمية قابلة للاستبدال'
          ]
        }
      ],
      audioText: 'نظام المكافآت والتحفيز يساعد في بناء بيئة تعليمية إيجابية ومحفزة للطلاب.'
    },
    {
      id: 'media',
      title: 'إدارة الملفات الإعلامية',
      description: 'منصة شاملة لتنظيم وإدارة الصور ومقاطع الفيديو والملفات التعليمية',
      icon: Image,
      color: 'bg-pink-500',
      image: realMedia,
      steps: [
        {
          title: 'رفع وتنظيم الملفات الإعلامية',
          description: 'إدارة متقدمة للصور والفيديوهات التعليمية',
          details: [
            'رفع الصور ومقاطع الفيديو بجودة عالية',
            'تنظيم الملفات في مجلدات حسب التاريخ والنشاط',
            'إضافة وصف وتعليقات للملفات',
            'ربط الملفات بالطلاب والأنشطة المحددة'
          ]
        }
      ],
      audioText: 'إدارة الملفات الإعلامية تساعد في توثيق الأنشطة والذكريات التعليمية بطريقة منظمة.'
    },
    {
      id: 'notes',
      title: 'ملاحظات الطلاب التطويرية',
      description: 'نظام متطور لتسجيل ومتابعة الملاحظات التعليمية والسلوكية للطلاب',
      icon: NotebookPen,
      color: 'bg-indigo-500',
      image: realNotes,
      steps: [
        {
          title: 'تسجيل الملاحظات التفصيلية',
          description: 'توثيق شامل لتطور كل طالب أكاديمياً وسلوكياً',
          details: [
            'تسجيل ملاحظات أكاديمية وسلوكية مفصلة',
            'تصنيف الملاحظات حسب النوع والأهمية',
            'إضافة خطط متابعة وتطوير',
            'مشاركة الملاحظات مع الأهل بشكل آمن'
          ]
        }
      ],
      audioText: 'نظام ملاحظات الطلاب يساعد في تتبع تطور كل طالب وتوثيق رحلته التعليمية.'
    },
    {
      id: 'ai-assistant',
      title: 'المساعد الذكي التعليمي',
      description: 'مساعد ذكي متطور يوفر اقتراحات تعليمية وتحليلات متقدمة لتحسين الأداء',
      icon: Brain,
      color: 'bg-emerald-500',
      image: realAiAssistant,
      steps: [
        {
          title: 'تحليل الأداء والبيانات التعليمية',
          description: 'تحليل ذكي ومتقدم لجميع جوانب العملية التعليمية',
          details: [
            'تحليل أنماط الحضور والغياب لكل طالب',
            'رصد تطور الأداء الأكاديمي عبر الزمن',
            'تحديد الطلاب الذين يحتاجون لاهتمام إضافي',
            'تحليل فعالية استراتيجيات التدريس المختلفة'
          ]
        }
      ],
      audioText: 'المساعد الذكي التعليمي هو رفيقك الدائم في رحلة التعليم والتطوير.'
    },
    {
      id: 'permissions',
      title: 'إدارة الأذونات',
      description: 'نظام شامل لإنشاء وإرسال أذونات النشاطات والرحلات للأهالي مع متابعة الردود',
      icon: Shield,
      color: 'bg-cyan-500',
      image: realPermissions,
      steps: [
        {
          title: 'إنشاء إذن جديد للنشاطات والرحلات',
          description: 'تصميم أذونات مخصصة للحصول على موافقة الأهل للأنشطة المختلفة',
          details: [
            'إنشاء إذن جديد بعنوان واضح ومحدد للنشاط أو الرحلة',
            'كتابة وصف تفصيلي يشمل: الهدف، التاريخ، المكان، الوقت',
            'تحديد خيارات الرد المتاحة: موافق، غير موافق، أحتاج تفاصيل',
            'تحديد تاريخ انتهاء صلاحية الإذن والموعد النهائي للرد'
          ]
        }
      ],
      audioText: 'نظام إدارة الأذونات يضمن التواصل الفعال مع الأهالي حول الأنشطة والرحلات المدرسية.'
    },
    {
      id: 'surveys',
      title: 'إدارة الاستطلاعات',
      description: 'نظام متقدم لإنشاء وإدارة استطلاعات تفاعلية مع تحليل النتائج والإحصائيات',
      icon: BarChart3,
      color: 'bg-teal-500',
      image: realSurveys,
      steps: [
        {
          title: 'إنشاء استطلاعات تفاعلية ومتنوعة',
          description: 'تصميم استطلاعات شاملة لجمع آراء الأهالي حول مختلف الجوانب التعليمية',
          details: [
            'إنشاء استطلاع جديد بعنوان جذاب ووصف مفصل للهدف',
            'إضافة أسئلة متنوعة: اختيار متعدد، نعم/لا، تقييم بالنجوم',
            'تخصيص خيارات الإجابة لكل سؤال حسب الحاجة والهدف',
            'تحديد مدة الاستطلاع وتاريخ انتهاء صلاحيته'
          ]
        }
      ],
      audioText: 'نظام إدارة الاستطلاعات يوفر أداة قوية لفهم آراء الأهالي وتوقعاتهم.'
    },
    {
      id: 'reports',
      title: 'التقارير الشاملة للطلاب',
      description: 'نظام متقدم لإنشاء وإرسال تقارير تفصيلية شاملة عن كل طالب لأولياء الأمور',
      icon: FileText,
      color: 'bg-rose-500',
      image: realStudentReports,
      steps: [
        {
          title: 'إنشاء تقرير شامل للطالب',
          description: 'تجميع جميع بيانات الطالب في تقرير واحد متكامل وشامل',
          details: [
            'معلومات الطالب الأساسية: الاسم، العمر، الفصل، الصورة',
            'سجل الحضور والغياب مع نسب مئوية ورسوم بيانية',
            'تقييم الواجبات والأنشطة مع الدرجات والملاحظات',
            'المكافآت والإنجازات المحققة خلال فترة التقرير'
          ]
        }
      ],
      audioText: 'نظام التقارير الشاملة يوفر للأهالي صورة كاملة عن تطور ونمو أطفالهم في الروضة.'
    }
  ];

  // Text to Speech function
  const playTextToSpeech = async (text: string) => {
    setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
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
        throw new Error('المتصفح لا يدعم تقنية تحويل النص إلى كلام');
      }
    } catch (error) {
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isLoading: false,
        error: 'حدث خطأ في تشغيل الصوت'
      }));
    }
  };

  const stopAudio = () => {
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
    setAudioState(prev => ({ 
      ...prev, 
      isPlaying: false, 
      currentAudio: null 
    }));
  };

  const currentSection = guideData.find(section => section.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <School className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">دليل المعلم التفاعلي</h1>
                  <p className="text-sm text-gray-500">SmartKindy - نظام إدارة الحضانات</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open('/', '_blank')}
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                الصفحة الرئيسية
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
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Navigation Tabs */}
          <div className="bg-white rounded-lg shadow-sm p-2 overflow-x-auto">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-11 gap-1 min-w-max">
              <TabsTrigger value="overview" className="text-xs whitespace-nowrap">
                نظرة عامة
              </TabsTrigger>
              {guideData.map((section) => {
                const Icon = section.icon;
                return (
                  <TabsTrigger 
                    key={section.id} 
                    value={section.id}
                    className="flex flex-col items-center gap-1 text-xs p-2 whitespace-nowrap"
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
                  مرحباً بك في دليل المعلم الشامل والتفاعلي
                </CardTitle>
                <CardDescription className="text-blue-100">
                  هذا الدليل سيساعدك في إتقان جميع أدوات نظام SmartKindy لإدارة فصلك بكفاءة عالية ومهنية متميزة
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  <div className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-green-300" />
                    <span>صور حقيقية من النظام</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100">إجمالي الأقسام</p>
                      <p className="text-3xl font-bold">{guideData.length}</p>
                    </div>
                    <BookOpen className="h-12 w-12 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">الخطوات التفصيلية</p>
                      <p className="text-3xl font-bold">{guideData.reduce((total, section) => total + section.steps.length, 0)}</p>
                    </div>
                    <ClipboardList className="h-12 w-12 text-purple-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">الشروحات الصوتية</p>
                      <p className="text-3xl font-bold">{guideData.length}</p>
                    </div>
                    <Headphones className="h-12 w-12 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </div>

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

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-gray-600">
            <p>© 2024 SmartKindy - نظام إدارة الحضانات الذكي</p>
            <p className="text-sm">دليل المعلم التفاعلي - جميع الحقوق محفوظة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StandaloneTeacherGuide;