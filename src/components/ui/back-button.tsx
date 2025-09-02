import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";

interface BackButtonProps {
  to?: string;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export const BackButton = ({ 
  to, 
  onClick, 
  className, 
  variant = "outline", 
  size = "default" 
}: BackButtonProps) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (to) {
      navigate(to);
    } else {
      window.history.back();
    }
  };

  const ArrowIcon = language === 'ar' ? ArrowRight : ArrowLeft;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={`flex items-center gap-2 ${className || ''}`}
    >
      <ArrowIcon className="h-4 w-4" />
      {t('nav.back')}
    </Button>
  );
};