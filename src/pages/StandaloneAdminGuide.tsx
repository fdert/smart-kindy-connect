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
  Home,
  Building,
  UserCog,
  TrendingUp,
  CreditCard,
  GraduationCap,
  Phone
} from 'lucide-react';

// Import real system images
import realDashboard from '@/assets/real-dashboard.jpg';
import realStudents from '@/assets/real-students.jpg';
import realClasses from '@/assets/real-classes.jpg';
import realAttendance from '@/assets/real-attendance.jpg';
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

const StandaloneAdminGuide = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentAudio: null,
    isLoading: false,
    error: null
  });
  const [autoPlayEnabled, setAutoPlayEnabled] = useState(true);

  // Auto-play audio when tab changes
  useEffect(() => {
    if (autoPlayEnabled && activeTab !== 'overview') {
      const currentSection = guideData.find(section => section.id === activeTab);
      if (currentSection?.audioText) {
        // Add a small delay to allow the UI to render first
        setTimeout(() => {
          playTextToSpeech(currentSection.audioText || currentSection.description);
        }, 500);
      }
    }
  }, [activeTab, autoPlayEnabled]);

  // Auto-play welcome message on page load
  useEffect(() => {
    if (autoPlayEnabled) {
      setTimeout(() => {
        playTextToSpeech('مرحباً بك في دليل مدير الروضة التفاعلي الشامل لنظام SmartKindy. هذا الدليل سيساعدك في إتقان جميع أدوات إدارة الروضة بطريقة تفاعلية وممتعة مع شرح صوتي مفصل لكل قسم. ستتعلم كيفية إدارة المعلمين والطلاب والفصول والتقارير المالية وجميع جوانب العملية التعليمية والإدارية.');
      }, 1000);
    }
  }, []);

  const guideData: GuideSection[] = [
    {
      id: 'dashboard',
      title: 'لوحة تحكم مدير الروضة',
      description: 'مركز القيادة الرئيسي لإدارة جميع جوانب الروضة مع إحصائيات شاملة ومؤشرات الأداء',
      icon: Building,
      color: 'bg-blue-500',
      image: realDashboard,
      steps: [
        {
          title: 'مؤشرات الأداء الرئيسية للروضة',
          description: 'عرض شامل لجميع الإحصائيات الحيوية لإدارة الروضة بكفاءة',
          details: [
            'إجمالي عدد الطلاب المسجلين في الروضة مع تفاصيل كل فئة عمرية',
            'عدد المعلمين والموظفين النشطين مع تفاصيل التخصصات',
            'عدد الفصول الدراسية وسعة كل فصل ومعدل الإشغال',
            'معدل الحضور العام للروضة على مستوى جميع الفصول',
            'الإيرادات الشهرية والسنوية مع مقارنات الفترات السابقة',
            'عدد الأنشطة والفعاليات المنجزة والمخططة'
          ],
          tips: [
            'مراجعة المؤشرات يومياً لضمان سير العمل بسلاسة',
            'استخدام الألوان التحليلية لفهم الوضع الحالي بسرعة',
            'تصدير التقارير الدورية لمشاركتها مع مجلس الإدارة'
          ]
        },
        {
          title: 'أدوات الإدارة السريعة',
          description: 'الوصول المباشر لأهم الوظائف الإدارية اليومية',
          details: [
            'إدارة شاملة لملفات جميع الطلاب وأولياء الأمور',
            'إدارة المعلمين والموظفين وتوزيع المهام',
            'تنظيم الفصول الدراسية وتوزيع الطلاب',
            'مراجعة وإعتماد التقارير المالية والإدارية',
            'إدارة الفعاليات والأنشطة الخاصة',
            'نظام الرسائل والتواصل مع المعلمين والأهالي'
          ]
        }
      ],
      audioText: 'مرحباً بك في دليل لوحة تحكم مدير الروضة. هذه اللوحة هي مركز القيادة الرئيسي للروضة، حيث يمكنك متابعة جميع جوانب العملية التعليمية والإدارية من مكان واحد.'
    },
    {
      id: 'teachers',
      title: 'إدارة المعلمين والموظفين',
      description: 'نظام شامل لإدارة الكادر التعليمي والإداري مع متابعة الأداء والتطوير المهني',
      icon: UserCog,
      color: 'bg-green-500',
      image: realStudents,
      steps: [
        {
          title: 'إدارة ملفات المعلمين والموظفين',
          description: 'نظام متكامل لإدارة بيانات الكادر التعليمي والإداري',
          details: [
            'ملفات شخصية شاملة لكل معلم مع السيرة الذاتية والمؤهلات',
            'تتبع الحضور والانصراف للمعلمين والموظفين',
            'توزيع الفصول والمواد على المعلمين',
            'تقييم الأداء الدوري مع التقارير التفصيلية',
            'إدارة الرواتب والحوافز والمكافآت',
            'برامج التدريب والتطوير المهني'
          ],
          tips: [
            'مراجعة تقارير الأداء شهرياً لضمان جودة التعليم',
            'تنظيم ورش تدريبية دورية لتطوير المهارات',
            'استخدام نظام الحوافز لتشجيع الأداء المتميز'
          ]
        }
      ],
      audioText: 'إدارة المعلمين والموظفين هي حجر الأساس في نجاح أي مؤسسة تعليمية. من هنا يمكنك إدارة الكادر التعليمي بكفاءة عالية.'
    },
    {
      id: 'students-management',
      title: 'إدارة الطلاب الشاملة',
      description: 'نظام متطور لإدارة جميع شؤون الطلاب من التسجيل حتى التخرج',
      icon: Users,
      color: 'bg-purple-500',
      image: realStudents,
      steps: [
        {
          title: 'إدارة التسجيل والقبول',
          description: 'نظام متكامل لقبول وتسجيل الطلاب الجدد',
          details: [
            'استقبال طلبات التسجيل الإلكترونية من أولياء الأمور',
            'مراجعة واعتماد طلبات القبول حسب المعايير المحددة',
            'توزيع الطلاب على الفصول حسب العمر والمستوى',
            'إدارة قوائم الانتظار والأولويات',
            'تحديد الرسوم الدراسية والخطط المالية',
            'إرسال رسائل القبول والرفض للأهالي'
          ]
        },
        {
          title: 'متابعة التطور الأكاديمي والسلوكي',
          description: 'مراقبة شاملة لتطور كل طالب في جميع الجوانب',
          details: [
            'تقارير الأداء الأكاديمي لكل طالب',
            'متابعة السلوك والانضباط اليومي',
            'تقييم المهارات الاجتماعية والحركية',
            'برامج الدعم الإضافي للطلاب المحتاجين',
            'التواصل المستمر مع أولياء الأمور',
            'خطط التطوير الفردية لكل طالب'
          ]
        }
      ],
      audioText: 'إدارة الطلاب الشاملة تتيح لك متابعة كل طالب من لحظة التسجيل وحتى تخرجه من الروضة، مع ضمان حصوله على أفضل تعليم ورعاية.'
    },
    {
      id: 'classes',
      title: 'تنظيم الفصول والمناهج',
      description: 'إدارة متقدمة للفصول الدراسية والمناهج التعليمية وتوزيع الموارد',
      icon: School,
      color: 'bg-orange-500',
      image: realClasses,
      steps: [
        {
          title: 'تنظيم الفصول الدراسية',
          description: 'إدارة فعالة للفصول وضمان البيئة التعليمية المثلى',
          details: [
            'تحديد سعة كل فصل وفقاً للمعايير التعليمية',
            'توزيع الطلاب على الفصول حسب العمر والمستوى',
            'تخصيص المعلمين والمساعدين لكل فصل',
            'ترتيب الجداول الزمنية والأنشطة اليومية',
            'إدارة الموارد والأدوات التعليمية',
            'متابعة نظافة وسلامة الفصول'
          ]
        },
        {
          title: 'إدارة المناهج والأنشطة',
          description: 'تطوير وتنفيذ مناهج تعليمية متميزة',
          details: [
            'وضع الخطط الدراسية السنوية والفصلية',
            'تطوير الأنشطة التعليمية والترفيهية',
            'تقييم فعالية المناهج والأنشطة',
            'تدريب المعلمين على المناهج الجديدة',
            'توفير المواد والأدوات اللازمة',
            'متابعة تنفيذ الخطط الدراسية'
          ]
        }
      ],
      audioText: 'تنظيم الفصول والمناهج يضمن حصول كل طالب على تعليم عالي الجودة في بيئة آمنة ومحفزة للتعلم والإبداع.'
    },
    {
      id: 'financial',
      title: 'النظام المالي والمحاسبي',
      description: 'إدارة شاملة للشؤون المالية والمحاسبية مع تقارير مفصلة ومتابعة الإيرادات والمصروفات',
      icon: CreditCard,
      color: 'bg-emerald-500',
      image: realStudentReports,
      steps: [
        {
          title: 'إدارة الرسوم والمدفوعات',
          description: 'نظام متطور لإدارة رسوم الطلاب والمتابعة المالية',
          details: [
            'تحديد هيكل الرسوم لكل مستوى وبرنامج',
            'متابعة دفعات الطلاب والمستحقات المتأخرة',
            'إصدار الفواتير والإيصالات الإلكترونية',
            'إدارة الخصومات والمنح الدراسية',
            'تقارير الإيرادات اليومية والشهرية والسنوية',
            'ربط النظام مع البنوك لتسهيل الدفعات الإلكترونية'
          ]
        },
        {
          title: 'إدارة المصروفات والميزانية',
          description: 'تخطيط ومتابعة المصروفات التشغيلية والاستثمارية',
          details: [
            'وضع الميزانية السنوية ومتابعة تنفيذها',
            'إدارة رواتب المعلمين والموظفين',
            'مصروفات الصيانة والتطوير والمرافق',
            'شراء المواد التعليمية والأدوات',
            'تقارير الربحية وتحليل التكاليف',
            'التخطيط المالي للمشاريع المستقبلية'
          ]
        }
      ],
      audioText: 'النظام المالي والمحاسبي يوفر إدارة شاملة ودقيقة لجميع الشؤون المالية للروضة مع ضمان الشفافية والمتابعة المستمرة.'
    },
    {
      id: 'reports',
      title: 'التقارير والتحليلات الإدارية',
      description: 'مجموعة شاملة من التقارير التحليلية لدعم اتخاذ القرارات الإدارية الذكية',
      icon: BarChart3,
      color: 'bg-indigo-500',
      image: realStudentReports,
      steps: [
        {
          title: 'تقارير الأداء التعليمي',
          description: 'تحليل شامل لمستوى الأداء التعليمي في الروضة',
          details: [
            'تقارير أداء الطلاب الفردية والجماعية',
            'تحليل معدلات النجاح والتطور بالفصول',
            'تقييم أداء المعلمين وفعالية التدريس',
            'مقارنة الأداء عبر الفترات الزمنية المختلفة',
            'تحديد نقاط القوة والتحسين المطلوبة',
            'تقارير مصورة ومرئية سهلة الفهم'
          ]
        },
        {
          title: 'التقارير المالية والإدارية',
          description: 'تحليل مالي وإداري شامل لدعم القرارات الاستراتيجية',
          details: [
            'قوائم الدخل والمصروفات الشهرية والسنوية',
            'تحليل الربحية والعائد على الاستثمار',
            'تقارير الحضور والغياب للطلاب والمعلمين',
            'استخدام المرافق والموارد التعليمية',
            'تقارير رضا أولياء الأمور والطلاب',
            'مؤشرات الأداء الرئيسية للروضة'
          ]
        }
      ],
      audioText: 'التقارير والتحليلات الإدارية توفر نظرة شاملة وعميقة على أداء الروضة في جميع الجوانب، مما يساعد في اتخاذ قرارات مدروسة وذكية.'
    },
    {
      id: 'communication',
      title: 'نظام التواصل المتطور',
      description: 'منصة شاملة للتواصل مع المعلمين وأولياء الأمور والطلاب عبر قنوات متعددة',
      icon: MessageSquare,
      color: 'bg-pink-500',
      image: realPermissions,
      steps: [
        {
          title: 'التواصل مع أولياء الأمور',
          description: 'قنوات تواصل متنوعة وفعالة مع الأهالي',
          details: [
            'إرسال الرسائل النصية والإشعارات الفورية',
            'تطبيق الواتساب للتواصل السريع والمباشر',
            'النشرات الإخبارية والإعلانات الهامة',
            'دعوات الفعاليات واجتماعات أولياء الأمور',
            'تقارير التطور اليومية والأسبوعية للطلاب',
            'استطلاعات الرأي وجمع الآراء والمقترحات'
          ]
        },
        {
          title: 'التواصل الداخلي مع المعلمين',
          description: 'نظام تواصل داخلي فعال مع الكادر التعليمي',
          details: [
            'منصة رسائل داخلية للتواصل السريع',
            'مشاركة التعليمات والقرارات الإدارية',
            'تنسيق الأنشطة والفعاليات المدرسية',
            'نظام الإشعارات للمهام والمواعيد المهمة',
            'مجموعات عمل للمشاريع المشتركة',
            'تبادل الخبرات والممارسات التعليمية الناجحة'
          ]
        }
      ],
      audioText: 'نظام التواصل المتطور يضمن تواصلاً فعالاً ومستمراً مع جميع أطراف العملية التعليمية، مما يخلق بيئة تعاونية إيجابية.'
    },
    {
      id: 'security',
      title: 'الأمان والحماية',
      description: 'نظام أمان متقدم لحماية بيانات الطلاب والمعلمين وضمان الخصوصية والامتثال للمعايير',
      icon: Shield,
      color: 'bg-red-500',
      image: realPermissions,
      steps: [
        {
          title: 'حماية البيانات والخصوصية',
          description: 'أعلى معايير الأمان لحماية المعلومات الحساسة',
          details: [
            'تشفير جميع البيانات الحساسة والشخصية',
            'نظام صلاحيات متدرج للوصول للمعلومات',
            'مراقبة العمليات وتسجيل جميع الأنشطة',
            'نسخ احتياطية دورية وآمنة للبيانات',
            'حماية من الفيروسات والهجمات الإلكترونية',
            'الامتثال لقوانين حماية البيانات المحلية والدولية'
          ]
        },
        {
          title: 'الأمان الفيزيائي للروضة',
          description: 'إجراءات أمنية شاملة لضمان سلامة الطلاب والمعلمين',
          details: [
            'نظام دخول وخروج آمن للطلاب والزوار',
            'كاميرات مراقبة في الأماكن العامة',
            'إجراءات الطوارئ وخطط الإخلاء',
            'متابعة صحة وسلامة البيئة التعليمية',
            'تدريب المعلمين على إجراءات الأمان',
            'التواصل السريع مع الجهات الأمنية عند الحاجة'
          ]
        }
      ],
      audioText: 'الأمان والحماية أولوية قصوى في النظام، حيث نوفر أعلى معايير الحماية للبيانات والطلاب والمعلمين.'
    },
    {
      id: 'settings',
      title: 'إعدادات النظام المتقدمة',
      description: 'تخصيص شامل للنظام ليتناسب مع احتياجات وسياسات الروضة الخاصة',
      icon: Settings,
      color: 'bg-gray-500',
      image: realAiAssistant,
      steps: [
        {
          title: 'إعدادات الروضة العامة',
          description: 'تخصيص المعلومات الأساسية والسياسات العامة',
          details: [
            'معلومات الروضة الأساسية (الاسم، العنوان، الهاتف)',
            'الشعار والهوية البصرية للروضة',
            'أوقات العمل والعطل الرسمية',
            'سياسات القبول والتسجيل',
            'قواعد السلوك والانضباط',
            'أنظمة التقييم والدرجات'
          ]
        },
        {
          title: 'إعدادات المستخدمين والصلاحيات',
          description: 'إدارة حسابات المستخدمين ومستويات الوصول',
          details: [
            'إنشاء وإدارة حسابات المعلمين والموظفين',
            'تحديد صلاحيات الوصول لكل مستخدم',
            'إعدادات الأمان وكلمات المرور',
            'مراقبة نشاط المستخدمين وتسجيل العمليات',
            'إعدادات الإشعارات والتنبيهات',
            'النسخ الاحتياطية وإعادة الاستعادة'
          ]
        }
      ],
      audioText: 'إعدادات النظام المتقدمة تتيح لك تخصيص النظام بالكامل ليتناسب مع احتياجات وسياسات روضتك الخاصة.'
    }
  ];

  const playTextToSpeech = async (text: string) => {
    try {
      setAudioState(prev => ({ ...prev, isLoading: true, error: null }));
      
      // Stop any currently playing audio
      if (audioState.currentAudio) {
        audioState.currentAudio.pause();
        audioState.currentAudio.currentTime = 0;
      }

      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': 'sk_5c2c7b4f7e8d4a0b8f3e6d1a9c2e4f7b8a1d3c5e7f9b2a4c6e8d1a3b5c7e9f1b3'
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error('فشل في تحويل النص إلى صوت');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onplay = () => {
        setAudioState(prev => ({ ...prev, isPlaying: true, isLoading: false }));
      };
      
      audio.onended = () => {
        setAudioState(prev => ({ ...prev, isPlaying: false, currentAudio: null }));
        URL.revokeObjectURL(audioUrl);
      };
      
      audio.onerror = () => {
        setAudioState(prev => ({ 
          ...prev, 
          isPlaying: false, 
          isLoading: false, 
          error: 'خطأ في تشغيل الصوت',
          currentAudio: null 
        }));
        URL.revokeObjectURL(audioUrl);
      };

      setAudioState(prev => ({ ...prev, currentAudio: audio }));
      await audio.play();
      
    } catch (error) {
      console.error('Text-to-speech error:', error);
      setAudioState(prev => ({ 
        ...prev, 
        isPlaying: false, 
        isLoading: false, 
        error: 'فشل في تشغيل الصوت',
        currentAudio: null 
      }));
    }
  };

  const stopAudio = () => {
    if (audioState.currentAudio) {
      audioState.currentAudio.pause();
      audioState.currentAudio.currentTime = 0;
      setAudioState(prev => ({ ...prev, isPlaying: false, currentAudio: null }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Enhanced Header */}
      <div className="bg-white shadow-lg border-b-4 border-gradient-to-r from-blue-500 to-purple-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="text-center lg:text-right">
              <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                🏫 دليل مدير الروضة التفاعلي
              </h1>
              <p className="text-lg text-gray-600 mt-2">
                الدليل الشامل لإتقان جميع أدوات إدارة الروضة في نظام SmartKindy
              </p>
              <div className="flex items-center justify-center lg:justify-start gap-2 mt-3">
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Headphones className="h-3 w-3" />
                  شرح صوتي تفاعلي
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Image className="h-3 w-3" />
                  صور حية من النظام
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <PlayCircle className="h-3 w-3" />
                  تعلم تفاعلي
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoPlayEnabled(!autoPlayEnabled)}
                className={`flex items-center gap-2 ${autoPlayEnabled ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
              >
                {autoPlayEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                {autoPlayEnabled ? 'إيقاف التشغيل التلقائي' : 'تفعيل التشغيل التلقائي'}
              </Button>
              
              {audioState.isPlaying ? (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={stopAudio}
                  className="flex items-center gap-2"
                  disabled={audioState.isLoading}
                >
                  <Pause className="h-4 w-4" />
                  إيقاف الصوت
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const currentSection = guideData.find(section => section.id === activeTab);
                    if (currentSection?.audioText) {
                      playTextToSpeech(currentSection.audioText || currentSection.description);
                    } else if (activeTab === 'overview') {
                      playTextToSpeech('مرحباً بك في دليل مدير الروضة التفاعلي الشامل لنظام SmartKindy.');
                    }
                  }}
                  className="flex items-center gap-2"
                  disabled={audioState.isLoading}
                >
                  {audioState.isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  تشغيل الشرح الصوتي
                </Button>
              )}
            </div>
          </div>
          
          {audioState.error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-center">
              {audioState.error}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Section Navigation Buttons */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">اختر القسم الذي تريد تعلمه:</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Button
                variant={activeTab === 'overview' ? "default" : "outline"}
                size="lg"
                onClick={() => setActiveTab('overview')}
                className={`flex flex-col items-center gap-2 h-auto py-4 px-6 ${
                  activeTab === 'overview' 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <Home className="h-8 w-8" />
                <span className="text-sm font-medium">نظرة عامة</span>
              </Button>
              
              {guideData.map((section) => {
                const Icon = section.icon;
                const isActive = activeTab === section.id;
                const gradientClass = isActive ? `bg-gradient-to-r ${section.color.replace('bg-', 'from-')}-400 to-${section.color.replace('bg-', '')}-600 text-white` : 'hover:bg-gray-50';
                
                return (
                  <Button
                    key={section.id}
                    variant={isActive ? "default" : "outline"}
                    size="lg"
                    onClick={() => setActiveTab(section.id)}
                    className={`flex flex-col items-center gap-2 h-auto py-4 px-6 ${gradientClass} transition-all duration-200`}
                  >
                    <Icon className="h-8 w-8" />
                    <span className="text-sm font-medium text-center leading-tight">{section.title}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-l-4 border-blue-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-blue-700">
                    <Building className="h-8 w-8" />
                    مرحباً بك في دليل مدير الروضة
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed mb-4">
                    هذا الدليل التفاعلي مصمم خصيصاً لمساعدتك في إتقان جميع أدوات إدارة الروضة في نظام SmartKindy. 
                    ستتعلم كيفية إدارة المعلمين والطلاب والشؤون المالية والتقارير بطريقة فعالة ومتطورة.
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      شرح صوتي تفاعلي لكل قسم
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      صور حية من النظام الفعلي
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      خطوات مفصلة وسهلة التطبيق
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      نصائح وأفضل الممارسات الإدارية
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-l-4 border-green-500">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-green-700">
                    <Target className="h-8 w-8" />
                    ما ستتعلمه في هذا الدليل
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      'إدارة لوحة التحكم الرئيسية للروضة',
                      'تنظيم وإدارة المعلمين والموظفين',
                      'إدارة شؤون الطلاب من التسجيل للتخرج',
                      'تنظيم الفصول والمناهج التعليمية',
                      'النظام المالي والمحاسبي المتطور',
                      'التقارير والتحليلات الإدارية الذكية',
                      'أنظمة التواصل مع الأهالي والمعلمين',
                      'الأمان والحماية المتقدمة'
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                        <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-600">{index + 1}</span>
                        </div>
                        {item}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-l-4 border-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-purple-700">
                  <Lightbulb className="h-8 w-8" />
                  كيفية الاستفادة القصوى من هذا الدليل
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <PlayCircle className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-800 mb-2">استمع للشرح</h4>
                    <p className="text-sm text-gray-600">فعّل التشغيل التلقائي واستمع للشرح الصوتي لكل قسم</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <Image className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-800 mb-2">تفحص الصور</h4>
                    <p className="text-sm text-gray-600">اطلع على الصور الحية من النظام لفهم أفضل</p>
                  </div>
                  <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                    <CheckCircle2 className="h-12 w-12 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-semibold text-gray-800 mb-2">طبق ما تعلمته</h4>
                    <p className="text-sm text-gray-600">اتبع الخطوات المفصلة وطبقها في النظام الفعلي</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Guide Sections */}
          {guideData.map((section) => (
            <TabsContent key={section.id} value={section.id} className="space-y-6">
              {/* Back to Home Button */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setActiveTab('overview')}
                  className="flex items-center gap-2 bg-white hover:bg-gray-50"
                >
                  <ArrowLeft className="h-5 w-5" />
                  العودة إلى النظرة العامة
                </Button>
              </div>

              <Card className={`border-l-4 ${section.color.replace('bg-', 'border-')} shadow-lg`}>
                <CardHeader className={`${section.color.replace('bg-', 'bg-')}/10`}>
                  <CardTitle className="flex items-center gap-4 text-2xl">
                    <section.icon className={`h-10 w-10 ${section.color.replace('bg-', 'text-')}`} />
                    {section.title}
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-700">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                
                {section.image && (
                  <div className="px-6">
                    <img 
                      src={section.image} 
                      alt={section.title}
                      className="w-full h-64 object-cover rounded-lg shadow-md"
                    />
                  </div>
                )}

                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="space-y-4">
                    {section.steps.map((step, stepIndex) => (
                      <AccordionItem 
                        key={stepIndex} 
                        value={`step-${stepIndex}`}
                        className="border border-gray-200 rounded-lg px-4"
                      >
                        <AccordionTrigger className="text-right hover:no-underline">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full ${section.color} text-white flex items-center justify-center text-sm font-bold`}>
                              {stepIndex + 1}
                            </div>
                            <div className="text-right">
                              <h4 className="text-lg font-semibold">{step.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{step.description}</p>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pt-4">
                          <div className="space-y-4">
                            <div>
                              <h5 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                <ClipboardList className="h-4 w-4" />
                                الخطوات التفصيلية:
                              </h5>
                              <ul className="space-y-2">
                                {step.details.map((detail, detailIndex) => (
                                  <li key={detailIndex} className="flex items-start gap-3 text-gray-700">
                                    <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <span>{detail}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                            
                            {step.tips && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h5 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                  <Lightbulb className="h-4 w-4" />
                                  نصائح مهمة:
                                </h5>
                                <ul className="space-y-2">
                                  {step.tips.map((tip, tipIndex) => (
                                    <li key={tipIndex} className="flex items-start gap-3 text-yellow-700">
                                      <Star className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                                      <span>{tip}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default StandaloneAdminGuide;