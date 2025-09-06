import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
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

const Index = () => {
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
                alt="SmartKindy Logo" 
                className="h-[150px] w-[150px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-300"
              />
              <h1 className="text-xl font-bold text-gray-900">SmartKindy</h1>
            </Link>
            <div className="flex items-center space-x-reverse space-x-4">
              <Link to="/demo">
                <Button variant="ghost" size="sm" className="text-sm">
                  🎯 جربه الآن
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="secondary" size="sm">
                  تسجيل حضانة
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">
                  تسجيل دخول
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
            SmartKindy
          </h1>
           <p className="text-2xl text-blue-600 font-semibold mb-4 max-w-3xl mx-auto leading-relaxed">
             منصة إدارة رياض الأطفال الذكية
           </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            نظام شامل لإدارة الحضانات مع تكامل واتساب وتتبع الحضور ونظام التحفيز
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/demo">
              <Button size="lg" className="text-lg px-8 py-3">
                🎯 جرب النظام الآن مجاناً
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth">
              <Button variant="outline" size="lg" className="text-lg px-8 py-3">
                تسجيل الدخول
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/tour">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-3">
                جولة تعريفية
              </Button>
            </Link>
            <Link to="/standalone-teacher-guide">
              <Button variant="secondary" size="lg" className="text-lg px-8 py-3 bg-green-500 hover:bg-green-600 text-white">
                📚 دليل المعلم التفاعلي
              </Button>
            </Link>
          </div>
        </div>

        {/* الميزات الرئيسية */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            ميزات المنصة
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            مجموعة شاملة من الأدوات المتطورة لإدارة حضانتك بكفاءة واحترافية
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-xl">إدارة الطلاب</CardTitle>
                <CardDescription className="text-gray-600">
                  إدارة شاملة لمعلومات الطلاب والفصول مع إمكانية التتبع والمراقبة
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mb-4 group-hover:bg-green-200 transition-colors">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">تتبع الحضور</CardTitle>
                <CardDescription className="text-gray-600">
                  نظام متقدم لتسجيل الحضور والغياب مع إشعارات فورية للأولياء
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-lg mb-4 group-hover:bg-yellow-200 transition-colors">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">نظام التحفيز</CardTitle>
                <CardDescription className="text-gray-600">
                  تحفيز الطلاب بالنجوم والأوسمة مع لوحة شرف تفاعلية
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mb-4 group-hover:bg-purple-200 transition-colors">
                  <MessageCircle className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">تكامل واتساب</CardTitle>
                <CardDescription className="text-gray-600">
                  إرسال الإشعارات والتحديثات للأولياء عبر واتساب بشكل تلقائي
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-pink-100 rounded-lg mb-4 group-hover:bg-pink-200 transition-colors">
                  <Camera className="h-6 w-6 text-pink-600" />
                </div>
                <CardTitle className="text-xl">الألبوم اليومي</CardTitle>
                <CardDescription className="text-gray-600">
                  مشاركة صور وأنشطة الطلاب مع الأولياء بروابط آمنة ومؤقتة
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-lg transition-all group">
              <CardHeader>
                <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg mb-4 group-hover:bg-gray-200 transition-colors">
                  <FileText className="h-6 w-6 text-gray-600" />
                </div>
                <CardTitle className="text-xl">التقارير الذكية</CardTitle>
                <CardDescription className="text-gray-600">
                  تقارير مفصلة عن الحضور والتطور والأنشطة مع إمكانية التصدير
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>

        {/* إحصائيات مثيرة للإعجاب */}
        <div className="mb-16 bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            لماذا يثق بنا المئات؟
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">500+</div>
              <div className="text-gray-600">حضانة تستخدم النظام</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">15K+</div>
              <div className="text-gray-600">طفل سعيد</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">99.9%</div>
              <div className="text-gray-600">معدل الرضا</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">24/7</div>
              <div className="text-gray-600">دعم فني</div>
            </div>
          </div>
        </div>

        {/* الميزات المتقدمة */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            ميزات متقدمة أكثر
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex items-start space-x-reverse space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">أمان متقدم</h3>
                <p className="text-gray-600">حماية شاملة للبيانات مع نسخ احتياطية تلقائية وتشفير متقدم</p>
              </div>
            </div>

            <div className="flex items-start space-x-reverse space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
                <Zap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">سرعة عالية</h3>
                <p className="text-gray-600">أداء متميز مع تحميل سريع واستجابة فورية لجميع العمليات</p>
              </div>
            </div>

            <div className="flex items-start space-x-reverse space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                <Smartphone className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">متوافق مع الجوال</h3>
                <p className="text-gray-600">تصميم متجاوب يعمل بسلاسة على جميع الأجهزة والشاشات</p>
              </div>
            </div>

            <div className="flex items-start space-x-reverse space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-xl">
              <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">توفير الوقت</h3>
                <p className="text-gray-600">أتمتة المهام الروتينية وتبسيط العمليات لتوفير ساعات من العمل</p>
              </div>
            </div>
          </div>
        </div>

        {/* التوصيات والآراء */}
        <Testimonials />

        {/* الأسعار المبسطة */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">
            خطط تناسب جميع الحضانات
          </h2>
          <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
            ابدأ مجاناً وارق لاحقاً حسب احتياجاتك
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm text-center">
              <CardHeader>
                <CardTitle className="text-2xl">المبتدئ</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">199</span>
                  <span className="text-gray-600 mr-2">ر.س/شهرياً</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">حتى 50 طالب</span>
                  </li>
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">3 معلمين</span>
                  </li>
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">ميزات أساسية</span>
                  </li>
                </ul>
                <Link to="/pricing">
                  <Button variant="outline" className="w-full">
                    اعرف المزيد
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-primary/5 to-purple-500/10 border-2 border-primary shadow-lg text-center relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white">
                  <Star className="h-3 w-3 ml-1" />
                  الأكثر شيوعاً
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">المحترف</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">399</span>
                  <span className="text-gray-600 mr-2">ر.س/شهرياً</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">حتى 150 طالب</span>
                  </li>
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">تكامل واتساب</span>
                  </li>
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">تقارير متقدمة</span>
                  </li>
                </ul>
                <Link to="/pricing">
                  <Button className="w-full">
                    ابدأ الآن
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm text-center">
              <CardHeader>
                <CardTitle className="text-2xl">المؤسسي</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">799</span>
                  <span className="text-gray-600 mr-2">ر.س/شهرياً</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">حتى 500 طالب</span>
                  </li>
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">مدير حساب مخصص</span>
                  </li>
                  <li className="flex items-center justify-center space-x-reverse space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">تخصيص كامل</span>
                  </li>
                </ul>
                <Link to="/pricing">
                  <Button variant="outline" className="w-full">
                    تواصل معنا
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Link to="/pricing">
              <Button variant="outline" size="lg">
                مقارنة جميع الخطط
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
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
