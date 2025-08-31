import { Star, Award, Trophy, Medal, Crown, Sparkles, Heart, Gift } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface RewardCardProps {
  studentName: string;
  rewardType: 'star' | 'certificate' | 'badge' | 'achievement';
  rewardTitle: string;
  rewardDescription?: string;
  points: number;
  awardedAt: string;
  nurseryName: string;
  showShareable?: boolean;
}

const RewardCard = ({
  studentName,
  rewardType,
  rewardTitle,
  rewardDescription,
  points,
  awardedAt,
  nurseryName,
  showShareable = false
}: RewardCardProps) => {
  const rewardTypes = {
    star: { label: 'نجمة', icon: Star, color: '#EAB308', bgColor: 'from-yellow-400 to-orange-400', emoji: '⭐' },
    certificate: { label: 'شهادة', icon: Award, color: '#059669', bgColor: 'from-emerald-400 to-green-500', emoji: '🏆' },
    badge: { label: 'وسام', icon: Medal, color: '#DC2626', bgColor: 'from-red-400 to-pink-500', emoji: '🏅' },
    achievement: { label: 'إنجاز', icon: Trophy, color: '#7C3AED', bgColor: 'from-purple-400 to-violet-500', emoji: '🎖️' },
  };

  const reward = rewardTypes[rewardType];
  const IconComponent = reward.icon;
  const date = new Date(awardedAt).toLocaleDateString('ar-SA');

  return (
    <Card className={`
      relative overflow-hidden border-none shadow-2xl transform transition-all duration-300 hover:scale-105
      ${showShareable ? 'w-full max-w-md mx-auto' : ''}
    `}>
      {/* Background with gradient and pattern */}
      <div className={`
        absolute inset-0 bg-gradient-to-br ${reward.bgColor}
        opacity-90
      `} />
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12" />
      
      {/* Sparkle decorations */}
      <div className="absolute top-4 right-8">
        <Sparkles className="h-6 w-6 text-white/80 animate-pulse" />
      </div>
      <div className="absolute top-12 left-6">
        <Heart className="h-4 w-4 text-white/60 animate-bounce" style={{ animationDelay: '0.5s' }} />
      </div>
      <div className="absolute bottom-8 right-12">
        <Gift className="h-5 w-5 text-white/70 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <CardContent className="relative z-10 p-8 text-center text-white">
        {/* Header */}
        <div className="mb-6">
          <div className="text-6xl mb-2">{reward.emoji}</div>
          <h2 className="text-2xl font-bold mb-1">مبروك!</h2>
          <p className="text-lg opacity-90">حصلت على {reward.label} جديدة</p>
        </div>

        {/* Main content */}
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-white/30 rounded-full p-4">
              <IconComponent className="h-12 w-12 text-white" />
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-2">{rewardTitle}</h3>
          
          <div className="bg-white/20 rounded-xl p-3 mb-4">
            <p className="text-lg font-semibold">{studentName}</p>
          </div>
          
          {rewardDescription && (
            <p className="text-sm opacity-90 mb-4 leading-relaxed">
              {rewardDescription}
            </p>
          )}
          
          <div className="flex items-center justify-center gap-2 mb-4">
            <Crown className="h-5 w-5 text-yellow-200" />
            <span className="text-lg font-bold">{points} نقطة</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm opacity-80 mb-1">مع أطيب التحيات</p>
          <p className="font-semibold text-lg">{nurseryName}</p>
          <p className="text-xs opacity-70 mt-2">{date}</p>
        </div>

        {/* Animated border */}
        <div className="absolute inset-0 rounded-lg">
          <div className="absolute inset-0 rounded-lg border-4 border-white/30 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
};

export default RewardCard;