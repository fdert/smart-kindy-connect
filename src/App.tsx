import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { LanguageProvider } from "@/hooks/useLanguage";
import { Layout } from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
import { useAuthRedirect } from "@/hooks/useAuthRedirect";
import Index from "./pages/Index";
import Tour from "./pages/Tour";
import StandaloneTour from "./pages/StandaloneTour";
import Demo from "./pages/Demo";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import DashboardRouter from "./pages/DashboardRouter";
import TeacherDashboard from "./pages/TeacherDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import GuardianDashboard from "./pages/GuardianDashboard";
import DemoSystemAdminDashboard from "./pages/DemoSystemAdminDashboard";
import Students from "./pages/Students";
import Teachers from "./pages/Teachers";
import Attendance from "./pages/Attendance";
import Assignments from "./pages/Assignments";
import StudentNotes from "./pages/StudentNotes";
import Rewards from "./pages/Rewards";
import Classes from "./pages/Classes";
import Media from "./pages/Media";
import Guardians from "./pages/Guardians";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import FinancialSystem from "./pages/FinancialSystem";
import FinancialReports from "./pages/FinancialReports";
import TenantRegistration from "./pages/TenantRegistration";
import SuperAdmin from "./pages/SuperAdmin";
import Pricing from "./pages/Pricing";
import Permissions from "./pages/Permissions";
import Surveys from "./pages/Surveys";
import VirtualClasses from "./pages/VirtualClasses";
import PlansManagement from "./pages/PlansManagement";
import CMSManagement from "./pages/CMSManagement";
import SharedRewardCard from "./pages/SharedRewardCard";
import PublicSurvey from "./pages/PublicSurvey";
import PublicPermission from "./pages/PublicPermission";
import StudentReport from "./pages/StudentReport";
import StudentAssignments from "./pages/StudentAssignments";
import StudentAttendance from "./pages/StudentAttendance";
import StudentRewards from "./pages/StudentRewards";
import StudentMedia from "./pages/StudentMedia";
import StudentNotesDetail from "./pages/StudentNotesDetail";
import AIAssistant from "./pages/AIAssistant";
import VisitorAnalytics from "./pages/VisitorAnalytics";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// مكون حماية المسارات المحسن
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuthRedirect();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !role) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <Layout>
      {children}
    </Layout>
  );
};

// مكون إعادة توجيه للمستخدمين المسجلين
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, role, loading } = useAuthRedirect();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  // إذا كان المستخدم مسجلاً الدخول ولديه دور، فلا حاجة لعرض الصفحات العامة
  // لأن useAuthRedirect سيتولى إعادة التوجيه
  if (user && role) {
    return null; // useAuthRedirect سيتولى التوجيه
  }
  
  return <>{children}</>;
};

// مكون صفحة عامة
const PublicPageRoute = ({ children }: { children: React.ReactNode }) => (
  <Layout showNavigation={false}>{children}</Layout>
);

const AppRoutes = () => (
  <Routes>
    {/* الصفحات العامة */}
    <Route path="/" element={<PublicPageRoute><Index /></PublicPageRoute>} />
    <Route path="/tour" element={<PublicPageRoute><Tour /></PublicPageRoute>} />
    <Route path="/visitor-analytics" element={<ProtectedRoute><VisitorAnalytics /></ProtectedRoute>} />
    <Route path="/standalone-tour" element={<PublicPageRoute><StandaloneTour /></PublicPageRoute>} />
    <Route path="/demo" element={<PublicPageRoute><Demo /></PublicPageRoute>} />
    <Route path="/register" element={<PublicPageRoute><TenantRegistration /></PublicPageRoute>} />
    <Route path="/pricing" element={<PublicPageRoute><Pricing /></PublicPageRoute>} />
    <Route path="/survey/:surveyId" element={<PublicPageRoute><PublicSurvey /></PublicPageRoute>} />
    <Route path="/permission/:id" element={<PublicPageRoute><PublicPermission /></PublicPageRoute>} />
    <Route path="/student-report/:studentId" element={<PublicPageRoute><StudentReport /></PublicPageRoute>} />
    <Route path="/student-assignments/:studentId" element={<PublicPageRoute><StudentAssignments /></PublicPageRoute>} />
    <Route path="/student-attendance/:studentId" element={<PublicPageRoute><StudentAttendance /></PublicPageRoute>} />
    <Route path="/student-rewards/:studentId" element={<PublicPageRoute><StudentRewards /></PublicPageRoute>} />
    <Route path="/student-media/:studentId" element={<PublicPageRoute><StudentMedia /></PublicPageRoute>} />
    <Route path="/student-notes-detail/:studentId" element={<PublicPageRoute><StudentNotesDetail /></PublicPageRoute>} />
    <Route path="/reward-card" element={<PublicPageRoute><SharedRewardCard /></PublicPageRoute>} />
    <Route path="/auth" element={
      <PublicRoute>
        <PublicPageRoute><Auth /></PublicPageRoute>
      </PublicRoute>
    } />
    
    {/* الصفحات المحمية */}
    <Route path="/super-admin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
    <Route path="/demo-system-admin" element={<ProtectedRoute><DemoSystemAdminDashboard /></ProtectedRoute>} />
    <Route path="/teacher-dashboard" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
    <Route path="/admin-dashboard" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
    <Route path="/guardian-dashboard" element={<ProtectedRoute><GuardianDashboard /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><DashboardRouter /></ProtectedRoute>} />
    <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
    <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
    <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
    <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
    <Route path="/student-notes" element={<ProtectedRoute><StudentNotes /></ProtectedRoute>} />
    <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
    <Route path="/rewards" element={<ProtectedRoute><Rewards /></ProtectedRoute>} />
    <Route path="/classes" element={<ProtectedRoute><Classes /></ProtectedRoute>} />
    <Route path="/media" element={<ProtectedRoute><Media /></ProtectedRoute>} />
    <Route path="/guardians" element={<ProtectedRoute><Guardians /></ProtectedRoute>} />
    <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
    <Route path="/financial-system" element={<ProtectedRoute><FinancialSystem /></ProtectedRoute>} />
    <Route path="/financial-reports" element={<ProtectedRoute><FinancialReports /></ProtectedRoute>} />
    <Route path="/permissions" element={<ProtectedRoute><Permissions /></ProtectedRoute>} />
    <Route path="/surveys" element={<ProtectedRoute><Surveys /></ProtectedRoute>} />
    <Route path="/virtual-classes" element={<ProtectedRoute><VirtualClasses /></ProtectedRoute>} />
    <Route path="/plans-management" element={<ProtectedRoute><PlansManagement /></ProtectedRoute>} />
    <Route path="/cms-management" element={<ProtectedRoute><CMSManagement /></ProtectedRoute>} />
    
    {/* صفحة 404 */}
    <Route path="*" element={<PublicPageRoute><NotFound /></PublicPageRoute>} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <TenantProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </TooltipProvider>
        </TenantProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
