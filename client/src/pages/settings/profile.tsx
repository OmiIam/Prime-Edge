import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Save,
  Upload,
  Edit,
  Eye,
  EyeOff,
  Clock,
  Globe
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  dateOfBirth?: string;
  profileImage?: string;
  kycStatus: 'PENDING' | 'IN_REVIEW' | 'APPROVED' | 'REJECTED';
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
];

const COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'EG', name: 'Egypt' }
];

export default function ProfileSettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch user profile
  const { data: profileData, isLoading, error } = useQuery({
    queryKey: ['/api/settings/profile'],
    enabled: authState.isAuthenticated,
    retry: 3,
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      const response = await fetch('/api/settings/profile', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      return response.json();
    }
  });

  const profile: UserProfile = profileData?.user;

  // Initialize form data when profile loads
  useEffect(() => {
    if (profile && !isEditing) {
      setFormData({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || '',
        city: profile.city || '',
        state: profile.state || '',
        zipCode: profile.zipCode || '',
        country: profile.country || 'US',
        dateOfBirth: profile.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
      });
    }
  }, [profile, isEditing]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updatedData: Partial<UserProfile>) => {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(updatedData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/profile'] });
      // Update auth state with new user data
      authManager.updateUser(data.user);
      setIsEditing(false);
      setHasChanges(false);
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    }
  });

  // Verify email mutation
  const verifyEmailMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/profile/verify-email', {
        method: 'POST',
        headers: authManager.getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to send verification email');
      return response.json();
    }
  });

  // Verify phone mutation
  const verifyPhoneMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/settings/profile/verify-phone', {
        method: 'POST',
        headers: authManager.getAuthHeader()
      });
      
      if (!response.ok) throw new Error('Failed to send verification SMS');
      return response.json();
    }
  });

  const handleInputChange = (field: keyof UserProfile, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    // Validate required fields
    if (!formData.name?.trim()) {
      alert('Name is required');
      return;
    }

    updateProfileMutation.mutate(formData);
  };

  const handleCancel = () => {
    setFormData({
      name: profile?.name || '',
      phone: profile?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
      state: profile?.state || '',
      zipCode: profile?.zipCode || '',
      country: profile?.country || 'US',
      dateOfBirth: profile?.dateOfBirth ? profile.dateOfBirth.split('T')[0] : ''
    });
    setIsEditing(false);
    setHasChanges(false);
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return 'bg-green-100 text-green-700 border-green-200';
      case 'IN_REVIEW': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'REJECTED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getKycStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED': return <CheckCircle className="h-4 w-4" />;
      case 'IN_REVIEW': return <Clock className="h-4 w-4" />;
      case 'REJECTED': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading profile...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-4xl mx-auto">
            <Alert className="bg-red-950/50 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                Failed to load profile data. Please try again.
              </AlertDescription>
            </Alert>
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
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Profile & Personal Information</h1>
                <p className="text-blue-200">Manage your personal details and contact information</p>
              </div>
              
              <div className="flex items-center gap-3">
                {!isEditing ? (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      onClick={handleCancel}
                      className="border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={!hasChanges || updateProfileMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {updateProfileMutation.isError && (
            <Alert className="mb-6 bg-red-950/50 border-red-500/30">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200">
                {updateProfileMutation.error?.message || 'Failed to update profile'}
              </AlertDescription>
            </Alert>
          )}

          {updateProfileMutation.isSuccess && (
            <Alert className="mb-6 bg-green-950/50 border-green-500/30">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200">
                Profile updated successfully
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-6">
            {/* Profile Summary */}
            <Card className="card-gradient border-white/10">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row sm:items-center gap-6">
                  <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {profile?.name ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase() : 'U'}
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <h3 className="text-xl font-bold text-white">{profile?.name}</h3>
                      <div className="flex items-center gap-2">
                        <Badge className={getKycStatusColor(profile?.kycStatus || 'PENDING')}>
                          {getKycStatusIcon(profile?.kycStatus || 'PENDING')}
                          <span className="ml-1">{profile?.kycStatus?.replace('_', ' ')}</span>
                        </Badge>
                      </div>
                    </div>
                    
                    <p className="text-blue-200">{profile?.email}</p>
                    
                    <div className="flex flex-col sm:flex-row gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-blue-400" />
                        <span className="text-gray-300">
                          Email {profile?.emailVerified ? '(Verified)' : '(Unverified)'}
                        </span>
                        {profile?.emailVerified ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => verifyEmailMutation.mutate()}
                            disabled={verifyEmailMutation.isPending}
                            className="ml-2 h-6 px-2 text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                          >
                            {verifyEmailMutation.isPending ? 'Sending...' : 'Verify'}
                          </Button>
                        )}
                      </div>
                      
                      {profile?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-400" />
                          <span className="text-gray-300">
                            Phone {profile?.phoneVerified ? '(Verified)' : '(Unverified)'}
                          </span>
                          {profile?.phoneVerified ? (
                            <CheckCircle className="h-4 w-4 text-green-400" />
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => verifyPhoneMutation.mutate()}
                              disabled={verifyPhoneMutation.isPending}
                              className="ml-2 h-6 px-2 text-xs border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                            >
                              {verifyPhoneMutation.isPending ? 'Sending...' : 'Verify'}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      Member since {new Date(profile?.createdAt || '').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal Information */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-400" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white font-medium">Full Name *</Label>
                    {isEditing ? (
                      <Input
                        value={formData.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md text-white">
                        {profile?.name || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Email Address</Label>
                    <div className="p-3 bg-white/5 rounded-md text-gray-400 text-sm">
                      {profile?.email} (Cannot be changed)
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Phone Number</Label>
                    {isEditing ? (
                      <Input
                        value={formData.phone || ''}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="+1 (555) 123-4567"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md text-white">
                        {profile?.phone || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Date of Birth</Label>
                    {isEditing ? (
                      <Input
                        type="date"
                        value={formData.dateOfBirth || ''}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                        className="bg-white/10 border-white/20 text-white"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md text-white">
                        {profile?.dateOfBirth 
                          ? new Date(profile.dateOfBirth).toLocaleDateString()
                          : 'Not provided'
                        }
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Address Information */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-green-400" />
                  Address Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-white font-medium">Street Address</Label>
                  {isEditing ? (
                    <Input
                      value={formData.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                      placeholder="123 Main Street"
                    />
                  ) : (
                    <div className="p-3 bg-white/5 rounded-md text-white">
                      {profile?.address || 'Not provided'}
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-white font-medium">City</Label>
                    {isEditing ? (
                      <Input
                        value={formData.city || ''}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="San Francisco"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md text-white">
                        {profile?.city || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">State</Label>
                    {isEditing ? (
                      <Select
                        value={formData.state || ''}
                        onValueChange={(value) => handleInputChange('state', value)}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md text-white">
                        {profile?.state || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">ZIP Code</Label>
                    {isEditing ? (
                      <Input
                        value={formData.zipCode || ''}
                        onChange={(e) => handleInputChange('zipCode', e.target.value)}
                        className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        placeholder="94105"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md text-white">
                        {profile?.zipCode || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white font-medium">Country</Label>
                    {isEditing ? (
                      <Select
                        value={formData.country || 'US'}
                        onValueChange={(value) => handleInputChange('country', value)}
                      >
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="p-3 bg-white/5 rounded-md text-white">
                        {COUNTRIES.find(c => c.code === profile?.country)?.name || profile?.country || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Account Status */}
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Shield className="h-5 w-5 text-purple-400" />
                  Account Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Identity Verification</span>
                      <Badge className={getKycStatusColor(profile?.kycStatus || 'PENDING')}>
                        {getKycStatusIcon(profile?.kycStatus || 'PENDING')}
                        <span className="ml-1">{profile?.kycStatus?.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      {profile?.kycStatus === 'APPROVED' 
                        ? 'Your identity has been verified'
                        : profile?.kycStatus === 'IN_REVIEW'
                        ? 'Your documents are being reviewed'
                        : 'Complete identity verification to unlock all features'
                      }
                    </p>
                    {profile?.kycStatus !== 'APPROVED' && (
                      <Button
                        size="sm"
                        className="mt-3 bg-blue-600 hover:bg-blue-700"
                        onClick={() => setLocation('/kyc/submit')}
                      >
                        {profile?.kycStatus === 'PENDING' ? 'Start Verification' : 'View Status'}
                      </Button>
                    )}
                  </div>

                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Account Security</span>
                      <Badge className="bg-green-100 text-green-700 border-green-200">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Secure
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-400">
                      Your account has strong security protections enabled
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 border-white/20 text-gray-300 hover:bg-white/10"
                      onClick={() => setLocation('/settings/security')}
                    >
                      Security Settings
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