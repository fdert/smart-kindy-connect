import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Star, Award, Trophy, ArrowLeft } from 'lucide-react';

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

interface StudentData {
  id: string;
  full_name: string;
  student_id: string;
  photo_url: string | null;
  class_name?: string;
}

export default function StudentRewards() {
  const { studentId } = useParams();
  const [searchParams] = useSearchParams();
  const [rewards, setRewards] = useState<RewardData[]>([]);
  const [studentInfo, setStudentInfo] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Get date filters from URL params
  const fromParam = searchParams.get('from');
  const toParam = searchParams.get('to');
  const dateRange = {
    from: fromParam ? new Date(fromParam) : new Date(new Date().getFullYear() - 1, 0, 1),
    to: toParam ? new Date(toParam) : new Date()
  };

  const loadRewardsData = async () => {
    console.log('=== loadRewardsData START ===');
    console.log('Current URL:', window.location.href);
    console.log('StudentId param:', studentId);
    console.log('Guardian param:', searchParams.get('guardian'));
    
    if (!studentId) {
      console.log('No studentId provided');
      setError('معرف الطالب غير متوفر');
      setLoading(false);
      return;
    }

    // Simple UUID validation
    if (studentId.length !== 36 || !studentId.includes('-')) {
      console.log('Invalid studentId format:', studentId);
      setError('معرف الطالب غير صحيح');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isGuardianAccess = searchParams.get('guardian') === 'true';
      console.log('Guardian access:', isGuardianAccess);

      // Direct API call to edge function
      console.log('Calling edge function directly...');
      
      const functionUrl = `https://ytjodudlnfamvnescumu.supabase.co/functions/v1/get-student-rewards`;
      
      const requestBody = {
        studentId: studentId,
        guardian: isGuardianAccess,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString()
      };
      
      console.log('Request URL:', functionUrl);
      console.log('Request body:', requestBody);
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Fetch response status:', response.status);
      console.log('Fetch response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Fetch error response:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('Raw response data:', data);

      if (!data || !data.success) {
        console.error('Edge function returned error:', data);
        throw new Error(data?.error || 'فشل في تحميل البيانات');
      }

      const { student, rewards: rewardsData } = data.data;
      
      console.log('Data received:', {
        studentName: student?.full_name,
        rewardsCount: rewardsData?.length || 0
      });

      if (!student) {
        throw new Error('لم يتم العثور على بيانات الطالب');
      }

      setStudentInfo(student);
      setRewards(rewardsData || []);

      console.log('=== Data loading completed successfully ===');

    } catch (err: any) {
      console.error('=== Error in loadRewardsData ===', err);
      const errorMessage = err.message || 'حدث خطأ غير متوقع';
      setError(errorMessage);
      toast({
        title: "خطأ في التحميل",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('=== loadRewardsData END ===');
    }
  };

  useEffect(() => {
    console.log('=== useEffect triggered ===');
    const isGuardianAccess = searchParams.get('guardian') === 'true';
    
    if (!studentId) {
      console.log('No studentId, stopping');
      setError('معرف الطالب مفقود');
      setLoading(false);
      return;
    }

    console.log('Loading rewards data for studentId:', studentId);
    console.log('Guardian access:', isGuardianAccess);
    
    loadRewardsData();
    
  }, [studentId, searchParams.get('guardian')]);

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

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">خطأ في التحميل</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-y-2">
            <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
              إعادة المحاولة
            </Button>
            <Button onClick={() => window.history.back()} variant="ghost" className="w-full">
              العودة
            </Button>
          </div>
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
              مكافآت الطالب: {studentInfo?.full_name || 'غير متوفر'}
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