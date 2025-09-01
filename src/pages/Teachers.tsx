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
  user_id: string | null;
  full_name: string;
  email: string;
  phone: string;
  whatsapp_number: string | null;
  national_id: string | null;
  hire_date: string;
  position: string;
  qualification: string;
  experience_years: number | null;
  salary: number | null;
  is_active: boolean;
  photo_url: string | null;
  emergency_contact: any;
  classes?: {
    name: string;
  }[];
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
    whatsapp_number: '',
    national_id: '',
    position: 'teacher',
    qualification: '',
    experience_years: 0,
    salary: 0,
    emergency_contact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  useEffect(() => {
    if (tenant) {
      loadTeachers();
      loadClasses();
    }
  }, [tenant]);

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          classes (name)
        `)
        .eq('tenant_id', tenant?.id)
        .in('role', ['teacher', 'admin'])
        .order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
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
        whatsapp_number: formData.whatsapp_number ? formatSaudiPhoneNumber(formData.whatsapp_number) : null,
        hire_date: new Date().toISOString().split('T')[0],
        is_active: true,
        role: formData.position
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
        const { error } = await supabase
          .from('users')
          .insert(teacherData);

        if (error) throw error;

        // Send WhatsApp message with login credentials
        try {
          const { error: whatsappError } = await supabase.functions.invoke('send-login-credentials', {
            body: {
              email: formData.email,
              phone: teacherData.phone,
              name: formData.full_name,
              role: 'teacher',
              tenantName: tenant.name
            }
          });

          if (whatsappError) {
            console.warn('Failed to send WhatsApp credentials:', whatsappError);
          }
        } catch (whatsappError) {
          console.warn('WhatsApp sending failed:', whatsappError);
        }

        toast({
          title: "تم إضافة المعلمة بنجاح",
          description: `تم إضافة ${formData.full_name} وإرسال بيانات الدخول عبر الواتساب`,
        });
      }

      loadTeachers();
      resetForm();
      setIsAddDialogOpen(false);
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
      whatsapp_number: '',
      national_id: '',
      position: 'teacher',
      qualification: '',
      experience_years: 0,
      salary: 0,
      emergency_contact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setSelectedTeacher(null);
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setFormData({
      full_name: teacher.full_name || '',
      email: teacher.email || '',
      phone: teacher.phone || '',
      whatsapp_number: teacher.whatsapp_number || '',
      national_id: teacher.national_id || '',
      position: teacher.position || 'teacher',
      qualification: teacher.qualification || '',
      experience_years: teacher.experience_years || 0,
      salary: teacher.salary || 0,
      emergency_contact: teacher.emergency_contact || {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setIsAddDialogOpen(true);
  };

  const sendLoginCredentials = async (teacher: Teacher) => {
    try {
      const { error } = await supabase.functions.invoke('send-login-credentials', {
        body: {
          userId: teacher.id,
          email: teacher.email,
          phone: teacher.phone,
          name: teacher.full_name,
          role: 'teacher',
          tenantName: tenant?.name
        }
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال بيانات الدخول إلى المعلمة عبر الواتساب",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error.message,
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

  const getRoleBadge = (position: string) => {
    switch (position) {
      case 'admin': return <Badge variant="default">مديرة</Badge>;
      case 'teacher': return <Badge variant="secondary">معلمة</Badge>;
      case 'assistant': return <Badge variant="outline">مساعدة</Badge>;
      default: return <Badge variant="outline">{position}</Badge>;
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
                      <Label htmlFor="whatsapp_number">رقم الواتساب</Label>
                      <Input
                        id="whatsapp_number"
                        value={formData.whatsapp_number}
                        onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="national_id">رقم الهوية</Label>
                      <Input
                        id="national_id"
                        value={formData.national_id}
                        onChange={(e) => setFormData(prev => ({ ...prev, national_id: e.target.value }))}
                        placeholder="رقم الهوية الوطنية"
                      />
                    </div>
                    <div>
                      <Label htmlFor="position">المنصب</Label>
                      <Select value={formData.position} onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المنصب" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">مديرة</SelectItem>
                          <SelectItem value="teacher">معلمة</SelectItem>
                          <SelectItem value="assistant">مساعدة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="qualification">المؤهل</Label>
                      <Input
                        id="qualification"
                        value={formData.qualification}
                        onChange={(e) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                        placeholder="المؤهل العلمي"
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience_years">سنوات الخبرة</Label>
                      <Input
                        id="experience_years"
                        type="number"
                        min="0"
                        value={formData.experience_years}
                        onChange={(e) => setFormData(prev => ({ ...prev, experience_years: parseInt(e.target.value) || 0 }))}
                        placeholder="عدد سنوات الخبرة"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="salary">الراتب (ريال)</Label>
                    <Input
                      id="salary"
                      type="number"
                      min="0"
                      value={formData.salary}
                      onChange={(e) => setFormData(prev => ({ ...prev, salary: parseFloat(e.target.value) || 0 }))}
                      placeholder="الراتب الشهري"
                    />
                  </div>

                  {/* Emergency Contact */}
                  <div className="border-t pt-4">
                    <h4 className="font-semibold mb-3">جهة الاتصال في الطوارئ</h4>
                    <div className="grid gap-3">
                      <Input
                        placeholder="اسم جهة الاتصال"
                        value={formData.emergency_contact.name}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergency_contact: { ...prev.emergency_contact, name: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="رقم الهاتف"
                        value={formData.emergency_contact.phone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergency_contact: { ...prev.emergency_contact, phone: e.target.value }
                        }))}
                      />
                      <Input
                        placeholder="صلة القرابة"
                        value={formData.emergency_contact.relationship}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          emergency_contact: { ...prev.emergency_contact, relationship: e.target.value }
                        }))}
                      />
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
                  {getRoleBadge(teacher.position)}
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
                  {teacher.qualification && (
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <GraduationCap className="h-4 w-4" />
                      {teacher.qualification}
                    </div>
                  )}
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