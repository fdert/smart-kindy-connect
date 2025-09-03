import React from 'react';
import { Layout } from '@/components/Layout';
import DeepSeekAIAssistant from '@/components/DeepSeekAIAssistant';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const AIAssistant: React.FC = () => {
  const { user } = useAuth();
  const { role, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // السماح للمدراء والمعلمات فقط
  if (!role || !['admin', 'teacher', 'super_admin', 'owner'].includes(role)) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <h1 className="text-2xl font-bold text-red-600">غير مصرح لك بالوصول</h1>
            <p className="text-muted-foreground">
              هذه الصفحة متاحة للمدراء والمعلمات فقط
            </p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto">
        <DeepSeekAIAssistant />
      </div>
    </Layout>
  );
};

export default AIAssistant;