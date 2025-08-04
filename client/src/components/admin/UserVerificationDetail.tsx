import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authManager } from "@/lib/auth";
import {
  User,
  Shield,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  DollarSign,
  FileText,
  IdCard,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Flag,
  Eye,
  Download,
  Globe,
  Heart,
  Briefcase,
  CreditCard,
  ArrowLeft,
  AlertCircle
} from "lucide-react";

interface UserVerificationDetailProps {
  userId: string;
  onClose: () => void;
}

interface UserVerificationData {
  user: {
    id: string;
    name: string;
    email: string;
    firstName?: string;
    middleName?: string;
    lastName?: string;
    
    // Contact Information
    phone?: string;
    alternatePhone?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
    
    // Personal Information
    dateOfBirth?: string;
    placeOfBirth?: string;
    nationality?: string;
    gender?: string;
    maritalStatus?: string;
    
    // Employment Information
    employmentStatus?: string;
    employer?: string;
    jobTitle?: string;
    annualIncome?: string;
    sourceOfFunds?: string;
    
    // Verification Status
    kycStatus: string;
    emailVerified: boolean;
    phoneVerified: boolean;
    addressVerified: boolean;
    identityVerified: boolean;
    incomeVerified: boolean;
    
    // Risk & Compliance
    riskLevel: string;
    isPep: boolean;
    sanctionsCheck?: string;
    
    // Timestamps
    createdAt: string;
    updatedAt: string;
  };
  verificationRequests: Array<{
    id: string;
    requestType: string;
    status: string;
    priority: string;
    requestedAt: string;
    completedAt?: string;
    completedBy?: string;
    adminNotes?: string;
  }>;
  verificationHistory: Array<{
    id: string;
    verificationType: string;
    action: string;
    previousStatus: string;
    newStatus: string;
    notes?: string;
    riskAssessment?: string;
    createdAt: string;
    admin: {
      name: string;
      email: string;
    };
  }>;
  documents: Array<{
    id: string;
    type: string;
    filename: string;
    uploadedAt: string;
    verified: boolean;
    verifiedAt?: string;
    verifiedBy?: string;
    expiresAt?: string;
  }>;
  addressHistory: Array<{
    id: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    startDate: string;
    endDate?: string;
    isCurrentAddress: boolean;
  }>;
}

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  IN_REVIEW: 'bg-blue-100 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  REQUIRES_ADDITIONAL_INFO: 'bg-orange-100 text-orange-700 border-orange-200'
};

const RISK_COLORS = {
  LOW: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  CRITICAL: 'bg-red-100 text-red-700 border-red-200'
};

