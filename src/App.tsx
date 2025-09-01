import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { TenantProvider } from "@/hooks/useTenant";
import { useUserRole } from "@/hooks/useUserRole";
import Index from "./pages/Index";
import Tour from "./pages/Tour";
import Demo from "./pages/Demo";
import Auth from "./pages/Auth";
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

// مكون حماية المسارات
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
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
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

// مكون إعادة توجيه للمستخدمين المسجلين
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }
  
  if (user && role) {
    console.log('PublicRoute: User found with role:', role);
    // توجيه المستخدمين حسب أدوارهم
    switch (role) {
      case 'super_admin':
        console.log('PublicRoute: Redirecting super_admin to /super-admin');
        return <Navigate to="/super-admin" replace />;
      case 'teacher':
        console.log('PublicRoute: Redirecting teacher to /students');
        return <Navigate to="/students" replace />; // توجيه المعلمين إلى صفحة الطلاب
      case 'admin':
        console.log('PublicRoute: Redirecting admin to /dashboard');
        return <Navigate to="/dashboard" replace />;
      default:
        console.log('PublicRoute: Redirecting default role to /dashboard');
        return <Navigate to="/dashboard" replace />;
    }
  }
  
  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/tour" element={<Tour />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/register" element={<TenantRegistration />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/survey/:surveyId" element={<PublicSurvey />} />
        <Route path="/permission/:id" element={<PublicPermission />} />
        <Route path="/student-report/:studentId" element={<StudentReport />} />
        <Route path="/student-assignments/:studentId" element={<StudentAssignments />} />
        <Route path="/student-attendance/:studentId" element={<StudentAttendance />} />
        <Route path="/student-rewards/:studentId" element={<StudentRewards />} />
        <Route path="/student-media/:studentId" element={<StudentMedia />} />
        <Route path="/student-notes-detail/:studentId" element={<StudentNotesDetail />} />
    <Route path="/super-admin" element={
      <ProtectedRoute>
        <SuperAdmin />
      </ProtectedRoute>
    } />
    <Route path="/auth" element={
      <PublicRoute>
        <Auth />
      </PublicRoute>
    } />
    <Route path="/dashboard" element={
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    } />
    <Route path="/students" element={
      <ProtectedRoute>
        <Students />
      </ProtectedRoute>
    } />
    <Route path="/teachers" element={
      <ProtectedRoute>
        <Teachers />
      </ProtectedRoute>
    } />
    <Route path="/attendance" element={
      <ProtectedRoute>
        <Attendance />
      </ProtectedRoute>
    } />
    <Route path="/assignments" element={
      <ProtectedRoute>
        <Assignments />
      </ProtectedRoute>
    } />
    <Route path="/student-notes" element={
      <ProtectedRoute>
        <StudentNotes />
      </ProtectedRoute>
    } />
    <Route path="/rewards" element={
      <ProtectedRoute>
        <Rewards />
      </ProtectedRoute>
    } />
    <Route path="/classes" element={
      <ProtectedRoute>
        <Classes />
      </ProtectedRoute>
    } />
    <Route path="/media" element={
      <ProtectedRoute>
        <Media />
      </ProtectedRoute>
    } />
    <Route path="/guardians" element={
      <ProtectedRoute>
        <Guardians />
      </ProtectedRoute>
    } />
    <Route path="/reports" element={
      <ProtectedRoute>
        <Reports />
      </ProtectedRoute>
    } />
    <Route path="/settings" element={
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    } />
    <Route path="/financial-system" element={
      <ProtectedRoute>
        <FinancialSystem />
      </ProtectedRoute>
    } />
    <Route path="/financial-reports" element={
      <ProtectedRoute>
        <FinancialReports />
      </ProtectedRoute>
    } />
    <Route path="/permissions" element={
      <ProtectedRoute>
        <Permissions />
      </ProtectedRoute>
    } />
    <Route path="/surveys" element={
      <ProtectedRoute>
        <Surveys />
      </ProtectedRoute>
    } />
    <Route path="/virtual-classes" element={
      <ProtectedRoute>
        <VirtualClasses />
      </ProtectedRoute>
    } />
    <Route path="/plans-management" element={
      <ProtectedRoute>
        <PlansManagement />
      </ProtectedRoute>
    } />
    <Route path="/cms-management" element={
      <ProtectedRoute>
        <CMSManagement />
      </ProtectedRoute>
    } />
    <Route path="/reward-card" element={<SharedRewardCard />} />
    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;
