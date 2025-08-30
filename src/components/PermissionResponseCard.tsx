import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, X, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface PermissionResponse {
  id: string;
  response: 'approved' | 'declined' | 'pending';
  responded_at: string | null;
  notes: string | null;
  guardians: {
    full_name: string;
    whatsapp_number: string;
  };
  students: {
    full_name: string;
  };
}

interface PermissionResponseCardProps {
  response: PermissionResponse;
}

export const PermissionResponseCard = ({ response }: PermissionResponseCardProps) => {
  const getResponseIcon = () => {
    switch (response.response) {
      case 'approved':
        return <Check className="h-4 w-4" />;
      case 'declined':
        return <X className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getResponseBadge = () => {
    const variants: Record<string, { variant: any, label: string }> = {
      approved: { variant: 'default', label: 'موافق' },
      declined: { variant: 'destructive', label: 'مرفوض' },
      pending: { variant: 'secondary', label: 'في الانتظار' }
    };
    
    const config = variants[response.response] || variants.pending;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        {getResponseIcon()}
        {config.label}
      </Badge>
    );
  };

  return (
    <Card className="mb-3">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h4 className="font-medium">{response.guardians.full_name}</h4>
            <p className="text-sm text-muted-foreground">
              ولي أمر: {response.students.full_name}
            </p>
          </div>
          {getResponseBadge()}
        </div>
        
        {response.responded_at && (
          <p className="text-xs text-muted-foreground mb-2">
            رد في: {format(new Date(response.responded_at), 'PPP p', { locale: ar })}
          </p>
        )}
        
        {response.notes && (
          <div className="flex items-start gap-2 mt-3 p-2 bg-muted rounded-md">
            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
            <p className="text-sm">{response.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};