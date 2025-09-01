import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';

interface PasswordResetFormProps {
  onSuccess: () => void;
  tempPassword?: string;
}

const PasswordResetForm = ({ onSuccess, tempPassword }: PasswordResetFormProps) => {
  const [currentPassword, setCurrentPassword] = useState(tempPassword || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const validatePasswords = () => {
    if (newPassword.length < 8) {
      toast({
        title: "كلمة مرور ضعيفة",
        description: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
        variant: "destructive",
      });
      return false;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "كلمات المرور غير متطابقة",
        description: "يرجى التأكد من تطابق كلمة المرور الجديدة مع تأكيدها",
        variant: "destructive",
      });
      return false;
    }

    if (currentPassword === newPassword) {
      toast({
        title: "كلمة مرور مشابهة",
        description: "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswords()) return;

    setLoading(true);

    try {
      // تحديث كلمة المرور في Supabase Auth
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (updateError) throw updateError;

      // إذا كان هناك كلمة مرور مؤقتة، قم بتحديث حالة المستخدم
      if (tempPassword) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // تحديث حالة إعادة تعيين كلمة المرور
          const { error: tenantUpdateError } = await supabase
            .from('tenants')
            .update({ 
              password_reset_required: false,
              temp_password: null
            })
            .eq('owner_email', user.email);

          if (tenantUpdateError) {
            console.warn('Could not update tenant password reset status:', tenantUpdateError);
          }
        }
      }

      toast({
        title: "تم تغيير كلمة المرور بنجاح",
        description: "يمكنك الآن استخدام كلمة المرور الجديدة لتسجيل الدخول",
      });

      onSuccess();

    } catch (error: any) {
      console.error('Password reset error:', error);
      toast({
        title: "خطأ في تغيير كلمة المرور",
        description: error.message || "حدث خطأ أثناء تغيير كلمة المرور",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-yellow-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
          <Lock className="h-8 w-8 text-yellow-600" />
        </div>
        <CardTitle className="text-2xl">تغيير كلمة المرور</CardTitle>
        <CardDescription>
          {tempPassword 
            ? "مطلوب تغيير كلمة المرور المؤقتة قبل المتابعة"
            : "قم بتحديث كلمة المرور الخاصة بك"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {tempPassword && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <AlertDescription className="text-yellow-800">
              <strong>تنبيه:</strong> يجب تغيير كلمة المرور المؤقتة قبل الوصول للنظام
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">
              {tempPassword ? 'كلمة المرور المؤقتة' : 'كلمة المرور الحالية'}
            </Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder={tempPassword ? "كلمة المرور المؤقتة" : "كلمة المرور الحالية"}
                required
                disabled={!!tempPassword}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div>
            <Label htmlFor="newPassword">كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="أدخل كلمة المرور الجديدة"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">8 أحرف على الأقل</p>
          </div>

          <div>
            <Label htmlFor="confirmPassword">تأكيد كلمة المرور الجديدة</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="أعد إدخال كلمة المرور الجديدة"
                required
                minLength={8}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {newPassword && confirmPassword && newPassword === confirmPassword && (
            <div className="flex items-center space-x-reverse space-x-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm">كلمات المرور متطابقة</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || newPassword !== confirmPassword}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                جاري التحديث...
              </>
            ) : (
              'تحديث كلمة المرور'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default PasswordResetForm;