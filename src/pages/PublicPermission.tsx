import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Shield, CheckCircle, AlertCircle, Clock, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

interface Permission {
  id: string;
  title: string;
  description: string | null;
  permission_type: string;
  expires_at: string;
  created_at: string;
  is_active: boolean;
  response_options?: string[];
  tenants: {
    name: string;
    logo_url: string | null;
  };
}

interface PermissionResponse {
  id: string;
  response: string;
  responded_at: string | null;
  notes: string | null;
  guardians: {
    full_name: string;
  };
  students: {
    full_name: string;
  };
}

const PublicPermission = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [permission, setPermission] = useState<Permission | null>(null);
  const [response, setResponse] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [existingResponse, setExistingResponse] = useState<PermissionResponse | null>(null);

  useEffect(() => {
    loadPermission();
  }, [id]);

  const loadPermission = async () => {
    if (!id) {
      navigate('/404');
      return;
    }

    try {
      setLoading(true);
      
      // Get permission details
      const { data: permissionData, error: permissionError } = await supabase
        .from('permissions')
        .select(`
          *,
          tenants (
            name,
            logo_url
          )
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (permissionError || !permissionData) {
        throw new Error('Permission not found or no longer active');
      }

      // Check if permission has expired
      if (new Date(permissionData.expires_at) < new Date()) {
        throw new Error('Permission has expired');
      }

      setPermission({
        ...permissionData,
        response_options: (permissionData as any).response_options || ['موافق', 'غير موافق']
      });
      
      // Check for existing response (we'll need to implement a way to identify the guardian)
      // For now, we'll skip this check since we don't have guardian identification
      
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل الإذن",
        description: error.message,
        variant: "destructive",
      });
      navigate('/404');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitResponse = async () => {
    if (!permission || !response) {
      toast({
        title: "خطأ",
        description: "يرجى اختيار إجابة",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);
      
      const { data, error } = await supabase.functions.invoke('permissions-api', {
        body: {
          action: 'publicResponse',
          permissionId: permission.id,
          response: response,
          notes: notes.trim() || null
        }
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "تم إرسال الرد",
        description: "شكراً لك، تم تسجيل ردك بنجاح",
      });
      
    } catch (error: any) {
      toast({
        title: "خطأ في إرسال الرد",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getPermissionTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      activity: 'نشاط',
      trip: 'رحلة',
      medical: 'طبي',
      event: 'فعالية',
      other: 'أخرى'
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري تحميل الإذن...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full bg-white/80 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600">تم إرسال الرد بنجاح</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-6">
              شكراً لك، تم تسجيل ردك على الإذن بنجاح. سيتم إشعار إدارة الحضانة بردك.
            </p>
            <Button 
              onClick={() => window.close()} 
              className="w-full"
            >
              إغلاق النافذة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!permission) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {permission.tenants.logo_url && (
            <img 
              src={permission.tenants.logo_url} 
              alt={permission.tenants.name}
              className="h-16 mx-auto mb-4 rounded-lg"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {permission.tenants.name}
          </h1>
          <p className="text-gray-600">طلب موافقة ولي الأمر</p>
        </div>

        {/* Permission Details */}
        <Card className="bg-white/80 backdrop-blur-sm mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                {permission.title}
              </CardTitle>
              <Badge variant="outline">
                {getPermissionTypeLabel(permission.permission_type)}
              </Badge>
            </div>
            {permission.description && (
              <CardDescription className="text-base">
                {permission.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>ينتهي في: {format(new Date(permission.expires_at), 'PPP p', { locale: ar })}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Form */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>ردك على الطلب</CardTitle>
            <CardDescription>
              يرجى اختيار ردك على هذا الطلب
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Response Options */}
            <div>
              <Label className="text-base font-medium mb-4 block">اختر إجابتك:</Label>
              <RadioGroup value={response} onValueChange={setResponse}>
                {permission.response_options?.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 space-x-reverse">
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label 
                      htmlFor={`option-${index}`}
                      className="cursor-pointer flex-1 py-2"
                    >
                      {option}
                    </Label>
                  </div>
                )) || (
                  // Default options if none are specified
                  <>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="موافق" id="approved" />
                      <Label htmlFor="approved" className="cursor-pointer flex-1 py-2">
                        موافق
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <RadioGroupItem value="غير موافق" id="declined" />
                      <Label htmlFor="declined" className="cursor-pointer flex-1 py-2">
                        غير موافق
                      </Label>
                    </div>
                  </>
                )}
              </RadioGroup>
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-base font-medium">
                ملاحظات إضافية (اختيارية)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="أي ملاحظات أو تفاصيل إضافية تود إضافتها..."
                className="mt-2"
                rows={3}
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button 
                onClick={handleSubmitResponse}
                disabled={!response || submitting}
                className="flex-1"
              >
                {submitting ? 'جاري الإرسال...' : 'إرسال الرد'}
              </Button>
            </div>

            {/* Warning */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                بمجرد إرسال الرد، لن تتمكن من تعديله. يرجى التأكد من إجابتك قبل الإرسال.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicPermission;