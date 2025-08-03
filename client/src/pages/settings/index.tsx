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
      badge: "Action Required",
      badgeVariant: "destructive",
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-blue-200">Manage your account settings and preferences</p>
            
            {/* Account Status Summary */}
            <Card className="card-gradient mt-6 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">
                        {authState.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{authState.user.name}</h3>
                      <p className="text-blue-200 text-sm">{authState.user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-green-400 border-green-400/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Account
                        </Badge>
                        <Badge variant="outline" className="text-blue-400 border-blue-400/30">
                          {authState.user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-blue-300">Account since</p>
                    <p className="text-white font-medium">
                      {new Date(authState.user.createdAt || new Date()).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settingsSections.map((section) => {
              const IconComponent = section.icon;
              return (
                <Card 
                  key={section.id}
                  className="card-gradient border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group"
                  onClick={() => setLocation(section.href)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Go to ${section.title} settings`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                          <IconComponent className="h-5 w-5 text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                              {section.title}
                            </h3>
                            {section.badge && (
                              <Badge variant={section.badgeVariant} className="text-xs">
                                {section.badge}
                              </Badge>
                            )}
                          </div>
                          {section.status && (
                            <div className="flex items-center gap-1 mb-2">
                              {getStatusIcon(section.status)}
                              <span className="text-xs text-gray-400">
                                {getStatusText(section.status)}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors" />
                    </div>
                    
                    <p className="text-sm text-gray-300 mb-4">
                      {section.description}
                    </p>
                    
                    {section.requiresVerification && (
                      <div className="flex items-center gap-2 text-xs text-yellow-400">
                        <Lock className="h-3 w-3" />
                        Requires identity verification
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Quick Actions */}
          <Card className="card-gradient border-white/10 mt-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-blue-400" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 border-white/20 hover:bg-white/10"
                  onClick={() => setLocation('/settings/security')}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-400" />
                      <span className="font-medium">Enable 2FA</span>
                    </div>
                    <p className="text-xs text-gray-400">Secure your account</p>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 border-white/20 hover:bg-white/10"
                  onClick={() => setLocation('/settings/statements')}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <Download className="h-4 w-4 text-green-400" />
                      <span className="font-medium">Download Statements</span>
                    </div>
                    <p className="text-xs text-gray-400">Get account records</p>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="justify-start h-auto p-4 border-white/20 hover:bg-white/10"
                  onClick={() => setLocation('/settings/help')}
                >
                  <div className="text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <HelpCircle className="h-4 w-4 text-purple-400" />
                      <span className="font-medium">Get Help</span>
                    </div>
                    <p className="text-xs text-gray-400">Contact support</p>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}