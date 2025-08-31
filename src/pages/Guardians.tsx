import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, Plus, Search, Edit, Trash2, Phone, Mail, Users } from 'lucide-react';
import { formatSaudiPhoneNumber, displaySaudiPhoneNumber } from '@/lib/phoneUtils';

interface Guardian {
  id: string;
  full_name: string;
  phone: string;
  whatsapp_number: string | null;
  email: string | null;
  relationship: string | null;
  is_primary: boolean;
  can_pickup: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
}

interface GuardianStudentLink {
  id: string;
  guardian_id: string;
  student_id: string;
  relationship: string;
  is_primary: boolean;
  can_pickup: boolean;
  students: {
    full_name: string;
    student_id: string;
  };
}

const Guardians = () => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [guardianLinks, setGuardianLinks] = useState<GuardianStudentLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedGuardian, setSelectedGuardian] = useState<Guardian | null>(null);
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    whatsapp_number: '',
    email: '',
    relationship: '',
    is_primary: false,
    can_pickup: true,
    linked_students: [] as { student_id: string; relationship: string; is_primary: boolean; can_pickup: boolean }[]
  });

  const relationshipOptions = [
    'الأب',
    'الأم',
    'الجد',
    'الجدة',
    'العم',
    'العمة',
    'الخال',
    'الخالة',
    'أخ',
    'أخت',
    'آخر'
  ];

  useEffect(() => {
    if (tenant) {
      loadData();
    }
  }, [tenant]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadGuardians(),
        loadStudents(),
        loadGuardianLinks()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const loadGuardians = async () => {
    try {
      const { data, error } = await supabase
        .from('guardians')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .order('full_name');

      if (error) throw error;
      setGuardians(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل أولياء الأمور",
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

  const loadGuardianLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('guardian_student_links')
        .select(`
          *,
          students (full_name, student_id)
        `)
        .eq('tenant_id', tenant?.id);

      if (error) throw error;
      setGuardianLinks(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل روابط أولياء الأمور",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      const guardianData = {
        tenant_id: tenant.id,
        full_name: formData.full_name,
        phone: formData.phone,
        whatsapp_number: formData.whatsapp_number || null,
        email: formData.email || null,
        relationship: formData.relationship || null,
        is_primary: formData.is_primary,
        can_pickup: formData.can_pickup
      };

      let guardianId: string;

      if (selectedGuardian) {
        const { error } = await supabase
          .from('guardians')
          .update(guardianData)
          .eq('id', selectedGuardian.id);

        if (error) throw error;
        guardianId = selectedGuardian.id;

        toast({
          title: "تم تحديث ولي الأمر بنجاح",
          description: `تم تحديث بيانات ${formData.full_name}`,
        });
      } else {
        const { data: guardian, error } = await supabase
          .from('guardians')
          .insert(guardianData)
          .select()
          .single();

        if (error) throw error;
        guardianId = guardian.id;

        toast({
          title: "تم إضافة ولي الأمر بنجاح",
          description: `تم إضافة ${formData.full_name} إلى النظام`,
        });
      }

      // Update student links
      if (formData.linked_students.length > 0) {
        // Delete existing links for this guardian
        await supabase
          .from('guardian_student_links')
          .delete()
          .eq('guardian_id', guardianId);

        // Insert new links
        const links = formData.linked_students.map(link => ({
          tenant_id: tenant.id,
          guardian_id: guardianId,
          student_id: link.student_id,
          relationship: link.relationship,
          is_primary: link.is_primary,
          can_pickup: link.can_pickup
        }));

        const { error: linkError } = await supabase
          .from('guardian_student_links')
          .insert(links);

        if (linkError) throw linkError;
      }

      loadData();
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
      phone: '',
      whatsapp_number: '',
      email: '',
      relationship: '',
      is_primary: false,
      can_pickup: true,
      linked_students: []
    });
    setSelectedGuardian(null);
  };

  const handleEdit = (guardian: Guardian) => {
    setSelectedGuardian(guardian);
    const guardianStudents = guardianLinks
      .filter(link => link.guardian_id === guardian.id)
      .map(link => ({
        student_id: link.student_id,
        relationship: link.relationship,
        is_primary: link.is_primary,
        can_pickup: link.can_pickup
      }));

    setFormData({
      full_name: guardian.full_name,
      phone: guardian.phone,
      whatsapp_number: guardian.whatsapp_number || '',
      email: guardian.email || '',
      relationship: guardian.relationship || '',
      is_primary: guardian.is_primary,
      can_pickup: guardian.can_pickup,
      linked_students: guardianStudents
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (guardian: Guardian) => {
    if (!confirm(`هل أنت متأكد من حذف ولي الأمر ${guardian.full_name}؟`)) return;

    try {
      // Delete guardian links first
      await supabase
        .from('guardian_student_links')
        .delete()
        .eq('guardian_id', guardian.id);

      // Delete guardian
      const { error } = await supabase
        .from('guardians')
        .delete()
        .eq('id', guardian.id);

      if (error) throw error;

      toast({
        title: "تم حذف ولي الأمر",
        description: `تم حذف ${guardian.full_name} من النظام`,
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف ولي الأمر",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStudentsForGuardian = (guardianId: string) => {
    return guardianLinks
      .filter(link => link.guardian_id === guardianId)
      .map(link => link.students);
  };

  const addStudentLink = () => {
    setFormData(prev => ({
      ...prev,
      linked_students: [...prev.linked_students, {
        student_id: '',
        relationship: '',
        is_primary: false,
        can_pickup: true
      }]
    }));
  };

  const removeStudentLink = (index: number) => {
    setFormData(prev => ({
      ...prev,
      linked_students: prev.linked_students.filter((_, i) => i !== index)
    }));
  };

  const updateStudentLink = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      linked_students: prev.linked_students.map((link, i) => 
        i === index ? { ...link, [field]: value } : link
      )
    }));
  };

  const filteredGuardians = guardians.filter(guardian =>
    guardian.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guardian.phone.includes(searchTerm) ||
    (guardian.email && guardian.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  // Statistics
  const totalGuardians = guardians.length;
  const primaryGuardians = guardians.filter(g => g.is_primary).length;
  const guardiansWithWhatsApp = guardians.filter(g => g.whatsapp_number).length;
  const guardiansWithEmail = guardians.filter(g => g.email).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل أولياء الأمور...</p>
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
              <UserCheck className="h-8 w-8 text-primary" />
              إدارة أولياء الأمور
            </h1>
            <p className="text-gray-600 mt-1">إدارة معلومات أولياء الأمور والأوصياء</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة ولي أمر جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {selectedGuardian ? 'تعديل بيانات ولي الأمر' : 'إضافة ولي أمر جديد'}
                </DialogTitle>
                <DialogDescription>
                  املأ جميع المعلومات المطلوبة لولي الأمر
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
                        placeholder="الاسم الكامل"
                        required
                      />
                    </div>
                     <div>
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        value={displaySaudiPhoneNumber(formData.phone)}
                        onChange={(e) => {
                          const formatted = formatSaudiPhoneNumber(e.target.value);
                          setFormData(prev => ({ ...prev, phone: formatted }));
                        }}
                        placeholder="05xxxxxxxx"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="whatsapp_number">رقم الواتساب</Label>
                      <Input
                        id="whatsapp_number"
                        value={displaySaudiPhoneNumber(formData.whatsapp_number)}
                        onChange={(e) => {
                          const formatted = formatSaudiPhoneNumber(e.target.value);
                          setFormData(prev => ({ ...prev, whatsapp_number: formatted }));
                        }}
                        placeholder="05xxxxxxxx"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        placeholder="email@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="relationship">صلة القرابة</Label>
                    <Select value={formData.relationship} onValueChange={(value) => setFormData(prev => ({ ...prev, relationship: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر صلة القرابة" />
                      </SelectTrigger>
                      <SelectContent>
                        {relationshipOptions.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-reverse space-x-4">
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Switch
                        id="is_primary"
                        checked={formData.is_primary}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked }))}
                      />
                      <Label htmlFor="is_primary">ولي أمر رئيسي</Label>
                    </div>
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Switch
                        id="can_pickup"
                        checked={formData.can_pickup}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, can_pickup: checked }))}
                      />
                      <Label htmlFor="can_pickup">يمكنه الاستلام</Label>
                    </div>
                  </div>

                  {/* Student Links */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-semibold">الطلاب المرتبطون</h4>
                      <Button type="button" variant="outline" size="sm" onClick={addStudentLink}>
                        <Plus className="h-4 w-4 ml-2" />
                        إضافة طالب
                      </Button>
                    </div>
                    
                    {formData.linked_students.map((link, index) => (
                      <div key={index} className="grid grid-cols-12 gap-2 items-end mb-2 p-3 border rounded">
                        <div className="col-span-4">
                          <Label>الطالب</Label>
                          <Select 
                            value={link.student_id} 
                            onValueChange={(value) => updateStudentLink(index, 'student_id', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="اختر الطالب" />
                            </SelectTrigger>
                            <SelectContent>
                              {students.map((student) => (
                                <SelectItem key={student.id} value={student.id}>
                                  {student.full_name} ({student.student_id})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-3">
                          <Label>صلة القرابة</Label>
                          <Select 
                            value={link.relationship} 
                            onValueChange={(value) => updateStudentLink(index, 'relationship', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="القرابة" />
                            </SelectTrigger>
                            <SelectContent>
                              {relationshipOptions.map((relation) => (
                                <SelectItem key={relation} value={relation}>
                                  {relation}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 flex items-center space-x-reverse space-x-2">
                          <Switch
                            checked={link.is_primary}
                            onCheckedChange={(checked) => updateStudentLink(index, 'is_primary', checked)}
                          />
                          <Label className="text-xs">رئيسي</Label>
                        </div>
                        <div className="col-span-2 flex items-center space-x-reverse space-x-2">
                          <Switch
                            checked={link.can_pickup}
                            onCheckedChange={(checked) => updateStudentLink(index, 'can_pickup', checked)}
                          />
                          <Label className="text-xs">استلام</Label>
                        </div>
                        <div className="col-span-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeStudentLink(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit">
                    {selectedGuardian ? 'حفظ التعديلات' : 'إضافة ولي الأمر'}
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
              <CardTitle className="text-sm font-medium">إجمالي أولياء الأمور</CardTitle>
              <UserCheck className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalGuardians}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">أولياء أمور رئيسيون</CardTitle>
              <Users className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{primaryGuardians}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">لديهم واتساب</CardTitle>
              <Phone className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guardiansWithWhatsApp}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">لديهم بريد إلكتروني</CardTitle>
              <Mail className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{guardiansWithEmail}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="البحث عن ولي أمر بالاسم أو الهاتف أو البريد الإلكتروني..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Guardians Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGuardians.map((guardian) => {
            const studentsForGuardian = getStudentsForGuardian(guardian.id);
            
            return (
              <Card key={guardian.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(guardian.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{guardian.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{guardian.relationship || 'ولي أمر'}</p>
                      </div>
                    </div>
                    <div className="flex space-x-reverse space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(guardian)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(guardian)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">الهاتف:</span>
                      <span className="text-sm font-medium">{guardian.phone}</span>
                    </div>
                    
                    {guardian.whatsapp_number && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">واتساب:</span>
                        <Badge variant="outline" className="text-green-600">
                          {guardian.whatsapp_number}
                        </Badge>
                      </div>
                    )}
                    
                    {guardian.email && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">البريد:</span>
                        <span className="text-sm font-medium text-blue-600">{guardian.email}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">النوع:</span>
                      <div className="flex gap-2">
                        {guardian.is_primary && (
                          <Badge variant="default">رئيسي</Badge>
                        )}
                        {guardian.can_pickup && (
                          <Badge variant="secondary">يستطيع الاستلام</Badge>
                        )}
                      </div>
                    </div>
                    
                    {studentsForGuardian.length > 0 && (
                      <div>
                        <span className="text-sm text-muted-foreground">الأطفال:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {studentsForGuardian.map((student, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {student.full_name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>تاريخ الإضافة:</span>
                      <span>{new Date(guardian.created_at).toLocaleDateString('ar-SA')}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredGuardians.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا يوجد أولياء أمور</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm ? 'لم يتم العثور على أولياء أمور مطابقين لبحثك' : 'لم يتم إضافة أي أولياء أمور بعد'}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أول ولي أمر
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Guardians;