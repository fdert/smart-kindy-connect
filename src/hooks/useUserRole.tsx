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
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        // إضافة timestamp لتجنب التخزين المؤقت
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else {
          const userRole = data?.role || null;
          console.log('User role fetched:', userRole, 'for user:', user.id);
          setRole(userRole);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
    
    // إعادة التحقق كل 5 ثوان للتأكد من التحديث
    const interval = setInterval(getUserRole, 5000);
    
    return () => clearInterval(interval);
  }, [user]);

  return { role, loading };
};