import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import AdminDashboard from './AdminDashboard';
import TeacherDashboard from './TeacherDashboard';
import GuardianDashboard from './GuardianDashboard';
import DemoSystemAdminDashboard from './DemoSystemAdminDashboard';

const DashboardRouter = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();

  // Loading state
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if no user
  if (!user || !role) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">لا يوجد مستخدم مسجل الدخول</p>
      </div>
    );
  }

  console.log('=== DASHBOARD ROUTER DEBUG ===');
  console.log('User Email:', user.email);
  console.log('User Role:', role);

  // Route to the correct dashboard based on role and account type
  switch (role) {
    case 'super_admin':
      // للحساب التجريبي لمدير النظام
      if (user.email === 'demo.system@smartkindy.com') {
        return <DemoSystemAdminDashboard />;
      }
      // للحسابات العادية لمدير النظام
      return <DemoSystemAdminDashboard />; // يمكن تغييرها لاحقاً إلى SuperAdmin
      
    case 'admin':
    case 'owner':
      return <AdminDashboard />;
      
    case 'teacher':
      return <TeacherDashboard />;
      
    case 'guardian':
      return <GuardianDashboard />;
      
    default:
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <p className="text-muted-foreground">دور غير معروف: {role}</p>
        </div>
      );
  }
};

export default DashboardRouter;