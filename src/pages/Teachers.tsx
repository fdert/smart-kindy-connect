import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, UserCheck, Edit, Trash2, Send, Phone, Mail, GraduationCap } from 'lucide-react';
import { formatSaudiPhoneNumber, displaySaudiPhoneNumber } from '@/lib/phoneUtils';

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  role: string;
  is_active: boolean;
  avatar_url?: string;
  tenant_id: string;
}

interface Class {
  id: string;
  name: string;
  capacity: number;
  teacher_id: string | null;
}

const Teachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'teacher' as 'teacher' | 'admin'
  });

  useEffect(() => {
    if (tenant) {
      loadTeachers();
      loadClasses();
    }
  }, [tenant]);

  // Listen for realtime changes in users table
  useEffect(() => {
    if (!tenant?.id) return;

    const channel = supabase
      .channel('users-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        () => {
          // Reload teachers when any user changes
          loadTeachers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  const loadTeachers = async () => {
    if (!tenant?.id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          classes (name)
        `)
        .eq('tenant_id', tenant.id)
        .in('role', ['teacher', 'admin'])
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      console.log('Loaded teachers:', data);
      setTeachers(data || []);
    } catch (error: any) {
      console.error('Error loading teachers:', error);
      toast({
        title: "خطأ في تحميل المعلمات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الفصول",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      const teacherData = {
        ...formData,
        tenant_id: tenant.id,
        phone: formatSaudiPhoneNumber(formData.phone),
        is_active: true
      };

      if (selectedTeacher) {
        const { error } = await supabase
          .from('users')
          .update(teacherData)
          .eq('id', selectedTeacher.id);

        if (error) throw error;

        toast({
          title: "تم تحديث المعلمة بنجاح",
          description: `تم تحديث بيانات ${formData.full_name}`,
        });
      } else {
        // Generate a UUID for the new user
        const newUserId = crypto.randomUUID();
        
        console.log('Creating teacher with data:', teacherData);
        
        // Create teacher record directly in users table
        const { error: userError } = await supabase
          .from('users')
          .insert({
            id: newUserId,
            ...teacherData
          });

        if (userError) {
          console.error('Error creating teacher:', userError);
          throw userError;
        }

        console.log('Teacher created successfully with ID:', newUserId);

        // Try to create auth user (this might fail, but that's ok)
        try {
          await supabase.auth.signUp({
            email: formData.email,
            password: 'TempPass' + Math.random().toString(36).substring(2, 8),
            options: {
              emailRedirectTo: `${window.location.origin}/auth`,
              data: {
                full_name: formData.full_name,
                tenant_id: tenant.id,
                role: formData.role
              }
            }
          });
        } catch (authError) {
          console.warn('Auth user creation failed, but user record created:', authError);
        }

        // Send WhatsApp message with instructions
        try {
          const whatsappMessage = `🔐 مرحباً بك في SmartKindy

حضانة: ${tenant.name}

👤 تم إنشاء حساب لك باسم: ${formData.full_name}
📧 البريد الإلكتروني: ${formData.email}

🌐 لتسجيل الدخول:
1. اذهب إلى: https://smartkindy.com/auth
2. انقر على "نسيت كلمة المرور"
3. أدخل بريدك الإلكتروني لإنشاء كلمة مرور جديدة

للدعم الفني: 920012345
مرحباً بك في فريق SmartKindy! 🌟`;

          const { error: whatsappError } = await supabase
            .from('whatsapp_messages')
            .insert({
              tenant_id: tenant.id,
              recipient_phone: teacherData.phone,
              message_content: whatsappMessage,
              message_type: 'teacher_credentials',
              scheduled_at: new Date().toISOString(),
              status: 'pending'
            });

          if (whatsappError) {
            console.warn('WhatsApp message creation failed:', whatsappError);
          } else {
            console.log('WhatsApp message queued for sending');
            
            // تشغيل Edge Function فوراً لإرسال الرسالة
            setTimeout(async () => {
              try {
                const { data: sendResult } = await supabase.functions.invoke('send-whatsapp-notifications');
                console.log('WhatsApp sending triggered:', sendResult);
              } catch (sendError) {
                console.warn('WhatsApp sending trigger failed:', sendError);
              }
            }, 1000);
          }
        } catch (whatsappError) {
          console.warn('WhatsApp sending failed:', whatsappError);
        }

        toast({
          title: "تم إضافة المعلمة بنجاح",
          description: `تم إضافة ${formData.full_name} وإرسال بيانات الدخول عبر الواتساب`,
        });
      }

      // Force reload teachers and reset form
      resetForm();
      setIsAddDialogOpen(false);
      
      // Delay reload to ensure database transaction is complete
      setTimeout(() => {
        loadTeachers();
      }, 500);
    } catch (error: any) {
      toast({
        title: "خطأ في حفظ البيانات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      role: 'teacher' as 'teacher' | 'admin'
    });
    setSelectedTeacher(null);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      full_name: teacher.full_name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      role: (teacher.role as 'teacher' | 'admin') || 'teacher'
    });
    setIsAddDialogOpen(true);
  };

  const sendLoginCredentials = async (teacher: Teacher) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-teacher-credentials', {
        body: { teacherId: teacher.id }
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح", 
        description: `تم إرسال بيانات تسجيل الدخول للمعلمة "${teacher.full_name}" عبر الواتساب`,
      });

    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error.message || "فشل في إرسال بيانات تسجيل الدخول",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (teacher: Teacher) => {
    if (!confirm(`هل أنت متأكد من حذف المعلمة ${teacher.full_name}؟`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', teacher.id);

      if (error) throw error;

      toast({
        title: "تم إلغاء تفعيل المعلمة",
        description: `تم إلغاء تفعيل ${teacher.full_name}`,
      });

      loadTeachers();
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredTeachers = teachers.filter(teacher =>
    teacher.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin': return <Badge variant="default">مديرة</Badge>;
      case 'teacher': return <Badge variant="secondary">معلمة</Badge>;
      case 'assistant': return <Badge variant="outline">مساعدة</Badge>;
      default: return <Badge variant="outline">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل المعلمات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              إدارة المعلمات
            </h1>
            <p className="text-gray-600 mt-1">إدارة المعلمات وبيانات التوظيف</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة معلمة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedTeacher ? 'تعديل بيانات المعلمة' : 'إضافة معلمة جديدة'}
                </DialogTitle>
                <DialogDescription>
                  املأ جميع المعلومات المطلوبة للمعلمة
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">الاسم الكامل</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                        placeholder="الاسم الكامل للمعلمة"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="البريد الإلكتروني"
                        required
                      />
                    </div>
                  </div>
                  
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="phone">رقم الهاتف</Label>
                              <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                placeholder="05xxxxxxxx"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="role">المنصب</Label>
                              <Select value={formData.role} onValueChange={(value) => setFormData(prev => ({ ...prev, role: value as 'teacher' | 'admin' }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر المنصب" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="admin">مديرة</SelectItem>
                                  <SelectItem value="teacher">معلمة</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {selectedTeacher ? 'حفظ التعديلات' : 'إضافة المعلمة'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search Bar */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="البحث عن معلمة بالاسم أو البريد الإلكتروني..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeachers.map((teacher) => (
            <Card key={teacher.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(teacher.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{teacher.full_name}</CardTitle>
                      <CardDescription>{teacher.email}</CardDescription>
                    </div>
                  </div>
                  {getRoleBadge(teacher.role)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4" />
                    {displaySaudiPhoneNumber(teacher.phone)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="h-4 w-4" />
                    {teacher.email}
                  </div>
                        <p className="text-sm text-gray-600">
                          {teacher.role === 'admin' ? 'مديرة' : 'معلمة'}
                        </p>
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(teacher)}
                      className="flex-1"
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendLoginCredentials(teacher)}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      إرسال
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(teacher)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTeachers.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="text-center py-8">
              <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">لا توجد معلمات مطابقة للبحث</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Teachers;