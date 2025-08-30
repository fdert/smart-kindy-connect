import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Loader2, 
  Heart, 
  Star, 
  Users, 
  UserCheck, 
  Settings, 
  BookOpen, 
  Eye, 
  Copy,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { Link } from 'react-router-dom';

const smartKindyLogo = "/lovable-uploads/46a447fc-00fa-49c5-b6ae-3f7b46fc4691.png";

const Demo = () => {
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // الحسابات التجريبية
  const demoAccounts = [
    {
      role: 'super_admin',
      title: 'مدير عام النظام',
      email: 'superadmin@smartkindy.com',
      password: 'demo123456',
      description: 'إدارة شاملة لجميع الحضانات والاشتراكات',
      icon: Settings,
      color: 'bg-purple-500',
      features: ['إدارة جميع الحضانات', 'إدارة الاشتراكات والفواتير', 'إحصائيات شاملة', 'إدارة المستخدمين']
    },
    {
      role: 'owner',
      title: 'مدير الروضة',
      email: 'owner@smartkindy.com',
      password: 'demo123456',
      description: 'إدارة كاملة للروضة والطلاب والمعلمين',
      icon: UserCheck,
      color: 'bg-blue-500',
      features: ['إدارة الطلاب والفصول', 'إدارة المعلمين', 'تقارير مفصلة', 'إعدادات الروضة']
    },
    {
      role: 'teacher',
      title: 'المعلمة',
      email: 'teacher@smartkindy.com',
      password: 'demo123456',
      description: 'متابعة الطلاب وتسجيل الحضور والأنشطة',
      icon: BookOpen,
      color: 'bg-green-500',
      features: ['تسجيل الحضور', 'منح المكافآت', 'رفع صور الأنشطة', 'متابعة الطلاب']
    },
    {
      role: 'guardian',
      title: 'ولي الأمر',
      email: 'parent@smartkindy.com',
      password: 'demo123456',
      description: 'متابعة طفلك وتلقي التحديثات والصور',
      icon: Heart,
      color: 'bg-pink-500',
      features: ['متابعة حضور الطفل', 'تلقي إشعارات واتساب', 'مشاهدة صور الأنشطة', 'تتبع المكافآت']
    }
  ];

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "تم النسخ",
      description: `تم نسخ ${type} بنجاح`,
      duration: 2000,
    });
  };

  const loginWithDemo = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await signIn(email, password);
    
    if (!error) {
      navigate('/dashboard');
    } else {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: "تأكد من صحة البيانات أو تواصل مع الدعم الفني",
        variant: "destructive",
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-bounce delay-1000"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-pink-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 bg-blue-300 rounded-full opacity-20 animate-bounce delay-500"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 bg-green-300 rounded-full opacity-20 animate-pulse delay-300"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
        {/* الهيدر */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center mb-6 text-gray-600 hover:text-primary transition-colors">
            <ArrowRight className="h-4 w-4 ml-2" />
            العودة للصفحة الرئيسية
          </Link>
          
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy - منصة إدارة رياض الأطفال الذكية" 
                className="h-20 w-20 object-contain drop-shadow-lg"
              />
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-lg animate-pulse-soft"></div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">تجربة نظام SmartKindy</h1>
          <p className="text-gray-600 font-medium mb-4">اختر أي دور لتجربة النظام بشكل كامل مع بيانات تجريبية</p>
          <p className="text-sm text-gray-500">جميع الحسابات تستخدم كلمة المرور: <code className="bg-gray-100 px-2 py-1 rounded">demo123456</code></p>
        </div>

        {/* الحسابات التجريبية */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {demoAccounts.map((account) => {
            const IconComponent = account.icon;
            return (
              <Card key={account.role} className="border border-gray-200 hover:border-primary/50 transition-all hover:shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-reverse space-x-3">
                      <div className={`p-3 rounded-lg ${account.color} text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-gray-900 mb-1">{account.title}</CardTitle>
                        <CardDescription className="text-gray-600">{account.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">تجريبي</Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                    {account.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-reverse space-x-2 text-sm text-gray-600">
                        <div className="w-1.5 h-1.5 bg-primary rounded-full flex-shrink-0"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">البريد الإلكتروني:</span>
                      <button
                        onClick={() => copyToClipboard(account.email, 'البريد الإلكتروني')}
                        className="flex items-center space-x-reverse space-x-1 text-gray-700 hover:text-primary transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="font-mono text-xs">{account.email}</span>
                      </button>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">كلمة المرور:</span>
                      <button
                        onClick={() => copyToClipboard(account.password, 'كلمة المرور')}
                        className="flex items-center space-x-reverse space-x-1 text-gray-700 hover:text-primary transition-colors"
                      >
                        <Copy className="h-3 w-3" />
                        <span className="font-mono text-xs">{account.password}</span>
                      </button>
                    </div>

                    <Button
                      onClick={() => loginWithDemo(account.email, account.password)}
                      disabled={loading}
                      className="w-full"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin ml-2" />
                      ) : (
                        <>
                          <Eye className="h-4 w-4 ml-2" />
                          تجربة هذا الدور
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* معلومات إضافية */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="text-center">
            <h3 className="font-semibold text-blue-900 mb-3 text-lg">💡 نصائح مهمة للتجربة</h3>
            <div className="text-blue-800 space-y-2">
              <p>• جميع البيانات تجريبية ويمكن التعديل عليها بحرية</p>
              <p>• تحتوي التجربة على حضانة وهمية مع 3 طلاب و2 فصول</p>
              <p>• جرب إضافة طلاب جدد وتسجيل الحضور ومنح المكافآت</p>
              <p>• تتضمن التجربة جميع ميزات النظام الكاملة بما في ذلك واتساب</p>
            </div>
          </div>
        </div>

        {/* أزرار التنقل */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link to="/tour">
            <Button variant="outline" size="lg" className="text-lg px-8 py-3">
              مشاهدة الجولة التعريفية
              <Star className="mr-2 h-5 w-5" />
            </Button>
          </Link>
          
          <Link to="/auth">
            <Button size="lg" className="text-lg px-8 py-3">
              لديك حساب؟ سجل دخولك
              <ArrowLeft className="mr-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Demo;