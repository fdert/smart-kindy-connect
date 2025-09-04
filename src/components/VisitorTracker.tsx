import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VisitorTrackerProps {
  pageUrl: string;
}

const VisitorTracker = ({ pageUrl }: VisitorTrackerProps) => {
  useEffect(() => {
    const trackVisit = async () => {
      try {
        // جمع معلومات المتصفح والزائر
        const userAgent = navigator.userAgent;
        const referrer = document.referrer || null;
        
        // معلومات الجهاز
        const deviceType = /Mobile|Android|iPhone|iPad/.test(userAgent) ? 'mobile' : 'desktop';
        
        // معلومات المتصفح
        let browser = 'Unknown';
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        
        // معلومات نظام التشغيل
        let os = 'Unknown';
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'Mac';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS')) os = 'iOS';
        
        // تسجيل الزيارة
        const { error } = await supabase.rpc('track_page_visit', {
          p_page_url: pageUrl,
          p_user_agent: userAgent,
          p_referrer: referrer,
          p_device_type: deviceType,
          p_browser: browser,
          p_os: os
        });
        
        if (error) {
          console.error('Error tracking visit:', error);
        } else {
          console.log('Visit tracked successfully for:', pageUrl);
        }
      } catch (error) {
        console.error('Error in visitor tracking:', error);
      }
    };
    
    // تأخير قصير للتأكد من تحميل الصفحة
    const timer = setTimeout(trackVisit, 1000);
    
    return () => clearTimeout(timer);
  }, [pageUrl]);
  
  return null; // مكون غير مرئي
};

export { VisitorTracker };