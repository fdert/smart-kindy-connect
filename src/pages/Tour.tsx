import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
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
  Smartphone
} from "lucide-react";

// استيراد الصور التوضيحية
import tourDashboard from "@/assets/tour-dashboard.jpg";
import tourAttendance from "@/assets/tour-attendance.jpg";
import tourRewards from "@/assets/tour-rewards.jpg";
import tourWhatsapp from "@/assets/tour-whatsapp.jpg";
import tourMedia from "@/assets/tour-media.jpg";
import tourReports from "@/assets/tour-reports.jpg";

const smartKindyLogo = "/lovable-uploads/46a447fc-00fa-49c5-b6ae-3f7b46fc4691.png";

const Tour = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'teacher' | 'parent'>('admin');

  const adminSteps = [
    {
      title: "لوحة التحكم الرئيسية",
      description: "مرحباً بك في SmartKindy! هذه هي لوحة التحكم الرئيسية حيث يمكنك مراقبة جميع أنشطة الحضانة في مكان واحد.",
      icon: Settings,
      features: [
        "إحصائيات شاملة عن الطلاب والحضور",
        "تحديثات فورية عن الأنشطة اليومية", 
        "تنبيهات هامة ومهام معلقة",
        "نظرة عامة على الأداء العام"
      ],
      image: tourDashboard
    },
    {
      title: "إدارة الطلاب",
      description: "إدارة شاملة لجميع بيانات الطلاب مع إمكانية التتبع والمراقبة المستمرة.",
      icon: Users,
      features: [
        "إضافة وتعديل بيانات الطلاب",
        "ربط كل طالب بولي الأمر",
        "تتبع المعلومات الطبية والحساسيات",
        "إدارة الفصول والمجموعات"
      ],
      image: tourDashboard
    },
    {
      title: "نظام الحضور الذكي",
      description: "تسجيل الحضور والانصراف مع إرسال إشعارات فورية لأولياء الأمور عبر واتساب.",
      icon: Calendar,
      features: [
        "تسجيل سريع للحضور والانصراف",
        "إشعارات تلقائية عبر واتساب",
        "تقارير حضور مفصلة",
        "إدارة الإجازات والغياب"
      ],
      image: tourAttendance
    },
    {
      title: "نظام التحفيز والمكافآت",
      description: "نظام تحفيزي متطور لتشجيع الطلاب وتحفيزهم على السلوك الإيجابي والتميز.",
      icon: Star,
      features: [
        "منح النجوم والأوسمة للطلاب",
        "لوحة شرف تفاعلية",
        "مكافآت قابلة للتخصيص",
        "تقارير التقدم والإنجازات"
      ],
      image: tourRewards
    },
    {
      title: "الألبوم اليومي",
      description: "مشاركة صور وأنشطة الطلاب مع أولياء الأمور بطريقة آمنة ومنظمة.",
      icon: Camera,
      features: [
        "رفع صور الأنشطة اليومية",
        "روابط آمنة ومؤقتة للأولياء",
        "تصنيف الصور حسب الطالب والنشاط",
        "حفظ الذكريات الجميلة"
      ],
      image: tourMedia
    },
    {
      title: "تكامل واتساب المتقدم",
      description: "تواصل مباشر وتلقائي مع أولياء الأمور عبر واتساب مع قوالب رسائل احترافية.",
      icon: MessageCircle,
      features: [
        "إرسال تلقائي لإشعارات الحضور",
        "قوالب رسائل قابلة للتخصيص",
        "إشعارات الأنشطة والفعاليات",
        "تحديثات عن تقدم الطالب"
      ],
      image: tourWhatsapp
    },
    {
      title: "التقارير الذكية",
      description: "تقارير شاملة ومفصلة عن جميع جوانب إدارة الحضانة مع إمكانية التصدير.",
      icon: FileText,
      features: [
        "تقارير الحضور والغياب",
        "تقارير الأداء والتقدم",
        "إحصائيات مالية ومحاسبية",
        "تصدير بصيغ مختلفة (PDF, Excel)"
      ],
      image: tourReports
    }
  ];

  const teacherSteps = [
    {
      title: "واجهة المعلم الودودة",
      description: "واجهة بسيطة ومصممة خصيصاً للمعلمين لإدارة فصولهم بسهولة ويسر.",
      icon: BookOpen,
      features: [
        "عرض الطلاب المخصصين لك",
        "تسجيل سريع للحضور",
        "متابعة الأنشطة اليومية",
        "التواصل مع الإدارة"
      ],
      image: tourDashboard
    },
    {
      title: "تسجيل الحضور السريع",
      description: "تسجيل حضور وانصراف الطلاب بنقرة واحدة مع إرسال إشعارات تلقائية للأولياء.",
      icon: Calendar,
      features: [
        "تسجيل سريع وسهل للحضور",
        "عرض حالة جميع الطلاب",
        "إضافة ملاحظات خاصة",
        "إشعارات فورية للأولياء"
      ],
      image: tourAttendance
    },
    {
      title: "نظام التحفيز التفاعلي",
      description: "منح النجوم والمكافآت للطلاب وتشجيعهم على السلوك الإيجابي.",
      icon: Star,
      features: [
        "منح نجوم للطلاب المتميزين",
        "اختيار نوع المكافأة المناسبة",
        "رؤية تقدم كل طالب",
        "تحفيز المشاركة الإيجابية"
      ],
      image: tourRewards
    },
    {
      title: "توثيق الأنشطة بالصور",
      description: "التقاط ومشاركة أجمل لحظات الطلاب مع أولياء الأمور.",
      icon: Camera,
      features: [
        "رفع صور الأنشطة اليومية",
        "إضافة وصف للأنشطة",
        "مشاركة آمنة مع الأولياء",
        "إنشاء ذكريات جميلة"
      ],
      image: tourMedia
    }
  ];

  const parentSteps = [
    {
      title: "متابعة طفلك على مدار الساعة",
      description: "تطبيق مخصص لأولياء الأمور لمتابعة جميع أنشطة أطفالهم في الحضانة.",
      icon: UserCheck,
      features: [
        "معلومات شاملة عن طفلك",
        "حالة الحضور اليومية",
        "النجوم والإنجازات",
        "الأنشطة والصور اليومية"
      ],
      image: tourDashboard
    },
    {
      title: "إشعارات واتساب الفورية",
      description: "تلقي إشعارات فورية عن وصول وانصراف طفلك مع تحديثات يومية عن أنشطته.",
      icon: MessageCircle,
      features: [
        "إشعار وصول الطفل للحضانة",
        "إشعار انصراف الطفل",
        "تحديثات عن الأنشطة اليومية",
        "تقارير أسبوعية عن التقدم"
      ],
      image: tourWhatsapp
    },
    {
      title: "ألبوم الذكريات الخاص",
      description: "استقبال صور طفلك وأنشطته اليومية مع إمكانية حفظها والاحتفاظ بها.",
      icon: Camera,
      features: [
        "صور يومية لأنشطة طفلك",
        "روابط آمنة ومؤقتة",
        "إمكانية تحميل وحفظ الصور",
        "ذكريات جميلة للاحتفاظ بها"
      ],
      image: tourMedia
    },
    {
      title: "تتبع تقدم طفلك",
      description: "متابعة إنجازات ونجوم طفلك ومشاهدة تقدمه في مختلف الأنشطة.",
      icon: Star,
      features: [
        "عدد النجوم المكتسبة",
        "الإنجازات والأوسمة",
        "تقارير التقدم الشهرية",
        "مقارنة الأداء عبر الوقت"
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* الشريط العلوي */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-reverse space-x-3">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy Logo" 
                className="h-10 w-10 object-contain"
              />
              <h1 className="text-xl font-bold text-gray-900">SmartKindy</h1>
            </Link>
            <Link to="/">
              <Button variant="outline" size="sm">
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* العنوان الرئيسي */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <img 
              src={smartKindyLogo} 
              alt="SmartKindy" 
              className="h-20 w-20 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            الجولة التعريفية لـ SmartKindy
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            اكتشف كيف يمكن لـ SmartKindy تحويل إدارة حضانتك إلى تجربة سهلة وممتعة
          </p>
        </div>

        {/* اختيار الدور */}
        <div className="flex justify-center mb-12">
          <div className="flex space-x-reverse space-x-4 bg-white rounded-lg p-2 shadow-sm">
            <Button
              variant={selectedRole === 'admin' ? 'default' : 'ghost'}
              onClick={() => switchRole('admin')}
              className="flex items-center gap-2"
            >
              <Settings className="h-4 w-4" />
              مدير الحضانة
            </Button>
            <Button
              variant={selectedRole === 'teacher' ? 'default' : 'ghost'}
              onClick={() => switchRole('teacher')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              المعلم
            </Button>
            <Button
              variant={selectedRole === 'parent' ? 'default' : 'ghost'}
              onClick={() => switchRole('parent')}
              className="flex items-center gap-2"
            >
              <UserCheck className="h-4 w-4" />
              ولي الأمر
            </Button>
          </div>
        </div>

        {/* مؤشر التقدم */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-gray-500">
              الخطوة {currentStep + 1} من {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(((currentStep + 1) / steps.length) * 100)}% مكتمل
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* محتوى الخطوة الحالية */}
        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full">
                <StepIcon className="h-8 w-8 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl mb-2">{step.title}</CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              {step.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* صورة توضيحية */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <img 
                  src={step.image} 
                  alt={step.title}
                  className="h-48 w-48 object-contain drop-shadow-lg rounded-lg"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg"></div>
              </div>
            </div>

            {/* الميزات */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {step.features.map((feature, index) => (
                <div key={index} className="flex items-start space-x-reverse space-x-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{feature}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* أزرار التنقل */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4" />
            السابق
          </Button>

          <div className="flex space-x-reverse space-x-2">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentStep(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentStep 
                    ? 'bg-primary scale-125' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>

          {currentStep === steps.length - 1 ? (
            <Link to="/auth">
              <Button className="flex items-center gap-2">
                <Play className="h-4 w-4" />
                ابدأ الآن
              </Button>
            </Link>
          ) : (
            <Button
              onClick={nextStep}
              className="flex items-center gap-2"
            >
              التالي
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* ميزات إضافية */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl">
            <Shield className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">أمان متقدم</h3>
            <p className="text-gray-600 text-sm">حماية شاملة للبيانات مع تشفير متقدم</p>
          </div>
          <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl">
            <Clock className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">سهولة الاستخدام</h3>
            <p className="text-gray-600 text-sm">واجهة بسيطة ومصممة للجميع</p>
          </div>
          <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-xl">
            <Smartphone className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">متوافق مع الجوال</h3>
            <p className="text-gray-600 text-sm">يعمل على جميع الأجهزة بسلاسة</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tour;