import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/hooks/useTenant';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Calendar, 
  Star, 
  BookOpen,
  Image,
  UserCheck,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  BarChart3,
  Video,
  Building,
  Baby,
  PenTool,
  ClipboardList
} from 'lucide-react';

const smartKindyLogo = "/lovable-uploads/46a447fc-00fa-49c5-b6ae-3f7b46fc4691.png";
import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { user, signOut } = useAuth();
  const { tenant } = useTenant();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      loadUserRole();
    }
  }, [user]);

  const loadUserRole = async () => {
    if (!user) return;

    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserRole(userData?.role || 'guardian');
    } catch (error: any) {
      console.error('Error loading user role:', error);
      setUserRole('guardian'); // default role
    }
  };

  // Navigation items for different roles
  const superAdminNavigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: Settings },
    { name: 'إدارة النظام', href: '/super-admin', icon: Shield },
    { name: 'إدارة الخطط', href: '/plans-management', icon: Building },
    { name: 'إدارة المحتوى', href: '/cms-management', icon: FileText },
  ];

  const adminNavigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: Settings },
    { name: 'الطلاب', href: '/students', icon: Users },
    { name: 'الفصول', href: '/classes', icon: BookOpen },
    { name: 'الحضور', href: '/attendance', icon: Calendar },
    { name: 'الواجبات', href: '/assignments', icon: PenTool },
    { name: 'ملاحظات الطلاب', href: '/student-notes', icon: ClipboardList },
    { name: 'التحفيز', href: '/rewards', icon: Star },
    { name: 'الألبوم', href: '/media', icon: Image },
    { name: 'أولياء الأمور', href: '/guardians', icon: UserCheck },
    { name: 'أذونات الوالدين', href: '/permissions', icon: Shield },
    { name: 'الاستطلاعات', href: '/surveys', icon: BarChart3 },
    { name: 'الفصول الافتراضية', href: '/virtual-classes', icon: Video },
    { name: 'التقارير', href: '/reports', icon: FileText },
    { name: 'الإعدادات', href: '/settings', icon: Settings },
  ];

  const teacherNavigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: Settings },
    { name: 'فصولي', href: '/classes', icon: BookOpen },
    { name: 'الحضور', href: '/attendance', icon: Calendar },
    { name: 'الواجبات', href: '/assignments', icon: PenTool },
    { name: 'ملاحظات الطلاب', href: '/student-notes', icon: ClipboardList },
    { name: 'التحفيز', href: '/rewards', icon: Star },
    { name: 'الألبوم', href: '/media', icon: Image },
  ];

  const guardianNavigation = [
    { name: 'لوحة التحكم', href: '/dashboard', icon: Settings },
    { name: 'أطفالي', href: '/students', icon: Baby },
    { name: 'الألبوم', href: '/media', icon: Image },
  ];

  const getNavigationItems = () => {
    switch (userRole) {
      case 'super_admin': return superAdminNavigation;
      case 'admin': return adminNavigation;
      case 'teacher': return teacherNavigation;
      case 'guardian': return guardianNavigation;
      default: return guardianNavigation;
    }
  };

  const navigation = getNavigationItems();

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const fullName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'مستخدم';

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center space-x-reverse space-x-3">
              <img 
                src={smartKindyLogo} 
                alt="SmartKindy Logo" 
                className="h-12 w-12 object-contain"
              />
              <h1 className="text-xl font-bold text-gray-900">
                {tenant?.name || 'SmartKindy'}
              </h1>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:ml-6 md:flex md:space-x-reverse md:space-x-8">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      isActive
                        ? 'border-primary text-primary'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center">
            {/* User Menu */}
            <div className="flex items-center space-x-reverse space-x-4">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {getInitials(fullName)}
                </AvatarFallback>
              </Avatar>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {fullName}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden md:inline mr-2">خروج</span>
              </Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="text-gray-500 hover:text-gray-700"
              >
                {isOpen ? (
                  <X className="h-6 w-6" />
                ) : (
                  <Menu className="h-6 w-6" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-lg">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } block px-3 py-2 rounded-md text-base font-medium flex items-center gap-3`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;