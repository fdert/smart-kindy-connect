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
import Demo from "./pages/Demo";
import Auth from "./pages/Auth";
import TeacherDashboard from "./pages/TeacherDashboard";
import Dashboard from "./pages/Dashboard";
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

const AppRoutes = () => (
  <Routes>
    {/* الصفحات العامة */}
    <Route path="/" element={<Layout showNavigation={false}><Index /></Layout>} />
    <Route path="/tour" element={<Layout showNavigation={false}><Tour /></Layout>} />
    <Route path="/demo" element={<Layout showNavigation={false}><Demo /></Layout>} />
    <Route path="/register" element={<Layout showNavigation={false}><TenantRegistration /></Layout>} />
    <Route path="/pricing" element={<Layout showNavigation={false}><Pricing /></Layout>} />
    <Route path="/survey/:surveyId" element={<Layout showNavigation={false}><PublicSurvey /></Layout>} />
    <Route path="/permission/:id" element={<Layout showNavigation={false}><PublicPermission /></Layout>} />
    <Route path="/student-report/:studentId" element={<Layout showNavigation={false}><StudentReport /></Layout>} />
    <Route path="/student-assignments/:studentId" element={<Layout showNavigation={false}><StudentAssignments /></Layout>} />
    <Route path="/student-attendance/:studentId" element={<Layout showNavigation={false}><StudentAttendance /></Layout>} />
    <Route path="/student-rewards/:studentId" element={<Layout showNavigation={false}><StudentRewards /></Layout>} />
    <Route path="/student-media/:studentId" element={<Layout showNavigation={false}><StudentMedia /></Layout>} />
    <Route path="/student-notes-detail/:studentId" element={<Layout showNavigation={false}><StudentNotesDetail /></Layout>} />
    <Route path="/reward-card" element={<Layout showNavigation={false}><SharedRewardCard /></Layout>} />
    <Route path="/auth" element={
      <PublicRoute>
        <Layout showNavigation={false}><Auth /></Layout>
      </PublicRoute>
    } />
    
    {/* الصفحات المحمية */}
    <Route path="/super-admin" element={<ProtectedRoute><SuperAdmin /></ProtectedRoute>} />
    <Route path="/teacher-dashboard" element={<ProtectedRoute><TeacherDashboard /></ProtectedRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
    <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
    <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
    <Route path="/assignments" element={<ProtectedRoute><Assignments /></ProtectedRoute>} />
    <Route path="/student-notes" element={<ProtectedRoute><StudentNotes /></ProtectedRoute>} />
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
    <Route path="*" element={<Layout showNavigation={false}><NotFound /></Layout>} />
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
