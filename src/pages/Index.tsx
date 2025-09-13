import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/hooks/useLanguage';
import { LanguageSwitcher } from '@/components/ui/language-switcher';
import Testimonials from "@/components/Testimonials";
import { 
  Heart, 
  Star, 
  Users, 
  MessageCircle, 
  Calendar, 
  Settings, 
  ArrowLeft,
  CheckCircle,
  Zap,
  Shield,
  Clock,
  Camera,
  FileText,
  Award,
  Smartphone
} from "lucide-react";

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

const Index = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, language } = useLanguage();

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true })
        .limit(3);

      if (error) throw error;
      setPlans(data || []);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* الخلفية الزخرفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-yellow-300 rounded-full opacity-10 animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-pink-300 rounded-full opacity-10 animate-bounce delay-1000"></div>
        <div className="absolute bottom-32 left-40 w-20 h-20 bg-blue-300 rounded-full opacity-10 animate-pulse delay-500"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-green-300 rounded-full opacity-10 animate-bounce delay-300"></div>
      </div>

      {/* الشريط العلوي */}
      <header className="relative z-10 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-[120px]">
            <Link to="/" className="flex items-center space-x-reverse space-x-3">
              <img 
                src={smartKindyLogo} 
                alt={t('landing.title')} 
                className="h-[150px] w-[150px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
              <h1 className="text-xl font-bold text-gray-900">{t('landing.title')}</h1>
            </Link>
            <div className="flex items-center space-x-reverse space-x-4 gap-2">
              <LanguageSwitcher />
              <Link to="/demo">
                <Button variant="ghost" size="sm" className="text-sm">
                  {t('landing.try_demo')}
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="sm">
                  {t('landing.register')}
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">
                  {t('landing.login')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* القسم الترحيبي */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-8">
            <div className="relative">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy - منصة إدارة رياض الأطفال الذكية" 
                className="h-32 w-32 object-contain drop-shadow-lg"
              />
              <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-xl animate-pulse-soft"></div>
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            {t('landing.title')}
          </h1>
           <p className="text-2xl text-blue-600 font-semibold mb-4 max-w-3xl mx-auto leading-relaxed">
             {t('landing.subtitle')}
           </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            {t('landing.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" className="text-lg px-8 py-3">
                {t('landing.try_demo')}
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                {t('landing.login')}
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/tour">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-3">
                {t('landing.tour')}
              </Button>
            </Link>
            <Link to="/standalone-teacher-guide">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-3 bg-green-500 hover:bg-green-600 text-white">
                {t('landing.teacher_guide')}
              </Button>
            </Link>
          </div>
        </div>

        {/* الميزات الرئيسية */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t('landing.features.title')}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('landing.features.description')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">{t('landing.features.student_management')}</CardTitle>
                <CardDescription className="text-gray-600">
                  {t('landing.features.student_management_desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">{t('landing.features.attendance')}</CardTitle>
                <CardDescription className="text-gray-600">
                  {t('landing.features.attendance_desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4 group-hover:bg-yellow-200 transition-colors">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">{t('landing.features.rewards')}</CardTitle>
                <CardDescription className="text-gray-600">
                  {t('landing.features.rewards_desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition-colors">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">{t('landing.features.whatsapp')}</CardTitle>
                <CardDescription className="text-gray-600">
                  {t('landing.features.whatsapp_desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-lg mb-4 group-hover:bg-pink-200 transition-colors">
                  <Camera className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle className="text-xl">{t('landing.features.media')}</CardTitle>
                <CardDescription className="text-gray-600">
                  {t('landing.features.media_desc')}
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4 group-hover:bg-gray-200 transition-colors">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <CardTitle className="text-xl">{t('landing.features.reports')}</CardTitle>
                <CardDescription className="text-gray-600">
                  {t('landing.features.reports_desc')}
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* إحصائيات مثيرة للإعجاب */}
        <div className="mb-16 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('landing.stats.title')}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">{t('landing.stats.nurseries')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">15K+</div>
              <div className="text-gray-600">{t('landing.stats.children')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-gray-600">{t('landing.stats.satisfaction')}</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">{t('landing.stats.support')}</div>
            </div>
          </div>
        </div>

        {/* الميزات المتقدمة */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('landing.advanced.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-reverse space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('landing.advanced.security')}</h3>
                <p className="text-gray-600">{t('landing.advanced.security_desc')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-reverse space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('landing.advanced.speed')}</h3>
                <p className="text-gray-600">{t('landing.advanced.speed_desc')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-reverse space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('landing.advanced.mobile')}</h3>
                <p className="text-gray-600">{t('landing.advanced.mobile_desc')}</p>
              </div>
            </div>

            <div className="flex items-start space-x-reverse space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{t('landing.advanced.time_saving')}</h3>
                <p className="text-gray-600">{t('landing.advanced.time_saving_desc')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* التوصيات والآراء */}
        <Testimonials />

        {/* الأسعار المبسطة */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            {t('landing.pricing.title')}
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            {t('landing.pricing.description')}
          </p>
          
          {loading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">{t('landing.pricing.loading')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan, index) => {
                const getCardClasses = (isPopular: boolean) => {
                  if (isPopular) {
                    return "bg-gradient-to-br from-primary/5 to-purple-500/10 border-2 border-primary shadow-lg text-center relative";
                  }
                  return "bg-white/80 backdrop-blur-sm border-0 shadow-sm text-center";
                };

                return (
                  <Card key={plan.id} className={getCardClasses(plan.is_popular)}>
                    {plan.is_popular && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-primary text-white">
                          <Star className="h-3 w-3 ml-1" />
                          {t('landing.pricing.popular')}
                        </Badge>
                      </div>
                    )}
                    <CardHeader>
                      <CardTitle className="text-2xl">{language === 'ar' ? plan.name_ar : plan.name}</CardTitle>
                      <div className="mt-4">
                        <span className="text-4xl font-bold">{plan.price_monthly}</span>
                        <span className="text-gray-600 mr-2">{t('landing.pricing.monthly')}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        <li className="flex items-center justify-center space-x-reverse space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {plan.max_students 
                              ? t('landing.pricing.students_limit').replace('{count}', plan.max_students.toString())
                              : t('landing.pricing.unlimited') + ' ' + (language === 'ar' ? 'طالب' : 'students')
                            }
                          </span>
                        </li>
                        <li className="flex items-center justify-center space-x-reverse space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-sm">
                            {plan.max_teachers 
                              ? t('landing.pricing.teachers_limit').replace('{count}', plan.max_teachers.toString())
                              : t('landing.pricing.unlimited') + ' ' + (language === 'ar' ? 'معلم' : 'teachers')
                            }
                          </span>
                        </li>
                        {plan.has_whatsapp && (
                          <li className="flex items-center justify-center space-x-reverse space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{t('pricing.whatsapp_integration')}</span>
                          </li>
                        )}
                        {plan.has_reports && (
                          <li className="flex items-center justify-center space-x-reverse space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-sm">تقارير متقدمة</span>
                          </li>
                        )}
                      </ul>
                      <Link to="/pricing">
                        <Button className={plan.is_popular ? "w-full" : "w-full"} variant={plan.is_popular ? "default" : "outline"}>
                          {plan.is_popular ? "ابدأ الآن" : "اعرف المزيد"}
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                 );
               })}
             </div>
           )}
         </div>

        {/* دعوة للعمل */}
        <div className="text-center bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            جاهز لتحسين إدارة حضانتك؟
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            انضم إلى مئات الحضانات التي تستخدم SmartKindy لتحسين جودة الخدمة وتسهيل التواصل مع الأولياء
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-12 py-4">
                ابدأ مجاناً الآن
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button variant="outline" size="lg" className="text-lg px-12 py-4">
                اطلع على الأسعار
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* الفوتر */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="flex items-center justify-center space-x-reverse space-x-3 mb-4">
            <img 
              src={smartKindyLogo} 
              alt="SmartKindy Logo" 
              className="h-8 w-8 object-contain"
            />
            <span className="text-lg font-bold text-gray-900">SmartKindy</span>
          </div>
            <p className="text-gray-600 text-sm">
              © 2025 SmartKindy. جميع الحقوق محفوظة. منصة إدارة رياض الأطفال الذكية.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
