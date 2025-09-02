import { BackButton } from "@/components/ui/back-button";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { LogoutButton } from "@/components/ui/logout-button";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  showBack?: boolean;
  showLanguageSwitch?: boolean;
  showLogout?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export const PageHeader = ({
  title,
  subtitle,
  backTo,
  showBack = true,
  showLanguageSwitch = true,
  showLogout = true,
  className = "",
  children
}: PageHeaderProps) => {
  return (
    <div className={`flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6 ${className}`}>
      <div className="flex items-center gap-2">
        {showBack && <BackButton to={backTo} />}
        {showLanguageSwitch && <LanguageSwitcher />}
        {showLogout && <LogoutButton />}
      </div>
      <div className="flex-1">
        <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm md:text-base text-gray-600 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
};