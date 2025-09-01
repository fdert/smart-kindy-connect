import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/useTenant';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Star, Award, Trophy, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RewardData {
  id: string;
  title: string;
  description: string | null;
  type: string;
  points: number;
  awarded_at: string;
  notes: string | null;
  badge_color: string | null;
  icon_url: string | null;
}

export default function StudentRewards() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { tenant } = useTenant();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get date filters from URL params
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateRange = {
    from: fromParam ? new Date(fromParam) : new Date(new Date().getFullYear() - 1, 0, 1), // بداية السنة الماضية
    to: toParam ? new Date(toParam) : new Date()
  };

  useEffect(() => {
    if (!studentId) {
      console.log('StudentRewards: No studentId provided');
      return;
    }
    
    const isGuardianAccess = searchParams.get('guardian') === 'true';
    
    console.log('StudentRewards useEffect:', { 
      isGuardianAccess, 
      studentId, 
      hasTenant: !!tenant?.id,
      tenantLoading: !tenant && !isGuardianAccess
    });
    
    if (isGuardianAccess) {
      // For guardian access, load immediately
      console.log('Loading data for guardian access immediately');
      loadData();
    } else {
      // For authenticated access, wait for tenant or load if tenant is available
      if (tenant?.id) {
        console.log('Loading data for authenticated access with tenant');
        loadData();
      } else if (tenant === null) {
        // Tenant loading failed, still try to load
        console.log('Tenant is null, attempting guardian-style access as fallback');
        loadData();
      } else {
        console.log('Waiting for tenant to load...');
      }
    }
  }, [studentId, searchParams, tenant]);

  const loadData = async () => {
    console.log('loadData called with studentId:', studentId);
    
    if (!studentId) {
      console.log('No studentId, returning');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(studentId)) {
      console.log('Invalid UUID format:', studentId);
      toast({
        title: "خطأ في الرابط",
        description: "معرف الطالب غير صحيح",
        variant: "destructive"
      });
      setLoading(false);
      return;
    }

    console.log('Starting to load rewards data...');
    setLoading(true);
    
    try {
      const isGuardianAccess = searchParams.get('guardian') === 'true';
      console.log('Guardian access:', isGuardianAccess);
      console.log('Date range:', dateRange);
      
      let tenantId: string;
      
      if (isGuardianAccess || !tenant?.id) {
        console.log('Loading data via guardian/public access');
        
        // For guardian access, get student data without tenant restriction
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select(`
            full_name,
            student_id,
            photo_url,
            tenant_id,
            classes (name)
          `)
          .eq('id', studentId)
          .maybeSingle();

        console.log('Student query result:', { studentData, studentError });
        
        if (studentError) {
          console.error('Student query error:', studentError);
          throw studentError;
        }
        if (!studentData) {
          console.log('No student data found');
          throw new Error('لم يتم العثور على بيانات الطالب');
        }
        
        setStudentInfo(studentData);
        tenantId = studentData.tenant_id;
        console.log('Using tenant_id from student:', tenantId);

        // Load rewards using student's tenant_id
        console.log('Loading rewards with params:', {
          student_id: studentId,
          tenant_id: tenantId,
          from: dateRange.from.toISOString(),
          to: dateRange.to.toISOString()
        });
        
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('rewards')
          .select('*')
          .eq('student_id', studentId)
          .eq('tenant_id', tenantId)
          .gte('awarded_at', dateRange.from.toISOString())
          .lte('awarded_at', dateRange.to.toISOString())
          .order('awarded_at', { ascending: false });

        console.log('Rewards query result:', { rewardsData, rewardsError });
        
        if (rewardsError) {
          console.error('Rewards query error:', rewardsError);
          throw rewardsError;
        }
        setRewards(rewardsData || []);
        console.log('Successfully loaded', (rewardsData || []).length, 'rewards');

      } else {
        console.log('Loading data via authenticated access with tenant:', tenant.id);
        
        // Load student info with tenant verification  
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('full_name, student_id, photo_url, classes(name)')
          .eq('id', studentId)
          .eq('tenant_id', tenant.id)
          .maybeSingle();

        console.log('Authenticated student query result:', { studentData, studentError });
        
        if (studentError) {
          console.error('Authenticated student query error:', studentError);
          throw studentError;
        }
        if (!studentData) {
          console.log('No student data found for authenticated access');
          throw new Error('لم يتم العثور على بيانات الطالب');
        }
        setStudentInfo(studentData);

        // Load rewards
        const { data: rewardsData, error: rewardsError } = await supabase
          .from('rewards')
          .select('*')
          .eq('student_id', studentId)
          .eq('tenant_id', tenant.id)
          .gte('awarded_at', dateRange.from.toISOString())
          .lte('awarded_at', dateRange.to.toISOString())
          .order('awarded_at', { ascending: false });

        console.log('Authenticated rewards query result:', { rewardsData, rewardsError });
        
        if (rewardsError) {
          console.error('Authenticated rewards query error:', rewardsError);
          throw rewardsError;
        }
        setRewards(rewardsData || []);
        console.log('Successfully loaded', (rewardsData || []).length, 'rewards for authenticated user');
      }

    } catch (error: any) {
      console.error('Error loading rewards data:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      console.log('Setting loading to false');
      setLoading(false);
    }
  };

  const getRewardTypeColor = (type: string) => {
    switch (type) {
      case 'academic': return 'bg-blue-500';
      case 'behavioral': return 'bg-green-500';
      case 'participation': return 'bg-purple-500';
      case 'creativity': return 'bg-pink-500';
      case 'leadership': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getRewardTypeText = (type: string) => {
    switch (type) {
      case 'academic': return 'أكاديمية';
      case 'behavioral': return 'سلوكية';
      case 'participation': return 'مشاركة';
      case 'creativity': return 'إبداع';
      case 'leadership': return 'قيادة';
      default: return 'عامة';
    }
  };

  const totalPoints = rewards.reduce((sum, reward) => sum + reward.points, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            onClick={() => {
              const isGuardianAccess = searchParams.get('guardian') === 'true';
              const guardianParam = isGuardianAccess ? '?guardian=true' : '';
              navigate(`/student-report/${studentId}${guardianParam}`);
            }}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            العودة للتقرير
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              مكافآت الطالب: {studentInfo?.full_name}
            </h1>
            <p className="text-gray-600">
              الفترة: {format(dateRange.from, 'dd MMM yyyy', { locale: ar })} - {format(dateRange.to, 'dd MMM yyyy', { locale: ar })}
            </p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">إجمالي المكافآت</p>
                  <p className="text-3xl font-bold">{rewards.length}</p>
                </div>
                <Award className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">إجمالي النقاط</p>
                  <p className="text-3xl font-bold">{totalPoints}</p>
                </div>
                <Star className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-90">متوسط النقاط</p>
                  <p className="text-3xl font-bold">
                    {rewards.length > 0 ? (totalPoints / rewards.length).toFixed(1) : '0'}
                  </p>
                </div>
                <Trophy className="h-8 w-8 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.length === 0 ? (
            <div className="col-span-full">
              <Card className="bg-white/90 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">لا توجد مكافآت</h3>
                  <p className="text-gray-500">لم يتم منح أي مكافآت للطالب في هذه الفترة</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            rewards.map((reward) => (
              <Card key={reward.id} className="bg-white/90 backdrop-blur-sm hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getRewardTypeColor(reward.type)}`}></div>
                      <Badge variant="outline">
                        {getRewardTypeText(reward.type)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 text-yellow-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-bold">{reward.points}</span>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{reward.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  {reward.description && (
                    <p className="text-gray-600 mb-4">{reward.description}</p>
                  )}
                  {reward.notes && (
                    <div className="bg-blue-50 p-3 rounded-lg mb-4">
                      <p className="text-sm font-medium text-blue-800 mb-1">ملاحظات:</p>
                      <p className="text-blue-700 text-sm">{reward.notes}</p>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs text-gray-500">
                    <span>{format(new Date(reward.awarded_at), 'dd MMM yyyy', { locale: ar })}</span>
                    <div className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      <span>مكافأة</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}