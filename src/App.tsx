
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from "@/components/ui/toaster"

import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Authenticate from './pages/Authenticate';
import QuickbooksCallback from './pages/QuickbooksCallback';
import Subscription from './pages/Subscription';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfUse from './pages/TermsOfUse';
import RouteGuard from './components/RouteGuard';
import { AuthProvider } from './contexts/AuthContext';
import { QuickbooksProvider } from './contexts/QuickbooksContext';
import { IdleTimeoutProvider } from './contexts/IdleTimeoutContext';
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import TrialBanner from "@/components/TrialBanner";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <SubscriptionProvider>
            <QuickbooksProvider>
              <IdleTimeoutProvider>
                <Toaster />
                <TrialBanner />
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/login" element={<RouteGuard isPublicOnly><Login /></RouteGuard>} />
                  <Route path="/signup" element={<RouteGuard isPublicOnly><Signup /></RouteGuard>} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfUse />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/authenticate" element={<RouteGuard requiresAuth><Authenticate /></RouteGuard>} />
                  <Route path="/dashboard/quickbooks-callback" element={<QuickbooksCallback />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/profile" element={<RouteGuard requiresAuth><Profile /></RouteGuard>} />
                  <Route path="/dashboard" element={<RouteGuard requiresAuth requiresQuickbooks><Dashboard /></RouteGuard>} />
                  <Route path="/dashboard/import" element={<RouteGuard requiresAuth requiresQuickbooks requiresActiveSubscription><Dashboard /></RouteGuard>} />
                  <Route path="/dashboard/export" element={<RouteGuard requiresAuth requiresQuickbooks requiresActiveSubscription><Dashboard /></RouteGuard>} />
                  <Route path="/dashboard/delete" element={<RouteGuard requiresAuth requiresQuickbooks requiresActiveSubscription><Dashboard /></RouteGuard>} />
                </Routes>
              </IdleTimeoutProvider>
            </QuickbooksProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
