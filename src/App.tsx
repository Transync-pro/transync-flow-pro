
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuickbooksProvider } from "@/contexts/QuickbooksContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { QuickbooksEntitiesProvider } from "@/contexts/QuickbooksEntitiesContext";
import RouteGuard from "@/components/RouteGuard";
import { useEffect } from "react";
import { configureErrorLogger } from "@/utils/errorLogger";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import Export from "./pages/Export";
import Delete from "./pages/Delete";
import History from "./pages/History"; // Import new History page
import Profile from "./pages/Profile";
import QuickbooksCallback from "./pages/QuickbooksCallback";
import QuickbooksConnectPage from "./components/QuickbooksConnectPage";
import NotFound from "./pages/NotFound";
import Disconnected from "./pages/Disconnected";

// New Pages
import Features from "./pages/Features";
import Subscription from "./pages/Subscription";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import Integrations from "./pages/Integrations";
import Demo from "./pages/Demo";
import Blog from "./pages/Blog";
import Documentation from "./pages/Documentation";
import Tutorials from "./pages/Tutorials";
import Support from "./pages/Support";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfUse from "./pages/TermsOfUse";

// Configure the global error logger
configureErrorLogger({
  consoleEnabled: true,
  persistToDbEnabled: false // Enable this once you set up the error_logs table
});

// Set up global error handling
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const { message, filename, lineno, colno, error } = event;
    import('./utils/errorLogger').then(({ logError }) => {
      logError(`Uncaught error: ${message}`, {
        source: filename || 'unknown',
        stack: error?.stack,
        context: { lineno, colno }
      });
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    import('./utils/errorLogger').then(({ logError }) => {
      logError(`Unhandled promise rejection: ${event.reason}`, {
        source: 'promise',
        stack: event.reason?.stack,
        context: { reason: event.reason }
      });
    });
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      meta: {
        onError: (error: unknown) => {
          import('./utils/errorLogger').then(({ logError }) => {
            logError(`Query error: ${error instanceof Error ? error.message : String(error)}`, {
              source: 'react-query',
              stack: error instanceof Error ? error.stack : undefined
            });
          });
        }
      }
    }
  }
});

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <QuickbooksProvider>
              <QuickbooksEntitiesProvider>
                <Routes>
                  {/* Public routes */}
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={
                    <RouteGuard requiresAuth={false} isPublicOnly={true}>
                      <Login />
                    </RouteGuard>
                  } />
                  <Route path="/signup" element={
                    <RouteGuard requiresAuth={false} isPublicOnly={true}>
                      <Signup />
                    </RouteGuard>
                  } />
                  <Route path="/verify" element={
                    <RouteGuard requiresAuth={false} isPublicOnly={false}>
                      <Verify />
                    </RouteGuard>
                  } />
                  <Route path="/disconnected" element={<Disconnected />} />
                  
                  {/* Auth protected routes */}
                  <Route path="/connect-quickbooks" element={
                    <RouteGuard requiresAuth={true} requiresQuickbooks={false}>
                      <QuickbooksConnectPage />
                    </RouteGuard>
                  } />
                  
                  <Route path="/profile" element={
                    <RouteGuard requiresAuth={true} requiresQuickbooks={false}>
                      <Profile />
                    </RouteGuard>
                  } />
                  
                  <Route path="/dashboard/quickbooks-callback" element={
                    <RouteGuard requiresAuth={true} requiresQuickbooks={false}>
                      <QuickbooksCallback />
                    </RouteGuard>
                  } />
                  
                  {/* Auth + QuickBooks protected routes */}
                  <Route path="/dashboard" element={
                    <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
                      <Dashboard />
                    </RouteGuard>
                  } />
                  <Route path="/dashboard/import" element={
                    <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
                      <Import />
                    </RouteGuard>
                  } />
                  <Route path="/dashboard/export" element={
                    <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
                      <Export />
                    </RouteGuard>
                  } />
                  <Route path="/dashboard/delete" element={
                    <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
                      <Delete />
                    </RouteGuard>
                  } />
                  <Route path="/dashboard/history" element={
                    <RouteGuard requiresAuth={true} requiresQuickbooks={true}>
                      <History />
                    </RouteGuard>
                  } />
                  
                  {/* New public pages */}
                  <Route path="/features" element={<Features />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/pricing" element={<Subscription />} /> {/* Redirect old path */}
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/about-us" element={<AboutUs />} />
                  <Route path="/integrations" element={<Integrations />} />
                  <Route path="/demo" element={<Demo />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/tutorials" element={<Tutorials />} />
                  <Route path="/support" element={<Support />} />
                  <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} /> {/* Redirect old path */}
                  <Route path="/terms-of-use" element={<TermsOfUse />} />
                  <Route path="/terms" element={<TermsOfUse />} /> {/* Redirect old path */}
                  
                  {/* Catch-all route */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </QuickbooksEntitiesProvider>
            </QuickbooksProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
