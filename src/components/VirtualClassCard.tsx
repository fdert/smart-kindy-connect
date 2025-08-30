import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Send, Eye, ExternalLink, Calendar, Clock, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface VirtualClass {
  id: string;
  title: string;
  description: string | null;
  provider: string;
  meeting_url: string;
  meeting_id: string | null;
  passcode: string | null;
  scheduled_at: string;
  duration_minutes: number;
  created_at: string;
  is_active: boolean;
  classes?: {
    name: string;
  };
  attendance?: any[];
}

interface VirtualClassCardProps {
  virtualClass: VirtualClass;
  onSendNotifications: (id: string) => void;
  onViewAttendance: (virtualClass: VirtualClass) => void;
}

export const VirtualClassCard = ({ 
  virtualClass, 
  onSendNotifications, 
  onViewAttendance 
}: VirtualClassCardProps) => {
  const getProviderLabel = (provider: string) => {
    const providers: Record<string, string> = {
      zoom: 'Zoom',
      meet: 'Google Meet',
      jitsi: 'Jitsi Meet',
      teams: 'Microsoft Teams'
    };
    return providers[provider] || provider;
  };

  const isScheduled = new Date(virtualClass.scheduled_at) > new Date();
  const attendanceCount = virtualClass.attendance?.length || 0;

  return (
    <Card className="bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              {virtualClass.title}
              <Badge variant="outline">
                {getProviderLabel(virtualClass.provider)}
              </Badge>
            </CardTitle>
            <CardDescription>
              {virtualClass.description}
            </CardDescription>
            {virtualClass.classes && (
              <Badge variant="secondary" className="mt-2">
                {virtualClass.classes.name}
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewAttendance(virtualClass)}
              className="flex items-center gap-1"
            >
              <Eye className="h-4 w-4" />
              الحضور ({attendanceCount})
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSendNotifications(virtualClass.id)}
              className="flex items-center gap-1"
            >
              <Send className="h-4 w-4" />
              إرسال تذكير
            </Button>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex items-center gap-1"
            >
              <a href={virtualClass.meeting_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
                انضمام
              </a>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(virtualClass.scheduled_at), 'PPP', { locale: ar })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(virtualClass.scheduled_at), 'p', { locale: ar })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{virtualClass.duration_minutes} دقيقة</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{attendanceCount} طالب</span>
          </div>
        </div>
        
        {virtualClass.meeting_id && (
          <div className="mt-3 p-2 bg-muted rounded-md text-sm">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <strong>معرف الاجتماع:</strong> {virtualClass.meeting_id}
              </div>
              {virtualClass.passcode && (
                <div>
                  <strong>كلمة المرور:</strong> {virtualClass.passcode}
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <Badge variant={isScheduled ? 'default' : 'secondary'}>
            {isScheduled ? 'مجدول' : 'منتهي'}
          </Badge>
          <Badge variant={virtualClass.is_active ? 'default' : 'secondary'}>
            {virtualClass.is_active ? 'نشط' : 'غير نشط'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};