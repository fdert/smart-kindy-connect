import Navigation from '@/components/Navigation';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
}

export const Layout = ({ children, showNavigation = true }: LayoutProps) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {showNavigation && user && <Navigation />}
      <main className={showNavigation && user ? "pt-0" : ""}>
        {children}
      </main>
    </div>
  );
};