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
import { ImageUpload } from '@/components/ImageUpload';
import { Plus, Search, Users, Calendar, Edit, Trash2, Send, FileText, Share, ExternalLink } from 'lucide-react';
import ExcelImport from '@/components/ExcelImport';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  date_of_birth: string;
  gender: string;
  photo_url: string | null;
  enrollment_date: string;
  is_active: boolean;
  class_id: string | null;
  medical_info: any;
  emergency_contact: any;
  classes?: {
    name: string;
  };
}

interface Class {
  id: string;
  name: string;
  capacity: number;
  teacher_id: string | null;
}

const Students = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    student_id: '',
    full_name: '',
    date_of_birth: '',
    gender: '',
    class_id: '',
    photo_url: null as string | null,
    emergency_contact: {
      name: '',
      phone: '',
      relationship: ''
    },
    medical_info: {
      allergies: '',
      medications: '',
      special_needs: ''
    }
  });

  useEffect(() => {
    if (tenant?.id) {
      loadStudents();
      loadClasses();
    } else if (tenant === null) {
      setLoading(false);
      toast({
        title: "خطأ في تحميل بيانات الروضة",
        description: "لا يمكن الوصول إلى بيانات الروضة. تأكد من صلاحياتك.",
        variant: "destructive",
      });
    }
  }, [tenant]);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (name)
        `)
        .eq('tenant_id', tenant?.id)
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الطلاب",
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
      const studentData = {
        ...formData,
        tenant_id: tenant.id,
        class_id: formData.class_id || null,
        enrollment_date: new Date().toISOString().split('T')[0],
        is_active: true
      };

      if (selectedStudent) {
        const { error } = await supabase
          .from('students')
          .update(studentData)
          .eq('id', selectedStudent.id);

        if (error) throw error;

        toast({
          title: "تم تحديث الطالب بنجاح",
          description: `تم تحديث بيانات ${formData.full_name}`,
        });
      } else {
        const { error } = await supabase
          .from('students')
          .insert(studentData);

        if (error) throw error;

        toast({
          title: "تم إضافة الطالب بنجاح",
          description: `تم إضافة ${formData.full_name} إلى النظام`,
        });
      }

      loadStudents();
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
      student_id: '',
      full_name: '',
      date_of_birth: '',
      gender: '',
      class_id: '',
      photo_url: null,
      emergency_contact: {
        name: '',
        phone: '',
        relationship: ''
      },
      medical_info: {
        allergies: '',
        medications: '',
        special_needs: ''
      }
    });
    setSelectedStudent(null);
  };

  const handleEdit = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      student_id: student.student_id,
      full_name: student.full_name,
      date_of_birth: student.date_of_birth,
      gender: student.gender || '',
      class_id: student.class_id || '',
      photo_url: student.photo_url,
      emergency_contact: student.emergency_contact || {
        name: '',
        phone: '',
        relationship: ''
      },
      medical_info: student.medical_info || {
        allergies: '',
        medications: '',
        special_needs: ''
      }
    });
    setIsAddDialogOpen(true);
  };

  const sendRegistrationLink = async (studentId: string) => {
    if (!tenant) return;

    try {
      // Get guardian phone from emergency contact
      const student = students.find(s => s.id === studentId);
      if (!student || !student.emergency_contact?.phone) {
        toast({
          title: "خطأ",
          description: "لا يوجد رقم هاتف لولي الأمر",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.functions.invoke('send-registration-link', {
        body: {
          studentId: studentId,
          guardianPhone: student.emergency_contact.phone,
          tenantId: tenant.id
        }
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال رابط التسجيل إلى ولي الأمر عبر الواتس آب",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (student: Student) => {
    if (!confirm(`هل أنت متأكد من حذف الطالب ${student.full_name}؟`)) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;

      toast({
        title: "تم حذف الطالب",
        description: `تم حذف ${student.full_name} من النظام`,
      });

      loadStudents();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الطالب",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredStudents = students.filter(student =>
    student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    const age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      return age - 1;
    }
    return age;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الطلاب...</p>
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
              <Users className="h-8 w-8 text-primary" />
              إدارة الطلاب
            </h1>
            <p className="text-gray-600 mt-1">إدارة معلومات الطلاب والفصول</p>
          </div>
          <div className="flex gap-2">
            <ExcelImport onImportComplete={loadStudents} />
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إضافة طالب جديد
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedStudent ? 'تعديل بيانات الطالب' : 'إضافة طالب جديد'}
                  </DialogTitle>
                  <DialogDescription>
                    املأ جميع المعلومات المطلوبة للطالب
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    {/* Photo Upload */}
                    <ImageUpload
                      currentImage={formData.photo_url}
                      onImageChange={(imageUrl) => setFormData(prev => ({ ...prev, photo_url: imageUrl }))}
                      studentName={formData.full_name}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="student_id">رقم الطالب</Label>
                        <Input
                          id="student_id"
                          value={formData.student_id}
                          onChange={(e) => setFormData(prev => ({ ...prev, student_id: e.target.value }))}
                          placeholder="مثال: STD001"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="full_name">الاسم الكامل</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="الاسم الكامل للطالب"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                        <Input
                          id="date_of_birth"
                          type="date"
                          value={formData.date_of_birth}
                          onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="gender">الجنس</Label>
                        <Select value={formData.gender} onValueChange={(value) => setFormData(prev => ({ ...prev, gender: value }))}>
                          <SelectTrigger>
                            <SelectValue placeholder="اختر الجنس" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="male">ذكر</SelectItem>
                            <SelectItem value="female">أنثى</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="class_id">الفصل</Label>
                      <Select value={formData.class_id} onValueChange={(value) => setFormData(prev => ({ ...prev, class_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الفصل" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                    {/* Medical Info */}
                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3">المعلومات الطبية</h4>
                      <div className="grid gap-3">
                        <Textarea
                          placeholder="الحساسية (إن وجدت)"
                          value={formData.medical_info.allergies}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            medical_info: { ...prev.medical_info, allergies: e.target.value }
                          }))}
                        />
                        <Textarea
                          placeholder="الأدوية (إن وجدت)"
                          value={formData.medical_info.medications}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            medical_info: { ...prev.medical_info, medications: e.target.value }
                          }))}
                        />
                        <Textarea
                          placeholder="احتياجات خاصة (إن وجدت)"
                          value={formData.medical_info.special_needs}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            medical_info: { ...prev.medical_info, special_needs: e.target.value }
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
                      {selectedStudent ? 'حفظ التعديلات' : 'إضافة الطالب'}
                    </Button>
                    {!selectedStudent && formData.emergency_contact.phone && (
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => {
                          // We need the student ID first, so this will be called after save
                          toast({
                            title: "احفظ الطالب أولاً",
                            description: "يرجى حفظ بيانات الطالب أولاً ثم إرسال رابط التسجيل",
                          });
                        }}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        إرسال رابط التسجيل
                      </Button>
                    )}
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
            
            <Button 
              variant="outline"
              onClick={async () => {
                if (!tenant) return;
                
                try {
                  // Create a shareable registration form link
                  const registrationUrl = `${window.location.origin}/register?tenant=${tenant.id}`;
                  
                  // Copy to clipboard
                  await navigator.clipboard.writeText(registrationUrl);
                  
                  toast({
                    title: "تم نسخ الرابط",
                    description: "تم نسخ رابط نموذج التسجيل. يمكنك مشاركته مع أولياء الأمور الجدد.",
                  });
                } catch (error) {
                  // Fallback for older browsers
                  const textArea = document.createElement('textarea');
                  textArea.value = `${window.location.origin}/register?tenant=${tenant?.id}`;
                  document.body.appendChild(textArea);
                  textArea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textArea);
                  
                  toast({
                    title: "تم نسخ الرابط",
                    description: "تم نسخ رابط نموذج التسجيل. يمكنك مشاركته مع أولياء الأمور الجدد.",
                  });
                }
              }}
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              مشاركة رابط التسجيل
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الطلاب</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطلاب النشطون</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.filter(s => s.is_active).length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الذكور</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.filter(s => s.gender === 'male').length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الإناث</CardTitle>
              <Users className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.filter(s => s.gender === 'female').length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن طالب بالاسم أو رقم الطالب..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center space-x-reverse space-x-4">
                  <Avatar className="h-12 w-12">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt={student.full_name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(student.full_name)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{student.full_name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {student.student_id}</p>
                  </div>
                  <div className="flex space-x-reverse space-x-1">
                     <Button
                       size="sm"
                       variant="ghost"
                       onClick={() => sendRegistrationLink(student.id)}
                       className="text-green-500 hover:text-green-700"
                       title="إرسال رابط التسجيل لولي الأمر"
                     >
                       <Send className="h-4 w-4" />
                     </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(`/student-report/${student.id}`, '_blank')}
                        className="text-blue-500 hover:text-blue-700"
                        title="عرض التقرير الشامل"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(student)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(student)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">العمر:</span>
                    <span className="text-sm font-medium">{calculateAge(student.date_of_birth)} سنة</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الجنس:</span>
                    <Badge variant={student.gender === 'male' ? 'default' : 'secondary'}>
                      {student.gender === 'male' ? 'ذكر' : 'أنثى'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الفصل:</span>
                    <span className="text-sm font-medium">
                      {student.classes?.name || 'غير محدد'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">تاريخ التسجيل:</span>
                    <span className="text-sm font-medium">
                      {new Date(student.enrollment_date).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الحالة:</span>
                    <Badge variant={student.is_active ? 'default' : 'secondary'}>
                      {student.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredStudents.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد طلاب</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? 'لم يتم العثور على طلاب مطابقين لبحثك' : 'لم يتم إضافة أي طلاب بعد'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أول طالب
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Students;