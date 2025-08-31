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
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Shield, Plus, Send, Eye, CalendarIcon, Check, X, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { PermissionResponseCard } from '@/components/PermissionResponseCard';

interface Permission {
  id: string;
  title: string;
  description: string | null;
  permission_type: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
  responses?: PermissionResponse[];
}

interface PermissionResponse {
  id: string;
  response: 'approved' | 'declined' | 'pending';
  responded_at: string | null;
  notes: string | null;
  guardians: {
    full_name: string;
    whatsapp_number: string;
  };
  students: {
    full_name: string;
  };
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
}

const Permissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [responses, setResponses] = useState<PermissionResponse[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showResponsesDialog, setShowResponsesDialog] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    permissionType: 'activity',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days from now
    selectedStudents: [] as string[],
    responseOptions: ['موافق', 'غير موافق'] as string[],
    customOption: ''
  });

  const { tenant } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    // Super admins can view all data, regular users need a tenant
    loadPermissions();
    loadStudents();
  }, [tenant]);

  const loadPermissions = async () => {
    try {
      let query = supabase
        .from('permissions')
        .select('*');
      
      // Filter by tenant only if user has a tenant (not super admin)
      if (tenant?.id) {
        query = query.eq('tenant_id', tenant.id);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      setPermissions(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الأذونات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
      toast({
        title: "خطأ في تحميل الطلاب",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreatePermission = async (e: React.FormEvent) => {
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
      
      const { data, error } = await supabase.functions.invoke('permissions-api', {
        body: {
          title: formData.title,
          description: formData.description,
          permissionType: formData.permissionType,
          expiresAt: formData.expiresAt.toISOString(),
          studentIds: formData.selectedStudents,
          responseOptions: formData.responseOptions
        }
      });

      if (error) throw error;

      toast({
        title: "تم إنشاء الإذن",
        description: "تم إنشاء إذن جديد بنجاح",
      });

      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        permissionType: 'activity',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        selectedStudents: [],
        responseOptions: ['موافق', 'غير موافق'],
        customOption: ''
      });
      loadPermissions();
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الإذن",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleSendNotifications = async (permissionId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('permissions-api', {
        body: {
          action: 'notify',
          permissionId: permissionId
        }
      });

      if (error) throw error;

      toast({
        title: "تم إرسال الإشعارات",
        description: `تم إرسال ${data?.notificationsSent || 0} إشعار عبر واتساب`,
      });
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الإشعارات",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewResponses = async (permission: Permission) => {
    try {
      setSelectedPermission(permission);
      
      const { data, error } = await supabase.functions.invoke('permissions-api', {
        body: {
          action: 'getResponses',
          permissionId: permission.id
        }
      });

      if (error) throw error;
      
      setResponses(data || []);
      setShowResponsesDialog(true);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الردود",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getPermissionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      activity: 'نشاط',
      trip: 'رحلة',
      medical: 'طبي',
      event: 'فعالية',
      other: 'أخرى'
    };
    return types[type] || type;
  };

  const getResponseBadge = (response: string) => {
    const variants: Record<string, { variant: any, icon: any, label: string }> = {
      approved: { variant: 'default', icon: Check, label: 'موافق' },
      declined: { variant: 'destructive', icon: X, label: 'مرفوض' },
      pending: { variant: 'secondary', icon: Clock, label: 'في الانتظار' }
    };
    
    const config = variants[response] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الأذونات...</p>
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
              <Shield className="h-8 w-8 text-primary" />
              أذونات الوالدين
            </h1>
            <p className="text-gray-600 mt-1">إدارة طلبات الموافقة من أولياء الأمور</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إنشاء إذن جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء إذن جديد</DialogTitle>
                <DialogDescription>
                  إنشاء طلب موافقة جديد لإرساله لأولياء الأمور
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleCreatePermission} className="space-y-4">
                <div>
                  <Label htmlFor="title">عنوان الإذن</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="مثال: إذن للمشاركة في الرحلة المدرسية"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">الوصف</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="تفاصيل إضافية حول الإذن المطلوب..."
                    rows={3}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>نوع الإذن</Label>
                    <Select
                      value={formData.permissionType}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, permissionType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="activity">نشاط</SelectItem>
                        <SelectItem value="trip">رحلة</SelectItem>
                        <SelectItem value="medical">طبي</SelectItem>
                        <SelectItem value="event">فعالية</SelectItem>
                        <SelectItem value="other">أخرى</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>تاريخ الانتهاء</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.expiresAt, 'PPP', { locale: ar })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.expiresAt}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, expiresAt: date }))}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div>
                  <Label>خيارات الرد المطلوبة</Label>
                  <div className="space-y-2">
                    {formData.responseOptions.map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          value={option}
                          onChange={(e) => {
                            const newOptions = [...formData.responseOptions];
                            newOptions[index] = e.target.value;
                            setFormData(prev => ({ ...prev, responseOptions: newOptions }));
                          }}
                          placeholder="خيار الرد"
                        />
                        {formData.responseOptions.length > 2 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const newOptions = formData.responseOptions.filter((_, i) => i !== index);
                              setFormData(prev => ({ ...prev, responseOptions: newOptions }));
                            }}
                          >
                            حذف
                          </Button>
                        )}
                      </div>
                    ))}
                    <div className="flex gap-2">
                      <Input
                        value={formData.customOption}
                        onChange={(e) => setFormData(prev => ({ ...prev, customOption: e.target.value }))}
                        placeholder="إضافة خيار جديد"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (formData.customOption.trim()) {
                            setFormData(prev => ({
                              ...prev,
                              responseOptions: [...prev.responseOptions, prev.customOption.trim()],
                              customOption: ''
                            }));
                          }
                        }}
                        disabled={!formData.customOption.trim()}
                      >
                        إضافة
                      </Button>
                    </div>
                  </div>
                </div>
                
                <div>
                  <Label>الطلاب المستهدفين</Label>
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
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={creating}>
                    {creating ? 'جاري الإنشاء...' : 'إنشاء الإذن'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Permissions List */}
        <div className="grid gap-4">
          {permissions.length === 0 ? (
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Shield className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد أذونات</h3>
                <p className="text-gray-500 text-center mb-4">ابدأ بإنشاء إذن جديد لطلب موافقة أولياء الأمور</p>
                <Button onClick={() => setShowCreateDialog(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  إنشاء إذن جديد
                </Button>
              </CardContent>
            </Card>
          ) : (
            permissions.map((permission) => (
              <Card key={permission.id} className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {permission.title}
                        <Badge variant="outline">
                          {getPermissionTypeLabel(permission.permission_type)}
                        </Badge>
                      </CardTitle>
                      <CardDescription>
                        {permission.description}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewResponses(permission)}
                        className="flex items-center gap-1"
                      >
                        <Eye className="h-4 w-4" />
                        الردود
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendNotifications(permission.id)}
                        className="flex items-center gap-1"
                      >
                        <Send className="h-4 w-4" />
                        إرسال تذكير
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center gap-4">
                      <span>تاريخ الإنشاء: {format(new Date(permission.created_at), 'PPP', { locale: ar })}</span>
                      <span>ينتهي في: {format(new Date(permission.expires_at), 'PPP', { locale: ar })}</span>
                    </div>
                    <Badge variant={permission.is_active ? 'default' : 'secondary'}>
                      {permission.is_active ? 'نشط' : 'غير نشط'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Responses Dialog */}
        <Dialog open={showResponsesDialog} onOpenChange={setShowResponsesDialog}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>ردود الأولياء</DialogTitle>
              <DialogDescription>
                {selectedPermission?.title}
              </DialogDescription>
            </DialogHeader>
            
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ولي الأمر</TableHead>
                    <TableHead>الطالب</TableHead>
                    <TableHead>الرد</TableHead>
                    <TableHead>تاريخ الرد</TableHead>
                    <TableHead>ملاحظات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {responses.map((response) => (
                    <TableRow key={response.id}>
                      <TableCell>{response.guardians?.full_name}</TableCell>
                      <TableCell>{response.students?.full_name}</TableCell>
                      <TableCell>{getResponseBadge(response.response)}</TableCell>
                      <TableCell>
                        {response.responded_at 
                          ? format(new Date(response.responded_at), 'PPP', { locale: ar })
                          : '-'
                        }
                      </TableCell>
                      <TableCell className="max-w-xs truncate">
                        {response.notes || '-'}
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

export default Permissions;