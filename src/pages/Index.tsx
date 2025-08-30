import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Star, Users, MessageCircle, Calendar, Settings, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

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
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-reverse space-x-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">SmartKindy</h1>
            </div>
            <div className="flex items-center space-x-reverse space-x-4">
              <Link to="/auth">
                <Button variant="outline" size="sm">
                  تسجيل الدخول
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">
                  ابدأ الآن
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* القسم الترحيبي */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-primary/10 p-4 rounded-full">
              <Heart className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            SmartKindy
          </h1>
          <p className="text-xl text-gray-600 mb-2 max-w-3xl mx-auto leading-relaxed">
            منصة إدارة رياض الأطفال الذكية
          </p>
          <p className="text-lg text-gray-500 mb-8 max-w-2xl mx-auto">
            نظام شامل لإدارة الحضانات مع تكامل واتساب وتتبع الحضور ونظام التحفيز
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="text-lg px-8 py-3">
                ابدأ رحلتك الآن
                <ArrowLeft className="mr-2 h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="lg" className="text-lg px-8 py-3" disabled>
              جولة تعريفية (قريباً)
            </Button>
          </div>
        </div>

        {/* الميزات الرئيسية */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            ميزات المنصة
          </h2>
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
                  <Heart className="h-6 w-6 text-pink-600" />
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
                  <Settings className="h-6 w-6 text-gray-600" />
                </div>
                <CardTitle className="text-xl">إدارة متقدمة</CardTitle>
                <CardDescription className="text-gray-600">
                  لوحة تحكم شاملة مع تقارير مفصلة وإعدادات قابلة للتخصيص
                </CardDescription>
              </CardHeader>
            </Card>
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
          <Link to="/auth">
            <Button size="lg" className="text-lg px-12 py-4">
              ابدأ مجاناً الآن
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* الفوتر */}
      <footer className="relative z-10 bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-reverse space-x-2 mb-4">
              <div className="bg-primary/10 p-2 rounded-full">
                <Heart className="h-5 w-5 text-primary" />
              </div>
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
