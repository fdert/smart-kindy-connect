import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Heart, Star, Users } from 'lucide-react';

const smartKindyLogo = "/lovable-uploads/46a447fc-00fa-49c5-b6ae-3f7b46fc4691.png";

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [signInForm, setSignInForm] = useState({ email: '', password: '' });
  const [signUpForm, setSignUpForm] = useState({ email: '', password: '', fullName: '', confirmPassword: '' });
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(signInForm.email, signInForm.password);
    
    if (!error) {
      navigate('/dashboard');
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
            <CardDescription>سجل دخولك أو أنشئ حساباً جديداً</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
                <TabsTrigger value="signup">حساب جديد</TabsTrigger>
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