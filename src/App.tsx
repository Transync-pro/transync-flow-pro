
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
import { getBasePath } from "@/config/environment";

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
  const basePath = getBasePath();
  
  return (
    <Routes>
      {/* Public routes */}
      <Route path={`${basePath}/`} element={<Index />} />
      <Route path={`${basePath}/login`} element={<Login />} />
      <Route path={`${basePath}/signup`} element={<Signup />} />
      <Route path={`${basePath}/forgot-password`} element={<ForgotPassword />} />
      <Route path={`${basePath}/reset-password`} element={<ResetPassword />} />
      <Route path={`${basePath}/verify`} element={<Verify />} />
      <Route path={`${basePath}/demo`} element={<Demo />} />
      <Route path={`${basePath}/features`} element={<Features />} />
      <Route path={`${basePath}/documentation`} element={<Documentation />} />
      <Route path={`${basePath}/support`} element={<Support />} />
      <Route path={`${basePath}/tutorials`} element={<Tutorials />} />
      <Route path={`${basePath}/contact`} element={<Contact />} />
      <Route path={`${basePath}/about-us`} element={<AboutUs />} />
      <Route path={`${basePath}/careers`} element={<Careers />} />
      <Route path={`${basePath}/privacy-policy`} element={<PrivacyPolicy />} />
      <Route path={`${basePath}/terms-of-use`} element={<TermsOfUse />} />
      <Route path={`${basePath}/integrations`} element={<Integrations />} />
      <Route 
        path={`${basePath}/coming-soon`} 
        element={
          <ComingSoon 
            title="Feature Coming Soon"
            description="This feature is currently under development and will be available soon."
          />
        } 
      />
      <Route path={`${basePath}/blog`} element={<Blog />} />
      <Route path={`${basePath}/blog/:slug`} element={<BlogDetail />} />

      {/* Protected routes */}
      <Route
        path={`${basePath}/dashboard`}
        element={
          <RouteGuard>
            <Dashboard />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/dashboard/quickbooks-callback`}
        element={
          <RouteGuard>
            <QuickbooksCallback />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/profile`}
        element={
          <RouteGuard>
            <Profile />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/authenticate`}
        element={
          <RouteGuard>
            <Authenticate />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/disconnected`}
        element={
          <RouteGuard>
            <Disconnected />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/export`}
        element={
          <RouteGuard>
            <Export />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/import`}
        element={
          <RouteGuard>
            <Import />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/delete`}
        element={
          <RouteGuard>
            <Delete />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/history`}
        element={
          <RouteGuard>
            <History />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/subscription`}
        element={
          <RouteGuard>
            <Subscription />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/admin/blog`}
        element={
          <RouteGuard>
            <BlogAdmin />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/admin/blog/import`}
        element={
          <RouteGuard>
            <BlogImportPage />
          </RouteGuard>
        }
      />
      <Route
        path={`${basePath}/admin/test`}
        element={
          <RouteGuard>
            <TestAdmin />
          </RouteGuard>
        }
      />

      {/* Handle root path for staging */}
      {basePath && <Route path="/" element={<Index />} />}

      {/* Catch all route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <QuickbooksProvider>
            <QuickbooksEntitiesProvider>
              <IdleTimeoutProvider>
                <TabVisibilityProvider>
                  <EnvironmentIndicator />
                  <RouteRestorer />
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

export default App;
