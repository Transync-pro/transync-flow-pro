
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuickbooksProvider } from "@/contexts/QuickbooksContext";
import { QuickbooksEntitiesProvider } from "@/contexts/QuickbooksEntitiesContext";
import { IdleTimeoutProvider } from "@/contexts/IdleTimeoutContext";
import { TabVisibilityProvider } from "@/contexts/TabVisibilityContext";
import RouteGuard from "@/components/RouteGuard";
import RouteRestorer from "@/components/RouteRestorer";
import EnvironmentIndicator from "@/components/EnvironmentIndicator";
import { isProduction, isStaging, isDevelopment, addStagingPrefix } from "./config/environment";

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
  const basePath = isStaging() ? '/staging' : '';
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path={addStagingPrefix("/")} element={<Index />} />
      <Route path={addStagingPrefix("/login")} element={<Login />} />
      <Route path={addStagingPrefix("/signup")} element={<Signup />} />
      <Route path={addStagingPrefix("/forgot-password")} element={<ForgotPassword />} />
      <Route path={addStagingPrefix("/reset-password")} element={<ResetPassword />} />
      <Route path={addStagingPrefix("/verify")} element={<Verify />} />
      <Route path={addStagingPrefix("/demo")} element={<Demo />} />
      <Route path={addStagingPrefix("/features")} element={<Features />} />
      <Route path={addStagingPrefix("/documentation")} element={<Documentation />} />
      <Route path={addStagingPrefix("/support")} element={<Support />} />
      <Route path={addStagingPrefix("/tutorials")} element={<Tutorials />} />
      <Route path={addStagingPrefix("/contact")} element={<Contact />} />
      <Route path={addStagingPrefix("/about-us")} element={<AboutUs />} />
      <Route path={addStagingPrefix("/careers")} element={<Careers />} />
      <Route path={addStagingPrefix("/privacy-policy")} element={<PrivacyPolicy />} />
      <Route path={addStagingPrefix("/terms-of-use")} element={<TermsOfUse />} />
      <Route path={addStagingPrefix("/integrations")} element={<Integrations />} />
      <Route 
        path={addStagingPrefix("/coming-soon")} 
        element={
          <ComingSoon 
            title="Feature Coming Soon"
            description="This feature is currently under development and will be available soon."
          />
        } 
      />
      <Route path={addStagingPrefix("/blog")} element={<Blog />} />
      <Route path={addStagingPrefix("/blog/:slug")} element={<BlogDetail />} />

      {/* Protected routes */}
      <Route
        path={addStagingPrefix("/dashboard")}
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <Dashboard />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/dashboard/quickbooks-callback")}
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <QuickbooksCallback />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/profile")}
        element={
          <RouteGuard>
            <Profile />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/authenticate")}
        element={
          <RouteGuard>
            <Authenticate />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/disconnected")}
        element={
          <RouteGuard>
            <Disconnected />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/dashboard/export")}
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <Export />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/dashboard/import")}
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <Import />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/dashboard/delete")}
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <Delete />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/dashboard/history")}
        element={
          <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
            <History />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/subscription")}
        element={
          <RouteGuard>
            <Subscription />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/admin/blog")}
        element={
          <RouteGuard>
            <BlogAdmin />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/admin/blog/import")}
        element={
          <RouteGuard>
            <BlogImportPage />
          </RouteGuard>
        }
      />
      <Route
        path={addStagingPrefix("/admin/test")}
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
  const basePath = isStaging() ? '/staging' : '';
  
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter basename={basePath}>
          <AuthProvider>
            <QuickbooksProvider>
              <QuickbooksEntitiesProvider>
                <IdleTimeoutProvider>
                  <TabVisibilityProvider>
                    <EnvironmentIndicator />
                    <AppRoutes />
                  </TabVisibilityProvider>
                </IdleTimeoutProvider>
              </QuickbooksEntitiesProvider>
            </QuickbooksProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
