import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Shield } from 'lucide-react';

export const CreateSuperAdmin = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createSuperAdmin = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://ytjodudlnfamvnescumu.supabase.co/functions/v1/create-super-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "تم إنشاء الحساب بنجاح",
          description: `البريد الإلكتروني: ${data.credentials.email}\nكلمة المرور: ${data.credentials.password}`,
        });
      } else {
        throw new Error(data.error || 'حدث خطأ غير معروف');
      }
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الحساب",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>إنشاء حساب المدير العام</CardTitle>
        <CardDescription>
          إنشاء حساب حقيقي للمدير العام للنظام
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={createSuperAdmin} 
          disabled={loading}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              جاري الإنشاء...
            </>
          ) : (
            'إنشاء حساب المدير العام'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};