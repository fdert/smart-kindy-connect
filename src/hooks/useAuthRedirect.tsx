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
      console.log('No role found for user, waiting...');
      return;
    }

    // توجيه المستخدم حسب دوره - تم إصلاح المنطق
    const currentPath = window.location.pathname;
    let targetPath = '/dashboard';

    console.log('=== AUTH REDIRECT DEBUG ===');
    console.log('User ID:', user.id);
    console.log('User Role:', role);
    console.log('Current Path:', currentPath);

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

    console.log('Target Path:', targetPath);

    // إذا كان المستخدم في الصفحة الخاطئة، وجه إلى الصفحة الصحيحة
    const publicPaths = ['/auth', '/', '/tour', '/demo', '/register', '/pricing'];
    const isOnPublicPath = publicPaths.includes(currentPath) || 
                          currentPath.startsWith('/survey/') || 
                          currentPath.startsWith('/permission/') || 
                          currentPath.startsWith('/student-');

    // إذا كان المستخدم في صفحة عامة أو الصفحة الحالية لا تطابق الهدف
    if (isOnPublicPath || currentPath !== targetPath) {
      console.log(`Redirecting ${role} user from ${currentPath} to ${targetPath}`);
      navigate(targetPath, { replace: true });
    } else {
      console.log('User is already on correct path:', currentPath);
    }

  }, [user, role, authLoading, roleLoading, navigate]);

  return { user, role, loading: authLoading || roleLoading };
};