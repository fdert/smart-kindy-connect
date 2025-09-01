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
              const { data: existingUser } = await supabase
                .from('users')
                .select('id, role')
                .eq('id', session.user.id)
                .maybeSingle();

                if (!existingUser) {
                // تحقق من البريد الإلكتروني لمعرفة نوع الحساب
                const isAdmin = session.user.email === 'admin@smartkindy.com';
                
                // تحقق إذا كان هذا حساب مدير روضة
                let userRole: 'super_admin' | 'admin' | 'guardian' = 'guardian';
                if (isAdmin) {
                  userRole = 'super_admin';
                } else {
                  // تحقق إذا كان البريد مرتبط بروضة
                  const { data: tenantData } = await supabase
                    .from('tenants')
                    .select('id, email')
                    .eq('email', session.user.email!)
                    .maybeSingle();
                  
                  if (tenantData) {
                    userRole = 'admin'; // مدير روضة
                  }
                }
                
                const { error } = await supabase
                  .from('users')
                  .insert([
                    {
                      id: session.user.id,
                      email: session.user.email!,
                      full_name: session.user.user_metadata?.full_name || '',
                      role: userRole
                    }
                  ]);

                if (error) {
                  console.error('Error creating user profile:', error);
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
    // أولاً، نتحقق إذا كان هذا تسجيل دخول بكلمة مرور مؤقتة لحضانة
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
        const { data: tenant } = await supabase
          .from('tenants')
          .select('id, name, temp_password, password_reset_required')
          .eq('email', email)
          .eq('temp_password', password)
          .eq('status', 'approved')
          .maybeSingle();
          
          if (tenant && tenant.temp_password === password) {
            // محاولة تسجيل الدخول مباشرة (الحساب يجب أن يكون موجود بالفعل)
            const { error: directSignInError } = await supabase.auth.signInWithPassword({
              email,
              password,
            });
            
            if (!directSignInError) {
              // تأكد من أن المستخدم لديه الصلاحية الصحيحة (admin)
              const { data: { user: currentUser } } = await supabase.auth.getUser();
              if (currentUser) {
                await supabase
                  .from('users')
                  .upsert([
                    {
                      id: currentUser.id,
                      email: currentUser.email!,
                      full_name: currentUser.user_metadata?.full_name || '',
                      role: 'admin' as const
                    }
                  ]);
              }
              authError = null;
            } else {
            // إذا فشل التسجيل، نرسل طلب لتحديث بيانات الدخول
            const { error: resendError } = await supabase.functions.invoke('send-login-credentials', {
              body: { tenantId: tenant.id }
            });
            
            if (!resendError) {
              throw new Error("تم إعادة إرسال بيانات الدخول. يرجى المحاولة مرة أخرى بعد دقيقتين.");
            } else {
              throw new Error("خطأ في تحديث بيانات الدخول. يرجى المحاولة لاحقاً.");
            }
          }
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
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء تسجيل الخروج",
        variant: "destructive",
      });
    } else {
      toast({
        title: "تم تسجيل الخروج",
        description: "تم تسجيل خروجك بنجاح",
      });
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