import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  MapPin
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* الشريط العلوي المستقل */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center space-x-reverse space-x-4">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy Logo" 
                className="h-12 w-12 object-contain drop-shadow-md"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">SmartKindy</h1>
                <p className="text-sm text-gray-600">نظام إدارة الحضانات الذكي</p>
              </div>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <Badge variant="secondary" className="px-4 py-2 text-sm">
                <Globe className="h-4 w-4 ml-2" />
                جولة تعريفية مجانية
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* المقدمة والعنوان الرئيسي */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy" 
                className="h-24 w-24 object-contain drop-shadow-xl"
              />
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-200 to-purple-200 rounded-full blur-xl opacity-30"></div>
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            اكتشف مستقبل إدارة الحضانات
          </h1>
          <p className="text-xl text-gray-700 mb-8 max-w-4xl mx-auto leading-relaxed">
            SmartKindy هو النظام الأول في المملكة العربية السعودية الذي يجمع بين التقنية المتطورة والبساطة في الاستخدام 
            لإدارة الحضانات والروضات بكفاءة عالية وأمان تام
          </p>
          <div className="flex justify-center space-x-reverse space-x-8 text-sm text-gray-600">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-green-500 ml-2" />
              <span>آمان مضمون 100%</span>
            </div>
            <div className="flex items-center">
              <Zap className="h-5 w-5 text-yellow-500 ml-2" />
              <span>سهل الاستخدام</span>
            </div>
            <div className="flex items-center">
              <Award className="h-5 w-5 text-purple-500 ml-2" />
              <span>جودة عالمية</span>
            </div>
          </div>
        </div>

        {/* اختيار نوع المستخدم */}
        <div className="flex justify-center mb-16">
          <div className="flex space-x-reverse space-x-6 bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-lg border border-gray-100">
            <Button
              variant={selectedRole === 'admin' ? 'default' : 'ghost'}
              onClick={() => switchRole('admin')}
              className="flex items-center gap-3 px-6 py-4 text-lg rounded-xl transition-all duration-300"
              size="lg"
            >
              <Settings className="h-5 w-5" />
              مدير الحضانة
            </Button>
            <Button
              variant={selectedRole === 'teacher' ? 'default' : 'ghost'}
              onClick={() => switchRole('teacher')}
              className="flex items-center gap-3 px-6 py-4 text-lg rounded-xl transition-all duration-300"
              size="lg"
            >
              <BookOpen className="h-5 w-5" />
              المعلم
            </Button>
            <Button
              variant={selectedRole === 'parent' ? 'default' : 'ghost'}
              onClick={() => switchRole('parent')}
              className="flex items-center gap-3 px-6 py-4 text-lg rounded-xl transition-all duration-300"
              size="lg"
            >
              <UserCheck className="h-5 w-5" />
              ولي الأمر
            </Button>
          </div>
        </div>

        {/* مؤشر التقدم المحسن */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <div className="text-right">
              <span className="text-lg font-semibold text-gray-800">
                الخطوة {currentStep + 1} من {steps.length}
              </span>
              <p className="text-sm text-gray-600 mt-1">
                {selectedRole === 'admin' ? 'مميزات المدير' : 
                 selectedRole === 'teacher' ? 'مميزات المعلم' : 'مميزات ولي الأمر'}
              </p>
            </div>
            <div className="text-left">
              <span className="text-lg font-semibold text-primary">
                {Math.round(((currentStep + 1) / steps.length) * 100)}% مكتمل
              </span>
              <p className="text-sm text-gray-600 mt-1">من الجولة التعريفية</p>
            </div>
          </div>
          <div className="relative">
            <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
              <div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out shadow-sm"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
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
            onClick={currentStep === steps.length - 1 ? () => window.open('https://wa.me/966535983261', '_blank') : nextStep}
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

        {/* المميزات الإضافية */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                <Shield className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">أمان متقدم</h3>
            <p className="text-gray-600 leading-relaxed">حماية شاملة للبيانات مع تشفير متقدم وحفظ احتياطي آمن في السحابة</p>
          </div>
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                <Heart className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">سهولة الاستخدام</h3>
            <p className="text-gray-600 leading-relaxed">واجهة بديهية مصممة خصيصاً للبيئة العربية مع دعم فني متخصص</p>
          </div>
          <div className="text-center p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex justify-center mb-6">
              <div className="flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full">
                <Smartphone className="h-8 w-8 text-purple-600" />
              </div>
            </div>
            <h3 className="text-xl font-bold mb-3 text-gray-900">متوافق مع الجوال</h3>
            <p className="text-gray-600 leading-relaxed">يعمل بسلاسة على جميع الأجهزة الذكية مع تطبيق جوال متخصص</p>
          </div>
        </div>

        {/* قسم التواصل والدعوة للعمل */}
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 border-0 shadow-2xl text-white">
          <CardContent className="text-center py-16">
            <h2 className="text-4xl font-bold mb-6">جاهز لتحويل حضانتك؟</h2>
            <p className="text-xl mb-8 opacity-95 max-w-3xl mx-auto leading-relaxed">
              انضم إلى أكثر من 500 حضانة في المملكة تستخدم SmartKindy لإدارة عملياتها بكفاءة ونجاح
            </p>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <Button 
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => window.open('https://wa.me/966535983261', '_blank')}
              >
                <MessageCircle className="h-5 w-5 ml-2" />
                ابدأ تجربتك المجانية الآن
              </Button>
              <Button 
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg rounded-xl transition-all duration-300"
                onClick={() => window.open('tel:+966535983261', '_blank')}
              >
                <Phone className="h-5 w-5 ml-2" />
                اتصل بنا للاستشارة
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* معلومات التواصل */}
        <div className="text-center mt-12 p-8 bg-white/60 backdrop-blur-sm rounded-xl">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">تواصل معنا</h3>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-8 text-gray-700">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-blue-500" />
              <span className="font-medium">+966 53 598 3261</span>
            </div>
            <div className="flex items-center gap-3">
              <MessageCircle className="h-5 w-5 text-green-500" />
              <span className="font-medium">واتساب متاح 24/7</span>
            </div>
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-purple-500" />
              <span className="font-medium">smartkindy.com</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer بسيط */}
      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex justify-center items-center space-x-reverse space-x-4 mb-4">
            <img 
              src={smartKindyLogo} 
              alt="SmartKindy" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold">SmartKindy</span>
          </div>
          <p className="text-gray-400 text-sm">
            © 2025 SmartKindy. جميع الحقوق محفوظة. نظام إدارة الحضانات الأول في المملكة العربية السعودية.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default StandaloneTour;