import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Camera, 
  Save, 
  AlertTriangle,
  CheckCircle,
  Shield,
  Bell,
  CreditCard,
  Settings,
  Trash2,
  Edit3,
  Upload,
  X
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  avatar?: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  preferences: {
    language: string;
    timezone: string;
    currency: string;
  };
  accountType: 'CHECKING' | 'SAVINGS' | 'BUSINESS';
  isActive: boolean;
  lastLogin: Date;
  createdAt: Date;
}

export default function ProfileSettings() {
  const [, setLocation] = useLocation();
  const authState = authManager.getState();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);

  // Mock user profile - in real app would come from API
  const [profile, setProfile] = useState<UserProfile>({
    id: "user_123",
    name: authState.user?.name || "John Doe",
    email: authState.user?.email || "john.doe@example.com",
    phone: "+1 (938) 271-8041",
    dateOfBirth: "1990-05-15",
    address: {
      street: "123 Main Street",
      city: "San Francisco",
      state: "CA",
      zipCode: "94105",
      country: "United States"
    },
    avatar: undefined,
    kycStatus: 'verified',
    preferences: {
      language: 'en',
      timezone: 'America/Los_Angeles',
      currency: 'USD'
    },
    accountType: 'CHECKING',
    isActive: true,
    lastLogin: new Date(),
    createdAt: new Date('2023-01-15')
  });

  const [editForm, setEditForm] = useState(profile);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-8">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-6">Please sign in to access your profile settings.</p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please choose an image smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please choose an image file.",
        variant: "destructive",
      });
      return;
    }

    setAvatarFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setAvatarPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Upload avatar if changed
      if (avatarFile) {
        // In real app, would upload to cloud storage
        console.log('Uploading avatar:', avatarFile);
      }
      
      // Update profile
      setProfile(editForm);
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeactivateAccount = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Account deactivation requested",
        description: "You will receive an email confirmation within 24 hours.",
      });
      
      setShowDeactivateDialog(false);
    } catch (error) {
      toast({
        title: "Deactivation failed",
        description: "Failed to process deactivation request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getKycStatusColor = (status: UserProfile['kycStatus']) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
    }
  };

  const getKycStatusIcon = (status: UserProfile['kycStatus']) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'pending': return AlertTriangle;
      case 'rejected': return X;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Profile Settings</h1>
                <p className="text-gray-300">Manage your personal information and preferences</p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-1.5 shadow-lg">
              <TabsTrigger value="profile" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <User className="h-4 w-4 mr-2" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="preferences" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Settings className="h-4 w-4 mr-2" />
                Preferences
              </TabsTrigger>
              <TabsTrigger value="security" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
              <TabsTrigger value="account" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                <CreditCard className="h-4 w-4 mr-2" />
                Account
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile">
              <div className="space-y-6">
                {/* Profile Overview Card */}
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-gray-900">
                        Personal Information
                      </CardTitle>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditing(!isEditing);
                          setEditForm(profile);
                          setAvatarPreview(null);
                          setAvatarFile(null);
                        }}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        {isEditing ? 'Cancel' : 'Edit Profile'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center overflow-hidden shadow-lg">
                          {avatarPreview || profile.avatar ? (
                            <img 
                              src={avatarPreview || profile.avatar} 
                              alt="Profile avatar"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="h-12 w-12 text-blue-600" />
                          )}
                        </div>
                        {isEditing && (
                          <div className="absolute -bottom-2 -right-2">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarChange}
                              className="hidden"
                              id="avatar-upload"
                            />
                            <label
                              htmlFor="avatar-upload"
                              className="w-8 h-8 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center cursor-pointer shadow-lg transition-colors"
                            >
                              <Camera className="h-4 w-4 text-white" />
                            </label>
                          </div>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {profile.name}
                        </h3>
                        <p className="text-gray-600 mb-2">{profile.email}</p>
                        <div className="flex items-center gap-2">
                          <Badge className={getKycStatusColor(profile.kycStatus)}>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            {profile.kycStatus.toUpperCase()}
                          </Badge>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            {profile.accountType}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Profile Form */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
                          <Input
                            id="name"
                            value={isEditing ? editForm.name : profile.name}
                            onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email" className="text-gray-700 font-medium">Email Address</Label>
                          <Input
                            id="email"
                            type="email"
                            value={isEditing ? editForm.email : profile.email}
                            onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                          <Input
                            id="phone"
                            value={isEditing ? editForm.phone : profile.phone}
                            onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="dob" className="text-gray-700 font-medium">Date of Birth</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={isEditing ? editForm.dateOfBirth : profile.dateOfBirth}
                            onChange={(e) => setEditForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="street" className="text-gray-700 font-medium">Street Address</Label>
                          <Input
                            id="street"
                            value={isEditing ? editForm.address.street : profile.address.street}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              address: { ...prev.address, street: e.target.value }
                            }))}
                            disabled={!isEditing}
                            className="mt-1"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="city" className="text-gray-700 font-medium">City</Label>
                            <Input
                              id="city"
                              value={isEditing ? editForm.address.city : profile.address.city}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                address: { ...prev.address, city: e.target.value }
                              }))}
                              disabled={!isEditing}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="state" className="text-gray-700 font-medium">State</Label>
                            <Input
                              id="state"
                              value={isEditing ? editForm.address.state : profile.address.state}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                address: { ...prev.address, state: e.target.value }
                              }))}
                              disabled={!isEditing}
                              className="mt-1"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="zipCode" className="text-gray-700 font-medium">ZIP Code</Label>
                            <Input
                              id="zipCode"
                              value={isEditing ? editForm.address.zipCode : profile.address.zipCode}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                address: { ...prev.address, zipCode: e.target.value }
                              }))}
                              disabled={!isEditing}
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="country" className="text-gray-700 font-medium">Country</Label>
                            <Input
                              id="country"
                              value={isEditing ? editForm.address.country : profile.address.country}
                              onChange={(e) => setEditForm(prev => ({
                                ...prev,
                                address: { ...prev.address, country: e.target.value }
                              }))}
                              disabled={!isEditing}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="flex gap-4 pt-4 border-t border-gray-200">
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isLoading}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditForm(profile);
                            setAvatarPreview(null);
                            setAvatarFile(null);
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* KYC Status Card */}
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          profile.kycStatus === 'verified' ? 'bg-green-100' : 
                          profile.kycStatus === 'pending' ? 'bg-yellow-100' : 'bg-red-100'
                        }`}>
                          {(() => {
                            const StatusIcon = getKycStatusIcon(profile.kycStatus);
                            return <StatusIcon className={`h-6 w-6 ${
                              profile.kycStatus === 'verified' ? 'text-green-600' :
                              profile.kycStatus === 'pending' ? 'text-yellow-600' : 'text-red-600'
                            }`} />;
                          })()}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">Identity Verification</h3>
                          <p className="text-sm text-gray-600">
                            {profile.kycStatus === 'verified' && 'Your identity has been verified'}
                            {profile.kycStatus === 'pending' && 'Verification in progress'}
                            {profile.kycStatus === 'rejected' && 'Verification requires attention'}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setLocation("/kyc/submit")}
                      >
                        {profile.kycStatus === 'verified' ? 'View Details' : 'Complete Verification'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Account Preferences
                  </CardTitle>
                  <p className="text-gray-600">
                    Customize your banking experience
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <div>
                      <Label htmlFor="language" className="text-gray-700 font-medium">Language</Label>
                      <Select value={profile.preferences.language}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timezone" className="text-gray-700 font-medium">Timezone</Label>
                      <Select value={profile.preferences.timezone}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                          <SelectItem value="America/Denver">Mountain Time</SelectItem>
                          <SelectItem value="America/Chicago">Central Time</SelectItem>
                          <SelectItem value="America/New_York">Eastern Time</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="currency" className="text-gray-700 font-medium">Currency</Label>
                      <Select value={profile.preferences.currency}>
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="USD">USD ($)</SelectItem>
                          <SelectItem value="EUR">EUR (€)</SelectItem>
                          <SelectItem value="GBP">GBP (£)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="space-y-6">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Security Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">Password</h3>
                        <p className="text-sm text-gray-600">Last changed 30 days ago</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => setLocation("/settings/security")}
                      >
                        Change Password
                      </Button>
                    </div>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <h3 className="font-semibold text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-600">Add an extra layer of security</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => setLocation("/settings/security")}
                      >
                        Setup 2FA
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Account Tab */}
            <TabsContent value="account">
              <div className="space-y-6">
                {/* Account Information */}
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Account Type</Label>
                          <p className="mt-1 text-gray-900">{profile.accountType}</p>
                        </div>
                        <div>
                          <Label className="text-gray-700 font-medium">Member Since</Label>
                          <p className="mt-1 text-gray-900">{profile.createdAt.toDateString()}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <Label className="text-gray-700 font-medium">Account Status</Label>
                          <p className="mt-1">
                            <Badge className="bg-green-100 text-green-700 border-green-200">
                              Active
                            </Badge>
                          </p>
                        </div>
                        <div>
                          <Label className="text-gray-700 font-medium">Last Login</Label>
                          <p className="mt-1 text-gray-900">{profile.lastLogin.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="bg-red-50 border-red-200 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-red-900">
                      Danger Zone
                    </CardTitle>
                    <p className="text-red-700">
                      These actions are permanent and cannot be undone.
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-red-900">Deactivate Account</h3>
                        <p className="text-sm text-red-700">
                          Permanently disable your account and all associated services.
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        onClick={() => setShowDeactivateDialog(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Deactivate
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Deactivate Account Dialog */}
          {showDeactivateDialog && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <Card className="max-w-md w-full bg-white">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-red-900">
                    Deactivate Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      <strong>Warning:</strong> This action cannot be undone. Your account and all associated data will be permanently deleted.
                    </AlertDescription>
                  </Alert>
                  <p className="text-gray-600">
                    Are you sure you want to deactivate your account? This will:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1 ml-4">
                    <li>• Close all open accounts</li>
                    <li>• Delete all transaction history</li>
                    <li>• Remove access to all services</li>
                    <li>• Cancel any pending transactions</li>
                  </ul>
                  <div className="flex gap-4 pt-4">
                    <Button
                      variant="destructive"
                      onClick={handleDeactivateAccount}
                      disabled={isLoading}
                      className="flex-1"
                    >
                      {isLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      Confirm Deactivation
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeactivateDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}