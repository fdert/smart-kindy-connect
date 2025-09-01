import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { Plus, DollarSign, CreditCard, Users, Calendar, TrendingUp, TrendingDown, Receipt, Send, AlertCircle, Clock } from 'lucide-react';

interface StudentFee {
  id: string;
  student_id: string;
  amount: number;
  fee_type: string;
  due_date: string;
  status: string;
  payment_date?: string;
  discount?: number;
  notes?: string;
  student?: {
    full_name: string;
    student_id: string;
  };
}

interface FinancialTransaction {
  id: string;
  type: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  reference_number?: string;
  status: string;
}

interface FinancialStats {
  totalIncome: number;
  totalExpenses: number;
  pendingFees: number;
  overdueFees: number;
  monthlyIncome: number;
  monthlyExpenses: number;
}

const FinancialSystem = () => {
  const [studentFees, setStudentFees] = useState<StudentFee[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [stats, setStats] = useState<FinancialStats>({
    totalIncome: 0,
    totalExpenses: 0,
    pendingFees: 0,
    overdueFees: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0
  });
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddFeeDialogOpen, setIsAddFeeDialogOpen] = useState(false);
  const [isAddTransactionDialogOpen, setIsAddTransactionDialogOpen] = useState(false);
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [feeFormData, setFeeFormData] = useState({
    student_id: '',
    amount: 0,
    fee_type: 'monthly',
    due_date: '',
    discount: 0,
    notes: ''
  });

  const [transactionFormData, setTransactionFormData] = useState({
    type: 'expense',
    category: '',
    amount: 0,
    description: '',
    reference_number: ''
  });

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    } else if (tenant === null) {
      // If tenant is explicitly null, stop loading
      setLoading(false);
      toast({
        title: "خطأ في تحميل بيانات الروضة",
        description: "لا يمكن الوصول إلى بيانات الروضة. تأكد من صلاحياتك.",
        variant: "destructive",
      });
    }
  }, [tenant]);

  const loadData = async () => {
    try {
      await Promise.all([
        loadStudentFees(),
        loadTransactions(),
        loadStudents(),
        calculateStats()
      ]);
    } catch (error) {
      console.error('Error loading financial data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل البيانات المالية",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudentFees = async () => {
    try {
      const { data, error } = await supabase
        .from('student_fees')
        .select(`
          *,
          students (full_name, student_id)
        `)
        .eq('tenant_id', tenant?.id)
        .order('due_date', { ascending: false });

      if (error) throw error;
      setStudentFees(data || []);
    } catch (error: any) {
      console.error('Error loading student fees:', error);
    }
  };

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_transactions')
        .select('*')
        .eq('tenant_id', tenant?.id)
        .order('date', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error loading transactions:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, student_id')
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error('Error loading students:', error);
    }
  };

  const calculateStats = async () => {
    try {
      // Calculate student fees stats
      const { data: feesData, error: feesError } = await supabase
        .from('student_fees')
        .select('amount, status')
        .eq('tenant_id', tenant?.id);

      if (feesError) throw feesError;

      // Calculate transaction stats
      const { data: transactionData, error: transactionError } = await supabase
        .from('financial_transactions')
        .select('type, amount, date')
        .eq('tenant_id', tenant?.id)
        .eq('status', 'completed');

      if (transactionError) throw transactionError;

      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

      const newStats = {
        totalIncome: transactionData?.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0) || 0,
        totalExpenses: transactionData?.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0) || 0,
        pendingFees: feesData?.filter(f => f.status === 'pending').reduce((sum, f) => sum + f.amount, 0) || 0,
        overdueFees: feesData?.filter(f => f.status === 'overdue').reduce((sum, f) => sum + f.amount, 0) || 0,
        monthlyIncome: transactionData?.filter(t => t.type === 'income' && t.date.startsWith(currentMonth)).reduce((sum, t) => sum + t.amount, 0) || 0,
        monthlyExpenses: transactionData?.filter(t => t.type === 'expense' && t.date.startsWith(currentMonth)).reduce((sum, t) => sum + t.amount, 0) || 0,
      };

      setStats(newStats);
    } catch (error: any) {
      console.error('Error calculating stats:', error);
    }
  };

  const handleAddFee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from('student_fees')
        .insert({
          ...feeFormData,
          tenant_id: tenant.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "تم إضافة الرسوم بنجاح",
        description: "تم إضافة رسوم جديدة للطالب",
      });

      setIsAddFeeDialogOpen(false);
      setFeeFormData({
        student_id: '',
        amount: 0,
        fee_type: 'monthly',
        due_date: '',
        discount: 0,
        notes: ''
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة الرسوم",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      const { error } = await supabase
        .from('financial_transactions')
        .insert({
          ...transactionFormData,
          tenant_id: tenant.id,
          date: new Date().toISOString().split('T')[0],
          status: 'completed'
        });

      if (error) throw error;

      toast({
        title: "تم إضافة المعاملة بنجاح",
        description: "تم تسجيل المعاملة المالية",
      });

      setIsAddTransactionDialogOpen(false);
      setTransactionFormData({
        type: 'expense',
        category: '',
        amount: 0,
        description: '',
        reference_number: ''
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ في إضافة المعاملة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const markFeeAsPaid = async (feeId: string) => {
    try {
      const { error } = await supabase
        .from('student_fees')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', feeId);

      if (error) throw error;

      // Add income transaction
      const fee = studentFees.find(f => f.id === feeId);
      if (fee) {
        await supabase
          .from('financial_transactions')
          .insert({
            tenant_id: tenant?.id,
            type: 'income',
            category: 'student_fees',
            amount: fee.amount - (fee.discount || 0),
            description: `رسوم ${fee.fee_type} - ${fee.student?.full_name}`,
            date: new Date().toISOString().split('T')[0],
            status: 'completed'
          });
      }

      toast({
        title: "تم تسجيل الدفع",
        description: "تم تسجيل دفع الرسوم بنجاح",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدفع",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendPaymentReminder = async (fee: StudentFee) => {
    try {
      const { error } = await supabase.functions.invoke('send-whatsapp-notifications', {
        body: {
          tenantId: tenant?.id,
          studentId: fee.student_id,
          message: `تذكير دفع الرسوم: ${fee.fee_type}\nالمبلغ: ${fee.amount} ريال\nتاريخ الاستحقاق: ${fee.due_date}`,
          messageType: 'payment_reminder'
        }
      });

      if (error) throw error;

      toast({
        title: "تم الإرسال بنجاح",
        description: "تم إرسال تذكير الدفع عبر الواتساب",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في الإرسال",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800">مدفوع</Badge>;
      case 'pending': return <Badge variant="secondary">معلق</Badge>;
      case 'overdue': return <Badge variant="destructive">متأخر</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatAmount = (amount: number) => {
    return `${amount.toLocaleString()} ريال`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل النظام المالي...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="h-8 w-8 text-primary" />
            النظام المالي
          </h1>
          <p className="text-gray-600 mt-1">إدارة الرسوم والمعاملات المالية</p>
        </div>

        {/* Financial Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي الدخل</p>
                  <p className="text-2xl font-bold text-green-600">{formatAmount(stats.totalIncome)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">إجمالي المصروفات</p>
                  <p className="text-2xl font-bold text-red-600">{formatAmount(stats.totalExpenses)}</p>
                </div>
                <TrendingDown className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">رسوم معلقة</p>
                  <p className="text-2xl font-bold text-yellow-600">{formatAmount(stats.pendingFees)}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">رسوم متأخرة</p>
                  <p className="text-2xl font-bold text-red-600">{formatAmount(stats.overdueFees)}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="fees" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="fees">رسوم الطلاب</TabsTrigger>
            <TabsTrigger value="transactions">المعاملات المالية</TabsTrigger>
            <TabsTrigger value="reports">التقارير المالية</TabsTrigger>
          </TabsList>

          {/* Student Fees */}
          <TabsContent value="fees">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>رسوم الطلاب</CardTitle>
                    <CardDescription>إدارة رسوم الاشتراكات والخدمات</CardDescription>
                  </div>
                  <Dialog open={isAddFeeDialogOpen} onOpenChange={setIsAddFeeDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة رسوم
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة رسوم جديدة</DialogTitle>
                        <DialogDescription>أضف رسوم للطالب</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddFee}>
                        <div className="grid gap-4 py-4">
                          <div>
                            <Label htmlFor="student">الطالب</Label>
                            <Select value={feeFormData.student_id} onValueChange={(value) => setFeeFormData(prev => ({ ...prev, student_id: value }))}>
                              <SelectTrigger>
                                <SelectValue placeholder="اختر الطالب" />
                              </SelectTrigger>
                              <SelectContent>
                                {students.map((student: any) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.full_name} ({student.student_id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="amount">المبلغ (ريال)</Label>
                              <Input
                                id="amount"
                                type="number"
                                min="0"
                                value={feeFormData.amount}
                                onChange={(e) => setFeeFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="fee_type">نوع الرسوم</Label>
                              <Select value={feeFormData.fee_type} onValueChange={(value) => setFeeFormData(prev => ({ ...prev, fee_type: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="monthly">شهري</SelectItem>
                                  <SelectItem value="semester">نصف سنوي</SelectItem>
                                  <SelectItem value="annual">سنوي</SelectItem>
                                  <SelectItem value="registration">رسوم تسجيل</SelectItem>
                                  <SelectItem value="uniform">زي مدرسي</SelectItem>
                                  <SelectItem value="books">كتب</SelectItem>
                                  <SelectItem value="transport">نقل</SelectItem>
                                  <SelectItem value="meals">وجبات</SelectItem>
                                  <SelectItem value="activity">أنشطة</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="due_date">تاريخ الاستحقاق</Label>
                              <Input
                                id="due_date"
                                type="date"
                                value={feeFormData.due_date}
                                onChange={(e) => setFeeFormData(prev => ({ ...prev, due_date: e.target.value }))}
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="discount">الخصم (ريال)</Label>
                              <Input
                                id="discount"
                                type="number"
                                min="0"
                                value={feeFormData.discount}
                                onChange={(e) => setFeeFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="notes">ملاحظات</Label>
                            <Input
                              id="notes"
                              value={feeFormData.notes}
                              onChange={(e) => setFeeFormData(prev => ({ ...prev, notes: e.target.value }))}
                              placeholder="ملاحظات إضافية"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsAddFeeDialogOpen(false)}>
                            إلغاء
                          </Button>
                          <Button type="submit">إضافة الرسوم</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {studentFees.map((fee) => (
                    <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{fee.student?.full_name}</h4>
                          <Badge variant="outline">{fee.student?.student_id}</Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {fee.fee_type} - {formatAmount(fee.amount)}
                          {fee.discount > 0 && ` (خصم: ${formatAmount(fee.discount)})`}
                        </p>
                        <p className="text-xs text-gray-500">
                          تاريخ الاستحقاق: {fee.due_date}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(fee.status)}
                        {fee.status !== 'paid' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendPaymentReminder(fee)}
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => markFeeAsPaid(fee.id)}
                            >
                              تسجيل دفع
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions */}
          <TabsContent value="transactions">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>المعاملات المالية</CardTitle>
                    <CardDescription>سجل جميع المعاملات المالية</CardDescription>
                  </div>
                  <Dialog open={isAddTransactionDialogOpen} onOpenChange={setIsAddTransactionDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        إضافة معاملة
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>إضافة معاملة مالية</DialogTitle>
                        <DialogDescription>سجل معاملة مالية جديدة</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleAddTransaction}>
                        <div className="grid gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="type">نوع المعاملة</Label>
                              <Select value={transactionFormData.type} onValueChange={(value) => setTransactionFormData(prev => ({ ...prev, type: value }))}>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="income">دخل</SelectItem>
                                  <SelectItem value="expense">مصروف</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor="category">التصنيف</Label>
                              <Select value={transactionFormData.category} onValueChange={(value) => setTransactionFormData(prev => ({ ...prev, category: value }))}>
                                <SelectTrigger>
                                  <SelectValue placeholder="اختر التصنيف" />
                                </SelectTrigger>
                                <SelectContent>
                                  {transactionFormData.type === 'income' ? (
                                    <>
                                      <SelectItem value="student_fees">رسوم الطلاب</SelectItem>
                                      <SelectItem value="registration">رسوم التسجيل</SelectItem>
                                      <SelectItem value="activities">الأنشطة</SelectItem>
                                      <SelectItem value="other_income">دخل أخر</SelectItem>
                                    </>
                                  ) : (
                                    <>
                                      <SelectItem value="salaries">الرواتب</SelectItem>
                                      <SelectItem value="rent">الإيجار</SelectItem>
                                      <SelectItem value="utilities">المرافق</SelectItem>
                                      <SelectItem value="supplies">المستلزمات</SelectItem>
                                      <SelectItem value="maintenance">الصيانة</SelectItem>
                                      <SelectItem value="marketing">التسويق</SelectItem>
                                      <SelectItem value="insurance">التأمين</SelectItem>
                                      <SelectItem value="transportation">النقل</SelectItem>
                                      <SelectItem value="meals">الوجبات</SelectItem>
                                      <SelectItem value="other_expense">مصروف أخر</SelectItem>
                                    </>
                                  )}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="amount">المبلغ (ريال)</Label>
                            <Input
                              id="amount"
                              type="number"
                              min="0"
                              value={transactionFormData.amount}
                              onChange={(e) => setTransactionFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="description">الوصف</Label>
                            <Input
                              id="description"
                              value={transactionFormData.description}
                              onChange={(e) => setTransactionFormData(prev => ({ ...prev, description: e.target.value }))}
                              placeholder="وصف المعاملة"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="reference">رقم المرجع</Label>
                            <Input
                              id="reference"
                              value={transactionFormData.reference_number}
                              onChange={(e) => setTransactionFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                              placeholder="رقم الفاتورة أو المرجع (اختياري)"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsAddTransactionDialogOpen(false)}>
                            إلغاء
                          </Button>
                          <Button type="submit">إضافة المعاملة</Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{transaction.description}</h4>
                          <Badge variant={transaction.type === 'income' ? 'default' : 'secondary'}>
                            {transaction.type === 'income' ? 'دخل' : 'مصروف'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">
                          {transaction.category} - {transaction.date}
                        </p>
                        {transaction.reference_number && (
                          <p className="text-xs text-gray-500">مرجع: {transaction.reference_number}</p>
                        )}
                      </div>
                      <div className={`text-lg font-semibold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatAmount(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Financial Reports */}
          <TabsContent value="reports">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>التقارير المالية</CardTitle>
                <CardDescription>تقارير شاملة عن الوضع المالي</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">الدخل الشهري</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600 mb-2">
                        {formatAmount(stats.monthlyIncome)}
                      </div>
                      <p className="text-sm text-gray-600">
                        مقارنة بالشهر الماضي: +12%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">المصروفات الشهرية</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-600 mb-2">
                        {formatAmount(stats.monthlyExpenses)}
                      </div>
                      <p className="text-sm text-gray-600">
                        مقارنة بالشهر الماضي: -5%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">صافي الربح</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold mb-2 ${stats.totalIncome - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatAmount(stats.totalIncome - stats.totalExpenses)}
                      </div>
                      <p className="text-sm text-gray-600">
                        هامش الربح: {((stats.totalIncome - stats.totalExpenses) / stats.totalIncome * 100 || 0).toFixed(1)}%
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">معدل التحصيل</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-600 mb-2">
                        {stats.pendingFees + stats.overdueFees > 0 
                          ? ((stats.totalIncome / (stats.totalIncome + stats.pendingFees + stats.overdueFees)) * 100).toFixed(1)
                          : 100}%
                      </div>
                      <p className="text-sm text-gray-600">
                        نسبة الرسوم المحصلة من إجمالي الرسوم
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="mt-6">
                  <Button>
                    <Receipt className="h-4 w-4 mr-2" />
                    إنشاء تقرير مفصل
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FinancialSystem;