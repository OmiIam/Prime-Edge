import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Settings,
  Globe,
  Clock,
  DollarSign,
  Calendar,
  Palette,
  Accessibility,
  Monitor,
  Smartphone,
  ArrowLeft,
  CheckCircle,
  Eye,
  Type,
  Volume2,
  Moon,
  Sun,
  Languages,
  AlertTriangle
} from "lucide-react";

interface UserSettings {
  id: string;
  userId: string;
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  theme: string;
  accessibility: any;
  dashboard: any;
}

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

const timezones = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'GMT (London)' },
  { value: 'Europe/Paris', label: 'CET (Paris)' },
  { value: 'Asia/Tokyo', label: 'JST (Tokyo)' },
  { value: 'Asia/Shanghai', label: 'CST (Shanghai)' },
  { value: 'Australia/Sydney', label: 'AEST (Sydney)' }
];

const currencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$', region: 'Americas' },
  { code: 'EUR', name: 'Euro', symbol: '€', region: 'Europe' },
  { code: 'GBP', name: 'British Pound', symbol: '£', region: 'Europe' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥', region: 'Asia' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', region: 'Americas' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', region: 'Oceania' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', region: 'Europe' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', region: 'Asia' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹', region: 'Asia' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', region: 'Asia' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$', region: 'Asia' },
  // African Currencies
  { code: 'ZAR', name: 'South African Rand', symbol: 'R', region: 'Africa' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦', region: 'Africa' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: '£E', region: 'Africa' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh', region: 'Africa' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: '₵', region: 'Africa' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh', region: 'Africa' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh', region: 'Africa' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br', region: 'Africa' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.', region: 'Africa' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P', region: 'Africa' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨', region: 'Africa' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA', region: 'Africa' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA', region: 'Africa' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج', region: 'Africa' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz', region: 'Africa' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'Fr', region: 'Africa' },
  { code: 'XPF', name: 'CFP Franc', symbol: '₣', region: 'Africa' },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC', region: 'Africa' },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj', region: 'Africa' },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk', region: 'Africa' },
  { code: 'SZL', name: 'Eswatini Lilangeni', symbol: 'L', region: 'Africa' },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D', region: 'Africa' },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'Fr', region: 'Africa' },
  { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$', region: 'Africa' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د', region: 'Africa' },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar', region: 'Africa' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK', region: 'Africa' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM', region: 'Africa' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT', region: 'Africa' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$', region: 'Africa' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'Fr', region: 'Africa' },
  { code: 'STN', name: 'São Tomé and Príncipe Dobra', symbol: 'Db', region: 'Africa' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨', region: 'Africa' },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le', region: 'Africa' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh', region: 'Africa' },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: '£', region: 'Africa' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.', region: 'Africa' },
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت', region: 'Africa' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK', region: 'Africa' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$', region: 'Africa' }
];

const dateFormats = [
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (12/31/2024)' },
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (31/12/2024)' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-12-31)' },
  { value: 'DD MMM YYYY', label: 'DD MMM YYYY (31 Dec 2024)' },
  { value: 'MMM DD, YYYY', label: 'MMM DD, YYYY (Dec 31, 2024)' }
];

const timeFormats = [
  { value: '12h', label: '12-hour (2:30 PM)' },
  { value: '24h', label: '24-hour (14:30)' }
];

