import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: any }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error?: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // إعداد مستمع تغيير حالة المصادقة أولاً
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // إنشاء ملف تعريف المستخدم إذا لم يكن موجوداً
        if (session?.user && event === 'SIGNED_IN') {
          setTimeout(async () => {
            try {
              console.log('=== AUTH STATE CHANGE: SIGNED_IN ===');
              console.log('User ID:', session.user.id);
              console.log('User email:', session.user.email);
              
              const { data: existingUser, error: fetchError } = await supabase
                .from('users')
                .select('id, role, is_active, tenant_id')
                .eq('id', session.user.id)
                .maybeSingle();

              console.log('Existing user data:', existingUser);
              console.log('Fetch error:', fetchError);

              if (existingUser && existingUser.is_active) {
                // المستخدم موجود ونشط - لا حاجة لأي تغيير
                console.log('User exists and is active, role:', existingUser.role);
                return;
              }
              
              if (!existingUser) {
                // إنشاء ملف تعريف جديد بدور افتراضي
                console.log('Creating new user profile');
                
                // تحديد دور المستخدم
                const isAdmin = session.user.email === 'admin@smartkindy.com';
                let userRole: 'super_admin' | 'admin' | 'guardian' = 'guardian';
                
                if (isAdmin) {
                  userRole = 'super_admin';
                } else {
                  // تحقق إذا كان البريد مرتبط بروضة
                  const { data: tenantData } = await supabase
                    .from('tenants')
                    .select('id, email')
                    .eq('email', session.user.email!)
                    .eq('status', 'approved')
                    .maybeSingle();
                  
                  if (tenantData) {
                    userRole = 'admin'; // مدير روضة
                  }
                }

                const { error: insertError } = await supabase
                  .from('users')
                  .insert([
                    {
                      id: session.user.id,
                      email: session.user.email!,
                      full_name: session.user.user_metadata?.full_name || '',
                      role: userRole,
                      is_active: true
                    }
                  ]);

                if (insertError) {
                  console.error('Error creating user profile:', insertError);
                } else {
                  console.log('User profile created successfully with role:', userRole);
                }
              } else if (!existingUser.is_active) {
                // تفعيل المستخدم إذا كان غير نشط
                console.log('Activating inactive user');
                const { error: updateError } = await supabase
                  .from('users')
                  .update({ is_active: true })
                  .eq('id', session.user.id);

                if (updateError) {
                  console.error('Error activating user:', updateError);
                } else {
                  console.log('User activated successfully');
                }
              }
            } catch (error) {
              console.error('Error handling user profile:', error);
            }
          }, 0);
        }
        
        setLoading(false);
      }
    );

    // ثم التحقق من الجلسة الحالية
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    let authError = null;
    
    try {
      // محاولة تسجيل الدخول العادي أولاً
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      authError = error;
      
      // إذا فشل تسجيل الدخول العادي، نتحقق من كلمة المرور المؤقتة
      if (error && error.message === 'Invalid login credentials') {
        
        // أولاً: التحقق من كلمة المرور المؤقتة للحضانة (مديري الحضانات)
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id, name, temp_password, password_reset_required')
          .eq('email', email)
          .eq('temp_password', password)
          .eq('status', 'approved')
          .maybeSingle();
          
        if (tenant && tenant.temp_password === password) {
          // محاولة إعادة إرسال بيانات الدخول للحضانة
          const { error: resendError } = await supabase.functions.invoke('send-login-credentials', {
            body: { tenantId: tenant.id }
          });
          
          if (!resendError) {
            throw new Error("تم إعادة إرسال بيانات الدخول. يرجى المحاولة مرة أخرى بعد دقيقتين.");
          }
        }
        
        // ثانياً: التحقق من كلمة المرور المؤقتة للمعلمين
        const { data: teacherData } = await supabase
          .from('users')
          .select(`
            id, 
            full_name, 
            tenant_id,
            tenants!inner (
              id,
              name,
              temp_password,
              password_reset_required
            )
          `)
          .eq('email', email)
          .eq('role', 'teacher')
          .eq('is_active', true)
          .maybeSingle();

        if (teacherData && teacherData.tenants.temp_password === password) {
          // إذا كانت كلمة المرور المؤقتة صحيحة للمعلم، نرسل بيانات دخول جديدة
          const { error: teacherResendError } = await supabase.functions.invoke('send-teacher-credentials', {
            body: { 
              teacherId: teacherData.id,
              tenantId: teacherData.tenant_id 
            }
          });
          
          if (!teacherResendError) {
            throw new Error("تم إرسال بيانات دخول جديدة للمعلمة عبر الواتساب. يرجى المحاولة مرة أخرى بعد دقيقتين.");
          } else {
            throw new Error("خطأ في إرسال بيانات الدخول للمعلمة. يرجى المحاولة لاحقاً.");
          }
        }
        
        // إذا لم نجد أي تطابق، نعرض رسالة خطأ واضحة
        if (!tenant && !teacherData) {
          throw new Error("بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور.");
        }
      }
    } catch (error: any) {
      authError = error;
    }

    if (authError) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: authError.message === 'Invalid login credentials' 
          ? "بيانات الدخول غير صحيحة. تأكد من البريد الإلكتروني وكلمة المرور المؤقتة" 
          : authError.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "مرحباً بك",
        description: "تم تسجيل الدخول بنجاح",
      });
    }

    return { error: authError };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        }
      }
    });

    if (error) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message === 'User already registered' 
          ? "هذا البريد الإلكتروني مسجل مسبقاً" 
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم إنشاء الحساب",
        description: "تم إنشاء حسابك بنجاح. يرجى التحقق من بريدك الإلكتروني لتفعيل الحساب.",
      });
    }

    return { error };
  };

  const signOut = async () => {
    try {
      // إنهاء الجلسة محلياً أولاً
      setUser(null);
      setSession(null);
      setLoading(false);
      
      // محاولة تسجيل الخروج من سوپابيس
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      
      // حتى لو كان هناك خطأ، نتأكد من إنهاء الجلسة المحلية
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
      
      // إعادة توجيه إلى صفحة تسجيل الدخول
      window.location.href = '/auth';
      
    } catch (error: any) {
      console.error('Logout error:', error);
      // حتى مع الخطأ، ننهي الجلسة المحلية
      setUser(null);
      setSession(null);
      
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
      
      window.location.href = '/auth';
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};