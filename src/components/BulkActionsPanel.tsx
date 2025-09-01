import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Send, MessageCircle, CreditCard, Calendar } from 'lucide-react';

interface BulkActionsPanelProps {
  selectedStudents: string[];
  onActionComplete?: () => void;
}

const BulkActionsPanel = ({ selectedStudents, onActionComplete }: BulkActionsPanelProps) => {
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [isFeeDialogOpen, setIsFeeDialogOpen] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [feeData, setFeeData] = useState({
    amount: 0,
    fee_type: 'monthly',
    due_date: '',
    notes: ''
  });
  const { tenant } = useTenant();
  const { toast } = useToast();

  const sendBulkMessage = async () => {
    if (!tenant || selectedStudents.length === 0 || !messageText.trim()) return;

    try {
      const { error } = await supabase.functions.invoke('send-whatsapp-notifications', {
        body: {
          tenantId: tenant.id,
          studentIds: selectedStudents,
          message: messageText,
          messageType: 'bulk_notification'
        }
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: `تم إرسال الرسالة إلى ${selectedStudents.length} ولي أمر`,
      });

      setIsMessageDialogOpen(false);
      setMessageText('');
      onActionComplete?.();
    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addBulkFees = async () => {
    if (!tenant || selectedStudents.length === 0) return;

    try {
      const feesData = selectedStudents.map(studentId => ({
        tenant_id: tenant.id,
        student_id: studentId,
        ...feeData,
        status: 'pending'
      }));

      const { error } = await supabase
        .from('student_fees')
        .insert(feesData);

      if (error) throw error;

      toast({
        title: "تم إضافة الرسوم بنجاح",
        description: `تم إضافة رسوم لـ ${selectedStudents.length} طالب`,
      });

      setIsFeeDialogOpen(false);
      setFeeData({
        amount: 0,
        fee_type: 'monthly',
        due_date: '',
        notes: ''
      });
      onActionComplete?.();
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة الرسوم",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (selectedStudents.length === 0) return null;

  return (
    <Card className="bg-blue-50/80 backdrop-blur-sm border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg">إجراءات جماعية</CardTitle>
        <CardDescription>
          تم تحديد {selectedStudents.length} طالب
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2">
          {/* Send Message */}
          <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <MessageCircle className="h-4 w-4 mr-2" />
                إرسال رسالة
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إرسال رسالة جماعية</DialogTitle>
                <DialogDescription>
                  إرسال رسالة واتساب إلى {selectedStudents.length} ولي أمر
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div>
                  <Label htmlFor="message">نص الرسالة</Label>
                  <Textarea
                    id="message"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="اكتب الرسالة هنا..."
                    rows={4}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsMessageDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={sendBulkMessage} disabled={!messageText.trim()}>
                  إرسال الرسالة
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Add Fees */}
          <Dialog open={isFeeDialogOpen} onOpenChange={setIsFeeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <CreditCard className="h-4 w-4 mr-2" />
                إضافة رسوم
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>إضافة رسوم جماعية</DialogTitle>
                <DialogDescription>
                  إضافة رسوم لـ {selectedStudents.length} طالب
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bulk_amount">المبلغ (ريال)</Label>
                    <Input
                      id="bulk_amount"
                      type="number"
                      min="0"
                      value={feeData.amount}
                      onChange={(e) => setFeeData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="bulk_fee_type">نوع الرسوم</Label>
                    <Select value={feeData.fee_type} onValueChange={(value) => setFeeData(prev => ({ ...prev, fee_type: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">شهري</SelectItem>
                        <SelectItem value="semester">نصف سنوي</SelectItem>
                        <SelectItem value="annual">سنوي</SelectItem>
                        <SelectItem value="registration">رسوم تسجيل</SelectItem>
                        <SelectItem value="activity">أنشطة</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="bulk_due_date">تاريخ الاستحقاق</Label>
                  <Input
                    id="bulk_due_date"
                    type="date"
                    value={feeData.due_date}
                    onChange={(e) => setFeeData(prev => ({ ...prev, due_date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="bulk_notes">ملاحظات</Label>
                  <Input
                    id="bulk_notes"
                    value={feeData.notes}
                    onChange={(e) => setFeeData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="ملاحظات إضافية"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsFeeDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button onClick={addBulkFees}>
                  إضافة الرسوم
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};

export default BulkActionsPanel;