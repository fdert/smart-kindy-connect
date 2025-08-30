import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Video, Plus, Send, Eye, Calendar, Clock, Users, ExternalLink, Play, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { VirtualClassCard } from '@/components/VirtualClassCard';

interface VirtualClass {
  id: string;
  title: string;
  description: string | null;
  provider: string;
  meeting_url: string;
  meeting_id: string | null;
  passcode: string | null;
  scheduled_at: string;
  duration_minutes: number;
  created_at: string;
  is_active: boolean;
  classes?: {
    name: string;
  };
  attendance?: VirtualClassAttendance[];
}

interface VirtualClassAttendance {
  id: string;
  student_id: string;
  status: 'invited' | 'joined' | 'left' | 'absent';
  joined_at: string | null;
  left_at: string | null;
  duration_minutes: number | null;
  students: {
    full_name: string;
    student_id: string;
  };
}

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
}

const VirtualClasses = () => {
  const [virtualClasses, setVirtualClasses] = useState<VirtualClass[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedClass, setSelectedClass] = useState<VirtualClass | null>(null);
  const [attendance, setAttendance] = useState<VirtualClassAttendance[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showAttendanceDialog, setShowAttendanceDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    classId: '',
    provider: 'zoom',
    meetingUrl: '',
    meetingId: '',
    passcode: '',
    scheduledAt: '',
    durationMinutes: 60,
    selectedStudents: [] as string[]
  });

  const { tenant } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    // Super admins can view all data, regular users need a tenant
    loadVirtualClasses();
    loadClasses();
    loadStudents();
  }, [tenant]);

  const loadVirtualClasses = async () => {
    try {
      let query = supabase
        .from('virtual_classes')
        .select(`
          *,
          classes(name),
          virtual_class_attendance(
            *,
            students(full_name, student_id)
          )
        `);
      
      // Filter by tenant only if user has a tenant (not super admin)
      if (tenant?.id) {
        query = query.eq('tenant_id', tenant.id);
      }
      
      const { data, error } = await query.order('scheduled_at', { ascending: false });

      if (error) throw error;
      setVirtualClasses(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الفصول الافتراضية",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      let query = supabase
        .from('classes')
        .select('id, name')
        .eq('is_active', true);
      
      // Filter by tenant only if user has a tenant (not super admin)
      if (tenant?.id) {
        query = query.eq('tenant_id', tenant.id);
      }
      
      const { data, error } = await query.order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error('Error loading classes:', error);
    }
  };

  const loadStudents = async () => {
    try {
      let query = supabase
        .from('students')
        .select('id, full_name, student_id')
        .eq('is_active', true);
      
      // Filter by tenant only if user has a tenant (not super admin)
      if (tenant?.id) {
        query = query.eq('tenant_id', tenant.id);
      }
      
      const { data, error } = await query.order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
    }
  };

  const handleCreateVirtualClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || formData.selectedStudents.length === 0) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار طالب واحد على الأقل",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      
      const { data, error } = await supabase.functions.invoke('virtual-classes-api', {
        body: {
          title: formData.title,
          description: formData.description,
          classId: formData.classId || null,
          provider: formData.provider,
          meetingUrl: formData.meetingUrl,
          meetingId: formData.meetingId,
          passcode: formData.passcode,
          scheduledAt: formData.scheduledAt,
          durationMinutes: formData.durationMinutes,
          studentIds: formData.selectedStudents
        }
      });

      if (error) throw error;

      toast({
        title: "تم إنشاء الفصل الافتراضي",
        description: "تم إنشاء فصل افتراضي جديد بنجاح",
      });

      setShowCreateDialog(false);
      resetForm();
      loadVirtualClasses();
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الفصل الافتراضي",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      classId: '',
      provider: 'zoom',
      meetingUrl: '',
      meetingId: '',
      passcode: '',
      scheduledAt: '',
      durationMinutes: 60,
      selectedStudents: []
    });
  };

  const handleSendNotifications = async (virtualClassId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('virtual-classes-api', {
        body: {},
        method: 'POST'
      });

      if (error) throw error;

      toast({
        title: "تم إرسال الإشعارات",
        description: `تم إرسال ${data.notificationsSent} إشعار عبر واتساب`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الإشعارات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewAttendance = async (virtualClass: VirtualClass) => {
    setSelectedClass(virtualClass);
    setAttendance(virtualClass.attendance || []);
    setShowAttendanceDialog(true);
  };

  const handleMarkAttendance = async (studentId: string, status: 'joined' | 'left' | 'absent') => {
    if (!selectedClass) return;

    try {
      const requestData: any = {
        studentId,
        status
      };

      if (status === 'joined') {
        requestData.joinedAt = new Date().toISOString();
      } else if (status === 'left') {
        requestData.leftAt = new Date().toISOString();
        // Find the attendance record to get joined time
        const attendanceRecord = attendance.find(a => a.student_id === studentId);
        if (attendanceRecord?.joined_at) {
          requestData.joinedAt = attendanceRecord.joined_at;
        }
      }

      const { error } = await supabase.functions.invoke('virtual-classes-api', {
        body: requestData,
        method: 'POST'
      });

      if (error) throw error;

      toast({
        title: "تم تحديث الحضور",
        description: "تم تسجيل الحضور بنجاح",
      });

      // Refresh attendance data
      const updatedAttendance = attendance.map(a => 
        a.student_id === studentId 
          ? { ...a, status, updated_at: new Date().toISOString() }
          : a
      );
      setAttendance(updatedAttendance);

    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الحضور",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getProviderLabel = (provider: string) => {
    const providers: Record<string, string> = {
      zoom: 'Zoom',
      meet: 'Google Meet',
      jitsi: 'Jitsi Meet',
      teams: 'Microsoft Teams'
    };
    return providers[provider] || provider;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any, label: string }> = {
      invited: { variant: 'secondary', label: 'مدعو' },
      joined: { variant: 'default', label: 'حضر' },
      left: { variant: 'outline', label: 'غادر' },
      absent: { variant: 'destructive', label: 'غائب' }
    };
    
    const config = variants[status] || variants.invited;
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الفصول الافتراضية...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
              <Video className="h-8 w-8 text-primary" />
              الفصول الافتراضية
            </h1>
            <p className="text-gray-600 mt-1">إدارة الفصول والحصص الافتراضية</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إنشاء فصل افتراضي
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء فصل افتراضي جديد</DialogTitle>
                <DialogDescription>
                  إنشاء جلسة افتراضية جديدة ودعوة الطلاب للحضور
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreateVirtualClass} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">عنوان الجلسة</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="مثال: درس الرياضيات"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label>الفصل</Label>
                    <Select
                      value={formData.classId}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, classId: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر الفصل (اختياري)" />
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
                </div>
                
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="وصف الجلسة ومحتواها..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>منصة الاجتماع</Label>
                    <Select
                      value={formData.provider}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, provider: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="zoom">Zoom</SelectItem>
                        <SelectItem value="meet">Google Meet</SelectItem>
                        <SelectItem value="jitsi">Jitsi Meet</SelectItem>
                        <SelectItem value="teams">Microsoft Teams</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="duration">المدة (دقيقة)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: parseInt(e.target.value) }))}
                      min="15"
                      max="480"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="meetingUrl">رابط الاجتماع</Label>
                  <Input
                    id="meetingUrl"
                    value={formData.meetingUrl}
                    onChange={(e) => setFormData(prev => ({ ...prev, meetingUrl: e.target.value }))}
                    placeholder="https://zoom.us/j/123456789"
                    type="url"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meetingId">معرف الاجتماع</Label>
                    <Input
                      id="meetingId"
                      value={formData.meetingId}
                      onChange={(e) => setFormData(prev => ({ ...prev, meetingId: e.target.value }))}
                      placeholder="123-456-789"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="passcode">كلمة المرور</Label>
                    <Input
                      id="passcode"
                      value={formData.passcode}
                      onChange={(e) => setFormData(prev => ({ ...prev, passcode: e.target.value }))}
                      placeholder="كلمة مرور الاجتماع"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="scheduledAt">وقت الجلسة</Label>
                  <Input
                    id="scheduledAt"
                    type="datetime-local"
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData(prev => ({ ...prev, scheduledAt: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label>الطلاب المدعوون</Label>
                  <div className="border rounded-md p-2 max-h-40 overflow-y-auto">
                    {students.map((student) => (
                      <div key={student.id} className="flex items-center space-x-2 py-1">
                        <input
                          type="checkbox"
                          id={student.id}
                          checked={formData.selectedStudents.includes(student.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                selectedStudents: [...prev.selectedStudents, student.id]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                selectedStudents: prev.selectedStudents.filter(id => id !== student.id)
                              }));
                            }
                          }}
                          className="rounded"
                        />
                        <label htmlFor={student.id} className="text-sm cursor-pointer flex-1">
                          {student.full_name} ({student.student_id})
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setShowCreateDialog(false);
                    resetForm();
                  }}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'جاري الإنشاء...' : 'إنشاء الفصل'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Virtual Classes List */}
        <div className="grid gap-4">
          {virtualClasses.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Video className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد فصول افتراضية</h3>
                <p className="text-gray-500 text-center mb-4">ابدأ بإنشاء فصل افتراضي جديد لعقد الحصص عن بُعد</p>
                <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إنشاء فصل افتراضي
                </Button>
              </CardContent>
            </Card>
          ) : (
            virtualClasses.map((virtualClass) => (
              <Card key={virtualClass.id} className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {virtualClass.title}
                        <Badge variant="outline">
                          {getProviderLabel(virtualClass.provider)}
                        </Badge>
                        {virtualClass.classes && (
                          <Badge variant="secondary">
                            {virtualClass.classes.name}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        {virtualClass.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewAttendance(virtualClass)}
                        className="flex items-center gap-1"
                      >
                        <UserCheck className="h-4 w-4" />
                        الحضور
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendNotifications(virtualClass.id)}
                        className="flex items-center gap-1"
                      >
                        <Send className="h-4 w-4" />
                        إرسال دعوات
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => window.open(virtualClass.meeting_url, '_blank')}
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-4 w-4" />
                        انضم للجلسة
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{format(new Date(virtualClass.scheduled_at), 'PPP', { locale: ar })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span>{format(new Date(virtualClass.scheduled_at), 'p', { locale: ar })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span>{virtualClass.attendance?.length || 0} مدعو</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={virtualClass.is_active ? 'default' : 'secondary'}>
                        {virtualClass.is_active ? 'نشط' : 'غير نشط'}
                      </Badge>
                    </div>
                  </div>
                  
                  {virtualClass.meeting_id && (
                    <div className="mt-2 text-sm text-gray-600">
                      معرف الاجتماع: <span className="font-mono">{virtualClass.meeting_id}</span>
                      {virtualClass.passcode && (
                        <span className="mr-4">
                          كلمة المرور: <span className="font-mono">{virtualClass.passcode}</span>
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Attendance Dialog */}
        <Dialog open={showAttendanceDialog} onOpenChange={setShowAttendanceDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>سجل الحضور</DialogTitle>
              <DialogDescription>
                {selectedClass?.title} - {selectedClass && format(new Date(selectedClass.scheduled_at), 'PPP p', { locale: ar })}
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>وقت الدخول</TableHead>
                    <TableHead>وقت الخروج</TableHead>
                    <TableHead>المدة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.students.full_name}</div>
                          <div className="text-sm text-gray-500">{record.students.student_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell>
                        {record.joined_at 
                          ? format(new Date(record.joined_at), 'p', { locale: ar })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {record.left_at 
                          ? format(new Date(record.left_at), 'p', { locale: ar })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {record.duration_minutes ? `${record.duration_minutes} دقيقة` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {record.status === 'invited' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAttendance(record.student_id, 'joined')}
                            >
                              حضر
                            </Button>
                          )}
                          {record.status === 'joined' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkAttendance(record.student_id, 'left')}
                            >
                              غادر
                            </Button>
                          )}
                          {record.status === 'invited' && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleMarkAttendance(record.student_id, 'absent')}
                            >
                              غائب
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default VirtualClasses;