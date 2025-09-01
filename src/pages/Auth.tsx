import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Heart, Star, Users, UserCheck, Settings, BookOpen, Eye, Copy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CreateSuperAdmin } from '@/components/CreateSuperAdmin';
import PasswordResetForm from '@/components/PasswordResetForm';
import { supabase } from '@/integrations/supabase/client';

const smartKindyLogo = "/lovable-uploads/46a447fc-00fa-49c5-b6ae-3f7b46fc4691.png";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '' });
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const { signIn, signUp, user } = useAuth();
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

  // التحقق من الحاجة لإعادة تعيين كلمة المرور
  useEffect(() => {
    const checkPasswordResetRequired = async () => {
      if (user?.email) {
        const { data: tenant } = await supabase
          .from('tenants')
          .select('password_reset_required, temp_password')
          .eq('owner_email', user.email)
          .eq('password_reset_required', true)
          .single();

        if (tenant) {
          setTempPassword(tenant.temp_password);
          setShowPasswordReset(true);
        }
      }
    };

    checkPasswordResetRequired();
  }, [user]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(signInForm.email, signInForm.password);
    
    if (!error) {
      // التحقق من الحاجة لإعادة تعيين كلمة المرور
      const { data: tenant } = await supabase
        .from('tenants')
        .select('password_reset_required, temp_password')
        .eq('owner_email', signInForm.email)
        .eq('password_reset_required', true)
        .single();

      if (tenant) {
        setTempPassword(tenant.temp_password);
        setShowPasswordReset(true);
      } else {
        navigate('/dashboard');
      }
    }
    
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signUpForm.password !== signUpForm.confirmPassword) {
      return;
    }
    
    setLoading(true);
    
    const { error } = await signUp(signUpForm.email, signUpForm.password, signUpForm.fullName);
    
    if (!error) {
      // المستخدم بحاجة لتأكيد البريد الإلكتروني
      setSignUpForm({ email: '', password: '', fullName: '', confirmPassword: '' });
    }
    
    setLoading(false);
  };

  // عرض نموذج إعادة تعيين كلمة المرور إذا كان مطلوباً
  if (showPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <PasswordResetForm 
          tempPassword={tempPassword || undefined}
          onSuccess={() => {
            setShowPasswordReset(false);
            setTempPassword(null);
            navigate('/dashboard');
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-300 rounded-full opacity-20 animate-bounce delay-1000"></div>
        <div className="absolute top-32 right-20 w-16 h-16 bg-pink-300 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute bottom-20 left-32 w-12 h-12 bg-blue-300 rounded-full opacity-20 animate-bounce delay-500"></div>
        <div className="absolute bottom-32 right-10 w-24 h-24 bg-green-300 rounded-full opacity-20 animate-pulse delay-300"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* شعار/عنوان المنصة */}
        <div className="text-center mb-8">
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">SmartKindy</h1>
          <p className="text-gray-600 font-medium">منصة إدارة رياض الأطفال الذكية</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">مرحباً بك</CardTitle>
            <CardDescription>سجل دخولك أو أنشئ حساباً جديداً أو جرب النظام</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">حساب جديد</TabsTrigger>
                <TabsTrigger value="password">كلمة المرور</TabsTrigger>
                <TabsTrigger value="admin">إنشاء مدير</TabsTrigger>
              </TabsList>


              {/* تسجيل الدخول */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signInForm.email}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="أدخل بريدك الإلكتروني"
                      required
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">كلمة المرور</Label>
                    <Input
                      id="password"
                      type="password"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="أدخل كلمة المرور"
                      required
                    />
                  </div>
                  
                  {/* رسالة توضيحية للمعلمين */}
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1">📝 للمعلمات:</p>
                    <p>إذا لم تتلقي بيانات الدخول، أدخلي بريدك الإلكتروني وكلمة المرور المؤقتة <strong>TK94303549</strong> وسيتم إرسال بيانات دخول جديدة عبر الواتساب.</p>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري تسجيل الدخول...
                      </>
                    ) : (
                      'تسجيل الدخول'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* إنشاء حساب جديد */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={signUpForm.fullName}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder="أدخل اسمك الكامل"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signupEmail">البريد الإلكتروني</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="أدخل بريدك الإلكتروني"
                      required
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signupPassword">كلمة المرور</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="أدخل كلمة المرور"
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">تأكيد كلمة المرور</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={signUpForm.confirmPassword}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="أعد إدخال كلمة المرور"
                      required
                      minLength={6}
                    />
                    {signUpForm.password && signUpForm.confirmPassword && signUpForm.password !== signUpForm.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">كلمات المرور غير متطابقة</p>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={loading || signUpForm.password !== signUpForm.confirmPassword}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        جاري إنشاء الحساب...
                      </>
                    ) : (
                      'إنشاء حساب جديد'
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* تغيير كلمة المرور */}
              <TabsContent value="password">
                <div className="space-y-4 text-center">
                  <p className="text-sm text-gray-600">
                    لتغيير كلمة المرور، يرجى تسجيل الدخول أولاً
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: "تغيير كلمة المرور",
                        description: "يرجى تسجيل الدخول أولاً لتتمكن من تغيير كلمة المرور",
                      });
                    }}
                  >
                    تسجيل الدخول لتغيير كلمة المرور
                  </Button>
                </div>
              </TabsContent>

              {/* إنشاء مدير عام */}
              <TabsContent value="admin">
                <div className="flex justify-center">
                  <CreateSuperAdmin />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ميزات سريعة */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
            <Users className="h-6 w-6 text-blue-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600">إدارة الطلاب</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
            <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600">نظام التحفيز</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
            <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600">تواصل الأولياء</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;