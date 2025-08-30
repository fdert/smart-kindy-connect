import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, BookOpen, Heart, UserCheck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const DemoAccountsManager = () => {
  const [loading, setLoading] = useState(false);
  const [createdAccounts, setCreatedAccounts] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const demoAccounts = [
    {
      role: 'super_admin' as const,
      title: 'مدير عام النظام',
      email: 'superadmin@smartkindy.com',
      password: 'demo123456',
      fullName: 'مدير عام النظام',
      icon: Settings,
      color: 'bg-purple-500',
      tenant_id: null
    },
    {
      role: 'owner' as const,
      title: 'مدير الروضة',
      email: 'owner@smartkindy.com',
      password: 'demo123456',
      fullName: 'مدير الروضة',
      icon: UserCheck,
      color: 'bg-blue-500',
      tenant_id: '11111111-1111-1111-1111-111111111111'
    },
    {
      role: 'teacher' as const,
      title: 'المعلمة سارة',
      email: 'teacher@smartkindy.com',
      password: 'demo123456',
      fullName: 'المعلمة سارة',
      icon: BookOpen,
      color: 'bg-green-500',
      tenant_id: '11111111-1111-1111-1111-111111111111'
    },
    {
      role: 'guardian' as const,
      title: 'ولي أمر تجريبي',
      email: 'parent@smartkindy.com',
      password: 'demo123456',
      fullName: 'ولي أمر تجريبي',
      icon: Heart,
      color: 'bg-pink-500',
      tenant_id: '11111111-1111-1111-1111-111111111111'
    }
  ];

  const createDemoAccount = async (account: typeof demoAccounts[0]) => {
    try {
      // 1. إنشاء المستخدم في نظام المصادقة
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: account.email,
        password: account.password,
        email_confirm: true,
        user_metadata: {
          full_name: account.fullName
        }
      });

      if (authError) {
        console.error('خطأ في إنشاء المستخدم في نظام المصادقة:', authError);
        throw authError;
      }

      if (!authData.user) {
        throw new Error('لم يتم إنشاء المستخدم');
      }

      // 2. إضافة المستخدم إلى جدول users
      const { error: userError } = await supabase
        .from('users')
        .upsert({
          id: authData.user.id,
          email: account.email,
          full_name: account.fullName,
          role: account.role,
          tenant_id: account.tenant_id,
          is_active: true
        }, {
          onConflict: 'id'
        });

      if (userError) {
        console.error('خطأ في إضافة المستخدم إلى جدول users:', userError);
        throw userError;
      }

      // 3. تحديث owner_id في tenants إذا كان المستخدم owner
      if (account.role === 'owner' && account.tenant_id) {
        const { error: tenantError } = await supabase
          .from('tenants')
          .update({ owner_id: authData.user.id })
          .eq('id', account.tenant_id);

        if (tenantError) {
          console.error('خطأ في تحديث owner_id:', tenantError);
        }
      }

      // 4. تحديث teacher_id في classes إذا كان المستخدم teacher
      if (account.role === 'teacher' && account.tenant_id) {
        const { error: classError } = await supabase
          .from('classes')
          .update({ teacher_id: authData.user.id })
          .eq('tenant_id', account.tenant_id);

        if (classError) {
          console.error('خطأ في تحديث teacher_id:', classError);
        }
      }

      // 5. ربط المستخدم مع بيانات guardian إذا كان guardian
      if (account.role === 'guardian' && account.tenant_id) {
        const { error: guardianError } = await supabase
          .from('guardians')
          .update({ user_id: authData.user.id })
          .eq('email', account.email)
          .eq('tenant_id', account.tenant_id);

        if (guardianError) {
          console.error('خطأ في ربط المستخدم مع بيانات guardian:', guardianError);
        }
      }

      setCreatedAccounts(prev => new Set([...prev, account.role]));
      
      toast({
        title: "تم إنشاء الحساب بنجاح",
        description: `تم إنشاء حساب ${account.title} بنجاح`,
      });

      return true;
    } catch (error: any) {
      console.error('خطأ في إنشاء الحساب:', error);
      
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message || 'حدث خطأ غير متوقع',
        variant: "destructive",
      });

      return false;
    }
  };

  const createAllDemoAccounts = async () => {
    setLoading(true);
    
    for (const account of demoAccounts) {
      await createDemoAccount(account);
      // انتظار قصير بين كل حساب
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    setLoading(false);
  };

  const checkAccountExists = async (email: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    
    return !error && data;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          إدارة الحسابات التجريبية
        </CardTitle>
        <CardDescription>
          إنشاء الحسابات التجريبية لجميع الأدوار للسماح للعملاء بتجربة النظام
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">الحسابات التجريبية</h3>
            <Button 
              onClick={createAllDemoAccounts}
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الإنشاء...
                </>
              ) : (
                'إنشاء جميع الحسابات'
              )}
            </Button>
          </div>

          <div className="grid gap-4">
            {demoAccounts.map((account) => {
              const IconComponent = account.icon;
              const isCreated = createdAccounts.has(account.role);
              
              return (
                <Card key={account.role} className="border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-reverse space-x-3">
                        <div className={`p-2 rounded-lg ${account.color} text-white`}>
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{account.title}</h4>
                          <p className="text-sm text-gray-600">{account.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {isCreated ? (
                          <Badge variant="default" className="bg-green-500">
                            <CheckCircle className="h-3 w-3 ml-1" />
                            تم الإنشاء
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            <AlertCircle className="h-3 w-3 ml-1" />
                            غير منشأ
                          </Badge>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => createDemoAccount(account)}
                          disabled={loading || isCreated}
                        >
                          {loading ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : isCreated ? (
                            'تم الإنشاء'
                          ) : (
                            'إنشاء'
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2">📋 معلومات الدخول</h4>
            <div className="text-sm text-yellow-800 space-y-1">
              <p><strong>كلمة المرور الموحدة:</strong> demo123456</p>
              <p><strong>ملاحظة:</strong> جميع الحسابات تستخدم نفس كلمة المرور للتسهيل على العملاء</p>
              <p><strong>الغرض:</strong> هذه الحسابات مخصصة للتجربة والعرض فقط</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DemoAccountsManager;