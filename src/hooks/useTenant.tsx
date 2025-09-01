import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  email: string;
  phone?: string;
  address?: string;
  status: 'pending' | 'approved' | 'suspended' | 'cancelled';
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

interface TenantSettings {
  [key: string]: any;
}

interface TenantContextType {
  tenant: Tenant | null;
  settings: TenantSettings;
  loading: boolean;
  refreshTenant: () => Promise<void>;
  updateSetting: (key: string, value: any) => Promise<void>;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [settings, setSettings] = useState<TenantSettings>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const refreshTenant = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get user's tenant information
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select(`
          tenant_id,
          tenants (*)
        `)
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      let tenantData = userData?.tenants;

      // If no tenant found via tenant_id, try to find by email
      if (!tenantData && user.email) {
        console.log('No tenant found via tenant_id, searching by email:', user.email);
        
        const { data: tenantByEmail, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('email', user.email)
          .eq('status', 'approved')
          .single();

        if (tenantError) {
          console.error('Error finding tenant by email:', tenantError);
          throw new Error('لا يمكن العثور على بيانات الروضة الخاصة بك');
        }

        if (tenantByEmail) {
          tenantData = tenantByEmail;
          
          // Update user record with correct tenant_id
          const { error: updateError } = await supabase
            .from('users')
            .update({ tenant_id: tenantByEmail.id })
            .eq('id', user.id);

          if (updateError) {
            console.error('Error updating user tenant_id:', updateError);
          } else {
            console.log('Successfully linked user to tenant:', tenantByEmail.id);
          }
        }
      }

      if (tenantData) {
        setTenant(tenantData as Tenant);

        // Load tenant settings
        const { data: settingsData, error: settingsError } = await supabase
          .from('tenant_settings')
          .select('key, value')
          .eq('tenant_id', tenantData.id);

        if (settingsError) {
          console.error('Error loading tenant settings:', settingsError);
        }

        const settingsMap = settingsData?.reduce((acc, setting) => {
          acc[setting.key] = setting.value;
          return acc;
        }, {} as TenantSettings) || {};

        setSettings(settingsMap);
      } else {
        throw new Error('لم يتم العثور على بيانات الروضة');
      }
    } catch (error) {
      console.error('Error loading tenant:', error);
      setTenant(null);
      setSettings({});
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    if (!tenant) return;

    try {
      // Check if setting exists
      const { data: existingSetting } = await supabase
        .from('tenant_settings')
        .select('id')
        .eq('tenant_id', tenant.id)
        .eq('key', key)
        .single();

      if (existingSetting) {
        // Update existing setting
        const { error } = await supabase
          .from('tenant_settings')
          .update({ value, updated_at: new Date().toISOString() })
          .eq('tenant_id', tenant.id)
          .eq('key', key);

        if (error) throw error;
      } else {
        // Insert new setting
        const { error } = await supabase
          .from('tenant_settings')
          .insert({
            tenant_id: tenant.id,
            key,
            value
          });

        if (error) throw error;
      }

      setSettings(prev => ({ ...prev, [key]: value }));
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  useEffect(() => {
    refreshTenant();
  }, [user]);

  const value = {
    tenant,
    settings,
    loading,
    refreshTenant,
    updateSetting,
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};