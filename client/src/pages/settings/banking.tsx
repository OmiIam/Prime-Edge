import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  DollarSign,
  ArrowUpDown,
  Building,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Smartphone,
  Globe,
  Users,
  Settings as SettingsIcon,
  Star,
  TrendingUp,
  PiggyBank,
  Wallet
} from "lucide-react";

interface PaymentMethod {
  id: string;
  type: 'CARD' | 'BANK_ACCOUNT' | 'DIGITAL_WALLET';
  name: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isVerified: boolean;
  provider?: string;
}

interface BankingPreferences {
  autoSaveEnabled: boolean;
  autoSavePercentage: number;
  overdraftProtection: boolean;
  lowBalanceAlerts: boolean;
  lowBalanceThreshold: number;
  monthlySpendingLimit?: number;
  internationalTransactions: boolean;
  mobilePayments: boolean;
  contactlessPayments: boolean;
  recurringTransfers: boolean;
}

interface TransferLimit {
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  amount: number;
  remaining: number;
}

export default function BankingServicesSettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [showCardNumber, setShowCardNumber] = useState<string | null>(null);
  const [addingPaymentMethod, setAddingPaymentMethod] = useState(false);

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch banking settings
  const { data: bankingData, isLoading } = useQuery({
    queryKey: ['/api/settings/banking'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/settings/banking', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch banking settings');
      }
      return response.json();
    }
  });

  const bankingSettings: BankingPreferences = bankingData?.settings || {} as BankingPreferences;
  const paymentMethods: PaymentMethod[] = bankingData?.paymentMethods || [];
  const transferLimits: TransferLimit[] = bankingData?.transferLimits || [];

  // Update banking settings
  const updateBankingMutation = useMutation({
    mutationFn: async (newSettings: Partial<BankingPreferences>) => {
      const response = await fetch('/api/settings/banking', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update banking settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/banking'] });
    }
  });

  const [preferences, setPreferences] = useState<BankingPreferences>({
    autoSaveEnabled: false,
    autoSavePercentage: 10,
    overdraftProtection: true,
    lowBalanceAlerts: true,
    lowBalanceThreshold: 100,
    monthlySpendingLimit: undefined,
    internationalTransactions: false,
    mobilePayments: true,
    contactlessPayments: true,
    recurringTransfers: false
  });

  // Update preferences state when banking settings load
  useEffect(() => {
    if (bankingSettings && Object.keys(bankingSettings).length > 0) {
      setPreferences({
        autoSaveEnabled: bankingSettings.autoSaveEnabled ?? false,
        autoSavePercentage: bankingSettings.autoSavePercentage ?? 10,
        overdraftProtection: bankingSettings.overdraftProtection ?? true,
        lowBalanceAlerts: bankingSettings.lowBalanceAlerts ?? true,
        lowBalanceThreshold: bankingSettings.lowBalanceThreshold ?? 100,
        monthlySpendingLimit: bankingSettings.monthlySpendingLimit,
        internationalTransactions: bankingSettings.internationalTransactions ?? false,
        mobilePayments: bankingSettings.mobilePayments ?? true,
        contactlessPayments: bankingSettings.contactlessPayments ?? true,
        recurringTransfers: bankingSettings.recurringTransfers ?? false
      });
    }
  }, [bankingSettings]);

  const handlePreferenceChange = (key: keyof BankingPreferences, value: boolean | number) => {
    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);
    updateBankingMutation.mutate(newPreferences);
  };

  // Set default payment method
  const setDefaultMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await fetch(`/api/settings/banking/payment-methods/${paymentMethodId}/default`, {
        method: 'PUT',
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to set default payment method');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/banking'] });
    }
  });

  // Delete payment method
  const deletePaymentMethodMutation = useMutation({
    mutationFn: async (paymentMethodId: string) => {
      const response = await fetch(`/api/settings/banking/payment-methods/${paymentMethodId}`, {
        method: 'DELETE',
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to delete payment method');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/banking'] });
    }
  });

  const handleSetDefault = (paymentMethodId: string) => {
    setDefaultMutation.mutate(paymentMethodId);
  };

  const handleDeletePaymentMethod = (paymentMethodId: string) => {
    if (confirm('Are you sure you want to delete this payment method?')) {
      deletePaymentMethodMutation.mutate(paymentMethodId);
    }
  };

  const getPaymentMethodIcon = (type: string) => {
    switch (type) {
      case 'CARD': return CreditCard;
      case 'BANK_ACCOUNT': return Building;
      case 'DIGITAL_WALLET': return Smartphone;
      default: return Wallet;
    }
  };

  const getProviderIcon = (provider: string) => {
    // In a real app, you'd have actual provider icons
    return provider.charAt(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading banking settings...</div>
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
            
            <h1 className="text-3xl font-bold text-white mb-2">Banking Services</h1>
            <p className="text-blue-200">Payment methods, transfers, and account preferences</p>
          </div>

          <div className="space-y-6">
            {/* Payment Methods */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-blue-400" />
                    Payment Methods
                  </CardTitle>
                  <Button
                    onClick={() => setAddingPaymentMethod(true)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Method
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {paymentMethods.map((method) => {
                  const IconComponent = getPaymentMethodIcon(method.type);
                  return (
                    <div key={method.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-white">{method.name}</h3>
                              {method.isDefault && (
                                <Badge className="bg-green-100 text-green-700 border-green-200">
                                  <Star className="h-3 w-3 mr-1" />
                                  Default
                                </Badge>
                              )}
                              {method.isVerified && (
                                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                              <span>
                                {method.provider} •••• {method.last4}
                              </span>
                              {method.expiryMonth && method.expiryYear && (
                                <span>
                                  Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {!method.isDefault && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSetDefault(method.id)}
                              className="border-white/20 text-gray-300 hover:bg-white/10"
                            >
                              Set Default
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-white/20 text-gray-300 hover:bg-white/10"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeletePaymentMethod(method.id)}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            {/* Transfer Limits */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ArrowUpDown className="h-5 w-5 text-green-400" />
                  Transfer Limits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-3 gap-6">
                  {transferLimits.map((limit) => (
                    <div key={limit.type} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="text-center">
                        <h3 className="font-semibold text-white mb-2">{limit.type}</h3>
                        <div className="space-y-2">
                          <div className="text-2xl font-bold text-green-400">
                            {formatCurrency(limit.remaining)}
                          </div>
                          <div className="text-sm text-gray-400">
                            of {formatCurrency(limit.amount)} remaining
                          </div>
                          <div className="w-full bg-white/10 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full"
                              style={{ width: `${(limit.remaining / limit.amount) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Alert className="mt-6 bg-blue-950/50 border-blue-500/30">
                  <AlertTriangle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    Transfer limits reset automatically. Contact support to request higher limits.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Banking Preferences */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-purple-400" />
                  Banking Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Auto Save */}
                <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <PiggyBank className="h-5 w-5 text-green-400" />
                      <div>
                        <Label className="text-white font-medium block">
                          Auto Save
                        </Label>
                        <p className="text-sm text-gray-400">Automatically save a percentage of deposits</p>
                      </div>
                    </div>
                    <Switch
                      checked={preferences.autoSaveEnabled}
                      onCheckedChange={(value) => handlePreferenceChange('autoSaveEnabled', value)}
                    />
                  </div>
                  
                  {preferences.autoSaveEnabled && (
                    <div className="space-y-2">
                      <Label className="text-white font-medium">Save Percentage</Label>
                      <div className="flex items-center gap-4">
                        <input
                          type="range"
                          min="1"
                          max="50"
                          value={preferences.autoSavePercentage}
                          onChange={(e) => handlePreferenceChange('autoSavePercentage', parseInt(e.target.value))}
                          className="flex-1"
                        />
                        <span className="text-white font-mono text-lg min-w-[3rem]">
                          {preferences.autoSavePercentage}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Account Protection */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Shield className="h-5 w-5 text-orange-400" />
                    Account Protection
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <Label className="text-white font-medium block">
                          Overdraft Protection
                        </Label>
                        <p className="text-sm text-gray-400">Prevent transactions that would overdraw your account</p>
                      </div>
                      <Switch
                        checked={preferences.overdraftProtection}
                        onCheckedChange={(value) => handlePreferenceChange('overdraftProtection', value)}
                      />
                    </div>

                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                        <div>
                          <Label className="text-white font-medium block">
                            Low Balance Alerts
                          </Label>
                          <p className="text-sm text-gray-400">Get notified when balance falls below threshold</p>
                        </div>
                        <Switch
                          checked={preferences.lowBalanceAlerts}
                          onCheckedChange={(value) => handlePreferenceChange('lowBalanceAlerts', value)}
                        />
                      </div>
                      
                      {preferences.lowBalanceAlerts && (
                        <div className="space-y-2">
                          <Label className="text-white font-medium">Alert Threshold</Label>
                          <Input
                            type="number"
                            value={preferences.lowBalanceThreshold}
                            onChange={(e) => handlePreferenceChange('lowBalanceThreshold', parseInt(e.target.value))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="100"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Spending Controls */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-cyan-400" />
                    Spending Controls
                  </h3>
                  
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-white font-medium block mb-2">
                          Monthly Spending Limit
                        </Label>
                        <Input
                          type="number"
                          value={preferences.monthlySpendingLimit || ''}
                          onChange={(e) => handlePreferenceChange('monthlySpendingLimit', parseInt(e.target.value) || undefined)}
                          className="bg-white/10 border-white/20 text-white"
                          placeholder="Enter amount (optional)"
                        />
                        <p className="text-sm text-gray-400 mt-1">Leave empty for no limit</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Features */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-indigo-400" />
                    Payment Features
                  </h3>
                  
                  <div className="grid gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <Label className="text-white font-medium block">
                          International Transactions
                        </Label>
                        <p className="text-sm text-gray-400">Allow transactions outside your home country</p>
                      </div>
                      <Switch
                        checked={preferences.internationalTransactions}
                        onCheckedChange={(value) => handlePreferenceChange('internationalTransactions', value)}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <Label className="text-white font-medium block">
                          Mobile Payments
                        </Label>
                        <p className="text-sm text-gray-400">Enable Apple Pay, Google Pay, and similar services</p>
                      </div>
                      <Switch
                        checked={preferences.mobilePayments}
                        onCheckedChange={(value) => handlePreferenceChange('mobilePayments', value)}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <Label className="text-white font-medium block">
                          Contactless Payments
                        </Label>
                        <p className="text-sm text-gray-400">Tap-to-pay and NFC transactions</p>
                      </div>
                      <Switch
                        checked={preferences.contactlessPayments}
                        onCheckedChange={(value) => handlePreferenceChange('contactlessPayments', value)}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white/5 rounded-lg border border-white/10">
                      <div>
                        <Label className="text-white font-medium block">
                          Recurring Transfers
                        </Label>
                        <p className="text-sm text-gray-400">Automatically schedule regular transfers</p>
                      </div>
                      <Switch
                        checked={preferences.recurringTransfers}
                        onCheckedChange={(value) => handlePreferenceChange('recurringTransfers', value)}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Services */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Building className="h-5 w-5 text-yellow-400" />
                  Account Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Request New Card</h3>
                        <p className="text-sm text-gray-400">Order replacement or additional cards</p>
                      </div>
                    </div>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      Request Card
                    </Button>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                        <DollarSign className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Credit Line Increase</h3>
                        <p className="text-sm text-gray-400">Request higher spending limits</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-white/20 text-gray-300 hover:bg-white/10">
                      Apply Now
                    </Button>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                        <Shield className="h-5 w-5 text-purple-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Fraud Protection</h3>
                        <p className="text-sm text-gray-400">Enhanced security monitoring</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-white/20 text-gray-300 hover:bg-white/10">
                      Learn More
                    </Button>
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                        <Users className="h-5 w-5 text-orange-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-white">Joint Account</h3>
                        <p className="text-sm text-gray-400">Share account access with family</p>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full border-white/20 text-gray-300 hover:bg-white/10">
                      Add User
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