import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import {
  Shield,
  Lock,
  Smartphone,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  History,
  MapPin,
  Monitor,
  RefreshCw,
  Trash2,
  Download,
  ArrowLeft,
  Settings,
  UserCheck,
  Fingerprint,
  Mail,
  Phone,
  Globe
} from "lucide-react";

interface LoginSession {
  id: string;
  device: string;
  location: string;
  ip: string;
  lastActive: Date;
  current: boolean;
}

interface SecurityAuditLog {
  id: string;
  action: string;
  timestamp: Date;
  ip: string;
  device: string;
  success: boolean;
}

export default function SecuritySettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Mock data for demonstration
  const loginSessions: LoginSession[] = [
    {
      id: "1",
      device: "Chrome on MacBook Pro",
      location: "New York, NY",
      ip: "192.168.1.1",
      lastActive: new Date(),
      current: true
    },
    {
      id: "2",
      device: "Safari on iPhone 15",
      location: "New York, NY",
      ip: "192.168.1.2",
      lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
      current: false
    },
    {
      id: "3",
      device: "Chrome on Windows PC",
      location: "Brooklyn, NY",
      ip: "10.0.1.15",
      lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
      current: false
    }
  ];

  const auditLogs: SecurityAuditLog[] = [
    {
      id: "1",
      action: "Login successful",
      timestamp: new Date(),
      ip: "192.168.1.1",
      device: "Chrome/MacOS",
      success: true
    },
    {
      id: "2",
      action: "Password changed",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
      ip: "192.168.1.1",
      device: "Chrome/MacOS",
      success: true
    },
    {
      id: "3",
      action: "Failed login attempt",
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
      ip: "203.0.113.0",
      device: "Unknown",
      success: false
    },
    {
      id: "4",
      action: "Two-factor authentication disabled",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
      ip: "192.168.1.2",
      device: "Safari/iOS",
      success: true
    }
  ];

  const handlePasswordChange = async () => {
    setIsChangingPassword(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsChangingPassword(false);
    // Reset form or show success message
  };

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setTwoFactorEnabled(true);
    setIsEnabling2FA(false);
  };

  const handleTerminateSession = (sessionId: string) => {
    // Handle session termination
    console.log("Terminating session:", sessionId);
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user} />
      
      <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/settings')}
                className="text-blue-200 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">Security & Privacy</h1>
            <p className="text-blue-200">Manage your account security, password, and privacy settings</p>
            
            {/* Security Status */}
            <Card className="card-gradient mt-6 border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Account Security Status</h3>
                      <p className="text-blue-200 text-sm">Your account has strong security protections</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className="bg-green-100 text-green-700 border-green-200 mb-2">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Secure
                    </Badge>
                    <p className="text-sm text-blue-300">Security Score: 85%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="password" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1">
              <TabsTrigger value="password" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs sm:text-sm">
                Password
              </TabsTrigger>
              <TabsTrigger value="2fa" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs sm:text-sm">
                <span className="hidden sm:inline">Two-Factor Auth</span>
                <span className="sm:hidden">2FA</span>
              </TabsTrigger>
              <TabsTrigger value="sessions" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs sm:text-sm">
                <span className="hidden sm:inline">Active Sessions</span>
                <span className="sm:hidden">Sessions</span>
              </TabsTrigger>
              <TabsTrigger value="audit" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs sm:text-sm">
                <span className="hidden sm:inline">Security Log</span>
                <span className="sm:hidden">Log</span>
              </TabsTrigger>
            </TabsList>

            {/* Password Management */}
            <TabsContent value="password">
              <div className="grid gap-6">
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Key className="h-5 w-5 text-blue-400" />
                      Change Password
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="current-password" className="text-white">
                        Current Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="current-password"
                          type={showCurrentPassword ? "text" : "password"}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                          placeholder="Enter current password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password" className="text-white">
                        New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="new-password"
                          type={showNewPassword ? "text" : "password"}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                          placeholder="Enter new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password" className="text-white">
                        Confirm New Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm-password"
                          type={showConfirmPassword ? "text" : "password"}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 pr-10"
                          placeholder="Confirm new password"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-gray-400 hover:text-white"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>

                    <Alert className="bg-blue-950/50 border-blue-500/30">
                      <AlertTriangle className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-200">
                        Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols.
                      </AlertDescription>
                    </Alert>

                    <Button 
                      onClick={handlePasswordChange}
                      disabled={isChangingPassword}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {isChangingPassword ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Changing Password...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Change Password
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>

                {/* Password Requirements */}
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-green-400" />
                      Password Security Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-4">
                      {[
                        "Minimum 8 characters",
                        "At least one uppercase letter",
                        "At least one lowercase letter", 
                        "At least one number",
                        "At least one special character",
                        "Not previously used"
                      ].map((requirement, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-gray-300">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          {requirement}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Two-Factor Authentication */}
            <TabsContent value="2fa">
              <div className="grid gap-6">
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-blue-400" />
                      Two-Factor Authentication
                      {twoFactorEnabled ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Enabled
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-700 border-red-200">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Disabled
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {!twoFactorEnabled ? (
                      <>
                        <div className="text-gray-300">
                          <p className="mb-4">
                            Add an extra layer of security to your account by enabling two-factor authentication.
                            You'll need your phone or authenticator app to complete login.
                          </p>
                        </div>

                        <Alert className="bg-yellow-950/50 border-yellow-500/30">
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                          <AlertDescription className="text-yellow-200">
                            Your account security can be improved by enabling two-factor authentication.
                          </AlertDescription>
                        </Alert>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Card className="bg-white/5 border-white/10">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Phone className="h-5 w-5 text-blue-400" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-white">SMS Verification</h3>
                                  <p className="text-sm text-gray-400">Receive codes via text message</p>
                                </div>
                              </div>
                              <Button variant="outline" className="w-full border-white/20 text-gray-300 hover:bg-white/10">
                                Set Up SMS
                              </Button>
                            </CardContent>
                          </Card>

                          <Card className="bg-white/5 border-white/10">
                            <CardContent className="p-4 sm:p-6">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                  <Smartphone className="h-5 w-5 text-green-400" />
                                </div>
                                <div className="min-w-0">
                                  <h3 className="font-semibold text-white">Authenticator App</h3>
                                  <p className="text-sm text-gray-400">Use Google Authenticator or similar</p>
                                </div>
                              </div>
                              <Button 
                                onClick={handleEnable2FA}
                                disabled={isEnabling2FA}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                              >
                                {isEnabling2FA ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    <span className="hidden sm:inline">Setting Up...</span>
                                    <span className="sm:hidden">Setup...</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="hidden sm:inline">Set Up Authenticator</span>
                                    <span className="sm:hidden">Setup App</span>
                                  </>
                                )}
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </>
                    ) : (
                      <div className="space-y-4">
                        <Alert className="bg-green-950/50 border-green-500/30">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <AlertDescription className="text-green-200">
                            Two-factor authentication is active. Your account is protected with an additional security layer.
                          </AlertDescription>
                        </Alert>

                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-green-400" />
                            <div>
                              <p className="font-medium text-white">Authenticator App</p>
                              <p className="text-sm text-gray-400">Last used 2 hours ago</p>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
                            Manage
                          </Button>
                        </div>

                        <Button variant="destructive" className="w-full">
                          <Trash2 className="h-4 w-4 mr-2" />
                          Disable Two-Factor Authentication
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Security Alerts */}
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-400" />
                      Security Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="email-alerts" className="text-white font-medium block">
                          Email Alerts
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">Receive security notifications via email</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Switch
                          id="email-alerts"
                          checked={emailAlerts}
                          onCheckedChange={setEmailAlerts}
                        />
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="sms-alerts" className="text-white font-medium block">
                          SMS Alerts
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">Receive security notifications via text</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Switch
                          id="sms-alerts"
                          checked={smsAlerts}
                          onCheckedChange={setSmsAlerts}
                        />
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="login-alerts" className="text-white font-medium block">
                          Login Notifications
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">Alert me when someone logs into my account</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Switch
                          id="login-alerts"
                          checked={loginAlerts}
                          onCheckedChange={setLoginAlerts}
                        />
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                      <div className="min-w-0 flex-1">
                        <Label htmlFor="transaction-alerts" className="text-white font-medium block">
                          Transaction Alerts
                        </Label>
                        <p className="text-sm text-gray-400 mt-1">Alert me about suspicious transactions</p>
                      </div>
                      <div className="flex-shrink-0">
                        <Switch
                          id="transaction-alerts"
                          checked={transactionAlerts}
                          onCheckedChange={setTransactionAlerts}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Active Sessions */}
            <TabsContent value="sessions">
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Monitor className="h-5 w-5 text-blue-400" />
                      Active Sessions
                    </CardTitle>
                    <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {loginSessions.map((session) => (
                      <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 rounded-lg border border-white/10 gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Monitor className="h-5 w-5 text-blue-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-2">
                              <p className="font-medium text-white truncate">{session.device}</p>
                              {session.current && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs w-fit">
                                  Current Session
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{session.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <span>{session.ip}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>{formatTimeAgo(session.lastActive)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {!session.current && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleTerminateSession(session.id)}
                            className="w-full sm:w-auto"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            <span className="hidden sm:inline">Terminate</span>
                            <span className="sm:hidden">End Session</span>
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Alert className="mt-6 bg-blue-950/50 border-blue-500/30">
                    <AlertTriangle className="h-4 w-4 text-blue-400" />
                    <AlertDescription className="text-blue-200">
                      If you notice any unfamiliar sessions, terminate them immediately and change your password.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Audit Log */}
            <TabsContent value="audit">
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <History className="h-5 w-5 text-purple-400" />
                      Security Activity Log
                    </CardTitle>
                    <Button variant="outline" size="sm" className="border-white/20 text-gray-300 hover:bg-white/10">
                      <Download className="h-4 w-4 mr-2" />
                      Export Log
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 rounded-lg border border-white/10 gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            log.success ? 'bg-green-500/20' : 'bg-red-500/20'
                          }`}>
                            {log.success ? (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white truncate">{log.action}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-400 mt-1">
                              <span>{formatTimeAgo(log.timestamp)}</span>
                              <span className="truncate">{log.ip}</span>
                              <span className="truncate">{log.device}</span>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          className={`w-fit ${log.success 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {log.success ? "Success" : "Failed"}
                        </Badge>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                      Load More Events
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}