
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QuickbooksProvider } from "@/contexts/QuickbooksContext";
import { AuthProvider } from "@/contexts/AuthContext";
import RouteGuard from "@/components/RouteGuard";

// Pages
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Verify from "./pages/Verify";
import Dashboard from "./pages/Dashboard";
import Import from "./pages/Import";
import Export from "./pages/Export";
import Delete from "./pages/Delete";
import Profile from "./pages/Profile";
import QuickbooksCallback from "./pages/QuickbooksCallback";
import QuickbooksConnectPage from "./components/QuickbooksConnectPage";
import NotFound from "./pages/NotFound";
import Disconnected from "./pages/Disconnected";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <QuickbooksProvider>
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
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </QuickbooksProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
