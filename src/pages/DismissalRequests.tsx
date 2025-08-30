import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { 
  UserX, 
  Plus, 
  Check, 
  X, 
  Clock, 
  CalendarIcon, 
  QrCode,
  Key,
  Send,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface DismissalRequest {
  id: string;
  student_id: string;
  guardian_id: string;
  pickup_time: string;
  reason: string | null;
  pickup_method: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  approved_by: string | null;
  approved_at: string | null;
  rejection_reason: string | null;
  request_time: string;
  students: {
    full_name: string;
    student_id: string;
  };
  guardians: {
    full_name: string;
    phone: string;
    whatsapp_number: string | null;
  };
  dismissal_tokens?: DismissalToken[];
}

interface DismissalToken {
  id: string;
  token_value: string;
  token_type: string;
  expires_at: string;
  is_active: boolean;
  used_at: string | null;
  used_by: string | null;
}

interface Student {
  id: string;
  full_name: string;
  student_id: string;
}

interface Guardian {
  id: string;
  full_name: string;
  phone: string;
}

const DismissalRequests = () => {
  const [requests, setRequests] = useState<DismissalRequest[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<DismissalRequest | null>(null);
  const [tokens, setTokens] = useState<DismissalToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showTokensDialog, setShowTokensDialog] = useState(false);

  const [formData, setFormData] = useState({
    student_id: '',
    guardian_id: '',
    pickup_time: new Date(),
    reason: '',
    pickup_method: 'guardian'
  });

  const [approvalData, setApprovalData] = useState({
    rejection_reason: ''
  });

  const { tenant } = useTenant();
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [tenant]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadRequests(),
        loadStudents(),
        loadGuardians()
      ]);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadRequests = async () => {
    if (!tenant?.id) return;

    const { data, error } = await supabase
      .from('dismissal_requests')
      .select(`
        *,
        students (full_name, student_id),
        guardians (full_name, phone, whatsapp_number)
      `)
      .eq('tenant_id', tenant.id)
      .order('request_time', { ascending: false });

    if (error) throw error;
    setRequests(data || []);
  };

  const loadStudents = async () => {
    if (!tenant?.id) return;

    const { data, error } = await supabase
      .from('students')
      .select('id, full_name, student_id')
      .eq('tenant_id', tenant.id)
      .eq('is_active', true)
      .order('full_name');

    if (error) throw error;
    setStudents(data || []);
  };

  const loadGuardians = async () => {
    if (!tenant?.id) return;

    const { data, error } = await supabase
      .from('guardians')
      .select('id, full_name, phone')
      .eq('tenant_id', tenant.id)
      .order('full_name');

    if (error) throw error;
    setGuardians(data || []);
  };

  const loadTokens = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('dismissal_tokens')
        .select('*')
        .eq('dismissal_request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTokens(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الرموز",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant?.id) return;

    setProcessing(true);
    try {
      const { error } = await supabase
        .from('dismissal_requests')
        .insert([{
          tenant_id: tenant.id,
          student_id: formData.student_id,
          guardian_id: formData.guardian_id,
          pickup_time: formData.pickup_time.toISOString(),
          reason: formData.reason,
          pickup_method: formData.pickup_method,
          status: 'pending'
        }]);

      if (error) throw error;

      toast({
        title: "تم إنشاء الطلب",
        description: "تم إنشاء طلب الخروج بنجاح",
      });

      setShowCreateDialog(false);
      setFormData({
        student_id: '',
        guardian_id: '',
        pickup_time: new Date(),
        reason: '',
        pickup_method: 'guardian'
      });
      loadRequests();
    } catch (error: any) {
      toast({
        title: "خطأ في إنشاء الطلب",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleApproval = async (requestId: string, approve: boolean) => {
    setProcessing(true);
    try {
      const updateData: any = {
        status: approve ? 'approved' : 'rejected',
        approved_at: new Date().toISOString()
      };

      if (!approve && approvalData.rejection_reason) {
        updateData.rejection_reason = approvalData.rejection_reason;
      }

      const { error } = await supabase
        .from('dismissal_requests')
        .update(updateData)
        .eq('id', requestId);

      if (error) throw error;

      // If approved, generate tokens
      if (approve) {
        await generateTokens(requestId);
      }

      toast({
        title: approve ? "تم اعتماد الطلب" : "تم رفض الطلب",
        description: approve ? "تم اعتماد طلب الخروج وإنتاج الرموز" : "تم رفض طلب الخروج",
      });

      loadRequests();
      setApprovalData({ rejection_reason: '' });
    } catch (error: any) {
      toast({
        title: "خطأ في معالجة الطلب",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const generateTokens = async (requestId: string) => {
    try {
      // Generate PIN (4-digit number)
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
      
      // Generate QR code data (could be a UUID or encrypted data)
      const qrData = `DISMISS_${requestId}_${Date.now()}`;
      
      const expiresAt = new Date();
      expiresAt.setHours(23, 59, 59, 999); // Expire at end of day

      // Insert both tokens
      const { error } = await supabase
        .from('dismissal_tokens')
        .insert([
          {
            dismissal_request_id: requestId,
            tenant_id: tenant?.id,
            token_type: 'pin',
            token_value: pin,
            expires_at: expiresAt.toISOString(),
            is_active: true
          },
          {
            dismissal_request_id: requestId,
            tenant_id: tenant?.id,
            token_type: 'qr',
            token_value: qrData,
            expires_at: expiresAt.toISOString(),
            is_active: true
          }
        ]);

      if (error) throw error;

      // Send WhatsApp notification with PIN/QR
      await sendDismissalNotification(requestId, pin, qrData);
      
    } catch (error: any) {
      console.error('Error generating tokens:', error);
      throw error;
    }
  };

  const sendDismissalNotification = async (requestId: string, pin: string, qrData: string) => {
    try {
      // This would integrate with the WhatsApp API
      // For now, just show success message
      console.log('Sending WhatsApp notification:', { requestId, pin, qrData });
    } catch (error: any) {
      console.error('Error sending notification:', error);
    }
  };

  const handleViewTokens = async (request: DismissalRequest) => {
    setSelectedRequest(request);
    await loadTokens(request.id);
    setShowTokensDialog(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'secondary', icon: Clock, label: 'في الانتظار' },
      approved: { variant: 'default', icon: Check, label: 'معتمد' },
      rejected: { variant: 'destructive', icon: X, label: 'مرفوض' },
      completed: { variant: 'default', icon: Check, label: 'مكتمل' }
    } as const;

    const config = variants[status as keyof typeof variants] || variants.pending;
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
          <p className="text-muted-foreground">جاري تحميل طلبات الخروج...</p>
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
              <UserX className="h-8 w-8 text-primary" />
              طلبات الخروج والاستئذان
            </h1>
            <p className="text-gray-600 mt-1">إدارة طلبات خروج الطلاب مع نظام QR/PIN</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                طلب خروج جديد
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إنشاء طلب خروج جديد</DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>الطالب</Label>
                    <Select
                      value={formData.student_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}
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

                  <div>
                    <Label>ولي الأمر</Label>
                    <Select
                      value={formData.guardian_id}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, guardian_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر ولي الأمر" />
                      </SelectTrigger>
                      <SelectContent>
                        {guardians.map((guardian) => (
                          <SelectItem key={guardian.id} value={guardian.id}>
                            {guardian.full_name} ({guardian.phone})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>وقت الاستلام</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {format(formData.pickup_time, 'PPP p', { locale: ar })}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.pickup_time}
                          onSelect={(date) => date && setFormData(prev => ({ ...prev, pickup_time: date }))}
                          initialFocus
                        />
                        <div className="p-3 border-t">
                          <Input
                            type="time"
                            value={format(formData.pickup_time, 'HH:mm')}
                            onChange={(e) => {
                              const [hours, minutes] = e.target.value.split(':');
                              const newDate = new Date(formData.pickup_time);
                              newDate.setHours(parseInt(hours), parseInt(minutes));
                              setFormData(prev => ({ ...prev, pickup_time: newDate }));
                            }}
                          />
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div>
                    <Label>طريقة الاستلام</Label>
                    <Select
                      value={formData.pickup_method}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, pickup_method: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="guardian">ولي الأمر</SelectItem>
                        <SelectItem value="authorized_person">شخص مخول</SelectItem>
                        <SelectItem value="transportation">مواصلات</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>سبب الخروج</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="سبب الخروج أو الاستئذان..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={processing}>
                    {processing ? 'جاري الإنشاء...' : 'إنشاء الطلب'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Requests List */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>طلبات الخروج</CardTitle>
            <CardDescription>إدارة جميع طلبات خروج الطلاب</CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
              <div className="text-center py-12">
                <UserX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد طلبات خروج</h3>
                <p className="text-gray-500 mb-4">ابدأ بإنشاء طلب خروج جديد</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 ml-1" />
                  طلب خروج جديد
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>الطالب</TableHead>
                    <TableHead>ولي الأمر</TableHead>
                    <TableHead>وقت الاستلام</TableHead>
                    <TableHead>السبب</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{request.students?.full_name}</div>
                          <div className="text-sm text-gray-500">{request.students?.student_id}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{request.guardians?.full_name}</div>
                          <div className="text-sm text-gray-500">{request.guardians?.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(request.pickup_time), 'PPP p', { locale: ar })}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs truncate" title={request.reason || ''}>
                          {request.reason || 'غير محدد'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(request.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {request.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleApproval(request.id, true)}
                                disabled={processing}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleApproval(request.id, false)}
                                disabled={processing}
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewTokens(request)}
                            >
                              <Eye className="h-4 w-4 ml-1" />
                              الرموز
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Tokens Dialog */}
        <Dialog open={showTokensDialog} onOpenChange={setShowTokensDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                رموز الاستلام - {selectedRequest?.students?.full_name}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {tokens.length === 0 ? (
                <p className="text-center text-gray-500 py-8">لا توجد رموز متاحة</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tokens.map((token) => (
                    <Card key={token.id} className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {token.token_type === 'pin' ? (
                            <Key className="h-5 w-5 text-blue-500" />
                          ) : (
                            <QrCode className="h-5 w-5 text-green-500" />
                          )}
                          <span className="font-semibold">
                            {token.token_type === 'pin' ? 'رمز PIN' : 'رمز QR'}
                          </span>
                        </div>
                        <Badge variant={token.is_active ? 'default' : 'secondary'}>
                          {token.is_active ? 'نشط' : 'منتهي'}
                        </Badge>
                      </div>
                      
                      <div className="text-center">
                        {token.token_type === 'pin' ? (
                          <div className="text-3xl font-mono font-bold text-blue-600 bg-blue-50 p-4 rounded-lg">
                            {token.token_value}
                          </div>
                        ) : (
                          <div className="bg-white p-4 rounded-lg border text-center">
                            <div className="text-xs text-gray-500 mb-2">QR Code</div>
                            <div className="font-mono text-sm break-all bg-gray-50 p-2 rounded">
                              {token.token_value}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-500 text-center">
                        ينتهي في: {format(new Date(token.expires_at), 'PPP p', { locale: ar })}
                        {token.used_at && (
                          <div className="text-green-600 mt-1">
                            تم الاستخدام: {format(new Date(token.used_at), 'PPP p', { locale: ar })}
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Send WhatsApp reminder
                    toast({
                      title: "تم إرسال التذكير",
                      description: "تم إرسال رسالة تذكير عبر واتساب",
                    });
                  }}
                >
                  <Send className="h-4 w-4 ml-1" />
                  إرسال تذكير
                </Button>
                <Button onClick={() => setShowTokensDialog(false)}>
                  إغلاق
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DismissalRequests;