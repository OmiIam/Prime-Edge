import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import {
  Eye,
  Shield,
  Download,
  Trash2,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Cookie,
  Database,
  Share2,
  FileDown,
  UserX,
  Lock,
  RefreshCw,
  ExternalLink
} from "lucide-react";

interface PrivacySettings {
  id: string;
  userId: string;
  marketingDataSharing: boolean;
  analyticsTracking: boolean;
  personalizationData: boolean;
  thirdPartySharing: boolean;
  dataRetentionPeriod: number; // in months
  allowCookies: boolean;
  functionalCookies: boolean;
  analyticsCookies: boolean;
  marketingCookies: boolean;
  createdAt: string;
  updatedAt: string;
}

interface DeleteAccountForm {
  password: string;
  reason: string;
  feedback: string;
  confirmText: string;
}

export default function PrivacyDataSettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Form states
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteForm, setDeleteForm] = useState<DeleteAccountForm>({
    password: '',
    reason: '',
    feedback: '',
    confirmText: ''
  });
  const [isExporting, setIsExporting] = useState(false);

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch privacy settings
  const { data: privacyData, isLoading } = useQuery({
    queryKey: ['/api/user/privacy'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/user/privacy', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch privacy settings');
      }
      return response.json();
    }
  });

  const privacySettings: PrivacySettings = privacyData?.settings || {} as PrivacySettings;

  // Update privacy settings
  const updatePrivacyMutation = useMutation({
    mutationFn: async (newSettings: Partial<PrivacySettings>) => {
      const response = await fetch('/api/user/privacy', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update privacy settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/privacy'] });
    }
  });

  // Export personal data
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/privacy/export', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to export data');
      return response.json();
    },
    onSuccess: (data) => {
      // Create and download JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `primeedge-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  });

  // Delete account
  const deleteAccountMutation = useMutation({
    mutationFn: async (formData: DeleteAccountForm) => {
      const response = await fetch('/api/user/account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify({
          password: formData.password,
          reason: formData.reason,
          feedback: formData.feedback
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete account');
      }
      return response.json();
    },
    onSuccess: () => {
      // Clear auth state and redirect
      authManager.logout();
    }
  });

  const handlePrivacyChange = (key: keyof PrivacySettings, value: boolean | number) => {
    updatePrivacyMutation.mutate({ [key]: value });
  };

  const handleExportData = () => {
    setIsExporting(true);
    exportDataMutation.mutate();
    setTimeout(() => setIsExporting(false), 2000);
  };

  const handleDeleteAccount = () => {
    if (deleteForm.confirmText !== 'DELETE MY ACCOUNT') {
      alert('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }
    if (!deleteForm.password) {
      alert('Password is required');
      return;
    }
    if (!deleteForm.reason) {
      alert('Please select a reason for account deletion');
      return;
    }
    
    deleteAccountMutation.mutate(deleteForm);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading privacy settings...</div>
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
        <div className="max-w-4xl mx-auto">
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
            
            <h1 className="text-3xl font-bold text-white mb-2">Privacy & Data</h1>
            <p className="text-blue-200">Manage your data sharing preferences and account controls</p>
          </div>

          <div className="space-y-6">
            {/* Data Sharing Preferences */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-purple-400" />
                  Data Sharing Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Marketing Data Sharing
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Allow us to use your data for personalized marketing</p>
                  </div>
                  <Switch
                    checked={privacySettings.marketingDataSharing || false}
                    onCheckedChange={(value) => handlePrivacyChange('marketingDataSharing', value)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Analytics Tracking
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Help improve our services through usage analytics</p>
                  </div>
                  <Switch
                    checked={privacySettings.analyticsTracking || false}
                    onCheckedChange={(value) => handlePrivacyChange('analyticsTracking', value)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Personalization Data
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Use your data to personalize your banking experience</p>
                  </div>
                  <Switch
                    checked={privacySettings.personalizationData !== false}
                    onCheckedChange={(value) => handlePrivacyChange('personalizationData', value)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Third-Party Sharing
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Share anonymized data with trusted partners</p>
                  </div>
                  <Switch
                    checked={privacySettings.thirdPartySharing || false}
                    onCheckedChange={(value) => handlePrivacyChange('thirdPartySharing', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Cookie Preferences */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Cookie className="h-5 w-5 text-orange-400" />
                  Cookie Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Essential Cookies
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Required for the website to function properly</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Functional Cookies
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Remember your preferences and settings</p>
                  </div>
                  <Switch
                    checked={privacySettings.functionalCookies !== false}
                    onCheckedChange={(value) => handlePrivacyChange('functionalCookies', value)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Analytics Cookies
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Help us understand how you use our website</p>
                  </div>
                  <Switch
                    checked={privacySettings.analyticsCookies || false}
                    onCheckedChange={(value) => handlePrivacyChange('analyticsCookies', value)}
                  />
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Marketing Cookies
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Show you relevant ads and measure campaign effectiveness</p>
                  </div>
                  <Switch
                    checked={privacySettings.marketingCookies || false}
                    onCheckedChange={(value) => handlePrivacyChange('marketingCookies', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Data Management */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Database className="h-5 w-5 text-cyan-400" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <FileDown className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Export Your Data</h3>
                        <p className="text-sm text-gray-400">Download all your personal data</p>
                      </div>
                    </div>
                    <Button 
                      onClick={handleExportData}
                      disabled={exportDataMutation.isPending || isExporting}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Preparing Export...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export Data
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Data Retention</h3>
                        <p className="text-sm text-gray-400">How long we keep your data</p>
                      </div>
                    </div>
                    <Select
                      value={privacySettings.dataRetentionPeriod?.toString() || "36"}
                      onValueChange={(value) => handlePrivacyChange('dataRetentionPeriod', parseInt(value))}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12">12 months</SelectItem>
                        <SelectItem value="24">24 months</SelectItem>
                        <SelectItem value="36">36 months</SelectItem>
                        <SelectItem value="60">60 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Alert className="bg-blue-950/50 border-blue-500/30">
                  <Shield className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    Your data is encrypted and stored securely. You can export or delete your data at any time.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Account Deletion */}
            <Card className="card-gradient border-red-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <UserX className="h-5 w-5 text-red-400" />
                  Account Deletion
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-red-950/50 border-red-500/30">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-200">
                    <strong>Warning:</strong> Deleting your account is permanent and cannot be undone. 
                    All your data, transactions, and settings will be permanently removed.
                  </AlertDescription>
                </Alert>

                <div className="text-gray-300 space-y-2">
                  <p><strong>Before deleting your account:</strong></p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Download any important statements or documents</li>
                    <li>Transfer any remaining balance to another account</li>
                    <li>Cancel any active subscriptions or recurring payments</li>
                    <li>Update your payment methods with other services</li>
                  </ul>
                </div>

                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-slate-900 border-red-500/30">
                    <DialogHeader>
                      <DialogTitle className="text-white">Delete Account</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Alert className="bg-red-950/50 border-red-500/30">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                        <AlertDescription className="text-red-200">
                          This action cannot be undone. Your account and all data will be permanently deleted.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label className="text-white">Password *</Label>
                        <Input
                          type="password"
                          value={deleteForm.password}
                          onChange={(e) => setDeleteForm(prev => ({ ...prev, password: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Enter your password"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Reason for deletion *</Label>
                        <Select
                          value={deleteForm.reason}
                          onValueChange={(value) => setDeleteForm(prev => ({ ...prev, reason: value }))}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="no-longer-needed">No longer needed</SelectItem>
                            <SelectItem value="switching-banks">Switching to another bank</SelectItem>
                            <SelectItem value="privacy-concerns">Privacy concerns</SelectItem>
                            <SelectItem value="poor-service">Poor service quality</SelectItem>
                            <SelectItem value="technical-issues">Technical issues</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Additional feedback (optional)</Label>
                        <Textarea
                          value={deleteForm.feedback}
                          onChange={(e) => setDeleteForm(prev => ({ ...prev, feedback: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Help us improve by sharing your feedback..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Type "DELETE MY ACCOUNT" to confirm *</Label>
                        <Input
                          value={deleteForm.confirmText}
                          onChange={(e) => setDeleteForm(prev => ({ ...prev, confirmText: e.target.value }))}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="DELETE MY ACCOUNT"
                        />
                      </div>

                      <div className="flex gap-2 pt-4">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowDeleteDialog(false);
                            setDeleteForm({ password: '', reason: '', feedback: '', confirmText: '' });
                          }}
                          className="flex-1 border-white/20 text-gray-300 hover:bg-white/10"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleDeleteAccount}
                          disabled={deleteAccountMutation.isPending}
                          className="flex-1"
                        >
                          {deleteAccountMutation.isPending ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Deleting...
                            </>
                          ) : (
                            <>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Account
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>

            {/* Privacy Links */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Eye className="h-5 w-5 text-indigo-400" />
                  Privacy Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button variant="outline" className="justify-start border-white/20 text-gray-300 hover:bg-white/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </Button>
                  <Button variant="outline" className="justify-start border-white/20 text-gray-300 hover:bg-white/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Terms of Service
                  </Button>
                  <Button variant="outline" className="justify-start border-white/20 text-gray-300 hover:bg-white/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Cookie Policy
                  </Button>
                  <Button variant="outline" className="justify-start border-white/20 text-gray-300 hover:bg-white/10">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Data Processing Agreement
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}