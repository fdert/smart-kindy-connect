import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VisitorTracker } from "@/components/VisitorTracker";
import { 
  ArrowRight, 
  ArrowLeft, 
  Users, 
  Calendar, 
  Star, 
  MessageCircle, 
  Camera, 
  FileText,
  Settings,
  UserCheck,
  BookOpen,
  Play,
  CheckCircle,
  Shield,
  Clock,
  Smartphone,
  Globe,
  Heart,
  Zap,
  Award,
  Phone,
  Mail,
  MapPin,
  Smile,
  Sparkles,
  Baby,
  Palette
} from "lucide-react";

// استيراد الصور التوضيحية
import tourDashboard from "@/assets/tour-dashboard.jpg";
import tourAttendance from "@/assets/tour-attendance.jpg";
import tourRewards from "@/assets/tour-rewards.jpg";
import tourWhatsapp from "@/assets/tour-whatsapp.jpg";
import tourMedia from "@/assets/tour-media.jpg";
import tourReports from "@/assets/tour-reports.jpg";

const smartKindyLogo = "/lovable-uploads/46a447fc-00fa-49c5-b6ae-3f7b46fc4691.png";

const StandaloneTour = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'parent'>('admin');

  const adminSteps = [
    {
      title: "لوحة التحكم الرئيسية المتطورة",
      description: "احصل على رؤية شاملة لجميع أنشطة حضانتك في مكان واحد مع تحليلات ذكية وإحصائيات متقدمة تساعدك في اتخاذ القرارات الصحيحة.",
      icon: Settings,
      features: [
        "إحصائيات شاملة ومفصلة عن الطلاب والحضور",
        "تحديثات لحظية عن جميع الأنشطة والفعاليات", 
        "تنبيهات ذكية ومهام معلقة مع إشعارات متقدمة",
        "لوحة معلومات تفاعلية مع رسوم بيانية"
      ],
      image: tourDashboard
    },
    {
      title: "إدارة الطلاب الذكية",
      description: "نظام إدارة متكامل للطلاب مع قاعدة بيانات شاملة وإمكانيات تتبع متقدمة لكل طالب مع تنظيم فصول احترافي.",
      icon: Users,
      features: [
        "ملفات شخصية كاملة لكل طالب مع الصور",
        "ربط تلقائي وآمن مع أولياء الأمور",
        "تتبع المعلومات الطبية والحساسيات والأدوية",
        "إدارة الفصول والمجموعات بمرونة عالية"
      ],
      image: tourDashboard
    },
    {
      title: "نظام الحضور الذكي والمتقدم",
      description: "تقنية متطورة لتسجيل الحضور والانصراف مع إشعارات فورية وتقارير دقيقة تساعدك في متابعة انتظام الطلاب.",
      icon: Calendar,
      features: [
        "تسجيل سريع وبديهي للحضور والانصراف",
        "إشعارات تلقائية فورية عبر واتساب للأولياء",
        "تقارير حضور مفصلة مع إحصائيات شهرية",
        "إدارة الإجازات والغياب مع أسباب مبررة"
      ],
      image: tourAttendance
    },
    {
      title: "نظام التحفيز والمكافآت التفاعلي",
      description: "نظام تحفيزي شامل مصمم خصيصاً لتشجيع الطلاب وتعزيز السلوك الإيجابي مع نظام نقاط ومكافآت قابل للتخصيص.",
      icon: Star,
      features: [
        "منح النجوم والأوسمة والشهادات للطلاب المتميزين",
        "لوحة شرف تفاعلية تحفز المنافسة الإيجابية",
        "مكافآت قابلة للتخصيص حسب احتياجات الحضانة",
        "تقارير تفصيلية عن التقدم والإنجازات"
      ],
      image: tourRewards
    },
    {
      title: "الألبوم اليومي والذكريات",
      description: "نظام أمن ومتطور لمشاركة صور وأنشطة الطلاب مع أولياء الأمور بطريقة منظمة وآمنة مع حماية الخصوصية.",
      icon: Camera,
      features: [
        "رفع وتنظيم صور الأنشطة اليومية بسهولة",
        "روابط آمنة ومؤقتة خاصة بكل ولي أمر",
        "تصنيف ذكي للصور حسب الطالب والنشاط",
        "أرشيف رقمي للذكريات الجميلة مع إمكانية البحث"
      ],
      image: tourMedia
    },
    {
      title: "تكامل واتساب المتقدم والاحترافي",
      description: "تواصل مباشر وتلقائي مع أولياء الأمور عبر واتساب مع قوالب رسائل احترافية وإشعارات مخصصة لكل ولي أمر.",
      icon: MessageCircle,
      features: [
        "إرسال تلقائي لجميع إشعارات الحضور والانصراف",
        "قوالب رسائل احترافية قابلة للتخصيص الكامل",
        "إشعارات الأنشطة والفعاليات مع صور توضيحية",
        "تحديثات دورية عن تقدم الطالب وإنجازاته"
      ],
      image: tourWhatsapp
    },
    {
      title: "التقارير الذكية والتحليلات المتقدمة",
      description: "نظام تقارير شامل يوفر رؤى عميقة وتحليلات متقدمة لجميع جوانب إدارة الحضانة مع إمكانيات تصدير متنوعة.",
      icon: FileText,
      features: [
        "تقارير شاملة للحضور والغياب مع الاتجاهات",
        "تحليلات أداء وتقدم الطلاب مع الرسوم البيانية",
        "إحصائيات مالية ومحاسبية متقدمة",
        "تصدير بصيغ متعددة (PDF, Excel, Word) مع تخصيص التصميم"
      ],
      image: tourReports
    }
  ];

  const teacherSteps = [
    {
      title: "واجهة المعلم البديهية والمريحة",
      description: "واجهة مصممة خصيصاً لتسهل على المعلمين إدارة فصولهم وطلابهم بأقل جهد وأقصى فعالية.",
      icon: BookOpen,
      features: [
        "عرض واضح ومنظم للطلاب المخصصين",
        "تسجيل سريع للحضور بنقرة واحدة",
        "متابعة سهلة للأنشطة اليومية",
        "تواصل مباشر مع الإدارة والزملاء"
      ],
      image: tourDashboard
    },
    {
      title: "تسجيل الحضور السريع والذكي",
      description: "نظام متطور لتسجيل حضور وانصراف الطلاب مع إشعارات تلقائية وإمكانية إضافة ملاحظات مهمة.",
      icon: Calendar,
      features: [
        "تسجيل فوري وسهل للحضور والانصراف",
        "عرض شامل لحالة جميع الطلاب",
        "إضافة ملاحظات وتعليقات خاصة",
        "إرسال إشعارات فورية لأولياء الأمور"
      ],
      image: tourAttendance
    },
    {
      title: "نظام التحفيز التفاعلي للطلاب",
      description: "أدوات تحفيزية متنوعة لتشجيع الطلاب ومكافأتهم على السلوك الإيجابي والتميز الأكاديمي.",
      icon: Star,
      features: [
        "منح فوري للنجوم والأوسمة للطلاب",
        "اختيار من مكتبة واسعة من المكافآت",
        "متابعة تقدم وإنجازات كل طالب",
        "تحفيز المشاركة الإيجابية في الأنشطة"
      ],
      image: tourRewards
    },
    {
      title: "توثيق الأنشطة بالصور والفيديو",
      description: "أدوات سهلة لالتقاط ومشاركة أجمل لحظات الطلاب مع أولياء الأمور بطريقة آمنة.",
      icon: Camera,
      features: [
        "رفع سريع لصور الأنشطة اليومية",
        "إضافة وصف وتعليقات للأنشطة",
        "مشاركة فورية وآمنة مع الأولياء",
        "إنشاء ألبومات ذكريات منظمة"
      ],
      image: tourMedia
    }
  ];

  const parentSteps = [
    {
      title: "متابعة شاملة لطفلك على مدار الساعة",
      description: "تطبيق متكامل يمنحك رؤية كاملة لجميع أنشطة وتطور طفلك في الحضانة مع تحديثات لحظية.",
      icon: UserCheck,
      features: [
        "معلومات تفصيلية وشاملة عن طفلك",
        "تتبع دقيق لحالة الحضور اليومية",
        "عرض جميع النجوم والإنجازات المكتسبة",
        "متابعة الأنشطة والصور اليومية بالتفصيل"
      ],
      image: tourDashboard
    },
    {
      title: "إشعارات واتساب الفورية والمخصصة",
      description: "تلقي إشعارات فورية ومفصلة عن جميع أنشطة طفلك مع تحديثات منتظمة عن تقدمه.",
      icon: MessageCircle,
      features: [
        "إشعار فوري بوصول الطفل للحضانة",
        "إشعار تلقائي بانصراف الطفل مع الوقت",
        "تحديثات مفصلة عن الأنشطة والفعاليات",
        "تقارير أسبوعية شاملة عن التقدم والإنجازات"
      ],
      image: tourWhatsapp
    },
    {
      title: "ألبوم الذكريات الشخصي والآمن",
      description: "استقبال وحفظ صور طفلك وأنشطته اليومية مع نظام أمان متقدم وإمكانيات تنظيم رائعة.",
      icon: Camera,
      features: [
        "صور يومية عالية الجودة لأنشطة طفلك",
        "روابط آمنة ومؤقتة لحماية الخصوصية",
        "إمكانية تحميل وحفظ جميع الصور",
        "أرشيف منظم للذكريات الجميلة"
      ],
      image: tourMedia
    },
    {
      title: "تتبع متقدم لتقدم ونمو طفلك",
      description: "رؤية شاملة لتطور طفلك وإنجازاته مع تقارير مفصلة ومقارنات زمنية مفيدة.",
      icon: Star,
      features: [
        "إحصائيات مفصلة للنجوم والنقاط المكتسبة",
        "عرض جميع الإنجازات والأوسمة",
        "تقارير شهرية شاملة عن التقدم",
        "رسوم بيانية لتتبع الأداء عبر الوقت"
      ],
      image: tourRewards
    }
  ];

  const getCurrentSteps = () => {
    switch (selectedRole) {
      case 'admin': return adminSteps;
      case 'teacher': return teacherSteps;
      case 'parent': return parentSteps;
      default: return adminSteps;
    }
  };

  const steps = getCurrentSteps();
  const step = steps[currentStep];
  const StepIcon = step.icon;

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const switchRole = (role: 'admin' | 'teacher' | 'parent') => {
    setSelectedRole(role);
    setCurrentStep(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-purple-50 relative overflow-hidden">
      {/* تتبع الزوار */}
      <VisitorTracker pageUrl="/standalone-tour" />
      
      {/* عناصر زخرفية للأطفال */}
      <div className="absolute top-10 left-10 animate-bounce">
        <div className="w-8 h-8 bg-yellow-300 rounded-full opacity-70"></div>
      </div>
      <div className="absolute top-20 right-20 animate-pulse">
        <Star className="h-6 w-6 text-pink-400" />
      </div>
      <div className="absolute top-40 left-32 animate-bounce delay-1000">
        <Heart className="h-5 w-5 text-red-400" />
      </div>
      <div className="absolute bottom-32 right-16 animate-pulse delay-500">
        <Sparkles className="h-7 w-7 text-purple-400" />
      </div>
      <div className="absolute bottom-20 left-20 animate-bounce delay-700">
        <div className="w-6 h-6 bg-green-300 rounded-full opacity-60"></div>
      </div>
      
      {/* الشريط العلوي المطور للأطفال */}
      <header className="bg-gradient-to-r from-pink-400 via-yellow-400 to-purple-400 shadow-lg relative">
        <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-reverse space-x-4">
              <div className="relative">
                <img 
                  src={smartKindyLogo} 
                  alt="SmartKindy Logo" 
                  className="h-14 w-14 object-contain drop-shadow-lg rounded-full border-4 border-white/30"
                />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white drop-shadow-md">🌟 SmartKindy</h1>
                <p className="text-sm text-white/90 font-medium">✨ نظام إدارة الحضانات الذكي والممتع</p>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <Badge className="px-4 py-2 text-sm bg-white/20 text-white border-white/30 backdrop-blur-sm">
                <Baby className="h-4 w-4 ml-2" />
                🎈 جولة تعريفية مجانية
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* المقدمة والعنوان الرئيسي المطور للأطفال */}
        <div className="text-center mb-16 relative">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy" 
                className="h-28 w-28 object-contain drop-shadow-2xl rounded-full border-4 border-white/50"
              />
              <div className="absolute -inset-6 bg-gradient-to-r from-pink-300 via-yellow-300 to-purple-300 rounded-full blur-xl opacity-40 animate-pulse"></div>
              <div className="absolute -top-2 -right-2">
                <Sparkles className="h-8 w-8 text-yellow-400 animate-spin" />
              </div>
              <div className="absolute -bottom-2 -left-2">
                <Heart className="h-6 w-6 text-pink-400 animate-bounce" />
              </div>
            </div>
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-6 leading-tight animate-pulse">
            🚀 اكتشف مستقبل إدارة الحضانات الممتع! 
          </h1>
          <p className="text-2xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed font-medium">
            🌈 SmartKindy هو النظام السحري الأول في المملكة العربية السعودية الذي يجمع بين التقنية المتطورة والمرح 
            لإدارة الحضانات والروضات بكفاءة عالية وأمان تام مع لمسة من البهجة والإبداع! ✨
          </p>
          <div className="flex justify-center space-x-reverse space-x-12 text-lg text-gray-600 mb-8">
            <div className="flex items-center bg-white/60 px-6 py-3 rounded-full shadow-lg backdrop-blur-sm">
              <Shield className="h-6 w-6 text-green-500 ml-3" />
              <span className="font-bold">🛡️ آمان مضمون 100%</span>
            </div>
            <div className="flex items-center bg-white/60 px-6 py-3 rounded-full shadow-lg backdrop-blur-sm">
              <Smile className="h-6 w-6 text-yellow-500 ml-3" />
              <span className="font-bold">😊 سهل ومُمتع</span>
            </div>
            <div className="flex items-center bg-white/60 px-6 py-3 rounded-full shadow-lg backdrop-blur-sm">
              <Award className="h-6 w-6 text-purple-500 ml-3" />
              <span className="font-bold">🏆 جودة عالمية</span>
            </div>
          </div>
          
          {/* شعار مخصص للأطفال */}
          <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-3xl p-6 mx-auto max-w-2xl border-4 border-dashed border-pink-300">
            <div className="flex items-center justify-center space-x-reverse space-x-4 text-2xl">
              <Baby className="text-pink-500" />
              <span className="font-bold text-purple-600">🎨 حيث يلتقي التعلم بالمرح والإبداع</span>
              <Palette className="text-yellow-500" />
            </div>
          </div>
        </div>

        {/* اختيار نوع المستخدم المطور */}
        <div className="flex justify-center mb-16">
          <div className="flex space-x-reverse space-x-6 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border-4 border-white/30">
            <Button
              variant={selectedRole === 'admin' ? 'default' : 'ghost'}
              onClick={() => switchRole('admin')}
              className={`flex items-center gap-3 px-8 py-6 text-xl rounded-2xl transition-all duration-500 font-bold ${
                selectedRole === 'admin' 
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg scale-105 border-4 border-white/50' 
                  : 'hover:bg-white/70 hover:scale-105 border-2 border-pink-200'
              }`}
              size="lg"
            >
              <Settings className="h-6 w-6" />
              👨‍💼 مدير الحضانة
            </Button>
            <Button
              variant={selectedRole === 'teacher' ? 'default' : 'ghost'}
              onClick={() => switchRole('teacher')}
              className={`flex items-center gap-3 px-8 py-6 text-xl rounded-2xl transition-all duration-500 font-bold ${
                selectedRole === 'teacher' 
                  ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg scale-105 border-4 border-white/50' 
                  : 'hover:bg-white/70 hover:scale-105 border-2 border-blue-200'
              }`}
              size="lg"
            >
              <BookOpen className="h-6 w-6" />
              👩‍🏫 المعلمة
            </Button>
            <Button
              variant={selectedRole === 'parent' ? 'default' : 'ghost'}
              onClick={() => switchRole('parent')}
              className={`flex items-center gap-3 px-8 py-6 text-xl rounded-2xl transition-all duration-500 font-bold ${
                selectedRole === 'parent' 
                  ? 'bg-gradient-to-r from-green-500 to-yellow-500 text-white shadow-lg scale-105 border-4 border-white/50' 
                  : 'hover:bg-white/70 hover:scale-105 border-2 border-green-200'
              }`}
              size="lg"
            >
              <UserCheck className="h-6 w-6" />
              👪 ولي الأمر
            </Button>
          </div>
        </div>

        {/* مؤشر التقدم المحسن والملون */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="text-right bg-white/60 p-4 rounded-2xl backdrop-blur-sm border-2 border-pink-200">
              <span className="text-2xl font-bold text-purple-600">
                🎯 الخطوة {currentStep + 1} من {steps.length}
              </span>
              <p className="text-lg text-pink-600 mt-1 font-medium">
                {selectedRole === 'admin' ? '👨‍💼 مميزات المدير الرائعة' : 
                 selectedRole === 'teacher' ? '👩‍🏫 مميزات المعلمة المبدعة' : '👪 مميزات ولي الأمر المهتم'}
              </p>
            </div>
            <div className="text-left bg-white/60 p-4 rounded-2xl backdrop-blur-sm border-2 border-green-200">
              <span className="text-2xl font-bold text-green-600">
                🎉 {Math.round(((currentStep + 1) / steps.length) * 100)}% مكتمل
              </span>
              <p className="text-lg text-blue-600 mt-1 font-medium">🚀 من الجولة التعريفية الممتعة</p>
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-gradient-to-r from-pink-200 to-purple-200 rounded-full h-4 shadow-inner">
              <div 
                className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 h-4 rounded-full transition-all duration-1000 ease-out shadow-lg relative overflow-hidden"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
              </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex space-x-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-3 w-3 text-yellow-400 animate-twinkle" style={{ animationDelay: `${i * 200}ms` }} />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* محتوى الخطوة الحالية */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl mb-12 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-purple-500 h-2"></div>
          <CardHeader className="text-center py-12">
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full shadow-xl">
                  <StepIcon className="h-10 w-10 text-white" />
                </div>
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full blur-xl opacity-40"></div>
              </div>
            </div>
            <CardTitle className="text-3xl mb-4 text-gray-900 font-bold">{step.title}</CardTitle>
            <CardDescription className="text-lg text-gray-700 max-w-4xl mx-auto leading-relaxed">
              {step.description}
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-12">
            {/* صورة توضيحية محسنة */}
            <div className="flex justify-center mb-12">
              <div className="relative group">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="h-64 w-64 object-contain drop-shadow-2xl rounded-2xl transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
                <div className="absolute -inset-6 bg-gradient-to-r from-blue-200 to-purple-200 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-opacity duration-300"></div>
              </div>
            </div>

            {/* المميزات المحسنة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {step.features.map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-start space-x-reverse space-x-4 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100/50 hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full flex-shrink-0">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-gray-800 font-medium leading-relaxed">{feature}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* أزرار التنقل المحسنة */}
        <div className="flex justify-between items-center mb-16">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-3 px-8 py-4 text-lg rounded-xl disabled:opacity-50 hover:shadow-lg transition-all duration-300"
            size="lg"
          >
            <ArrowRight className="h-5 w-5" />
            السابق
          </Button>

          <div className="flex space-x-reverse space-x-3">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === currentStep 
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 scale-125 shadow-lg' 
                    : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                }`}
                aria-label={`الانتقال إلى الخطوة ${index + 1}`}
              />
            ))}
          </div>

          <Button
            onClick={currentStep === steps.length - 1 ? () => {
              const phoneNumber = '966535983261';
              const message = 'مرحباً، أريد معرفة المزيد عن نظام SmartKindy لإدارة الحضانات';
              
              // محاولة فتح الواتساب بطرق متعددة
              const tryOpenWhatsApp = () => {
                // الطريقة الأولى: wa.me
                const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                console.log('Trying wa.me:', waUrl);
                
                // محاولة فتح الرابط
                const newWindow = window.open(waUrl, '_blank');
                
                // إذا فشل، اعرض رقم الهاتف للمستخدم
                setTimeout(() => {
                  if (!newWindow || newWindow.closed) {
                    alert(`لم يتم فتح الواتساب تلقائياً.\nيمكنك التواصل معنا على:\n+${phoneNumber}\n\nأو ابحث عن: SmartKindy في الواتساب`);
                  }
                }, 1000);
              };
              
              // تأكيد من المستخدم
              if (confirm('هل تريد فتح الواتساب للتواصل معنا؟')) {
                tryOpenWhatsApp();
              }
            } : nextStep}
            className="flex items-center gap-3 px-8 py-4 text-lg rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl transition-all duration-300"
            size="lg"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <MessageCircle className="h-5 w-5" />
                تواصل معنا الآن
              </>
            ) : (
              <>
                التالي
                <ArrowLeft className="h-5 w-5" />
              </>
            )}
          </Button>
        </div>

        {/* المميزات الإضافية المطورة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-8 bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl shadow-xl border-4 border-green-200 hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-400 to-blue-400 rounded-full shadow-xl group-hover:animate-bounce">
                <Shield className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-green-600">🛡️ أمان متقدم وموثوق</h3>
            <p className="text-gray-700 leading-relaxed font-medium">حماية شاملة للبيانات مع تشفير متقدم وحفظ احتياطي آمن في السحابة ✨</p>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-br from-pink-50 to-yellow-50 rounded-3xl shadow-xl border-4 border-pink-200 hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-pink-400 to-yellow-400 rounded-full shadow-xl group-hover:animate-bounce">
                <Heart className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-pink-600">😊 سهولة ومتعة الاستخدام</h3>
            <p className="text-gray-700 leading-relaxed font-medium">واجهة بديهية مصممة خصيصاً للبيئة العربية مع دعم فني متخصص ومُحب 💝</p>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-3xl shadow-xl border-4 border-purple-200 hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-r from-purple-400 to-indigo-400 rounded-full shadow-xl group-hover:animate-bounce">
                <Smartphone className="h-10 w-10 text-white drop-shadow-lg" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-4 text-purple-600">📱 متوافق مع جميع الأجهزة</h3>
            <p className="text-gray-700 leading-relaxed font-medium">يعمل بسلاسة على جميع الأجهزة الذكية مع تطبيق جوال متخصص وسريع 🚀</p>
          </div>
        </div>

        {/* قسم التواصل والدعوة للعمل المطور */}
        <Card className="bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 border-0 shadow-2xl text-white relative overflow-hidden">
          {/* عناصر زخرفية */}
          <div className="absolute top-4 left-4">
            <Star className="h-8 w-8 text-yellow-300 animate-spin" />
          </div>
          <div className="absolute top-8 right-8">
            <Heart className="h-6 w-6 text-pink-300 animate-bounce" />
          </div>
          <div className="absolute bottom-4 left-8">
            <Sparkles className="h-7 w-7 text-yellow-400 animate-pulse" />
          </div>
          
          <CardContent className="text-center py-20 relative">
            <h2 className="text-5xl font-bold mb-8 drop-shadow-lg">🚀 جاهز لتحويل حضانتك إلى عالم سحري؟</h2>
            <p className="text-2xl mb-12 opacity-95 max-w-4xl mx-auto leading-relaxed font-medium drop-shadow-md">
              🌟 انضم إلى أكثر من 500 حضانة في المملكة تستخدم SmartKindy لإدارة عملياتها بكفاءة ونجاح مع لمسة من السحر والإبداع! ✨
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-8">
              <Button 
                size="lg"
                className="bg-white text-purple-600 hover:bg-yellow-100 px-12 py-6 text-2xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-110 font-bold border-4 border-white/30"
                onClick={() => {
                  const phoneNumber = '966535983261';
                  const message = 'مرحباً، أود بدء التجربة المجانية لنظام SmartKindy لإدارة الحضانات';
                  
                  const tryOpenWhatsApp = () => {
                    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                    console.log('Opening WhatsApp URL (Free Trial):', waUrl);
                    
                    const newWindow = window.open(waUrl, '_blank');
                    
                    setTimeout(() => {
                      if (!newWindow || newWindow.closed) {
                        alert(`لم يتم فتح الواتساب تلقائياً.\nيمكنك التواصل معنا على:\n+${phoneNumber}\n\nأو ابحث عن: SmartKindy في الواتساب`);
                      }
                    }, 1000);
                  };
                  
                  if (confirm('هل تريد بدء التجربة المجانية؟')) {
                    tryOpenWhatsApp();
                  }
                }}
              >
                <Sparkles className="h-6 w-6 ml-3 animate-spin" />
                🎉 ابدأ تجربتك السحرية المجانية الآن
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-4 border-white text-white hover:bg-white hover:text-purple-600 px-12 py-6 text-2xl rounded-3xl transition-all duration-500 hover:scale-110 font-bold backdrop-blur-sm"
                onClick={() => {
                  const phoneNumber = '966535983261';
                  const message = 'مرحباً، أريد معرفة المزيد عن نظام SmartKindy لإدارة الحضانات';
                  
                  const tryOpenWhatsApp = () => {
                    const waUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
                    console.log('Opening WhatsApp URL (Contact):', waUrl);
                    
                    const newWindow = window.open(waUrl, '_blank');
                    
                    setTimeout(() => {
                      if (!newWindow || newWindow.closed) {
                        alert(`لم يتم فتح الواتساب تلقائياً.\nيمكنك التواصل معنا على:\n+${phoneNumber}\n\nأو ابحث عن: SmartKindy في الواتساب`);
                      }
                    }, 1000);
                  };
                  
                  if (confirm('هل تريد التواصل معنا عبر الواتساب؟')) {
                    tryOpenWhatsApp();
                  }
                }}
              >
                <MessageCircle className="h-6 w-6 ml-3 animate-bounce" />
                💬 تواصل معنا الآن
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* معلومات التواصل المطورة */}
        <div className="text-center mt-16 p-10 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-lg rounded-3xl shadow-2xl border-4 border-white/30 relative">
          {/* عناصر زخرفية */}
          <div className="absolute top-2 left-4">
            <Star className="h-5 w-5 text-yellow-400 animate-bounce" />
          </div>
          <div className="absolute top-4 right-4">
            <Heart className="h-4 w-4 text-pink-400 animate-pulse" />
          </div>
          
          <h3 className="text-3xl font-bold text-purple-600 mb-8 flex items-center justify-center">
            <Phone className="h-8 w-8 ml-3 text-blue-500" />
            💬 تواصل معنا بسهولة
          </h3>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-12 text-gray-700">
            <div className="flex items-center gap-4 bg-blue-50 px-8 py-4 rounded-2xl border-2 border-blue-200 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500 rounded-full">
                <Phone className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-blue-600 text-xl" dir="ltr">+966 53 598 3261</div>
                <div className="text-sm text-blue-500">📞 اتصال مباشر</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-green-50 px-8 py-4 rounded-2xl border-2 border-green-200 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500 rounded-full">
                <MessageCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-green-600 text-xl">واتساب متاح 24/7</div>
                <div className="text-sm text-green-500">💬 دردشة فورية</div>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-purple-50 px-8 py-4 rounded-2xl border-2 border-purple-200 hover:scale-105 transition-all duration-300">
              <div className="flex items-center justify-center w-12 h-12 bg-purple-500 rounded-full">
                <Globe className="h-6 w-6 text-white" />
              </div>
              <div>
                <div className="font-bold text-purple-600 text-xl">smartkindy.com</div>
                <div className="text-sm text-purple-500">🌐 موقعنا الإلكتروني</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer بسيط ومُلون */}
      <footer className="bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 text-white py-12 mt-20 relative overflow-hidden">
        {/* عناصر زخرفية في الفوتر */}
        <div className="absolute top-4 left-8">
          <Star className="h-6 w-6 text-yellow-300 animate-spin" />
        </div>
        <div className="absolute bottom-4 right-8">
          <Heart className="h-5 w-5 text-pink-300 animate-bounce" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 text-center relative">
          <div className="flex justify-center items-center space-x-reverse space-x-6 mb-6">
            <div className="relative">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy" 
                className="h-12 w-12 object-contain rounded-full border-2 border-white/50"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-300 rounded-full animate-pulse"></div>
            </div>
            <span className="text-2xl font-bold drop-shadow-lg">✨ SmartKindy</span>
          </div>
          <p className="text-white/90 text-lg font-medium mb-4">
            🌟 © 2025 SmartKindy. جميع الحقوق محفوظة. نظام إدارة الحضانات الأول والأكثر متعة في المملكة العربية السعودية. 🎈
          </p>
          <div className="flex justify-center items-center space-x-reverse space-x-8 text-white/80">
            <div className="flex items-center">
              <Heart className="h-4 w-4 ml-2 animate-pulse" />
              <span>صُنع بحب وإبداع</span>
            </div>
            <div className="flex items-center">
              <Sparkles className="h-4 w-4 ml-2 animate-spin" />
              <span>مستقبل التعليم الذكي</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StandaloneTour;