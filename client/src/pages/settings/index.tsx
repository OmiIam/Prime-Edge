import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { 
  User, 
  Shield, 
  Bell, 
  CreditCard, 
  Settings as SettingsIcon,
  Download,
  Eye,
  Lock,
  Smartphone,
  Globe,
  FileText,
  HelpCircle,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock
} from "lucide-react";

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  href: string;
  requiresVerification?: boolean;
  status?: "complete" | "pending" | "action-required";
}

export default function Settings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  const settingsSections: SettingsSection[] = [
    {
      id: "profile",
      title: "Profile & Personal Information",
      description: "Manage your personal details, contact information, and profile picture",
      icon: User,
      href: "/settings/profile",
      status: "complete"
    },
    {
      id: "security",
      title: "Security & Privacy",
      description: "Password, two-factor authentication, and privacy controls",
      icon: Shield,
      badge: "Needs Attention",
      badgeVariant: "outline",
      href: "/settings/security",
      status: "action-required"
    },
    {
      id: "notifications",
      title: "Notifications & Alerts",
      description: "Configure how and when you receive notifications",
      icon: Bell,
      href: "/settings/notifications",
      status: "pending"
    },
    {
      id: "banking",
      title: "Banking Services",
      description: "Payment methods, transfers, and account preferences",
      icon: CreditCard,
      href: "/settings/banking",
      status: "complete"
    },
    {
      id: "preferences",
      title: "Account Preferences",
      description: "Language, timezone, accessibility, and display settings",
      icon: SettingsIcon,
      href: "/settings/preferences",
      status: "complete"
    },
    {
      id: "privacy",
      title: "Privacy & Data",
      description: "Data sharing, export, and account management options",
      icon: Eye,
      href: "/settings/privacy",
      requiresVerification: true,
      status: "complete"
    },
    {
      id: "statements",
      title: "Statements & Documents",
      description: "Download statements, tax documents, and transaction history",
      icon: FileText,
      href: "/settings/statements",
      status: "complete"
    },
    {
      id: "help",
      title: "Help & Support",
      description: "Contact support, FAQs, and account assistance",
      icon: HelpCircle,
      href: "/settings/help",
      status: "complete"
    }
  ];

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "complete":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "action-required":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status?: string) => {
    switch (status) {
      case "complete":
        return "Up to date";
      case "action-required":
        return "Needs attention";
      case "pending":
        return "Setup required";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user} />
      
      <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                  <SettingsIcon className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <h1 className="text-4xl font-bold text-white tracking-tight">Account Settings</h1>
                  <p className="text-white/70 text-lg font-medium">Complete control over your banking experience</p>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full status-pulse" />
                  <span className="text-white/80 font-medium">
                    {settingsSections.filter(s => s.status === 'complete').length}/{settingsSections.length} sections configured
                  </span>
                </div>
                <span className="text-white/40">•</span>
                <span className="text-white/60">Last updated today</span>
              </div>
            </div>
            
            {/* Account Status Summary */}
            <Card className="card-hero slide-in hover-lift">
              <CardContent className="p-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="relative">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 via-purple-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                        <span className="text-white font-bold text-xl">
                          {authState.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center border-2 border-white/20">
                        <CheckCircle className="h-3 w-3 text-white" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-2xl font-bold text-white">{authState.user.name}</h3>
                      <p className="text-white/70 text-base">{authState.user.email}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className="status-success text-xs px-3 py-1">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Account
                        </Badge>
                        <Badge className="status-info text-xs px-3 py-1">
                          {authState.user.role.charAt(0).toUpperCase() + authState.user.role.slice(1)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-left sm:text-right space-y-2">
                    <p className="text-sm text-white/60 font-medium uppercase tracking-wider">Member since</p>
                    <p className="text-white font-bold text-lg">
                      {new Date(authState.user.createdAt || new Date()).toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <div className="w-2 h-2 bg-green-400 rounded-full status-pulse" />
                      <span>Account Active</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsSections.map((section, index) => {
              const IconComponent = section.icon;
              return (
                <Card 
                  key={section.id}
                  className="card-elevated slide-in hover-lift cursor-pointer group border border-white/10 hover:border-white/20 transition-all duration-300"
                  onClick={() => setLocation(section.href)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Go to ${section.title} settings`}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-6 relative overflow-hidden">
                    {/* Background decorative elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    
                    <div className="relative">
                      <div className="flex items-start justify-between mb-6">
                        <div className="flex items-center gap-4">
                          <div className={`
                            w-12 h-12 rounded-xl flex items-center justify-center shadow-lg transition-all duration-300
                            ${
                              section.status === 'complete' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                              section.status === 'action-required' ? 'bg-gradient-to-r from-red-500 to-red-600' :
                              section.status === 'pending' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                              'bg-gradient-to-r from-blue-500 to-indigo-600'
                            }
                            group-hover:scale-110 group-hover:shadow-xl
                          `}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-bold text-white group-hover:text-blue-200 transition-colors text-lg">
                                {section.title}
                              </h3>
                              {section.badge && (
                                <Badge variant={section.badgeVariant} className="text-xs px-2 py-1">
                                  {section.badge}
                                </Badge>
                              )}
                            </div>
                            {section.status && (
                              <div className="flex items-center gap-2 mb-3">
                                {getStatusIcon(section.status)}
                                <span className={`text-sm font-medium ${
                                  section.status === 'complete' ? 'text-green-400' :
                                  section.status === 'action-required' ? 'text-red-400' :
                                  section.status === 'pending' ? 'text-yellow-400' :
                                  'text-gray-400'
                                }`}>
                                  {getStatusText(section.status)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-5 w-5 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all duration-300" />
                      </div>
                      
                      <p className="text-sm text-white/70 mb-4 leading-relaxed">
                        {section.description}
                      </p>
                      
                      {section.requiresVerification && (
                        <div className="flex items-center gap-2 text-xs font-medium">
                          <div className="flex items-center gap-2 px-3 py-1.5 bg-yellow-400/20 text-yellow-300 rounded-full border border-yellow-400/30">
                            <Lock className="h-3 w-3" />
                            <span>Requires identity verification</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card className="card-elevated slide-in mt-8">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                  <SettingsIcon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-white">Quick Actions</CardTitle>
                  <p className="text-sm text-white/60">Common settings shortcuts</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  className="group text-left p-5 rounded-2xl border border-white/10 hover:border-white/20 bg-gradient-to-br from-blue-500/10 to-indigo-600/10 hover:from-blue-500/20 hover:to-indigo-600/20 transition-all duration-300 hover-lift"
                  onClick={() => setLocation('/settings/security')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-white group-hover:text-blue-200 transition-colors">Enable 2FA</span>
                  </div>
                  <p className="text-sm text-white/70 group-hover:text-white/80 transition-colors">Add an extra layer of security to your account</p>
                </button>
                
                <button
                  className="group text-left p-5 rounded-2xl border border-white/10 hover:border-white/20 bg-gradient-to-br from-green-500/10 to-emerald-600/10 hover:from-green-500/20 hover:to-emerald-600/20 transition-all duration-300 hover-lift"
                  onClick={() => setLocation('/settings/statements')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Download className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-white group-hover:text-green-200 transition-colors">Download Statements</span>
                  </div>
                  <p className="text-sm text-white/70 group-hover:text-white/80 transition-colors">Get your account records and tax documents</p>
                </button>
                
                <button
                  className="group text-left p-5 rounded-2xl border border-white/10 hover:border-white/20 bg-gradient-to-br from-purple-500/10 to-purple-600/10 hover:from-purple-500/20 hover:to-purple-600/20 transition-all duration-300 hover-lift"
                  onClick={() => setLocation('/settings/help')}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                      <HelpCircle className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold text-white group-hover:text-purple-200 transition-colors">Get Help</span>
                  </div>
                  <p className="text-sm text-white/70 group-hover:text-white/80 transition-colors">Contact our support team for assistance</p>
                </button>
              </div>
              
              {/* Bottom stats */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/60">
                    {settingsSections.filter(s => s.status === 'complete').length} of {settingsSections.length} sections configured
                  </span>
                  <div className="flex items-center gap-2 text-white/50">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full status-pulse" />
                    <span className="text-xs">Account secure</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}