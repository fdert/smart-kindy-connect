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
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, Plus, Search, Edit, Trash2, User } from 'lucide-react';

interface Class {
  id: string;
  name: string;
  description: string | null;
  capacity: number;
  age_min: number | null;
  age_max: number | null;
  teacher_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
}

interface Teacher {
  id: string;
  full_name: string;
  email: string;
}

const Classes = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    capacity: 20,
    age_min: 3,
    age_max: 6,
    teacher_id: '',
    is_active: true
  });

  useEffect(() => {
    if (tenant) {
      loadData();
    }
  }, [tenant]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadClasses(),
        loadStudents(),
        loadTeachers()
      ]);
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

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, student_id')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true);

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الطلاب",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, email')
        .eq('tenant_id', tenant?.id)
        .in('role', ['teacher', 'admin', 'owner']);

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل المعلمين",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      const classData = {
        ...formData,
        tenant_id: tenant.id,
        teacher_id: formData.teacher_id || null
      };

      if (selectedClass) {
        const { error } = await supabase
          .from('classes')
          .update(classData)
          .eq('id', selectedClass.id);

        if (error) throw error;

        toast({
          title: "تم تحديث الفصل بنجاح",
          description: `تم تحديث فصل ${formData.name}`,
        });
      } else {
        const { error } = await supabase
          .from('classes')
          .insert(classData);

        if (error) throw error;

        toast({
          title: "تم إضافة الفصل بنجاح",
          description: `تم إضافة فصل ${formData.name} إلى النظام`,
        });
      }

      loadClasses();
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
      name: '',
      description: '',
      capacity: 20,
      age_min: 3,
      age_max: 6,
      teacher_id: '',
      is_active: true
    });
    setSelectedClass(null);
  };

  const handleEdit = (classItem: Class) => {
    setSelectedClass(classItem);
    setFormData({
      name: classItem.name,
      description: classItem.description || '',
      capacity: classItem.capacity,
      age_min: classItem.age_min || 3,
      age_max: classItem.age_max || 6,
      teacher_id: classItem.teacher_id || '',
      is_active: classItem.is_active
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (classItem: Class) => {
    if (!confirm(`هل أنت متأكد من حذف فصل ${classItem.name}؟`)) return;

    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classItem.id);

      if (error) throw error;

      toast({
        title: "تم حذف الفصل",
        description: `تم حذف فصل ${classItem.name} من النظام`,
      });

      loadClasses();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الفصل",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStudentsInClass = (classId: string) => {
    // This would need to be loaded from students table where class_id = classId
    // For now, returning empty array
    return [];
  };

  const getTeacherName = (teacherId: string | null) => {
    if (!teacherId) return 'غير محدد';
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher?.full_name || 'غير محدد';
  };

  const filteredClasses = classes.filter(classItem =>
    classItem.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Statistics
  const totalClasses = classes.length;
  const activeClasses = classes.filter(c => c.is_active).length;
  const totalCapacity = classes.reduce((sum, c) => sum + c.capacity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الفصول...</p>
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
              <BookOpen className="h-8 w-8 text-primary" />
              إدارة الفصول
            </h1>
            <p className="text-gray-600 mt-1">إنشاء وإدارة الفصول الدراسية</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة فصل جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {selectedClass ? 'تعديل بيانات الفصل' : 'إضافة فصل جديد'}
                </DialogTitle>
                <DialogDescription>
                  املأ جميع المعلومات المطلوبة للفصل
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="name">اسم الفصل</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="مثال: الفراشات"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="وصف مختصر للفصل..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="capacity">السعة القصوى</Label>
                      <Input
                        id="capacity"
                        type="number"
                        min="5"
                        max="50"
                        value={formData.capacity}
                        onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 20 }))}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="teacher_id">المعلم المسؤول</Label>
                      <Select value={formData.teacher_id} onValueChange={(value) => setFormData(prev => ({ ...prev, teacher_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المعلم" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">بدون معلم محدد</SelectItem>
                          {teachers.map((teacher) => (
                            <SelectItem key={teacher.id} value={teacher.id}>
                              {teacher.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="age_min">العمر الأدنى</Label>
                      <Input
                        id="age_min"
                        type="number"
                        min="2"
                        max="8"
                        value={formData.age_min}
                        onChange={(e) => setFormData(prev => ({ ...prev, age_min: parseInt(e.target.value) || 3 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="age_max">العمر الأقصى</Label>
                      <Input
                        id="age_max"
                        type="number"
                        min="3"
                        max="10"
                        value={formData.age_max}
                        onChange={(e) => setFormData(prev => ({ ...prev, age_max: parseInt(e.target.value) || 6 }))}
                      />
                    </div>
                  </div>

                  <div className="flex items-center space-x-reverse space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="is_active">فصل نشط</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {selectedClass ? 'حفظ التعديلات' : 'إضافة الفصل'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي الفصول</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClasses}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الفصول النشطة</CardTitle>
              <BookOpen className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeClasses}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">السعة الإجمالية</CardTitle>
              <Users className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCapacity}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">المعلمين</CardTitle>
              <User className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن فصل بالاسم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClasses.map((classItem) => (
            <Card key={classItem.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getInitials(classItem.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{classItem.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {getTeacherName(classItem.teacher_id)}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-reverse space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(classItem)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(classItem)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {classItem.description && (
                    <p className="text-sm text-gray-600">{classItem.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">السعة:</span>
                    <Badge variant="secondary">
                      {getStudentsInClass(classItem.id).length}/{classItem.capacity}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الأعمار:</span>
                    <span className="text-sm font-medium">
                      {classItem.age_min} - {classItem.age_max} سنوات
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">الحالة:</span>
                    <Badge variant={classItem.is_active ? 'default' : 'secondary'}>
                      {classItem.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">تاريخ الإنشاء:</span>
                    <span className="text-sm font-medium">
                      {new Date(classItem.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredClasses.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد فصول</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? 'لم يتم العثور على فصول مطابقة لبحثك' : 'لم يتم إضافة أي فصول بعد'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أول فصل
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Classes;