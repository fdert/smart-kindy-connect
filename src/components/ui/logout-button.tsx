import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";

interface LogoutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  showText?: boolean;
}

export const LogoutButton = ({ 
  className, 
  variant = "ghost", 
  size = "sm",
  showText = true 
}: LogoutButtonProps) => {
  const { signOut } = useAuth();
  const { t } = useLanguage();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={signOut}
      className={`flex items-center gap-2 ${className || ''}`}
    >
      <LogOut className="h-4 w-4" />
      {showText && <span>{t('nav.logout')}</span>}
    </Button>
  );
};