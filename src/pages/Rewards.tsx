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
import { Star, Award, Trophy, Medal, Crown, Gift, Plus, Search, Filter } from 'lucide-react';

interface Student {
  id: string;
  student_id: string;
  full_name: string;
  class_id: string | null;
  classes?: {
    name: string;
  };
}

interface Reward {
  id: string;
  student_id: string;
  type: 'star' | 'certificate' | 'badge' | 'achievement';
  title: string;
  description: string | null;
  points: number;
  awarded_at: string;
  awarded_by: string;
  is_public: boolean;
  notes: string | null;
  badge_color: string | null;
  icon_url: string | null;
  students: {
    full_name: string;
    student_id: string;
  };
}

interface StudentStats {
  student_id: string;
  student_name: string;
  total_points: number;
  total_rewards: number;
  last_reward: string | null;
}

const Rewards = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const { tenant } = useTenant();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    student_id: '',
    type: 'star' as 'star' | 'certificate' | 'badge' | 'achievement',
    title: '',
    description: '',
    points: 1,
    is_public: true,
    notes: '',
    badge_color: '#3B82F6'
  });

  const rewardTypes = [
    { value: 'star', label: 'نجمة', icon: Star, color: '#EAB308' },
    { value: 'certificate', label: 'شهادة', icon: Award, color: '#059669' },
    { value: 'badge', label: 'وسام', icon: Medal, color: '#DC2626' },
    { value: 'achievement', label: 'إنجاز', icon: Trophy, color: '#7C3AED' },
  ];

  useEffect(() => {
    if (tenant?.id) {
      loadData();
    } else if (tenant === null) {
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
      setLoading(true);
      await Promise.all([
        loadStudents(),
        loadRewards(),
        loadStudentStats()
      ]);
    } catch (error) {
      console.error('Error loading rewards data:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: "حدث خطأ أثناء تحميل بيانات التحفيز",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (name)
        `)
        .eq('tenant_id', tenant?.id)
        .eq('is_active', true)
        .order('full_name');

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

  const loadRewards = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select(`
          *,
          students (full_name, student_id)
        `)
        .eq('tenant_id', tenant?.id)
        .order('awarded_at', { ascending: false });

      if (error) throw error;
      setRewards(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الجوائز",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const loadStudentStats = async () => {
    try {
      const { data, error } = await supabase
        .from('rewards')
        .select(`
          student_id,
          points,
          awarded_at,
          students!inner (full_name, student_id)
        `)
        .eq('tenant_id', tenant?.id);

      if (error) throw error;

      // Calculate stats for each student
      const statsMap = new Map<string, StudentStats>();
      
      data?.forEach((reward: any) => {
        const studentId = reward.student_id;
        const studentName = reward.students.full_name;
        
        if (!statsMap.has(studentId)) {
          statsMap.set(studentId, {
            student_id: studentId,
            student_name: studentName,
            total_points: 0,
            total_rewards: 0,
            last_reward: null
          });
        }
        
        const stats = statsMap.get(studentId)!;
        stats.total_points += reward.points;
        stats.total_rewards += 1;
        
        if (!stats.last_reward || reward.awarded_at > stats.last_reward) {
          stats.last_reward = reward.awarded_at;
        }
      });

      const statsArray = Array.from(statsMap.values()).sort((a, b) => b.total_points - a.total_points);
      setStudentStats(statsArray);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل إحصائيات الطلاب",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "خطأ في المصادقة",
          description: "يجب تسجيل الدخول لمنح الجوائز",
          variant: "destructive",
        });
        return;
      }

      const rewardData = {
        ...formData,
        tenant_id: tenant.id,
        awarded_by: user.id,
        awarded_at: new Date().toISOString(),
        is_public: true // Force to public for shareable rewards
      };

      const { data: insertedReward, error } = await supabase
        .from('rewards')
        .insert(rewardData)
        .select()
        .single();

      if (error) throw error;

      const student = students.find(s => s.id === formData.student_id);
      const rewardType = rewardTypes.find(t => t.value === formData.type);
      
      // Generate shareable card URL
      const cardUrl = `${window.location.origin}/reward-card?id=${insertedReward.id}&tenant=${tenant.id}`;
      
      // Send WhatsApp notification to guardians
      if (student) {
        try {
          // Get student's guardians
          const { data: guardianLinks } = await supabase
            .from('guardian_student_links')
            .select(`
              guardian_id,
              guardians (
                full_name,
                whatsapp_number
              )
            `)
            .eq('student_id', formData.student_id)
            .eq('tenant_id', tenant.id);

          if (guardianLinks && guardianLinks.length > 0) {
            for (const link of guardianLinks) {
              if (link.guardians?.whatsapp_number) {
                await supabase.functions.invoke('whatsapp-outbound', {
                  body: {
                    tenantId: tenant.id,
                    to: link.guardians.whatsapp_number,
                    templateName: 'reward_notification',
                    templateData: {
                      guardianName: link.guardians.full_name,
                      studentName: student.full_name,
                      rewardType: rewardType?.label || 'جائزة',
                      rewardTitle: formData.title,
                      rewardDescription: formData.description || '',
                      points: formData.points.toString(),
                      nurseryName: tenant.name,
                      cardUrl: cardUrl
                    },
                    contextType: 'reward',
                    contextId: insertedReward.id,
                    studentId: formData.student_id
                  }
                });
              }
            }
          }
        } catch (notificationError) {
          console.error('خطأ في إرسال الإشعار:', notificationError);
          // Don't block the success message for notification failures
        }
      }
      
      toast({
        title: "تم منح الجائزة بنجاح",
        description: `تم منح ${rewardType?.label} للطالب ${student?.full_name} وإرسال إشعار لولي الأمر`,
      });

      loadData();
      resetForm();
      setIsAddDialogOpen(false);
    } catch (error: any) {
      toast({
        title: "خطأ في منح الجائزة",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      student_id: '',
      type: 'star',
      title: '',
      description: '',
      points: 1,
      is_public: true,
      notes: '',
      badge_color: '#3B82F6'
    });
  };

  const getRewardIcon = (type: string) => {
    const rewardType = rewardTypes.find(t => t.value === type);
    const IconComponent = rewardType?.icon || Star;
    return <IconComponent className="h-5 w-5" style={{ color: rewardType?.color }} />;
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const filteredRewards = rewards.filter(reward => {
    const matchesSearch = reward.students.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         reward.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || reward.type === selectedType;
    const matchesStudent = selectedStudent === '' || reward.student_id === selectedStudent;
    return matchesSearch && matchesType && matchesStudent;
  });

  // Statistics
  const totalRewards = rewards.length;
  const totalPoints = rewards.reduce((sum, reward) => sum + reward.points, 0);
  const topStudents = studentStats.slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل نظام التحفيز...</p>
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
              <Star className="h-8 w-8 text-yellow-500" />
              نظام التحفيز
            </h1>
            <p className="text-gray-600 mt-1">منح الجوائز والنجوم للطلاب المتميزين</p>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                منح جائزة جديدة
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>منح جائزة جديدة</DialogTitle>
                <DialogDescription>
                  اختر الطالب ونوع الجائزة التي تريد منحها
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="student_id">الطالب</Label>
                    <Select value={formData.student_id} onValueChange={(value) => setFormData(prev => ({ ...prev, student_id: value }))}>
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
                    <Label htmlFor="type">نوع الجائزة</Label>
                    <Select value={formData.type} onValueChange={(value: any) => setFormData(prev => ({ ...prev, type: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="اختر نوع الجائزة" />
                      </SelectTrigger>
                      <SelectContent>
                        {rewardTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" style={{ color: type.color }} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="title">العنوان</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="مثال: نجمة التميز"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="points">النقاط</Label>
                    <Input
                      id="points"
                      type="number"
                      min="1"
                      max="100"
                      value={formData.points}
                      onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) || 1 }))}
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">الوصف</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="سبب منح هذه الجائزة..."
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="notes">ملاحظات إضافية</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                      placeholder="ملاحظات للمعلمين أو الأولياء..."
                      rows={2}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" disabled={!formData.student_id || !formData.title}>
                    منح الجائزة
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
              <CardTitle className="text-sm font-medium">إجمالي الجوائز</CardTitle>
              <Award className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRewards}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">إجمالي النقاط</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalPoints}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">الطلاب المشاركون</CardTitle>
              <Crown className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentStats.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">متوسط النقاط</CardTitle>
              <Trophy className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {studentStats.length > 0 ? Math.round(totalPoints / studentStats.length) : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Students */}
        {topStudents.length > 0 && (
          <Card className="mb-6 bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-6 w-6 text-yellow-600" />
                لوحة الشرف - أفضل 3 طلاب
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topStudents.map((student, index) => (
                  <div key={student.student_id} className="flex items-center gap-3 p-4 bg-white/60 backdrop-blur-sm rounded-lg">
                    <div className="relative">
                      <Avatar className="h-12 w-12">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {getInitials(student.student_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-500 text-white text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold">{student.student_name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          {student.total_points} نقطة
                        </span>
                        <span className="flex items-center gap-1">
                          <Award className="h-3 w-3 text-green-500" />
                          {student.total_rewards} جائزة
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="mb-6 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في الجوائز..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="w-full sm:w-48">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الجائزة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    {rewardTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full sm:w-48">
                <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الطالب" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الطلاب</SelectItem>
                    {students.map((student) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Rewards List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRewards.map((reward) => (
            <Card key={reward.id} className="bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full" style={{ backgroundColor: `${rewardTypes.find(t => t.value === reward.type)?.color}20` }}>
                      {getRewardIcon(reward.type)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{reward.title}</h3>
                      <p className="text-sm text-muted-foreground">{reward.students.full_name}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Star className="h-3 w-3" />
                    {reward.points}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {reward.description && (
                    <p className="text-sm text-gray-600">{reward.description}</p>
                  )}
                  
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span>تاريخ المنح:</span>
                    <span>{new Date(reward.awarded_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  
                  {reward.is_public && (
                    <Badge variant="outline" className="text-xs">
                      جائزة عامة
                    </Badge>
                  )}
                  
                  {reward.notes && (
                    <div className="p-2 bg-gray-50 rounded text-xs">
                      <strong>ملاحظات:</strong> {reward.notes}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRewards.length === 0 && (
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Award className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">لا توجد جوائز</h3>
              <p className="text-muted-foreground text-center mb-4">
                {searchTerm || selectedType !== 'all' || selectedStudent 
                  ? 'لم يتم العثور على جوائز مطابقة للفلاتر المحددة' 
                  : 'لم يتم منح أي جوائز بعد'}
              </p>
              {!searchTerm && selectedType === 'all' && !selectedStudent && (
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="h-4 w-4 ml-2" />
                  منح أول جائزة
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Rewards;