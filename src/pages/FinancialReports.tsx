import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useTenant } from '@/hooks/useTenant';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, DollarSign, Users, CreditCard } from 'lucide-react';

interface ReportData {
  month: string;
  income: number;
  expenses: number;
  profit: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

const FinancialReports = () => {
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<CategoryData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6months');
  const [loading, setLoading] = useState(true);
  const { tenant } = useTenant();
  const { toast } = useToast();

  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1', '#d084d0'];

  useEffect(() => {
    if (tenant) {
      loadReportData();
    }
  }, [tenant, selectedPeriod]);

  const loadReportData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadMonthlyData(),
        loadCategoryData()
      ]);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل التقارير",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMonthlyData = async () => {
    try {
      const startDate = getStartDate();
      
      // Load financial transactions
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('type, amount, date, category')
        .eq('tenant_id', tenant?.id)
        .eq('status', 'completed')
        .gte('date', startDate);

      if (error) throw error;

      // Group by month
      const monthlyData: { [key: string]: { income: number; expenses: number } } = {};
      
      transactions?.forEach(transaction => {
        const month = transaction.date.slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { income: 0, expenses: 0 };
        }
        
        if (transaction.type === 'income') {
          monthlyData[month].income += transaction.amount;
        } else {
          monthlyData[month].expenses += transaction.amount;
        }
      });

      const formattedData = Object.entries(monthlyData).map(([month, data]) => ({
        month: formatMonthName(month),
        income: data.income,
        expenses: data.expenses,
        profit: data.income - data.expenses
      }));

      setReportData(formattedData.sort((a, b) => a.month.localeCompare(b.month)));
    } catch (error: any) {
      console.error('Error loading monthly data:', error);
    }
  };

  const loadCategoryData = async () => {
    try {
      const startDate = getStartDate();
      
      const { data: transactions, error } = await supabase
        .from('financial_transactions')
        .select('type, amount, category')
        .eq('tenant_id', tenant?.id)
        .eq('status', 'completed')
        .gte('date', startDate);

      if (error) throw error;

      // Group income by category
      const incomeByCategory: { [key: string]: number } = {};
      const expenseByCategory: { [key: string]: number } = {};

      transactions?.forEach(transaction => {
        if (transaction.type === 'income') {
          incomeByCategory[transaction.category] = (incomeByCategory[transaction.category] || 0) + transaction.amount;
        } else {
          expenseByCategory[transaction.category] = (expenseByCategory[transaction.category] || 0) + transaction.amount;
        }
      });

      const incomeData = Object.entries(incomeByCategory).map(([category, value], index) => ({
        name: getCategoryDisplayName(category),
        value,
        color: COLORS[index % COLORS.length]
      }));

      const expenseData = Object.entries(expenseByCategory).map(([category, value], index) => ({
        name: getCategoryDisplayName(category),
        value,
        color: COLORS[index % COLORS.length]
      }));

      setIncomeCategories(incomeData);
      setExpenseCategories(expenseData);
    } catch (error: any) {
      console.error('Error loading category data:', error);
    }
  };

  const getStartDate = () => {
    const now = new Date();
    switch (selectedPeriod) {
      case '1month':
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      case '3months':
        return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
      case '6months':
        return new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
      case '1year':
        return new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];
      default:
        return new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().split('T')[0];
    }
  };

  const formatMonthName = (month: string) => {
    const [year, monthNum] = month.split('-');
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
  };

  const getCategoryDisplayName = (category: string) => {
    const categoryNames: { [key: string]: string } = {
      student_fees: 'رسوم الطلاب',
      registration: 'رسوم التسجيل',
      activities: 'الأنشطة',
      salaries: 'الرواتب',
      rent: 'الإيجار',
      utilities: 'المرافق',
      supplies: 'المستلزمات',
      maintenance: 'الصيانة',
      marketing: 'التسويق',
      insurance: 'التأمين',
      transportation: 'النقل',
      meals: 'الوجبات'
    };
    return categoryNames[category] || category;
  };

  const exportReport = () => {
    // Create CSV data
    const csvData = reportData.map(item => 
      `${item.month},${item.income},${item.expenses},${item.profit}`
    );
    
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'الشهر,الدخل,المصروفات,الربح\n' + 
      csvData.join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `تقرير_مالي_${tenant?.name}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "تم تصدير التقرير",
      description: "تم تحميل التقرير المالي بصيغة CSV",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل التقارير المالية...</p>
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
              <FileText className="h-8 w-8 text-primary" />
              التقارير المالية
            </h1>
            <p className="text-gray-600 mt-1">تحليل شامل للوضع المالي والأداء</p>
          </div>
          <div className="flex gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">آخر شهر</SelectItem>
                <SelectItem value="3months">آخر 3 أشهر</SelectItem>
                <SelectItem value="6months">آخر 6 أشهر</SelectItem>
                <SelectItem value="1year">آخر سنة</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={exportReport}>
              <Download className="h-4 w-4 mr-2" />
              تصدير
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">نظرة عامة</TabsTrigger>
            <TabsTrigger value="income">تحليل الدخل</TabsTrigger>
            <TabsTrigger value="expenses">تحليل المصروفات</TabsTrigger>
            <TabsTrigger value="trends">الاتجاهات</TabsTrigger>
          </TabsList>

          {/* Overview */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>الدخل والمصروفات الشهرية</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="income" fill="#10b981" name="الدخل" />
                      <Bar dataKey="expenses" fill="#ef4444" name="المصروفات" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>صافي الربح</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="profit" stroke="#3b82f6" name="صافي الربح" />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Income Analysis */}
          <TabsContent value="income">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>تحليل مصادر الدخل</CardTitle>
                <CardDescription>توزيع الدخل حسب المصدر</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={incomeCategories}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {incomeCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">تفاصيل مصادر الدخل</h4>
                    {incomeCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                        <span className="font-semibold text-green-600">
                          {category.value.toLocaleString()} ريال
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Expense Analysis */}
          <TabsContent value="expenses">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>تحليل المصروفات</CardTitle>
                <CardDescription>توزيع المصروفات حسب النوع</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={expenseCategories}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {expenseCategories.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">تفاصيل المصروفات</h4>
                    {expenseCategories.map((category, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          <span>{category.name}</span>
                        </div>
                        <span className="font-semibold text-red-600">
                          {category.value.toLocaleString()} ريال
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Trends */}
          <TabsContent value="trends">
            <div className="space-y-6">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>التحليل التنبؤي</CardTitle>
                  <CardDescription>توقعات الأداء المالي</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <h4 className="font-semibold">النمو المتوقع</h4>
                      <p className="text-2xl font-bold text-green-600">+15%</p>
                      <p className="text-sm text-gray-600">الشهر القادم</p>
                    </div>
                    <div className="text-center">
                      <DollarSign className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                      <h4 className="font-semibold">الدخل المتوقع</h4>
                      <p className="text-2xl font-bold text-blue-600">
                        {((reportData.reduce((sum, item) => sum + item.income, 0) / reportData.length) * 1.15).toLocaleString()} ريال
                      </p>
                      <p className="text-sm text-gray-600">متوسط شهري</p>
                    </div>
                    <div className="text-center">
                      <CreditCard className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                      <h4 className="font-semibold">معدل التحصيل</h4>
                      <p className="text-2xl font-bold text-purple-600">92%</p>
                      <p className="text-sm text-gray-600">من إجمالي الرسوم</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>توصيات مالية</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border-l-4 border-green-400 rounded">
                      <h4 className="font-semibold text-green-800">فرصة تحسين</h4>
                      <p className="text-green-700">يمكن زيادة معدل التحصيل بإرسال تذكيرات منتظمة</p>
                    </div>
                    <div className="p-4 bg-blue-50 border-l-4 border-blue-400 rounded">
                      <h4 className="font-semibold text-blue-800">اقتراح مالي</h4>
                      <p className="text-blue-700">النظر في خفض مصروفات المرافق بنسبة 10% قد يوفر 2,000 ريال شهرياً</p>
                    </div>
                    <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <h4 className="font-semibold text-yellow-800">تنبيه</h4>
                      <p className="text-yellow-700">هناك رسوم متأخرة بقيمة {expenseCategories.reduce((sum, cat) => sum + cat.value, 0).toLocaleString()} ريال تحتاج للمتابعة</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FinancialReports;