export default function PreferencesSettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [hasChanges, setHasChanges] = useState(false);

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch user preferences
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings/preferences'],
    enabled: authState.isAuthenticated
  });

  const settings: UserSettings = settingsData?.settings || {} as UserSettings;

  // Update preferences
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<UserSettings>) => {
      const response = await fetch('/api/settings/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/preferences'] });
      setHasChanges(false);
    }
  });

  const handleSettingChange = (key: keyof UserSettings, value: string | boolean | any) => {
    updateSettingsMutation.mutate({ [key]: value });
    setHasChanges(true);
  };

  const handleAccessibilityChange = (key: string, value: boolean) => {
    const newAccessibility = {
      ...settings?.accessibility,
      [key]: value
    };
    handleSettingChange('accessibility', newAccessibility);
  };

  const handleDashboardChange = (key: string, value: any) => {
    const newDashboard = {
      ...settings?.dashboard,
      [key]: value
    };
    handleSettingChange('dashboard', newDashboard);
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
            
            <h1 className="text-3xl font-bold text-white mb-2">Account Preferences</h1>
            <p className="text-blue-200">Language, timezone, accessibility, and display settings</p>
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
            {/* Language & Region */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="h-5 w-5 text-blue-400" />
                  Language & Region
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Language</Label>
                    <Select
                      value={settings?.language || "en"}
                      onValueChange={(value) => handleSettingChange('language', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {languages.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>
                            <span className="flex items-center gap-2">
                              <span>{lang.flag}</span>
                              <span>{lang.name}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Timezone</Label>
                    <Select
                      value={settings?.timezone || "America/New_York"}
                      onValueChange={(value) => handleSettingChange('timezone', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timezones.map((tz) => (
                          <SelectItem key={tz.value} value={tz.value}>
                            {tz.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Format Preferences */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-green-400" />
                  Format Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Currency</Label>
                    <Select
                      value={settings?.currency || "USD"}
                      onValueChange={(value) => handleSettingChange('currency', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {currencies.map((curr) => (
                          <SelectItem key={curr.code} value={curr.code}>
                            <span className="flex items-center gap-2">
                              <span className="font-mono text-sm">{curr.symbol}</span>
                              <span>{curr.name}</span>
                              <span className="text-xs text-gray-500">({curr.region})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Date Format</Label>
                    <Select
                      value={settings?.dateFormat || "MM/DD/YYYY"}
                      onValueChange={(value) => handleSettingChange('dateFormat', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {dateFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Time Format</Label>
                    <Select
                      value={settings?.timeFormat || "12h"}
                      onValueChange={(value) => handleSettingChange('timeFormat', value)}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {timeFormats.map((format) => (
                          <SelectItem key={format.value} value={format.value}>
                            {format.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Palette className="h-5 w-5 text-purple-400" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'auto', label: 'Auto', icon: Monitor }
                    ].map((theme) => {
                      const IconComponent = theme.icon;
                      return (
                        <Button
                          key={theme.value}
                          variant={settings?.theme === theme.value ? "default" : "outline"}
                          className={`h-20 flex-col gap-2 ${
                            settings?.theme === theme.value 
                              ? 'bg-blue-600 text-white' 
                              : 'border-white/20 text-gray-300 hover:bg-white/10'
                          }`}
                          onClick={() => handleSettingChange('theme', theme.value)}
                        >
                          <IconComponent className="h-6 w-6" />
                          <span className="text-sm">{theme.label}</span>
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Accessibility */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Accessibility className="h-5 w-5 text-orange-400" />
                  Accessibility
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    key: 'highContrast',
                    title: 'High Contrast Mode',
                    description: 'Increase contrast for better visibility',
                    icon: Eye
                  },
                  {
                    key: 'largeText',
                    title: 'Large Text',
                    description: 'Increase font size throughout the application',
                    icon: Type
                  },
                  {
                    key: 'reduceMotion',
                    title: 'Reduce Motion',
                    description: 'Minimize animations and transitions',
                    icon: Monitor
                  },
                  {
                    key: 'screenReader',
                    title: 'Screen Reader Support',
                    description: 'Enhanced support for screen readers',
                    icon: Volume2
                  }
                ].map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <div key={option.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-orange-400" />
                        </div>
                        <div>
                          <Label className="text-white font-medium block">
                            {option.title}
                          </Label>
                          <p className="text-sm text-gray-400">{option.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={settings?.accessibility?.[option.key] || false}
                        onCheckedChange={(value) => handleAccessibilityChange(option.key, value)}
                      />
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Dashboard Preferences */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Monitor className="h-5 w-5 text-cyan-400" />
                  Dashboard Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  {
                    key: 'showBalance',
                    title: 'Show Account Balance',
                    description: 'Display account balance on dashboard'
                  },
                  {
                    key: 'showRecentTransactions',
                    title: 'Show Recent Transactions',
                    description: 'Display recent transaction history'
                  },
                  {
                    key: 'showQuickActions',
                    title: 'Show Quick Actions',
                    description: 'Display quick action buttons'
                  },
                  {
                    key: 'showInsights',
                    title: 'Show Financial Insights',
                    description: 'Display spending insights and analytics'
                  },
                  {
                    key: 'compactView',
                    title: 'Compact View',
                    description: 'Use a more compact dashboard layout'
                  }
                ].map((option) => (
                  <div key={option.key} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-2">
                    <div className="min-w-0 flex-1">
                      <Label className="text-white font-medium block">
                        {option.title}
                      </Label>
                      <p className="text-sm text-gray-400 mt-1">{option.description}</p>
                    </div>
                    <Switch
                      checked={settings?.dashboard?.[option.key] !== false}
                      onCheckedChange={(value) => handleDashboardChange(option.key, value)}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Reset Options */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-red-400" />
                  Reset Options
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Alert className="bg-yellow-950/50 border-yellow-500/30">
                    <AlertTriangle className="h-4 w-4 text-yellow-400" />
                    <AlertDescription className="text-yellow-200">
                      Reset options will restore settings to their default values. This action cannot be undone.
                    </AlertDescription>
                  </Alert>

                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      variant="outline"
                      className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        updateSettingsMutation.mutate({
                          language: 'en',
                          timezone: 'America/New_York',
                          currency: 'USD',
                          dateFormat: 'MM/DD/YYYY',
                          timeFormat: '12h',
                          theme: 'auto'
                        });
                      }}
                    >
                      Reset to Defaults
                    </Button>

                    <Button
                      variant="outline"
                      className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                      onClick={() => {
                        handleAccessibilityChange('highContrast', false);
                        handleAccessibilityChange('largeText', false);
                        handleAccessibilityChange('reduceMotion', false);
                        handleAccessibilityChange('screenReader', false);
                      }}
                    >
                      Reset Accessibility
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}