import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, TrendingUp, Award } from 'lucide-react';

interface StudentStatsCardsProps {
  assignments: {
    total: number;
    completed: number;
    pending: number;
    score_average: number;
  };
  attendance: {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    attendance_rate: number;
  };
  rewards: any[];
  getProgressColor: (percentage: number) => string;
}

export function StudentStatsCards({ assignments, attendance, rewards, getProgressColor }: StudentStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {/* Stats Cards */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">الواجبات المنجزة</p>
              <p className="text-3xl font-bold">{assignments.completed}/{assignments.total}</p>
              <p className="text-blue-100 text-sm">
                متوسط الدرجات: {assignments.score_average.toFixed(1)}
              </p>
            </div>
            <CheckCircle className="h-10 w-10 text-blue-100" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">نسبة الحضور</p>
              <p className="text-3xl font-bold">{attendance.attendance_rate.toFixed(1)}%</p>
              <p className="text-green-100 text-sm">
                {attendance.present_days} من أصل {attendance.total_days} يوم
              </p>
            </div>
            <Clock className="h-10 w-10 text-green-100" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">إجمالي النقاط</p>
              <p className="text-3xl font-bold">
                {rewards.reduce((total, reward) => total + reward.points, 0)}
              </p>
              <p className="text-purple-100 text-sm">
                من {rewards.length} إنجاز
              </p>
            </div>
            <Award className="h-10 w-10 text-purple-100" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">التقدم الإجمالي</p>
              <p className="text-3xl font-bold">
                {((assignments.completed / assignments.total || 0) * 100).toFixed(0)}%
              </p>
              <p className="text-orange-100 text-sm">تقييم شامل</p>
            </div>
            <TrendingUp className="h-10 w-10 text-orange-100" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}