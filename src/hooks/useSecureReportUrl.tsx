import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ReportUrlOptions {
  studentId: string;
  reportType: 'student-rewards' | 'student-notes-detail' | 'student-media' | 'student-attendance' | 'student-assignments' | 'student-report';
  guardianAccess?: boolean;
}

export const useSecureReportUrl = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateSecureUrl = useCallback(async (options: ReportUrlOptions) => {
    setLoading(true);
    setError(null);

    try {
      // استدعاء دالة إنشاء التوكن
      const { data, error } = await supabase.functions.invoke('generate-report-token', {
        body: {
          studentId: options.studentId,
          reportType: options.reportType,
          guardianAccess: options.guardianAccess || false
        }
      });

      if (error) {
        throw new Error(error.message || 'فشل في إنشاء رابط آمن');
      }

      if (!data.success) {
        throw new Error(data.error || 'فشل في إنشاء رابط آمن');
      }

      const baseUrl = 'https://ytjodudlnfamvnescumu.supabase.co';
      return data.data.reportUrl;

    } catch (err: any) {
      const errorMessage = err.message || 'حدث خطأ غير متوقع';
      setError(errorMessage);
      console.error('Error generating secure URL:', err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateWhatsAppUrl = useCallback(async (options: ReportUrlOptions) => {
    try {
      const secureUrl = await generateSecureUrl(options);
      const message = encodeURIComponent(`تقرير الطالب: ${secureUrl}`);
      return `https://wa.me/?text=${message}`;
    } catch (err) {
      throw err;
    }
  }, [generateSecureUrl]);

  return {
    generateSecureUrl,
    generateWhatsAppUrl,
    loading,
    error
  };
};