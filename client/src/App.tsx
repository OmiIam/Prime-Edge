import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { RouteLoader } from "@/components/RouteLoader";
import { useEffect, useState } from "react";
import { authManager } from "./lib/auth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Dashboard from "@/pages/dashboard";
import Admin from "@/pages/admin";

// Service Pages
import PersonalBanking from "@/pages/services/personal-banking";
import BusinessBanking from "@/pages/services/business-banking";
import InvestmentServices from "@/pages/services/investment-services";
import LoansAndCredit from "@/pages/services/loans";

// Support Pages
import HelpCenter from "@/pages/support/help-center";
import ContactUs from "@/pages/support/contact-us";
import SecurityCenter from "@/pages/support/security";

// Legal Pages
import PrivacyPolicy from "@/pages/legal/privacy-policy";
import TermsOfService from "@/pages/legal/terms-of-service";

// Company Pages
import About from "@/pages/about";

// User Pages
import KycSubmit from "@/pages/kyc/submit";
import ProfileSettings from "@/pages/settings/profile";
import SecuritySettings from "@/pages/settings/security";
import NotificationSettings from "@/pages/settings/notifications";
import PreferencesSettings from "@/pages/settings/preferences";
import BankingSettings from "@/pages/settings/banking";
import PrivacySettings from "@/pages/settings/privacy";
import StatementsSettings from "@/pages/settings/statements";
import HelpSettings from "@/pages/settings/help";
import Settings from "@/pages/settings/index";
import TransactionHistory from "@/pages/transactions/history";

// Admin Pages
import UserDetail from "@/pages/admin/users/[id]";

function Router() {
  const [authState, setAuthState] = useState(authManager.getState());

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  if (!authState.isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        
        {/* Service Pages */}
        <Route path="/services/personal-banking" component={PersonalBanking} />
        <Route path="/services/business-banking" component={BusinessBanking} />
        <Route path="/services/investment-services" component={InvestmentServices} />
        <Route path="/services/loans" component={LoansAndCredit} />
        
        {/* Support Pages */}
        <Route path="/support/help-center" component={HelpCenter} />
        <Route path="/support/contact-us" component={ContactUs} />
        <Route path="/support/security" component={SecurityCenter} />
        
        {/* Legal Pages */}
        <Route path="/legal/privacy-policy" component={PrivacyPolicy} />
        <Route path="/legal/terms-of-service" component={TermsOfService} />
        
        {/* Company Pages */}
        <Route path="/about" component={About} />
        
        {/* Redirect authenticated routes to landing for non-authenticated users */}
        <Route path="/admin" component={Landing} />
        <Route path="/dashboard" component={Landing} />
        <Route path="/kyc/submit" component={Landing} />
        <Route path="/settings" component={Landing} />
        <Route path="/settings/profile" component={Landing} />
        <Route path="/settings/security" component={Landing} />
        <Route path="/settings/notifications" component={Landing} />
        <Route path="/settings/preferences" component={Landing} />
        <Route path="/settings/banking" component={Landing} />
        <Route path="/settings/privacy" component={Landing} />
        <Route path="/settings/statements" component={Landing} />
        <Route path="/settings/help" component={Landing} />
        <Route path="/transactions/history" component={Landing} />
        <Route path="/admin/users/:id" component={Landing} />
        
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (authState.user?.role === 'ADMIN') {
    return (
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/admin" component={Admin} />
        <Route path="/admin/users/:id" component={UserDetail} />
        
        {/* User Pages */}
        <Route path="/kyc/submit" component={KycSubmit} />
        <Route path="/settings" component={Settings} />
        <Route path="/settings/profile" component={ProfileSettings} />
        <Route path="/settings/security" component={SecuritySettings} />
        <Route path="/settings/notifications" component={NotificationSettings} />
        <Route path="/settings/preferences" component={PreferencesSettings} />
        <Route path="/settings/banking" component={BankingSettings} />
        <Route path="/settings/privacy" component={PrivacySettings} />
        <Route path="/settings/statements" component={StatementsSettings} />
        <Route path="/settings/help" component={HelpSettings} />
        <Route path="/transactions/history" component={TransactionHistory} />
        
        {/* Service Pages (available to all users) */}
        <Route path="/services/personal-banking" component={PersonalBanking} />
        <Route path="/services/business-banking" component={BusinessBanking} />
        <Route path="/services/investment-services" component={InvestmentServices} />
        <Route path="/services/loans" component={LoansAndCredit} />
        
        {/* Support Pages (available to all users) */}
        <Route path="/support/help-center" component={HelpCenter} />
        <Route path="/support/contact-us" component={ContactUs} />
        <Route path="/support/security" component={SecurityCenter} />
        
        {/* Legal Pages (available to all users) */}
        <Route path="/legal/privacy-policy" component={PrivacyPolicy} />
        <Route path="/legal/terms-of-service" component={TermsOfService} />
        
        {/* Company Pages (available to all users) */}
        <Route path="/about" component={About} />
        
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      
      {/* User Pages */}
      <Route path="/kyc/submit" component={KycSubmit} />
      <Route path="/settings" component={Settings} />
      <Route path="/settings/profile" component={ProfileSettings} />
      <Route path="/settings/security" component={SecuritySettings} />
      <Route path="/settings/notifications" component={NotificationSettings} />
      <Route path="/settings/preferences" component={PreferencesSettings} />
      <Route path="/settings/banking" component={BankingSettings} />
      <Route path="/settings/privacy" component={PrivacySettings} />
      <Route path="/settings/statements" component={StatementsSettings} />
      <Route path="/settings/help" component={HelpSettings} />
      <Route path="/transactions/history" component={TransactionHistory} />
      
      {/* Service Pages (available to all users) */}
      <Route path="/services/personal-banking" component={PersonalBanking} />
      <Route path="/services/business-banking" component={BusinessBanking} />
      <Route path="/services/investment-services" component={InvestmentServices} />
      <Route path="/services/loans" component={LoansAndCredit} />
      
      {/* Support Pages (available to all users) */}
      <Route path="/support/help-center" component={HelpCenter} />
      <Route path="/support/contact-us" component={ContactUs} />
      <Route path="/support/security" component={SecurityCenter} />
      
      {/* Legal Pages (available to all users) */}
      <Route path="/legal/privacy-policy" component={PrivacyPolicy} />
      <Route path="/legal/terms-of-service" component={TermsOfService} />
      
      {/* Company Pages (available to all users) */}
      <Route path="/about" component={About} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <TooltipProvider>
          <div className="dark">
            <Toaster />
            <RouteLoader />
            <Router />
          </div>
        </TooltipProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
}

export default App;
