import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import RewardCard from '@/components/RewardCard';
import { Button } from '@/components/ui/button';
import { Share2, Download, Heart } from 'lucide-react';
import html2canvas from 'html2canvas';

interface RewardData {
  id: string;
  student_id: string;
  type: 'star' | 'certificate' | 'badge' | 'achievement';
  title: string;
  description: string | null;
  points: number;
  awarded_at: string;
  students: {
    full_name: string;
  };
  tenants: {
    name: string;
  };
}

const SharedRewardCard = () => {
  const [searchParams] = useSearchParams();
  const [reward, setReward] = useState<RewardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rewardId = searchParams.get('id');
  const tenantId = searchParams.get('tenant');

  useEffect(() => {
    console.log('SharedRewardCard mounted with params:', { rewardId, tenantId });
    console.log('Current URL:', window.location.href);
    console.log('Search params:', window.location.search);
    
    if (rewardId && tenantId) {
      console.log('Valid params found, loading reward...');
      loadReward();
    } else {
      console.log('Invalid params:', { rewardId, tenantId });
      setError('رابط غير صحيح - معاملات مفقودة');
      setLoading(false);
    }
  }, [rewardId, tenantId]);

  const loadReward = async () => {
    try {
      console.log('Starting loadReward with:', { rewardId, tenantId });
      
      // First get the reward
      const { data: rewardData, error: rewardError } = await supabase
        .from('rewards')
        .select(`
          *,
          students!inner (full_name)
        `)
        .eq('id', rewardId)
        .eq('tenant_id', tenantId)
        .eq('is_public', true)
        .single();

      console.log('Reward query result:', { rewardData, rewardError });

      if (rewardError) {
        console.error('Reward loading error:', rewardError);
        throw new Error(`خطأ في تحميل بيانات الجائزة: ${rewardError.message}`);
      }
      
      if (!rewardData) {
        console.log('No reward data found');
        setError('البطاقة غير موجودة أو غير متاحة للعرض');
        return;
      }

      console.log('Reward data loaded successfully:', rewardData);

      // Get tenant name with public access - use anon key
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('name')
        .eq('id', tenantId)
        .eq('status', 'approved') // Only approved tenants
        .single();

      console.log('Tenant query result:', { tenantData, tenantError });

      if (tenantError) {
        console.error('Tenant loading error:', tenantError);
        // If we can't get tenant name, use a fallback
        const combinedData = {
          ...rewardData,
          tenants: { name: 'الروضة' }
        };
        console.log('Using fallback tenant name');
        setReward(combinedData);
        return;
      }

      // Combine the data
      const combinedData = {
        ...rewardData,
        tenants: { name: tenantData.name }
      };

      console.log('Combined data ready:', combinedData);
      setReward(combinedData);
    } catch (error: any) {
      console.error('Error in loadReward:', error);
      setError(`حدث خطأ في تحميل البطاقة: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const cardElement = document.getElementById('reward-card');
      if (!cardElement) return;

      const canvas = await html2canvas(cardElement, {
        backgroundColor: null,
        scale: 2,
        useCORS: true
      });

      const link = document.createElement('a');
      link.download = `جائزة_${reward?.students.full_name}_${new Date().getTime()}.png`;
      link.href = canvas.toDataURL();
      link.click();
    } catch (error) {
      console.error('Error downloading image:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `جائزة ${reward?.title} - ${reward?.students.full_name}`,
          text: `مبروك! حصل ${reward?.students.full_name} على ${reward?.title}`,
          url: window.location.href
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل البطاقة...</p>
        </div>
      </div>
    );
  }

  if (error || !reward) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">عذراً</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => window.location.href = '/'}>
            العودة للصفحة الرئيسية
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
            <Heart className="h-8 w-8 text-red-500" />
            بطاقة تحفيزية
          </h1>
          <p className="text-gray-600">شارك هذه اللحظة المميزة مع الآخرين</p>
        </div>

        {/* Reward Card */}
        <div id="reward-card" className="mb-8">
          <RewardCard
            studentName={reward.students.full_name}
            rewardType={reward.type}
            rewardTitle={reward.title}
            rewardDescription={reward.description || undefined}
            points={reward.points}
            awardedAt={reward.awarded_at}
            nurseryName={reward.tenants.name}
            showShareable={true}
          />
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button 
            onClick={handleShare} 
            className="flex items-center gap-2"
            size="lg"
          >
            <Share2 className="h-4 w-4" />
            مشاركة البطاقة
          </Button>
          
          <Button 
            onClick={handleDownload} 
            variant="outline"
            className="flex items-center gap-2"
            size="lg"
          >
            <Download className="h-4 w-4" />
            تحميل كصورة
          </Button>
        </div>

        {/* Congratulations message */}
        <div className="text-center mt-12 p-6 bg-white/60 backdrop-blur-sm rounded-2xl">
          <div className="text-4xl mb-4">🎉</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            نفخر بإنجازات {reward.students.full_name}
          </h3>
          <p className="text-gray-600 leading-relaxed">
            نتطلع لمزيد من التميز والإبداع. هذه الجائزة هي بداية رحلة مليئة بالنجاحات.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SharedRewardCard;