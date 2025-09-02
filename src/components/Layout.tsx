import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/hooks/useLanguage';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export const Layout = ({ children, showNavigation = true }: LayoutProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && user && <Navigation />}
      <main className={showNavigation && user ? "pt-0" : ""}>
        {children}
      </main>
    </div>
  );
};