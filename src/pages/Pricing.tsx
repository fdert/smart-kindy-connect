import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { 
  Check, 
  X, 
  Star, 
  Heart, 
  Building, 
  Users, 
  MessageCircle, 
  Camera, 
  FileText,
  Shield,
  Zap,
  ArrowLeft
} from 'lucide-react';

const smartKindyLogo = "/lovable-uploads/46a447fc-00fa-49c5-b6ae-3f7b46fc4691.png";

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);

  const plans = [
    {
      id: 'starter',
      name: 'المبتدئ',
      nameEn: 'Starter',
      description: 'مثالي للحضانات الصغيرة',
      priceMonthly: 199,
      priceYearly: 1990,
      maxStudents: 50,
      maxTeachers: 3,
      maxClasses: 3,
      storageGB: 5,
      features: [
        'إدارة الطلاب والفصول',
        'تسجيل الحضور الأساسي',
        'نظام التحفيز البسيط',
        'ألبوم الصور',
        'تقارير أساسية',
        'دعم فني عبر البريد'
      ],
      notIncluded: [
        'تكامل واتساب',
        'التقارير المتقدمة',
        'نسخ احتياطية متعددة',
        'دعم فني أولوي'
      ],
      isPopular: false,
      color: 'blue'
    },
    {
      id: 'professional',
      name: 'المحترف',
      nameEn: 'Professional',
      description: 'الأكثر طلباً للحضانات المتوسطة',
      priceMonthly: 399,
      priceYearly: 3990,
      maxStudents: 150,
      maxTeachers: 10,
      maxClasses: 10,
      storageGB: 20,
      features: [
        'جميع ميزات الخطة المبتدئة',
        'تكامل واتساب الكامل',
        'التقارير المتقدمة',
        'لوحة تحكم تحليلية',
        'نسخ احتياطية يومية',
        'دعم فني أولوي',
        'تخصيص الشعار',
        'إدارة متعددة المستخدمين'
      ],
      notIncluded: [
        'API مخصص',
        'تدريب شخصي',
        'مدير حساب مخصص'
      ],
      isPopular: true,
      color: 'primary'
    },
    {
      id: 'enterprise',
      name: 'المؤسسي',
      nameEn: 'Enterprise',
      description: 'للحضانات الكبيرة والمجموعات',
      priceMonthly: 799,
      priceYearly: 7990,
      maxStudents: 500,
      maxTeachers: 50,
      maxClasses: 50,
      storageGB: 100,
      features: [
        'جميع ميزات الخطة المحترفة',
        'API مخصص',
        'تكامل مع أنظمة أخرى',
        'تدريب شخصي للفريق',
        'مدير حساب مخصص',
        'دعم فني 24/7',
        'تخصيص كامل للنظام',
        'تقارير مخصصة',
        'أمان متقدم',
        'SLA مضمون'
      ],
      notIncluded: [],
      isPopular: false,
      color: 'purple'
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    const price = isYearly ? plan.priceYearly : plan.priceMonthly;
    const period = isYearly ? 'سنوياً' : 'شهرياً';
    const discount = isYearly ? Math.round(((plan.priceMonthly * 12 - plan.priceYearly) / (plan.priceMonthly * 12)) * 100) : 0;
    
    return { price, period, discount };
  };

  const getColorClasses = (color: string, isPopular: boolean) => {
    if (isPopular) {
      return {
        card: 'border-2 border-primary bg-gradient-to-br from-primary/5 to-purple-500/10',
        button: 'bg-primary hover:bg-primary/90',
        badge: 'bg-primary text-white'
      };
    }
    
    const colorMap = {
      blue: {
        card: 'border border-blue-200 bg-white/80',
        button: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-500 text-white'
      },
      purple: {
        card: 'border border-purple-200 bg-white/80',
        button: 'bg-purple-600 hover:bg-purple-700',
        badge: 'bg-purple-500 text-white'
      }
    };
    
    return colorMap[color as keyof typeof colorMap] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* شريط التنقل */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center space-x-reverse space-x-3">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy Logo" 
                className="h-8 w-8 object-contain"
              />
              <h1 className="text-xl font-bold text-gray-900">SmartKindy</h1>
            </Link>
            <div className="flex items-center space-x-reverse space-x-4">
              <Link to="/auth">
                <Button variant="outline" size="sm">تسجيل الدخول</Button>
              </Link>
              <Link to="/register">
                <Button size="sm">تسجيل حضانة</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* القسم الرئيسي */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            خطط تناسب جميع احتياجاتك
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            اختر الخطة المناسبة لحضانتك مع إمكانية الترقية أو التغيير في أي وقت
          </p>

          {/* مفتاح التبديل بين الشهري والسنوي */}
          <div className="flex items-center justify-center space-x-reverse space-x-4 mb-12">
            <span className={`text-lg ${!isYearly ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              شهرياً
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-primary"
            />
            <span className={`text-lg ${isYearly ? 'font-semibold text-gray-900' : 'text-gray-500'}`}>
              سنوياً
            </span>
            {isYearly && (
              <Badge className="bg-green-500 text-white">
                وفر حتى 20%
              </Badge>
            )}
          </div>
        </div>

        {/* بطاقات الخطط */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => {
            const { price, period, discount } = getPrice(plan);
            const colorClasses = getColorClasses(plan.color, plan.isPopular);

            return (
              <Card key={plan.id} className={`${colorClasses.card} backdrop-blur-sm relative`}>
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={colorClasses.badge}>
                      <Star className="h-3 w-3 ml-1" />
                      الأكثر شيوعاً
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <CardDescription className="text-lg">{plan.description}</CardDescription>
                  
                  <div className="pt-4">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold text-gray-900">{price}</span>
                      <span className="text-lg text-gray-600 mr-2">ر.س</span>
                      <span className="text-sm text-gray-500">/ {period}</span>
                    </div>
                    {discount > 0 && (
                      <p className="text-sm text-green-600 mt-1">وفر {discount}% مع الدفع السنوي</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* المواصفات الرئيسية */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">عدد الطلاب</span>
                      <span className="font-semibold">حتى {plan.maxStudents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">عدد المعلمين</span>
                      <span className="font-semibold">حتى {plan.maxTeachers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">عدد الفصول</span>
                      <span className="font-semibold">حتى {plan.maxClasses}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">مساحة التخزين</span>
                      <span className="font-semibold">{plan.storageGB} جيجابايت</span>
                    </div>
                  </div>

                  {/* الميزات المتضمنة */}
                  <div>
                    <h4 className="font-semibold mb-3">الميزات المتضمنة:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-reverse space-x-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* الميزات غير المتضمنة */}
                  {plan.notIncluded.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-600">غير متضمن:</h4>
                      <ul className="space-y-2">
                        {plan.notIncluded.map((feature, index) => (
                          <li key={index} className="flex items-start space-x-reverse space-x-2">
                            <X className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link to="/register" className="w-full block">
                    <Button className={`w-full ${colorClasses.button} text-white`}>
                      ابدأ مع {plan.name}
                      <ArrowLeft className="mr-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* الأسئلة الشائعة */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            أسئلة شائعة حول الأسعار
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-2">هل يمكنني تغيير خطتي لاحقاً؟</h3>
              <p className="text-gray-600">نعم، يمكنك الترقية أو تخفيض درجة خطتك في أي وقت من خلال لوحة التحكم.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">هل هناك رسوم إعداد؟</h3>
              <p className="text-gray-600">لا، جميع الخطط لا تتضمن رسوم إعداد أو رسوم خفية إضافية.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">ماذا يحدث إذا تجاوزت الحدود؟</h3>
              <p className="text-gray-600">سنتواصل معك لترقية خطتك، ولن نوقف الخدمة دون إشعار مسبق.</p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">هل يمكنني إلغاء اشتراكي؟</h3>
              <p className="text-gray-600">نعم، يمكنك إلغاء اشتراكك في أي وقت وستحتفظ بالوصول حتى نهاية فترة الدفع.</p>
            </div>
          </div>
        </div>

        {/* دعوة للعمل */}
        <div className="text-center mt-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            غير متأكد من الخطة المناسبة؟
          </h2>
          <p className="text-lg text-gray-600 mb-8">
            تواصل معنا وسنساعدك في اختيار الخطة المثالية لحضانتك
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-3">
              تواصل معنا
            </Button>
            <Link to="/register">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                ابدأ تجربة مجانية
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;