export default function UserVerificationDetail({ userId, onClose }: UserVerificationDetailProps) {
  const queryClient = useQueryClient();
  const [selectedDocument, setSelectedDocument] = useState<string | null>(null);

  // Fetch detailed user verification data
  const { data: verificationData, isLoading, error } = useQuery({
    queryKey: [`/api/admin/users/${userId}/verification-details`],
    queryFn: async () => {
      const response = await fetch(`/api/admin/users/${userId}/verification-details`, {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch user verification details');
      return response.json();
    }
  });

  // Create manual verification request
  const createVerificationMutation = useMutation({
    mutationFn: async (data: { verificationType: string; priority: string; notes?: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/create-verification-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create verification request');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/verification-details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications/queue'] });
    }
  });

  // Bulk verify user
  const bulkVerifyMutation = useMutation({
    mutationFn: async (data: { verifications: string[]; notes?: string }) => {
      const response = await fetch(`/api/admin/users/${userId}/bulk-verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to bulk verify user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/users/${userId}/verification-details`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications/stats'] });
    }
  });

  const userData: UserVerificationData = verificationData || {
    user: {},
    verificationRequests: [],
    verificationHistory: [],
    documents: [],
    addressHistory: []
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getVerificationStatus = (type: string) => {
    switch (type) {
      case 'EMAIL': return userData.user.emailVerified;
      case 'PHONE': return userData.user.phoneVerified;
      case 'ADDRESS': return userData.user.addressVerified;
      case 'IDENTITY': return userData.user.identityVerified;
      case 'INCOME': return userData.user.incomeVerified;
      default: return false;
    }
  };

  const handleBulkVerify = () => {
    const unverifiedTypes = ['EMAIL', 'PHONE', 'ADDRESS', 'IDENTITY', 'INCOME']
      .filter(type => !getVerificationStatus(type));
    
    if (unverifiedTypes.length > 0) {
      bulkVerifyMutation.mutate({
        verifications: unverifiedTypes,
        notes: 'Bulk verification approved by admin'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 bg-white">
          <CardContent className="p-8 text-center">
            <div className="text-lg">Loading user verification details...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-4xl mx-4 bg-white">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">Failed to load user verification details</p>
            <Button onClick={onClose}>Close</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-7xl bg-white max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">
                  User Verification Review
                </CardTitle>
                <p className="text-gray-600 mt-1">{userData.user.name} ({userData.user.email})</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge className={RISK_COLORS[userData.user.riskLevel as keyof typeof RISK_COLORS] || 'bg-gray-100 text-gray-700'}>
                Risk: {userData.user.riskLevel}
              </Badge>
              <Badge className={STATUS_COLORS[userData.user.kycStatus as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-700'}>
                KYC: {userData.user.kycStatus?.replace('_', ' ')}
              </Badge>
              {userData.user.isPep && (
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  PEP
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="overview" className="h-full flex flex-col">
            <TabsList className="flex-shrink-0 grid w-full grid-cols-5 bg-gray-50 border-b">
              <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
              <TabsTrigger value="personal" className="data-[state=active]:bg-white">Personal Info</TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-white">Documents</TabsTrigger>
              <TabsTrigger value="history" className="data-[state=active]:bg-white">History</TabsTrigger>
              <TabsTrigger value="actions" className="data-[state=active]:bg-white">Actions</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto p-6">
              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Verification Status */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-500" />
                        Verification Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[
                        { type: 'EMAIL', label: 'Email Verification', icon: Mail, verified: userData.user.emailVerified },
                        { type: 'PHONE', label: 'Phone Verification', icon: Phone, verified: userData.user.phoneVerified },
                        { type: 'ADDRESS', label: 'Address Verification', icon: MapPin, verified: userData.user.addressVerified },
                        { type: 'IDENTITY', label: 'Identity Verification', icon: User, verified: userData.user.identityVerified },
                        { type: 'INCOME', label: 'Income Verification', icon: DollarSign, verified: userData.user.incomeVerified }
                      ].map(({ type, label, icon: Icon, verified }) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 text-gray-600" />
                            <span className="font-medium">{label}</span>
                          </div>
                          {verified ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Quick Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-orange-500" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <Button 
                        onClick={handleBulkVerify}
                        disabled={bulkVerifyMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {bulkVerifyMutation.isPending ? 'Verifying...' : 'Approve All Verifications'}
                      </Button>
                      
                      <Button 
                        onClick={() => createVerificationMutation.mutate({
                          verificationType: 'FULL_KYC',
                          priority: 'HIGH',
                          notes: 'Full KYC review requested by admin'
                        })}
                        disabled={createVerificationMutation.isPending}
                        variant="outline"
                        className="w-full"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Request Full KYC Review
                      </Button>
                      
                      <Button variant="outline" className="w-full">
                        <FileText className="h-4 w-4 mr-2" />
                        Generate Report
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Verification Requests */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      Recent Verification Requests
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.verificationRequests.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No verification requests found</p>
                    ) : (
                      <div className="space-y-3">
                        {userData.verificationRequests.slice(0, 5).map((request) => (
                          <div key={request.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div>
                              <div className="font-medium">{request.requestType.replace('_', ' ')}</div>
                              <div className="text-sm text-gray-600">
                                Requested: {formatDate(request.requestedAt)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>
                                {request.status.replace('_', ' ')}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {request.priority}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-500" />
                        Basic Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Full Name:</span>
                          <p className="text-gray-900">{userData.user.name || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Email:</span>
                          <p className="text-gray-900">{userData.user.email}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Phone:</span>
                          <p className="text-gray-900">{userData.user.phone || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Date of Birth:</span>
                          <p className="text-gray-900">{userData.user.dateOfBirth ? new Date(userData.user.dateOfBirth).toLocaleDateString() : 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Gender:</span>
                          <p className="text-gray-900">{userData.user.gender || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Nationality:</span>
                          <p className="text-gray-900">{userData.user.nationality || 'Not provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Address Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-500" />
                        Address Information
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium text-gray-600">Address:</span>
                          <p className="text-gray-900">{userData.user.address || 'Not provided'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium text-gray-600">City:</span>
                            <p className="text-gray-900">{userData.user.city || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">State:</span>
                            <p className="text-gray-900">{userData.user.state || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">ZIP Code:</span>
                            <p className="text-gray-900">{userData.user.zipCode || 'Not provided'}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-600">Country:</span>
                            <p className="text-gray-900">{userData.user.country || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Employment Information */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-purple-500" />
                        Employment & Financial
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600">Employment Status:</span>
                          <p className="text-gray-900">{userData.user.employmentStatus || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Employer:</span>
                          <p className="text-gray-900">{userData.user.employer || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Job Title:</span>
                          <p className="text-gray-900">{userData.user.jobTitle || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Annual Income:</span>
                          <p className="text-gray-900">{userData.user.annualIncome || 'Not provided'}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Source of Funds:</span>
                          <p className="text-gray-900">{userData.user.sourceOfFunds || 'Not provided'}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Risk Assessment */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-500" />
                        Risk Assessment
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-600">Risk Level:</span>
                          <Badge className={RISK_COLORS[userData.user.riskLevel as keyof typeof RISK_COLORS]}>
                            {userData.user.riskLevel}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-600">PEP Status:</span>
                          <Badge className={userData.user.isPep ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}>
                            {userData.user.isPep ? 'Yes' : 'No'}
                          </Badge>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600">Sanctions Check:</span>
                          <p className="text-gray-900 mt-1">{userData.user.sanctionsCheck || 'Not performed'}</p>
                        </div>
                        <div className="text-xs text-gray-500 mt-3">
                          Last Updated: {formatDate(userData.user.updatedAt)}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Documents Tab */}
              <TabsContent value="documents" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-500" />
                      Uploaded Documents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No documents uploaded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userData.documents.map((doc) => (
                          <div key={doc.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <div className="font-medium">{doc.type.replace('_', ' ')}</div>
                                <div className="text-sm text-gray-600">{doc.filename}</div>
                                <div className="text-xs text-gray-500">
                                  Uploaded: {formatDate(doc.uploadedAt)}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {doc.verified ? (
                                <Badge className="bg-green-100 text-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge className="bg-yellow-100 text-yellow-700">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              <Button size="sm" variant="outline">
                                <Download className="h-4 w-4 mr-1" />
                                View
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Address History */}
                {userData.addressHistory.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-green-500" />
                        Address History
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {userData.addressHistory.map((address) => (
                          <div key={address.id} className="p-4 border border-gray-200 rounded-lg">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">
                                  {address.address}, {address.city}, {address.state} {address.zipCode}
                                </div>
                                <div className="text-sm text-gray-600">{address.country}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {formatDate(address.startDate)} - {address.endDate ? formatDate(address.endDate) : 'Present'}
                                </div>
                              </div>
                              {address.isCurrentAddress && (
                                <Badge className="bg-blue-100 text-blue-700">Current</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* History Tab */}
              <TabsContent value="history" className="space-y-6 mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-purple-500" />
                      Verification History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {userData.verificationHistory.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">No verification history found</p>
                    ) : (
                      <div className="space-y-4">
                        {userData.verificationHistory.map((entry) => (
                          <div key={entry.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {entry.verificationType.replace('_', ' ')} - {entry.action}
                                </div>
                                <div className="text-sm text-gray-600">
                                  by {entry.admin.name}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatDate(entry.createdAt)}
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Badge className={STATUS_COLORS[entry.previousStatus as keyof typeof STATUS_COLORS]}>
                                  {entry.previousStatus}
                                </Badge>
                                <span className="text-gray-400">→</span>
                                <Badge className={STATUS_COLORS[entry.newStatus as keyof typeof STATUS_COLORS]}>
                                  {entry.newStatus}
                                </Badge>
                              </div>
                            </div>
                            
                            {entry.notes && (
                              <div className="mt-3 p-3 bg-gray-50 rounded">
                                <div className="text-sm font-medium text-gray-700 mb-1">Notes:</div>
                                <div className="text-sm text-gray-600">{entry.notes}</div>
                              </div>
                            )}
                            
                            {entry.riskAssessment && (
                              <div className="mt-3 p-3 bg-yellow-50 rounded">
                                <div className="text-sm font-medium text-yellow-700 mb-1">Risk Assessment:</div>
                                <div className="text-sm text-yellow-600">{entry.riskAssessment}</div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Actions Tab */}
              <TabsContent value="actions" className="space-y-6 mt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Create Verification Request */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Flag className="h-5 w-5 text-orange-500" />
                        Create Verification Request
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {['IDENTITY', 'ADDRESS', 'INCOME', 'EMAIL', 'PHONE', 'FULL_KYC'].map((type) => (
                        <Button
                          key={type}
                          onClick={() => createVerificationMutation.mutate({
                            verificationType: type,
                            priority: 'NORMAL',
                            notes: `${type.replace('_', ' ')} verification requested by admin`
                          })}
                          disabled={createVerificationMutation.isPending}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Request {type.replace('_', ' ')} Verification
                        </Button>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Admin Actions */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Shield className="h-5 w-5 text-red-500" />
                        Administrative Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          These actions will create audit trail entries and may affect the user's account status.
                        </AlertDescription>
                      </Alert>
                      
                      <Button
                        onClick={handleBulkVerify}
                        disabled={bulkVerifyMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {bulkVerifyMutation.isPending ? 'Processing...' : 'Approve All Verifications'}
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start" disabled>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject All Verifications
                      </Button>
                      
                      <Button variant="outline" className="w-full justify-start" disabled>
                        <Flag className="h-4 w-4 mr-2" />
                        Flag for Manual Review
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </Card>
    </div>
  );
}