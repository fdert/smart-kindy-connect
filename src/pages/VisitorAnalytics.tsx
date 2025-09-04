import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { 
  Users, 
  Eye, 
  Monitor, 
  Smartphone, 
  Globe, 
  Calendar,
  TrendingUp,
  MapPin,
  RefreshCw
} from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";

interface VisitorStats {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  weeklyVisits: number;
  monthlyVisits: number;
  topPages: Array<{ page_url: string; count: number }>;
  topCountries: Array<{ country: string; count: number }>;
  topDevices: Array<{ device_type: string; count: number }>;
  topBrowsers: Array<{ browser: string; count: number }>;
  recentVisits: Array<{
    id: string;
    page_url: string;
    visit_date: string;
    country: string;
    device_type: string;
    browser: string;
  }>;
}

const VisitorAnalytics = () => {
  const { role: userRole, loading } = useUserRole();
  const [stats, setStats] = useState<VisitorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // التحقق من الصلاحيات - فقط للسوبر أدمن
  if (!loading && userRole !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // إحصائيات عامة
      const { data: totalVisitsData } = await supabase
        .from('page_visitors')
        .select('id', { count: 'exact' });

      const { data: todayVisitsData } = await supabase
        .from('page_visitors')
        .select('id', { count: 'exact' })
        .gte('visit_date', new Date().toISOString().split('T')[0]);

      const { data: weeklyVisitsData } = await supabase
        .from('page_visitors')
        .select('id', { count: 'exact' })
        .gte('visit_date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

      const { data: monthlyVisitsData } = await supabase
        .from('page_visitors')
        .select('id', { count: 'exact' })
        .gte('visit_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // الصفحات والزوار الأكثر زيارة
      const { data: topPagesData } = await supabase
        .from('page_visitors')
        .select('page_url, user_agent, referrer')
        .limit(1000);

      // الدول الأكثر زيارة
      const { data: topCountriesData } = await supabase
        .from('page_visitors')
        .select('country')
        .not('country', 'is', null)
        .limit(1000);

      // الأجهزة الأكثر استخداماً
      const { data: topDevicesData } = await supabase
        .from('page_visitors')
        .select('device_type')
        .not('device_type', 'is', null)
        .limit(1000);

      // المتصفحات الأكثر استخداماً
      const { data: topBrowsersData } = await supabase
        .from('page_visitors')
        .select('browser')
        .not('browser', 'is', null)
        .limit(1000);

      // أحدث الزيارات
      const { data: recentVisitsData } = await supabase
        .from('page_visitors')
        .select('id, page_url, visit_date, country, device_type, browser')
        .order('visit_date', { ascending: false })
        .limit(10);

      // معالجة البيانات
      const processTopData = (data: any[], field: string) => {
        const counts: { [key: string]: number } = {};
        data?.forEach(item => {
          const value = item[field] || 'غير محدد';
          counts[value] = (counts[value] || 0) + 1;
        });
        return Object.entries(counts)
          .map(([key, count]) => ({ [field]: key, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
      };

      const topPages = processTopData(topPagesData, 'page_url');
      const topCountries = processTopData(topCountriesData, 'country');
      const topDevices = processTopData(topDevicesData, 'device_type');
      const topBrowsers = processTopData(topBrowsersData, 'browser');

      // حساب الزوار الفريدين (تقريبي باستخدام user agent + referrer)
      const uniqueVisitors = new Set(topPagesData?.map(v => `${v.user_agent || ''}-${v.referrer || ''}`).filter(Boolean));

      setStats({
        totalVisits: totalVisitsData?.length || 0,
        uniqueVisitors: uniqueVisitors.size || Math.floor(totalVisitsData?.length * 0.7) || 0,
        todayVisits: todayVisitsData?.length || 0,
        weeklyVisits: weeklyVisitsData?.length || 0,
        monthlyVisits: monthlyVisitsData?.length || 0,
        topPages: topPages as any,
        topCountries: topCountries as any,
        topDevices: topDevices as any,
        topBrowsers: topBrowsers as any,
        recentVisits: recentVisitsData || []
      });
    } catch (error) {
      console.error('Error fetching visitor stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!loading && userRole === 'super_admin') {
      fetchStats();
    }
  }, [loading, userRole]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <PageHeader
          title="تحليلات الزوار"
          subtitle="إحصائيات مفصلة عن زوار الموقع"
        />
        <Button onClick={fetchStats} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 ml-2 ${isLoading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </Button>
      </div>

      {stats && (
        <div className="space-y-8">
          {/* إحصائيات عامة */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-D font-medium">إجمالي الزيارات</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalVisits.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">الزوار الفريدون</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueVisitors.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">زيارات اليوم</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.todayVisits.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">زيارات الأسبوع</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weeklyVisits.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">زيارات الشهر</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.monthlyVisits.toLocaleString()}</div>
              </CardContent>
            </Card>
          </div>

          {/* التفاصيل */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* الصفحات الأكثر زيارة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  الصفحات الأكثر زيارة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topPages.map((page, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm truncate max-w-48">{page.page_url}</span>
                      <Badge variant="secondary">{page.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* الدول */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  الدول الأكثر زيارة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topCountries.map((country, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{country.country || 'غير محدد'}</span>
                      <Badge variant="secondary">{country.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* الأجهزة */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  أنواع الأجهزة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topDevices.map((device, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {device.device_type === 'mobile' ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                        <span className="text-sm">{device.device_type === 'mobile' ? 'جوال' : 'سطح المكتب'}</span>
                      </div>
                      <Badge variant="secondary">{device.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* المتصفحات */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  المتصفحات الأكثر استخداماً
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topBrowsers.map((browser, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{browser.browser}</span>
                      <Badge variant="secondary">{browser.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* أحدث الزيارات */}
          <Card>
            <CardHeader>
              <CardTitle>أحدث الزيارات</CardTitle>
              <CardDescription>آخر 10 زيارات للموقع</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentVisits.map((visit, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="text-sm font-medium truncate max-w-64">{visit.page_url}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(visit.visit_date).toLocaleString('ar-SA')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">
                        {visit.country || 'غير محدد'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {visit.device_type === 'mobile' ? 'جوال' : 'سطح المكتب'}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {visit.browser}
                      </Badge>
                    </div>
                  </div>
                ))}
                {stats.recentVisits.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    لا توجد زيارات حديثة
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VisitorAnalytics;