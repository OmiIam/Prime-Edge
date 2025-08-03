import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
  sessionId: string;
  deviceInfo: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  isActive: boolean;
  lastUsed: string;
  expiresAt: string;
  createdAt: string;
}

interface SecurityEvent {
  id: string;
  eventType: string;
  description: string;
  ipAddress?: string;
  userAgent?: string;
  deviceInfo?: string;
  location?: string;
  riskLevel: string;
  resolved: boolean;
  createdAt: string;
}

interface SecuritySettings {
  id: string;
  userId: string;
  twoFactorEnabled: boolean;
  twoFactorType?: string;
  passwordLastChanged?: string;
  sessionTimeout: number;
  deviceTrustEnabled: boolean;
  loginAlertsEnabled: boolean;
  accountLocked: boolean;
  lockoutUntil?: string;
  failedLoginAttempts: number;
  lastSecurityCheck?: string;
}

interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  manualEntryKey: string;
}

interface PasswordChangeForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function SecuritySettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Form states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<PasswordChangeForm>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  // 2FA states
  const [showTwoFactorSetup, setShowTwoFactorSetup] = useState(false);
  const [twoFactorSetupData, setTwoFactorSetupData] = useState<TwoFactorSetup | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  
  // Alert states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);
  const [loginAlerts, setLoginAlerts] = useState(true);
  const [transactionAlerts, setTransactionAlerts] = useState(true);

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch security settings
  const { data: securityData, isLoading } = useQuery({
    queryKey: ['/api/settings/security'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/settings/security', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch security settings');
      }
      return response.json();
    }
  });

  const securitySettings: SecuritySettings = securityData?.settings || {} as SecuritySettings;
  const loginSessions: LoginSession[] = securityData?.activeSessions || [];
  const securityEvents: SecurityEvent[] = securityData?.securityEvents || [];

  // Password change mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: PasswordChangeForm) => {
      const response = await fetch('/api/settings/security/password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to change password');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/security'] });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  });

  // 2FA setup mutation
  const setup2FAMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/security/2fa/setup', {
        method: 'POST',
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to setup 2FA');
      return response.json();
    },
    onSuccess: (data: TwoFactorSetup) => {
      setTwoFactorSetupData(data);
      setShowTwoFactorSetup(true);
    }
  });

  // 2FA verify mutation
  const verify2FAMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch('/api/settings/security/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify({ token }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to verify 2FA');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/security'] });
      setShowTwoFactorSetup(false);
      setTwoFactorSetupData(null);
      setVerificationCode('');
    }
  });

  // 2FA disable mutation
  const disable2FAMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await fetch('/api/settings/security/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to disable 2FA');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/security'] });
      setShowDisable2FA(false);
      setDisablePassword('');
    }
  });

  // Terminate session mutation
  const terminateSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      const response = await fetch(`/api/settings/security/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to terminate session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/security'] });
    }
  });

  const handlePasswordChange = () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      return;
    }
    changePasswordMutation.mutate(passwordForm);
  };

  const handleEnable2FA = () => {
    setup2FAMutation.mutate();
  };

  const handleVerify2FA = () => {
    if (!verificationCode || verificationCode.length !== 6) {
      return;
    }
    verify2FAMutation.mutate(verificationCode);
  };

  const handleDisable2FA = () => {
    if (!disablePassword) {
      return;
    }
    disable2FAMutation.mutate(disablePassword);
  };

  const handleTerminateSession = (sessionId: string) => {
    if (confirm('Are you sure you want to terminate this session?')) {
      terminateSessionMutation.mutate(sessionId);
    }
  };

  const formatTimeAgo = (timestamp: string | Date) => {
    const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading security settings...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
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
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
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
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
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
                      disabled={changePasswordMutation.isPending || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {changePasswordMutation.isPending ? (
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
                      {securitySettings.twoFactorEnabled ? (
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
                    {!securitySettings.twoFactorEnabled ? (
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
                                disabled={setup2FAMutation.isPending}
                                className="w-full bg-green-600 hover:bg-green-700 text-white"
                              >
                                {setup2FAMutation.isPending ? (
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

                        {/* 2FA Setup Modal */}
                        {showTwoFactorSetup && twoFactorSetupData && (
                          <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                              <CardTitle className="text-white">Set Up Two-Factor Authentication</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <div className="text-center">
                                <p className="text-gray-300 mb-4">
                                  Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                                </p>
                                <div className="bg-white p-4 rounded-lg inline-block">
                                  <img src={twoFactorSetupData.qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                </div>
                                <p className="text-sm text-gray-400 mt-4">
                                  Or enter this key manually: <code className="bg-white/10 px-2 py-1 rounded text-white">{twoFactorSetupData.manualEntryKey}</code>
                                </p>
                              </div>
                              
                              <div className="space-y-2">
                                <Label className="text-white">Enter the 6-digit code from your app</Label>
                                <Input
                                  value={verificationCode}
                                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                  className="bg-white/10 border-white/20 text-white text-center text-lg tracking-widest"
                                  placeholder="000000"
                                  maxLength={6}
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowTwoFactorSetup(false);
                                    setTwoFactorSetupData(null);
                                    setVerificationCode('');
                                  }}
                                  className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  onClick={handleVerify2FA}
                                  disabled={verify2FAMutation.isPending || verificationCode.length !== 6}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  {verify2FAMutation.isPending ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Verifying...
                                    </>
                                  ) : (
                                    'Verify & Enable'
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
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

                        <Button 
                          variant="destructive" 
                          className="w-full"
                          onClick={() => setShowDisable2FA(true)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Disable Two-Factor Authentication
                        </Button>

                        {/* Disable 2FA Modal */}
                        {showDisable2FA && (
                          <Card className="bg-white/5 border-white/10">
                            <CardHeader>
                              <CardTitle className="text-white">Disable Two-Factor Authentication</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                              <Alert className="bg-red-950/50 border-red-500/30">
                                <AlertTriangle className="h-4 w-4 text-red-400" />
                                <AlertDescription className="text-red-200">
                                  Disabling 2FA will make your account less secure. You'll only need your password to log in.
                                </AlertDescription>
                              </Alert>
                              
                              <div className="space-y-2">
                                <Label className="text-white">Enter your password to confirm</Label>
                                <Input
                                  type="password"
                                  value={disablePassword}
                                  onChange={(e) => setDisablePassword(e.target.value)}
                                  className="bg-white/10 border-white/20 text-white"
                                  placeholder="Enter your password"
                                />
                              </div>
                              
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    setShowDisable2FA(false);
                                    setDisablePassword('');
                                  }}
                                  className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleDisable2FA}
                                  disabled={disable2FAMutation.isPending || !disablePassword}
                                  className="flex-1"
                                >
                                  {disable2FAMutation.isPending ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Disabling...
                                    </>
                                  ) : (
                                    'Disable 2FA'
                                  )}
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}
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
                              <p className="font-medium text-white truncate">{session.deviceInfo}</p>
                              {session.sessionId === localStorage.getItem('sessionId') && (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-xs w-fit">
                                  Current Session
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                              {session.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 flex-shrink-0" />
                                  <span className="truncate">{session.location}</span>
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Globe className="h-3 w-3 flex-shrink-0" />
                                <span>{session.ipAddress}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3 flex-shrink-0" />
                                <span>{formatTimeAgo(session.lastUsed)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        {session.sessionId !== localStorage.getItem('sessionId') && (
                          <Button 
                            variant="destructive" 
                            size="sm"
                            onClick={() => handleTerminateSession(session.id)}
                            disabled={terminateSessionMutation.isPending}
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
                    {securityEvents.map((event) => (
                      <div key={event.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 bg-white/5 rounded-lg border border-white/10 gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            event.riskLevel === 'HIGH' || event.riskLevel === 'CRITICAL' ? 'bg-red-500/20' : 'bg-green-500/20'
                          }`}>
                            {event.riskLevel === 'HIGH' || event.riskLevel === 'CRITICAL' ? (
                              <AlertTriangle className="h-4 w-4 text-red-400" />
                            ) : (
                              <CheckCircle className="h-4 w-4 text-green-400" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white truncate">{event.description}</p>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm text-gray-400 mt-1">
                              <span>{formatTimeAgo(event.createdAt)}</span>
                              {event.ipAddress && <span className="truncate">{event.ipAddress}</span>}
                              {event.deviceInfo && <span className="truncate">{event.deviceInfo}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge 
                          className={`w-fit ${
                            event.riskLevel === 'CRITICAL' ? "bg-red-100 text-red-700 border-red-200" :
                            event.riskLevel === 'HIGH' ? "bg-orange-100 text-orange-700 border-orange-200" :
                            event.riskLevel === 'MEDIUM' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                            "bg-green-100 text-green-700 border-green-200"
                          }`}
                        >
                          {event.riskLevel}
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