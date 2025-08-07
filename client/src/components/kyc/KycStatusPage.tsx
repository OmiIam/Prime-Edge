// KYC Status Page Component
// Shows users their current verification status and allows management

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'wouter';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Calendar,
  User,
  MapPin,
  RefreshCw,
  Upload,
  Download,
  Eye,
  AlertCircle
} from 'lucide-react';

// Local imports
import { useKyc } from '../../hooks/useKyc';
import { KycStatus, KycSubmissionResponse } from '../../types/kyc';
import { getCountryName, getCountryFlag } from '../../lib/countries';

interface KycStatusPageProps {
  className?: string;
}

const KycStatusPage: React.FC<KycStatusPageProps> = ({ className = '' }) => {
  const navigate = useNavigate();
  const { getKycStatus, refreshKycStatus } = useKyc();
  
  const [kycData, setKycData] = useState<KycSubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load KYC status on mount
  useEffect(() => {
    loadKycStatus();
  }, []);

  const loadKycStatus = async () => {
    try {
      setLoading(true);
      const data = await getKycStatus();
      setKycData(data);
    } catch (error) {
      console.error('Failed to load KYC status:', error);
      toast.error('Failed to load verification status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      const data = await refreshKycStatus();
      setKycData(data);
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to refresh status');
    } finally {
      setRefreshing(false);
    }
  };

  // Get status display information
  const getStatusInfo = (status: KycStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="h-6 w-6" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/30',
          title: 'Under Review',
          description: 'Your documents are being verified by our team.'
        };
      case 'APPROVED':
        return {
          icon: <CheckCircle2 className="h-6 w-6" />,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/30',
          title: 'Verified',
          description: 'Your identity has been successfully verified.'
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="h-6 w-6" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/30',
          title: 'Verification Failed',
          description: 'Your documents could not be verified. Please resubmit.'
        };
      case 'REQUIRES_RESUBMISSION':
        return {
          icon: <AlertTriangle className="h-6 w-6" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          borderColor: 'border-orange-400/30',
          title: 'Resubmission Required',
          description: 'Please update your documents based on the feedback provided.'
        };
    }
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get estimated completion time
  const getEstimatedCompletion = (): string => {
    if (!kycData || kycData.status !== 'PENDING') return '';
    
    const submittedAt = new Date(kycData.submittedAt);
    const businessDays = 3; // Standard review time
    const completionDate = new Date(submittedAt);
    
    // Add business days (skip weekends)
    let daysAdded = 0;
    while (daysAdded < businessDays) {
      completionDate.setDate(completionDate.getDate() + 1);
      if (completionDate.getDay() !== 0 && completionDate.getDay() !== 6) {
        daysAdded++;
      }
    }
    
    return completionDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading verification status...</p>
        </div>
      </div>
    );
  }

  if (!kycData) {
    return (
      <div className={`max-w-4xl mx-auto ${className}`}>
        <Card className="card-gradient border-white/10">
          <CardContent className="text-center py-12">
            <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">No Verification Found</h2>
            <p className="text-gray-400 mb-6">
              You haven't submitted any identity verification documents yet.
            </p>
            <Button 
              onClick={() => navigate('/kyc/submit')}
              className="btn-primary"
            >
              <Upload className="h-4 w-4 mr-2" />
              Start Verification
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(kycData.status);
  const estimatedCompletion = getEstimatedCompletion();

  return (
    <div className={`max-w-4xl mx-auto space-y-8 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Identity Verification Status</h1>
        <p className="text-gray-300">
          Track your verification progress and manage your submission.
        </p>
      </div>

      {/* Status Card */}
      <Card className={`card-gradient border-white/10 ${statusInfo.borderColor}`}>
        <CardContent className="p-8">
          <div className="flex items-start gap-6">
            <div className={`p-4 rounded-full ${statusInfo.bgColor}`}>
              <div className={statusInfo.color}>
                {statusInfo.icon}
              </div>
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-semibold text-white">
                  {statusInfo.title}
                </h2>
                <Badge variant="outline" className={`${statusInfo.color} ${statusInfo.borderColor}`}>
                  {kycData.status.replace('_', ' ')}
                </Badge>
              </div>
              
              <p className="text-gray-300 mb-4">
                {statusInfo.description}
              </p>
              
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted {formatDate(kycData.submittedAt)}</span>
                </div>
                
                {kycData.reviewedAt && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Reviewed {formatDate(kycData.reviewedAt)}</span>
                  </div>
                )}
                
                {estimatedCompletion && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Expected by {estimatedCompletion}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={refreshing}
                className="border-white/20 hover:bg-white/5"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rejection/Resubmission Feedback */}
      {(kycData.status === 'REJECTED' || kycData.status === 'REQUIRES_RESUBMISSION') && kycData.feedback && (
        <Alert className="border-red-400/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            <strong>Feedback from Review Team:</strong>
            <div className="mt-2 space-y-1">
              {kycData.feedback.map((item, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-red-400">•</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Submission Details */}
      <Card className="card-gradient border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <User className="h-5 w-5" />
            Submission Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm font-medium text-gray-400">Full Name</label>
              <p className="text-white mt-1">{kycData.fullName}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-400">Date of Birth</label>
              <p className="text-white mt-1">
                {new Date(kycData.dateOfBirth).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-400">Country of Residence</label>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-lg">{getCountryFlag(kycData.countryOfResidence)}</span>
                <span className="text-white">{getCountryName(kycData.countryOfResidence)}</span>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-400">Document Types</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {kycData.documentTypes.map((type, index) => (
                  <Badge key={index} variant="secondary" className="bg-blue-600/20 text-blue-300">
                    {type.replace('_', ' ')}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />
          
          {/* Address */}
          <div>
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Residential Address
            </label>
            <p className="text-white mt-1 leading-relaxed">
              {kycData.residentialAddress}
            </p>
          </div>

          <Separator className="bg-white/10" />
          
          {/* Documents Summary */}
          <div>
            <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Uploaded Documents
            </label>
            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white">Identity Documents</span>
                <Badge variant="outline" className="text-blue-300 border-blue-400/30">
                  {kycData.documentTypes.length} files
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white">Selfie Verification</span>
                <Badge variant="outline" className="text-green-300 border-green-400/30">
                  1 file
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-center gap-4">
        {(kycData.status === 'REJECTED' || kycData.status === 'REQUIRES_RESUBMISSION') && (
          <Button
            onClick={() => navigate('/kyc/resubmit')}
            className="btn-primary px-6"
          >
            <Upload className="h-4 w-4 mr-2" />
            Resubmit Documents
          </Button>
        )}
        
        {kycData.status === 'APPROVED' && (
          <Button
            variant="outline"
            className="border-green-400/30 text-green-300 hover:bg-green-400/10"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Certificate
          </Button>
        )}
        
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard')}
          className="border-white/20 hover:bg-white/5"
        >
          Return to Dashboard
        </Button>
      </div>

      {/* Help Section */}
      <Card className="card-gradient border-white/10">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-white mb-2">Review Process</h4>
              <p className="text-gray-400">
                Our verification team reviews documents within 1-3 business days. You'll receive email updates on progress.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Document Quality</h4>
              <p className="text-gray-400">
                Ensure documents are clear, well-lit, and show all corners. Blurry or cropped images may cause delays.
              </p>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Contact Support</h4>
              <p className="text-gray-400">
                Having issues? Contact our support team for personalized assistance with your verification.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default KycStatusPage;