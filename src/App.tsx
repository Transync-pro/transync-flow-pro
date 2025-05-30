import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuickbooksProvider } from "@/contexts/QuickbooksContext";
import { IdleTimeoutProvider } from "@/contexts/IdleTimeoutContext";
import { TabVisibilityProvider } from "@/contexts/TabVisibilityContext";
import RouteGuard from "@/components/RouteGuard";
import RouteRestorer from "@/components/RouteRestorer";
import EnvironmentIndicator from "@/components/EnvironmentIndicator";
import { isProduction, isDevelopment } from "./config/environment";

// Import statements for pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Authenticate from "./pages/Authenticate";
import QuickbooksCallback from "./pages/QuickbooksCallback";
import Disconnected from "./pages/Disconnected";
import Export from "./pages/Export";
import Import from "./pages/Import";
import Delete from "./pages/Delete";
import History from "./pages/History";
import Demo from "./pages/Demo";
import Features from "./pages/Features";
import Documentation from "./pages/Documentation";
import Support from "./pages/Support";
import Tutorials from "./pages/Tutorials";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import Careers from "./pages/Careers";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";
import Subscription from "./pages/Subscription";
import Integrations from "./pages/Integrations";
import ComingSoon from "./pages/ComingSoon";
import Blog from "./pages/Blog";
import BlogDetail from "./pages/BlogDetail";
import BlogAdmin from "./pages/Admin/BlogAdmin";
import BlogImportPage from "./pages/Admin/BlogImportPage";
import TestAdmin from "./pages/Admin/TestAdmin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppRoutes = () => {
  // All routes are now relative to the root
  // Staging is handled via subdomain, not path
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Index />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/demo" element={<Demo />} />
      <Route path="/features" element={<Features />} />
      <Route path="/documentation" element={<Documentation />} />
      <Route path="/support" element={<Support />} />
      <Route path="/tutorials" element={<Tutorials />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/about-us" element={<AboutUs />} />
      <Route path="/careers" element={<Careers />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-use" element={<TermsOfUse />} />
      <Route path="/integrations" element={<Integrations />} />
      <Route 
        path="/coming-soon" 
        element={
          <ComingSoon 
            title="Feature Coming Soon"
            description="This feature is currently under development and will be available soon."
          />
        } 
      />
      <Route path="/blog" element={<Blog />} />
      <Route path="/blog/:slug" element={<BlogDetail />} />

      {/* Protected routes */}
      <Route
        path="/dashboard"
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <Dashboard />
          </RouteGuard>
        }
      />
      <Route
        path="/dashboard/quickbooks-callback"
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <QuickbooksCallback />
          </RouteGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <RouteGuard>
            <Profile />
          </RouteGuard>
        }
      />
      <Route
        path="/authenticate"
        element={
          <RouteGuard>
            <Authenticate />
          </RouteGuard>
        }
      />
      <Route
        path="/disconnected"
        element={
          <RouteGuard>
            <Disconnected />
          </RouteGuard>
        }
      />
      <Route
        path="/dashboard/export"
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <Export />
          </RouteGuard>
        }
      />
      <Route
        path="/dashboard/import"
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <Import />
          </RouteGuard>
        }
      />
      <Route
        path="/dashboard/delete"
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <Delete />
          </RouteGuard>
        }
      />
      <Route
        path="/dashboard/history"
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <History />
          </RouteGuard>
        }
      />
      <Route
        path="/subscription"
        element={
          <RouteGuard>
            <Subscription />
          </RouteGuard>
        }
      />
      <Route
        path="/admin/blog"
        element={
          <RouteGuard>
            <BlogAdmin />
          </RouteGuard>
        }
      />
      <Route
        path="/admin/blog/import"
        element={
          <RouteGuard>
            <BlogImportPage />
          </RouteGuard>
        }
      />
      <Route
        path="/admin/test"
        element={
          <RouteGuard>
            <TestAdmin />
          </RouteGuard>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename="/">
          <AuthProvider>
            <QuickbooksProvider>
              <IdleTimeoutProvider>
                <TabVisibilityProvider>
                  <EnvironmentIndicator />
                  <AppRoutes />
                </TabVisibilityProvider>
              </IdleTimeoutProvider>
            </QuickbooksProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
