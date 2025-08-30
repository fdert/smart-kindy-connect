import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Building, Mail, Phone, MapPin, User, Check } from 'lucide-react';

interface RegistrationForm {
  name: string;
  slug: string;
  email: string;
  phone: string;
  address: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
}

const TenantRegistration = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<RegistrationForm>({
    name: '',
    slug: '',
    email: '',
    phone: '',
    address: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: ''
  });

  const handleInputChange = (field: keyof RegistrationForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name') {
      const slug = value
        .toLowerCase()
        .replace(/[أإآ]/g, 'ا')
        .replace(/[ة]/g, 'ه')
        .replace(/[ء]/g, '')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u0600-\u06FF-]/g, '')
        .substring(0, 50);
      setForm(prev => ({ ...prev, slug }));
    }
  };

  const validateForm = (): string | null => {
    if (!form.name.trim()) return 'اسم الحضانة مطلوب';
    if (!form.slug.trim()) return 'معرف الحضانة مطلوب';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) return 'بريد إلكتروني صحيح مطلوب';
    if (!form.phone.trim()) return 'رقم الهاتف مطلوب';
    if (!form.address.trim()) return 'العنوان مطلوب';
    if (!form.ownerName.trim()) return 'اسم المالك مطلوب';
    if (!form.ownerEmail.trim() || !/\S+@\S+\.\S+/.test(form.ownerEmail)) return 'بريد المالك الإلكتروني مطلوب';
    if (!form.ownerPhone.trim()) return 'رقم هاتف المالك مطلوب';

    if (form.slug.length < 3 || form.slug.length > 50) {
      return 'معرف الحضانة يجب أن يكون بين 3 و 50 حرف';
    }

    if (!/^[a-z0-9\u0600-\u06FF-]+$/.test(form.slug)) {
      return 'معرف الحضانة يمكن أن يحتوي على أحرف وأرقام وشرطات فقط';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      toast({
        title: "خطأ في البيانات",
        description: validationError,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Check if slug is already taken
      const { data: existingTenant } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', form.slug)
        .limit(1);

      if (existingTenant && existingTenant.length > 0) {
        toast({
          title: "معرف محجوز",
          description: "هذا المعرف محجوز بالفعل، يرجى اختيار معرف آخر",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Register tenant
      const { data: tenant, error: tenantError } = await supabase
        .from('tenants')
        .insert([
          {
            name: form.name.trim(),
            slug: form.slug.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
            address: form.address.trim(),
            status: 'pending'
          }
        ])
        .select('id')
        .single();

      if (tenantError) throw tenantError;

      // Create owner account (we'll need to handle this differently since we can't create auth users directly)
      // For now, we'll store the owner info and create the account after approval
      
      setSubmitted(true);
      toast({
        title: "تم إرسال الطلب بنجاح",
        description: "سيتم مراجعة طلبك وإرسال تفاصيل الدخول عبر البريد الإلكتروني خلال 24-48 ساعة",
      });

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "خطأ في التسجيل",
        description: error.message || "حدث خطأ أثناء إرسال الطلب، يرجى المحاولة مرة أخرى",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-green-100 rounded-full p-3 w-16 h-16 flex items-center justify-center mb-4">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl text-green-700">تم إرسال الطلب بنجاح!</CardTitle>
            <CardDescription className="text-center">
              شكراً لك على تسجيل حضانة {form.name}. سيتم مراجعة طلبك من قبل فريق SmartKindy وسنتواصل معك خلال 24-48 ساعة.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">الخطوات التالية:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• مراجعة البيانات من قبل الفريق المختص</li>
                <li>• إرسال تفاصيل الدخول عبر البريد الإلكتروني</li>
                <li>• بدء استخدام المنصة والاستفادة من جميع الميزات</li>
              </ul>
            </div>
            <div className="flex space-x-reverse space-x-2">
              <Button 
                className="flex-1" 
                onClick={() => navigate('/')}
              >
                العودة للرئيسية
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/auth')}
              >
                تسجيل الدخول
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">تسجيل حضانة جديدة</h1>
          <p className="text-lg text-gray-600">انضم إلى SmartKindy وابدأ رحلة إدارة حضانتك بذكاء</p>
        </div>

        <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="h-5 w-5 ml-2" />
              معلومات الحضانة
            </CardTitle>
            <CardDescription>
              يرجى ملء جميع البيانات المطلوبة بدقة لمراجعة طلبك
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* معلومات الحضانة */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">اسم الحضانة *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="مثال: حضانة الأطفال السعداء"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">معرف الحضانة (للدومين الفرعي) *</Label>
                  <Input
                    id="slug"
                    type="text"
                    value={form.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="happy-kids"
                    className="text-left"
                    dir="ltr"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    سيكون رابط حضانتك: https://{form.slug || 'your-nursery'}.smartkindy.com
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">البريد الإلكتروني للحضانة *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="info@nursery.com"
                      className="text-left"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone">رقم الهاتف *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="text-left"
                      dir="ltr"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="address">العنوان *</Label>
                  <Textarea
                    id="address"
                    value={form.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="الحي، الشارع، رقم المبنى، المدينة"
                    required
                  />
                </div>
              </div>

              {/* معلومات المالك */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <User className="h-5 w-5 ml-2" />
                  معلومات المالك / المدير
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="ownerName">الاسم الكامل *</Label>
                    <Input
                      id="ownerName"
                      type="text"
                      value={form.ownerName}
                      onChange={(e) => handleInputChange('ownerName', e.target.value)}
                      placeholder="اسم المالك أو المدير"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="ownerEmail">البريد الإلكتروني *</Label>
                      <Input
                        id="ownerEmail"
                        type="email"
                        value={form.ownerEmail}
                        onChange={(e) => handleInputChange('ownerEmail', e.target.value)}
                        placeholder="owner@email.com"
                        className="text-left"
                        dir="ltr"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="ownerPhone">رقم الهاتف *</Label>
                      <Input
                        id="ownerPhone"
                        type="tel"
                        value={form.ownerPhone}
                        onChange={(e) => handleInputChange('ownerPhone', e.target.value)}
                        placeholder="05xxxxxxxx"
                        className="text-left"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات */}
              <div className="flex space-x-reverse space-x-4 pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                      جاري الإرسال...
                    </>
                  ) : (
                    'إرسال طلب التسجيل'
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/')}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TenantRegistration;