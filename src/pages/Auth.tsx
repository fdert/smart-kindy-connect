import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';
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
import { LanguageSwitcher } from '@/components/ui/language-switcher';

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
  const { t, language } = useLanguage();

  // الحسابات التجريبية
  const demoAccounts = [
    {
      role: 'super_admin',
      title: language === 'ar' ? 'مدير عام النظام' : 'System Super Admin',
      email: 'superadmin@smartkindy.com',
      password: 'demo123456',
      description: language === 'ar' ? 'إدارة شاملة لجميع الحضانات والاشتراكات' : 'Comprehensive management of all nurseries and subscriptions',
      icon: Settings,
      color: 'bg-purple-500',
      features: language === 'ar' 
        ? ['إدارة جميع الحضانات', 'إدارة الاشتراكات والفواتير', 'إحصائيات شاملة', 'إدارة المستخدمين']
        : ['Manage all nurseries', 'Manage subscriptions & billing', 'Comprehensive statistics', 'User management']
    },
    {
      role: 'owner',
      title: language === 'ar' ? 'مدير الروضة' : 'Nursery Manager',
      email: 'owner@smartkindy.com',
      password: 'demo123456',
      description: language === 'ar' ? 'إدارة كاملة للروضة والطلاب والمعلمين' : 'Complete management of nursery, students and teachers',
      icon: UserCheck,
      color: 'bg-blue-500',
      features: language === 'ar' 
        ? ['إدارة الطلاب والفصول', 'إدارة المعلمين', 'تقارير مفصلة', 'إعدادات الروضة']
        : ['Manage students & classes', 'Teacher management', 'Detailed reports', 'Nursery settings']
    },
    {
      role: 'teacher',
      title: language === 'ar' ? 'المعلمة' : 'Teacher',
      email: 'teacher@smartkindy.com',
      password: 'demo123456',
      description: language === 'ar' ? 'متابعة الطلاب وتسجيل الحضور والأنشطة' : 'Student monitoring, attendance tracking and activities',
      icon: BookOpen,
      color: 'bg-green-500',
      features: language === 'ar' 
        ? ['تسجيل الحضور', 'منح المكافآت', 'رفع صور الأنشطة', 'متابعة الطلاب']
        : ['Record attendance', 'Award rewards', 'Upload activity photos', 'Monitor students']
    },
    {
      role: 'guardian',
      title: language === 'ar' ? 'ولي الأمر' : 'Guardian/Parent',
      email: 'parent@smartkindy.com',
      password: 'demo123456',
      description: language === 'ar' ? 'متابعة طفلك وتلقي التحديثات والصور' : 'Monitor your child and receive updates and photos',
      icon: Heart,
      color: 'bg-pink-500',
      features: language === 'ar' 
        ? ['متابعة حضور الطفل', 'تلقي إشعارات واتساب', 'مشاهدة صور الأنشطة', 'تتبع المكافآت']
        : ['Track child attendance', 'Receive WhatsApp notifications', 'View activity photos', 'Track rewards']
    }
  ];

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('auth.copy_success'),
      description: t('auth.copy_success_desc').replace('{type}', type),
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
        title: t('auth.login_error_title'),
        description: t('auth.login_error_desc'),
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
      console.log('=== SIGN IN SUCCESSFUL ===');
      console.log('User signed in, checking role...');
      // لا نحتاج للتوجيه هنا لأن useAuthRedirect سيتولى ذلك
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
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="relative">
              <img 
                src={smartKindyLogo} 
                alt={t('auth.platform_name')} 
                className="h-20 w-20 object-contain drop-shadow-lg"
              />
              <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-full blur-lg animate-pulse-soft"></div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('auth.platform_name')}</h1>
          <p className="text-gray-600 font-medium">{t('auth.platform_description')}</p>
        </div>

        <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-gray-900">{t('auth.welcome')}</CardTitle>
            <CardDescription>{t('auth.description')}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="signin">{t('auth.signin')}</TabsTrigger>
                <TabsTrigger value="signup">{t('auth.signup')}</TabsTrigger>
                <TabsTrigger value="password">{t('auth.password_reset')}</TabsTrigger>
                <TabsTrigger value="admin">{t('auth.admin_create')}</TabsTrigger>
              </TabsList>


              {/* تسجيل الدخول */}
              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Label htmlFor="email">{t('auth.email')}</Label>
                    <Input
                      id="email"
                      type="email"
                      value={signInForm.email}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t('auth.email_placeholder')}
                      required
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">{t('auth.password')}</Label>
                    <Input
                      id="password"
                      type="password"
                      value={signInForm.password}
                      onChange={(e) => setSignInForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={t('auth.password_placeholder')}
                      required
                    />
                  </div>
                  
                  {/* رسالة توضيحية للمعلمين */}
                  <div className="bg-blue-50 p-3 rounded-lg text-sm text-blue-800">
                    <p className="font-medium mb-1">📝 {t('auth.teacher_note')}</p>
                    <p>{t('auth.teacher_instruction')}</p>
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                        {t('auth.signing_in')}
                      </>
                    ) : (
                      t('auth.signin')
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* إنشاء حساب جديد */}
              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Label htmlFor="fullName">{t('auth.full_name')}</Label>
                    <Input
                      id="fullName"
                      type="text"
                      value={signUpForm.fullName}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, fullName: e.target.value }))}
                      placeholder={t('auth.full_name_placeholder')}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="signupEmail">{t('auth.email')}</Label>
                    <Input
                      id="signupEmail"
                      type="email"
                      value={signUpForm.email}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder={t('auth.email_placeholder')}
                      required
                      className="text-right"
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="signupPassword">{t('auth.password')}</Label>
                    <Input
                      id="signupPassword"
                      type="password"
                      value={signUpForm.password}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder={t('auth.password_placeholder')}
                      required
                      minLength={6}
                    />
                  </div>
                  <div>
                    <Label htmlFor="confirmPassword">{t('auth.confirm_password')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={signUpForm.confirmPassword}
                      onChange={(e) => setSignUpForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder={t('auth.confirm_password_placeholder')}
                      required
                      minLength={6}
                    />
                    {signUpForm.password && signUpForm.confirmPassword && signUpForm.password !== signUpForm.confirmPassword && (
                      <p className="text-sm text-red-500 mt-1">{t('auth.passwords_dont_match')}</p>
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
                        {t('auth.creating_account')}
                      </>
                    ) : (
                      t('auth.create_new_account')
                    )}
                  </Button>
                </form>
              </TabsContent>

              {/* تغيير كلمة المرور */}
              <TabsContent value="password">
                <div className="space-y-4 text-center">
                  <p className="text-sm text-gray-600">
                    {t('auth.change_password_instruction')}
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      toast({
                        title: t('auth.change_password_toast_title'),
                        description: t('auth.change_password_toast_desc'),
                      });
                    }}
                  >
                    {t('auth.login_to_change_password')}
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
            <p className="text-xs text-gray-600">{t('auth.students_management')}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
            <Star className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600">{t('auth.reward_system')}</p>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-lg p-3">
            <Heart className="h-6 w-6 text-pink-500 mx-auto mb-2" />
            <p className="text-xs text-gray-600">{t('auth.parent_communication')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;