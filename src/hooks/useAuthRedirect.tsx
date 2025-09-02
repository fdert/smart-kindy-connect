import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useUserRole } from './useUserRole';

export const useAuthRedirect = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    // لا نفعل أي شيء إذا كان التحميل جارياً
    if (authLoading || roleLoading) {
      return;
    }

    // إذا لم يكن المستخدم مسجلاً الدخول، توجه إلى صفحة تسجيل الدخول
    if (!user) {
      navigate('/auth', { replace: true });
      return;
    }

    // إذا كان المستخدم مسجلاً الدخول لكن لا يوجد دور، انتظر قليلاً
    if (!role) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      return;
    }

    // توجيه المستخدم حسب دوره
    const currentPath = window.location.pathname;
    let targetPath = '/dashboard';

    switch (role) {
      case 'super_admin':
        targetPath = '/super-admin';
        break;
      case 'admin':
        targetPath = '/dashboard';
        break;
      case 'teacher':
        targetPath = '/teacher-dashboard';
        break;
      case 'guardian':
        targetPath = '/dashboard';
        break;
      default:
        targetPath = '/dashboard';
    }

    // إذا كان المستخدم في الصفحة الخاطئة، وجه إلى الصفحة الصحيحة
    const publicPaths = ['/auth', '/', '/tour', '/demo', '/register', '/pricing'];
    const isOnPublicPath = publicPaths.includes(currentPath) || currentPath.startsWith('/survey/') || currentPath.startsWith('/permission/') || currentPath.startsWith('/student-');

    if (isOnPublicPath || currentPath !== targetPath) {
      console.log(`Redirecting ${role} user from ${currentPath} to ${targetPath}`);
      navigate(targetPath, { replace: true });
    }

  }, [user, role, authLoading, roleLoading, navigate]);

  return { user, role, loading: authLoading || roleLoading };
};