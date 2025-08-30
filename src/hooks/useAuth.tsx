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
      async (event, session) => {
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
                
                const { error } = await supabase
                  .from('users')
                  .insert([
                    {
                      id: session.user.id,
                      email: session.user.email!,
                      full_name: session.user.user_metadata?.full_name || '',
                      role: isAdmin ? 'super_admin' : 'guardian'
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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message === 'Invalid login credentials' 
          ? "بيانات الدخول غير صحيحة" 
          : error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "مرحباً بك",
        description: "تم تسجيل الدخول بنجاح",
      });
    }

    return { error };
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