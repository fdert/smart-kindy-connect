import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings, Plus, Edit, Trash2, Package, DollarSign, Users, Building, Star } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  name_ar: string;
  description: string | null;
  description_ar: string | null;
  price_monthly: number;
  price_quarterly: number | null;
  price_yearly: number | null;
  max_students: number | null;
  max_teachers: number | null;
  max_classes: number | null;
  storage_gb: number;
  has_whatsapp: boolean;
  has_analytics: boolean;
  has_reports: boolean;
  features: any;
  is_active: boolean;
  is_popular: boolean;
  sort_order: number;
  currency: string;
}

interface PlanForm {
  name: string;
  name_ar: string;
  description: string;
  description_ar: string;
  price_monthly: number;
  price_quarterly: number;
  price_yearly: number;
  max_students: number;
  max_teachers: number;
  max_classes: number;
  storage_gb: number;
  has_whatsapp: boolean;
  has_analytics: boolean;
  has_reports: boolean;
  features: string[];
  is_popular: boolean;
}

const PlansManagement = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<PlanForm>({
    name: '',
    name_ar: '',
    description: '',
    description_ar: '',
    price_monthly: 0,
    price_quarterly: 0,
    price_yearly: 0,
    max_students: 50,
    max_teachers: 5,
    max_classes: 5,
    storage_gb: 5,
    has_whatsapp: false,
    has_analytics: false,
    has_reports: false,
    features: [],
    is_popular: false
  });

  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setPlans(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الخطط",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      name_ar: '',
      description: '',
      description_ar: '',
      price_monthly: 0,
      price_quarterly: 0,
      price_yearly: 0,
      max_students: 50,
      max_teachers: 5,
      max_classes: 5,
      storage_gb: 5,
      has_whatsapp: false,
      has_analytics: false,
      has_reports: false,
      features: [],
      is_popular: false
    });
    setEditingPlan(null);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      name_ar: plan.name_ar,
      description: plan.description || '',
      description_ar: plan.description_ar || '',
      price_monthly: plan.price_monthly,
      price_quarterly: plan.price_quarterly || 0,
      price_yearly: plan.price_yearly || 0,
      max_students: plan.max_students || 50,
      max_teachers: plan.max_teachers || 5,
      max_classes: plan.max_classes || 5,
      storage_gb: plan.storage_gb,
      has_whatsapp: plan.has_whatsapp,
      has_analytics: plan.has_analytics,
      has_reports: plan.has_reports,
      features: Array.isArray(plan.features) ? plan.features : [],
      is_popular: plan.is_popular
    });
    setShowCreateDialog(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const planData = {
        ...formData,
        price_quarterly: formData.price_quarterly || null,
        price_yearly: formData.price_yearly || null,
        max_students: formData.max_students || null,
        max_teachers: formData.max_teachers || null,
        max_classes: formData.max_classes || null,
        features: formData.features
      };

      let error;
      if (editingPlan) {
        const { error: updateError } = await supabase
          .from('plans')
          .update(planData)
          .eq('id', editingPlan.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('plans')
          .insert([{
            ...planData,
            sort_order: plans.length,
            is_active: true,
            currency: 'SAR'
          }]);
        error = insertError;
      }

      if (error) throw error;

      toast({
        title: editingPlan ? "تم تحديث الخطة" : "تم إنشاء الخطة",
        description: "تم حفظ التغييرات بنجاح",
      });

      setShowCreateDialog(false);
      resetForm();
      loadPlans();
    } catch (error: any) {
      toast({
        title: "خطأ في حفظ الخطة",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (planId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الخطة؟')) return;

    try {
      const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: "تم حذف الخطة",
        description: "تم حذف الخطة بنجاح",
      });

      loadPlans();
    } catch (error: any) {
      toast({
        title: "خطأ في حذف الخطة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const togglePlanStatus = async (planId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('plans')
        .update({ is_active: isActive })
        .eq('id', planId);

      if (error) throw error;

      toast({
        title: isActive ? "تم تفعيل الخطة" : "تم إلغاء تفعيل الخطة",
        description: "تم تحديث حالة الخطة بنجاح",
      });

      loadPlans();
    } catch (error: any) {
      toast({
        title: "خطأ في تحديث الخطة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const addFeature = () => {
    if (newFeature.trim() && !formData.features.includes(newFeature.trim())) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, newFeature.trim()]
      }));
      setNewFeature('');
    }
  };

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الخطط...</p>
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
              <Package className="h-8 w-8 text-primary" />
              إدارة خطط الاشتراك
            </h1>
            <p className="text-gray-600 mt-1">إدارة الخطط والأسعار والميزات</p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={(open) => {
            setShowCreateDialog(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                إضافة خطة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? 'تعديل الخطة' : 'إنشاء خطة جديدة'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="basic">المعلومات الأساسية</TabsTrigger>
                    <TabsTrigger value="pricing">الأسعار والحدود</TabsTrigger>
                    <TabsTrigger value="features">الميزات</TabsTrigger>
                  </TabsList>

                  <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">اسم الخطة (إنجليزي)</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Professional"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="name_ar">اسم الخطة (عربي)</Label>
                        <Input
                          id="name_ar"
                          value={formData.name_ar}
                          onChange={(e) => setFormData(prev => ({ ...prev, name_ar: e.target.value }))}
                          placeholder="المحترف"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="description">الوصف (إنجليزي)</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Perfect for medium-sized nurseries"
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="description_ar">الوصف (عربي)</Label>
                        <Textarea
                          id="description_ar"
                          value={formData.description_ar}
                          onChange={(e) => setFormData(prev => ({ ...prev, description_ar: e.target.value }))}
                          placeholder="مثالي للحضانات المتوسطة"
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="flex items-center space-x-reverse space-x-2">
                      <Switch
                        checked={formData.is_popular}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_popular: checked }))}
                      />
                      <Label>خطة شائعة (ستظهر مع تمييز خاص)</Label>
                    </div>
                  </TabsContent>

                  <TabsContent value="pricing" className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="price_monthly">السعر الشهري (ر.س)</Label>
                        <Input
                          id="price_monthly"
                          type="number"
                          min="0"
                          value={formData.price_monthly}
                          onChange={(e) => setFormData(prev => ({ ...prev, price_monthly: Number(e.target.value) }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="price_quarterly">السعر الربعي (ر.س)</Label>
                        <Input
                          id="price_quarterly"
                          type="number"
                          min="0"
                          value={formData.price_quarterly}
                          onChange={(e) => setFormData(prev => ({ ...prev, price_quarterly: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="price_yearly">السعر السنوي (ر.س)</Label>
                        <Input
                          id="price_yearly"
                          type="number"
                          min="0"
                          value={formData.price_yearly}
                          onChange={(e) => setFormData(prev => ({ ...prev, price_yearly: Number(e.target.value) }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="max_students">أقصى عدد طلاب</Label>
                        <Input
                          id="max_students"
                          type="number"
                          min="1"
                          value={formData.max_students}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_students: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_teachers">أقصى عدد معلمين</Label>
                        <Input
                          id="max_teachers"
                          type="number"
                          min="1"
                          value={formData.max_teachers}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_teachers: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="max_classes">أقصى عدد فصول</Label>
                        <Input
                          id="max_classes"
                          type="number"
                          min="1"
                          value={formData.max_classes}
                          onChange={(e) => setFormData(prev => ({ ...prev, max_classes: Number(e.target.value) }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="storage_gb">مساحة التخزين (جيجابايت)</Label>
                        <Input
                          id="storage_gb"
                          type="number"
                          min="1"
                          value={formData.storage_gb}
                          onChange={(e) => setFormData(prev => ({ ...prev, storage_gb: Number(e.target.value) }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Switch
                          checked={formData.has_whatsapp}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_whatsapp: checked }))}
                        />
                        <Label>تكامل واتساب</Label>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Switch
                          checked={formData.has_analytics}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_analytics: checked }))}
                        />
                        <Label>التحليلات المتقدمة</Label>
                      </div>
                      <div className="flex items-center space-x-reverse space-x-2">
                        <Switch
                          checked={formData.has_reports}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, has_reports: checked }))}
                        />
                        <Label>التقارير المتقدمة</Label>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="features" className="space-y-4">
                    <div>
                      <Label>إضافة ميزة جديدة</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="اكتب ميزة جديدة..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                        />
                        <Button type="button" onClick={addFeature} variant="outline">
                          إضافة
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label>الميزات المتضمنة</Label>
                      <div className="border rounded-md p-4 max-h-40 overflow-y-auto mt-1">
                        {formData.features.length === 0 ? (
                          <p className="text-gray-500 text-sm">لا توجد ميزات مضافة</p>
                        ) : (
                          <div className="space-y-2">
                            {formData.features.map((feature, index) => (
                              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                                <span className="text-sm">{feature}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFeature(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? 'جاري الحفظ...' : (editingPlan ? 'تحديث الخطة' : 'إنشاء الخطة')}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Plans List */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>الخطط الحالية</CardTitle>
            <CardDescription>إدارة جميع خطط الاشتراك المتاحة</CardDescription>
          </CardHeader>
          <CardContent>
            {plans.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">لا توجد خطط</h3>
                <p className="text-gray-500 mb-4">ابدأ بإنشاء خطة اشتراك جديدة</p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 ml-1" />
                  إضافة خطة جديدة
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>اسم الخطة</TableHead>
                    <TableHead>السعر الشهري</TableHead>
                    <TableHead>الحدود</TableHead>
                    <TableHead>الميزات</TableHead>
                    <TableHead>الحالة</TableHead>
                    <TableHead>الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-semibold flex items-center gap-1">
                              {plan.name_ar}
                              {plan.is_popular && (
                                <Star className="h-4 w-4 text-yellow-500" />
                              )}
                            </div>
                            <div className="text-sm text-gray-500">{plan.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold">{plan.price_monthly} ر.س</span>
                          {plan.price_yearly && (
                            <span className="text-sm text-gray-500">
                              {plan.price_yearly} ر.س سنوياً
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>🎓 {plan.max_students || '∞'} طالب</div>
                          <div>👨‍🏫 {plan.max_teachers || '∞'} معلم</div>
                          <div>📁 {plan.storage_gb} جيجابايت</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {plan.has_whatsapp && <Badge variant="secondary" className="text-xs">واتساب</Badge>}
                          {plan.has_analytics && <Badge variant="secondary" className="text-xs">تحليلات</Badge>}
                          {plan.has_reports && <Badge variant="secondary" className="text-xs">تقارير</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={plan.is_active}
                            onCheckedChange={(checked) => togglePlanStatus(plan.id, checked)}
                          />
                          <Badge variant={plan.is_active ? 'default' : 'secondary'}>
                            {plan.is_active ? 'نشط' : 'غير نشط'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(plan.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlansManagement;