import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import Index from "./pages/Index";
import Login from "./pages/authentication/Login";
import SignUp from "./pages/authentication/SignUp";
import VerifyCode from "./pages/authentication/VerifyCode";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/authentication/ForgotPassword";
import ChangePassword from "./pages/authentication/ChangePassword";
import ResetPassword from "./pages/authentication/ResetPassword";
import NotFound from "./pages/NotFound";
import SavedProfiles from "./pages/SavedProfiles";
import Pricing from "./pages/Pricing";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import OptOut from "./pages/OptOut";
import CookiePolicy from "./pages/CookiePolicy";
import About from "./pages/About";
import CookieConsent from "./components/CookieConsent";
import { useAuth } from "./contexts/AuthContext";
import { OnboardingVideoModal } from "./components/OnboardingVideoModal";

const queryClient = new QueryClient();

// Simple auth state management for demo purposes
// In a real app, this would be handled with a proper auth provider
const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const { user, showOnboardingVideo, closeOnboardingVideo } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [cookiePreferences, setCookiePreferences] = useState(null);

  // Check if user is authenticated on component mount
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      setIsAuthenticated(true);

      // Check if the user is an admin (for demo purposes)
      const userData = JSON.parse(user);
      setIsAdmin(userData.email === 'admin@example.com');
    }
  }, []);

  const handleLogin = (email: string) => {
    const isAdminLogin = email === 'admin@example.com';
    localStorage.setItem('user', JSON.stringify({
      name: isAdminLogin ? 'Admin User' : 'User',
      email: email
    }));
    setIsAuthenticated(true);
    setIsAdmin(isAdminLogin);
  };

  const handleSignup = () => {
    // Don't set user yet – wait for actual login
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };


  const handleLogout = () => {
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setIsAdmin(false);
  };

  const handleCookieConsent = (preferences: any) => {
    setCookiePreferences(preferences);
    // Here you would typically initialize analytics, marketing scripts, etc.
    // based on the user's preferences
    console.log('Cookie preferences saved:', preferences);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/"
              element={
                isAuthenticated ?
                  <Navigate to={"/leads"} replace /> :
                  <Index />
              }
            />
            <Route
              path="/login"
              element={
                isAuthenticated ?
                  <Navigate to={"/leads"} replace /> :
                  <Login onLogin={handleLogin} />
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated ?
                  <Navigate to="/leads" replace /> :
                  <SignUp onSignup={handleSignup} />
              }
            />
            <Route path="/verify-email" element={<VerifyCode onVerificationSuccess={handleSignup} />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />

            {/* GDPR and Legal Pages - Public Routes */}
            <Route path="/terms-of-service" element={<TermsOfService />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/opt-out" element={<OptOut />} />
            <Route path="/cookie-policy" element={<CookiePolicy />} />

            <Route
              path="/change-password"
              element={
                isAuthenticated ?
                  <ChangePassword /> :
                  <Navigate to="/login" replace />
              }
            />

            {/* Dashboard and related routes */}
            <Route
              path="/dashboard/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/profile/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/leads/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/savedProfiles/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/campaigns/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/inbox/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/tasks/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/calls/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/reports/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/templates/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/projects/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/candidates/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/enrich/*"
              element={
                isAuthenticated ?
                  <Dashboard onLogout={handleLogout} /> :
                  <Navigate to="/login" replace />
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <AdminDashboard />
              }
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <CookieConsent onConsentGiven={handleCookieConsent} />

          {/* Onboarding Video Modal */}
          {showOnboardingVideo && (
            <OnboardingVideoModal onClose={closeOnboardingVideo} />
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider >
  );
};

export default App;
