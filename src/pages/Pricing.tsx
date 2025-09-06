import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

interface Plan {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  price_monthly: number;
  price_quarterly: number | null;
  price_yearly: number | null;
  max_students: number | null;
  max_teachers: number | null;
  max_classes: number | null;
  storage_gb: number;
  has_whatsapp: boolean;
  has_analytics: boolean;
  has_reports: boolean;
  features: any;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  currency: string;
}

const Pricing = () => {
  const [isYearly, setIsYearly] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPrice = (plan: Plan) => {
    const price = isYearly ? (plan.price_yearly || plan.price_monthly * 10) : plan.price_monthly;
    const period = isYearly ? 'سنوياً' : 'شهرياً';
    const yearlyPrice = plan.price_yearly || plan.price_monthly * 10;
    const discount = isYearly ? Math.round(((plan.price_monthly * 12 - yearlyPrice) / (plan.price_monthly * 12)) * 100) : 0;
    
    return { price, period, discount };
  };

  const getColorClasses = (isPopular: boolean, index: number) => {
    if (isPopular) {
      return {
        card: 'border-2 border-primary bg-gradient-to-br from-primary/5 to-purple-500/10',
        button: 'bg-primary hover:bg-primary/90',
        badge: 'bg-primary text-white'
      };
    }
    
    const colors = [
      {
        card: 'border border-blue-200 bg-white/80',
        button: 'bg-blue-600 hover:bg-blue-700',
        badge: 'bg-blue-500 text-white'
      },
      {
        card: 'border border-purple-200 bg-white/80',
        button: 'bg-purple-600 hover:bg-purple-700',
        badge: 'bg-purple-500 text-white'
      },
      {
        card: 'border border-green-200 bg-white/80',
        button: 'bg-green-600 hover:bg-green-700',
        badge: 'bg-green-500 text-white'
      }
    ];
    
    return colors[index % colors.length];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الخطط...</p>
        </div>
      </div>
    );
  }

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
          {plans.map((plan, index) => {
            const { price, period, discount } = getPrice(plan);
            const colorClasses = getColorClasses(plan.is_popular, index);

            // إنشاء قائمة الميزات المتضمنة
            const includedFeatures = [
              `حتى ${plan.max_students || 'غير محدود'} طالب`,
              `حتى ${plan.max_teachers || 'غير محدود'} معلم`,
              `حتى ${plan.max_classes || 'غير محدود'} فصل`,
              `${plan.storage_gb} جيجابايت تخزين`,
              ...(plan.has_whatsapp ? ['تكامل واتساب'] : []),
              ...(plan.has_analytics ? ['التحليلات المتقدمة'] : []),
              ...(plan.has_reports ? ['التقارير المتقدمة'] : []),
              ...(Array.isArray(plan.features) ? plan.features : [])
            ];

            // إنشاء قائمة الميزات غير المتضمنة
            const notIncludedFeatures = [];
            if (!plan.has_whatsapp) notIncludedFeatures.push('تكامل واتساب');
            if (!plan.has_analytics) notIncludedFeatures.push('التحليلات المتقدمة');
            if (!plan.has_reports) notIncludedFeatures.push('التقارير المتقدمة');

            return (
              <Card key={plan.id} className={`${colorClasses.card} backdrop-blur-sm relative`}>
                {plan.is_popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className={colorClasses.badge}>
                      <Star className="h-3 w-3 ml-1" />
                      الأكثر شيوعاً
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="pb-4">
                  <CardTitle className="text-2xl font-bold">{plan.name_ar}</CardTitle>
                  <CardDescription className="text-lg">{plan.description_ar || plan.description}</CardDescription>
                  
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
                  {/* الميزات المتضمنة */}
                  <div>
                    <h4 className="font-semibold mb-3">الميزات المتضمنة:</h4>
                    <ul className="space-y-2">
                      {includedFeatures.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start space-x-reverse space-x-2">
                          <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* الميزات غير المتضمنة */}
                  {notIncludedFeatures.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3 text-gray-600">غير متضمن:</h4>
                      <ul className="space-y-2">
                        {notIncludedFeatures.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start space-x-reverse space-x-2">
                            <X className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-gray-500">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Link to="/register" className="w-full block">
                    <Button className={`w-full ${colorClasses.button} text-white`}>
                      ابدأ مع {plan.name_ar}
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