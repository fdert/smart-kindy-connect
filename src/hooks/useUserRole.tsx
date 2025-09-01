import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type UserRole = 'admin' | 'teacher' | 'student' | 'guardian' | 'super_admin' | 'owner' | 'gate' | null;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUserRole = async () => {
      if (!user) {
        console.log('useUserRole: No user found');
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // إضافة timestamp لتجنب التخزين المؤقت
        const timestamp = new Date().getTime();
        const { data, error } = await supabase
          .from('users')
          .select('role, updated_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else {
          const userRole = data?.role || null;
          console.log('User role fetched:', userRole, 'for user:', user.id, 'at:', timestamp);
          console.log('User last updated:', data?.updated_at);
          setRole(userRole);
          
          // إذا كان الدور "teacher" أو "admin"، أعد تحديد الصفحة لتطبيق التوجيه الجديد
          if (userRole === 'teacher' && window.location.pathname === '/dashboard') {
            console.log('Redirecting teacher to teacher dashboard...');
            window.location.href = '/teacher-dashboard';
          }
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
    
    // إعادة التحقق كل 3 ثوان للتأكد من التحديث السريع
    const interval = setInterval(getUserRole, 3000);
    
    return () => clearInterval(interval);
  }, [user]);

  return { role, loading };
};