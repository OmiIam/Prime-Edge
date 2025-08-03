import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  Mail,
  Smartphone,
  Clock,
  Shield,
  DollarSign,
  FileText,
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Volume2,
  VolumeX,
  Moon,
  Sun
} from "lucide-react";

interface NotificationSettings {
  id: string;
  userId: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  loginAlerts: boolean;
  transactionAlerts: boolean;
  securityAlerts: boolean;
  marketingEmails: boolean;
  accountUpdates: boolean;
  statementReady: boolean;
  maintenanceAlerts: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  weekendNotifications: boolean;
}

export default function NotificationSettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch notification settings
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings/notifications'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/settings/notifications', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch notification settings');
      }
      return response.json();
    }
  });

  const settings: NotificationSettings = settingsData?.settings || {} as NotificationSettings;

  // Update notification settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<NotificationSettings>) => {
      const response = await fetch('/api/settings/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/notifications'] });
      setHasChanges(false);
    }
  });

  const handleSettingChange = (key: keyof NotificationSettings, value: boolean | string) => {
    updateSettingsMutation.mutate({ [key]: value });
    setHasChanges(true);
  };

  const handleTestNotification = async (type: string) => {
    try {
      const response = await fetch('/api/settings/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify({ type }),
      });
      
      if (response.ok) {
        // Show success message
        alert(`Test ${type} notification sent!`);
      }
    } catch (error) {
      console.error('Test notification failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading...</div>
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
            
            <h1 className="text-3xl font-bold text-white mb-2">Notifications & Alerts</h1>
            <p className="text-blue-200">Configure how and when you receive notifications</p>
          </div>

          {hasChanges && (
            <Alert className="mb-6 bg-blue-950/50 border-blue-500/30">
              <CheckCircle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                Changes are saved automatically
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Notification Channels */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-400" />
                  Notification Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Email Notifications
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Receive notifications via email</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('email')}
                      className="border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      Test
                    </Button>
                    <Switch
                      checked={settings?.emailNotifications || false}
                      onCheckedChange={(value) => handleSettingChange('emailNotifications', value)}
                    />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      SMS Notifications
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Receive notifications via text message</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('sms')}
                      className="border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      Test
                    </Button>
                    <Switch
                      checked={settings?.smsNotifications || false}
                      onCheckedChange={(value) => handleSettingChange('smsNotifications', value)}
                    />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Push Notifications
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Browser and mobile app notifications</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTestNotification('push')}
                      className="border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      Test
                    </Button>
                    <Switch
                      checked={settings?.pushNotifications || false}
                      onCheckedChange={(value) => handleSettingChange('pushNotifications', value)}
                    />
                  </div>
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      In-App Notifications
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Notifications within the banking app</p>
                  </div>
                  <Switch
                    checked={settings?.inAppNotifications || false}
                    onCheckedChange={(value) => handleSettingChange('inAppNotifications', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Alert Types */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                  Alert Types
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6">
                  {[
                    {
                      key: 'loginAlerts',
                      icon: Shield,
                      title: 'Login Alerts',
                      description: 'Get notified of new login attempts',
                      iconColor: 'text-blue-400'
                    },
                    {
                      key: 'transactionAlerts',
                      icon: DollarSign,
                      title: 'Transaction Alerts',
                      description: 'Notifications for account transactions',
                      iconColor: 'text-green-400'
                    },
                    {
                      key: 'securityAlerts',
                      icon: Shield,
                      title: 'Security Alerts',
                      description: 'Important security-related notifications',
                      iconColor: 'text-red-400'
                    },
                    {
                      key: 'accountUpdates',
                      icon: Bell,
                      title: 'Account Updates',
                      description: 'Changes to your account information',
                      iconColor: 'text-purple-400'
                    },
                    {
                      key: 'statementReady',
                      icon: FileText,
                      title: 'Statement Ready',
                      description: 'When monthly statements are available',
                      iconColor: 'text-orange-400'
                    },
                    {
                      key: 'maintenanceAlerts',
                      icon: AlertTriangle,
                      title: 'Maintenance Alerts',
                      description: 'System maintenance and downtime notices',
                      iconColor: 'text-yellow-400'
                    }
                  ].map((alert) => {
                    const IconComponent = alert.icon;
                    return (
                      <div key={alert.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                            <IconComponent className={`h-5 w-5 ${alert.iconColor}`} />
                          </div>
                          <div>
                            <Label className="text-white font-medium block">
                              {alert.title}
                            </Label>
                            <p className="text-sm text-gray-400">{alert.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={settings?.[alert.key as keyof NotificationSettings] as boolean || false}
                          onCheckedChange={(value) => handleSettingChange(alert.key as keyof NotificationSettings, value)}
                        />
                      </div>
                    );
                  })}
                </div>

                <Separator className="bg-white/10" />

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Marketing Emails
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Promotional offers and product updates</p>
                  </div>
                  <Switch
                    checked={settings?.marketingEmails || false}
                    onCheckedChange={(value) => handleSettingChange('marketingEmails', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Preferences */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-400" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Quiet Hours Start</Label>
                    <Select
                      value={settings?.quietHoursStart || "22:00"}
                      onValueChange={(value) => handleSettingChange('quietHoursStart', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Quiet Hours End</Label>
                    <Select
                      value={settings?.quietHoursEnd || "08:00"}
                      onValueChange={(value) => handleSettingChange('quietHoursEnd', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }, (_, i) => {
                          const hour = i.toString().padStart(2, '0');
                          return (
                            <SelectItem key={hour} value={`${hour}:00`}>
                              {hour}:00
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                  <div className="min-w-0 flex-1">
                    <Label className="text-white font-medium block">
                      Weekend Notifications
                    </Label>
                    <p className="text-sm text-gray-400 mt-1">Receive notifications on weekends</p>
                  </div>
                  <Switch
                    checked={settings?.weekendNotifications || false}
                    onCheckedChange={(value) => handleSettingChange('weekendNotifications', value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Bell className="h-5 w-5 text-blue-400" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4 border-white/20 hover:bg-white/10 text-white"
                    onClick={() => {
                      // Enable all important notifications
                      updateSettingsMutation.mutate({
                        loginAlerts: true,
                        transactionAlerts: true,
                        securityAlerts: true,
                        accountUpdates: true
                      });
                    }}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <Volume2 className="h-4 w-4 text-green-400" />
                        <span className="font-medium">Enable All Essential</span>
                      </div>
                      <p className="text-xs text-gray-400">Turn on important security and account alerts</p>
                    </div>
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start h-auto p-4 border-white/20 hover:bg-white/10 text-white"
                    onClick={() => {
                      // Disable all marketing
                      updateSettingsMutation.mutate({
                        marketingEmails: false,
                        weekendNotifications: false
                      });
                    }}
                  >
                    <div className="text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <VolumeX className="h-4 w-4 text-red-400" />
                        <span className="font-medium">Minimize Marketing</span>
                      </div>
                      <p className="text-xs text-gray-400">Reduce promotional notifications</p>
                    </div>
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