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
        console.log('=== FETCHING USER ROLE ===');
        console.log('User ID:', user.id);
        console.log('User email:', user.email);
        
        const { data, error } = await supabase
          .from('users')
          .select('role, is_active, updated_at')
          .eq('id', user.id)
          .eq('is_active', true)
          .single();

        if (error) {
          console.error('Error fetching user role:', error);
          setRole(null);
        } else if (data) {
          const userRole = data.role || null;
          console.log('=== USER ROLE FETCHED ===');
          console.log('Role:', userRole);
          console.log('Is Active:', data.is_active);
          console.log('Last Updated:', data.updated_at);
          
          setRole(userRole);
        } else {
          console.log('No user data found');
          setRole(null);
        }
      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    getUserRole();
  }, [user]);

  return { role, loading };
};