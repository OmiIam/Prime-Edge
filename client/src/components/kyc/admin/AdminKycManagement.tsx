// Admin KYC Management Interface
// Comprehensive admin panel for reviewing and managing KYC submissions

import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Shield,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  MoreHorizontal,
  Download,
  MessageSquare,
  User,
  Calendar,
  MapPin,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';

// Local imports
import { useAdminKyc } from '../../../hooks/useAdminKyc';
import { 
  KycRequest, 
  KycStatus, 
  ReviewAction,
  AdminKycFilters 
} from '../../../types/kyc';
import { getCountryName, getCountryFlag } from '../../../lib/countries';

interface AdminKycManagementProps {
  className?: string;
}

const AdminKycManagement: React.FC<AdminKycManagementProps> = ({ 
  className = '' 
}) => {
  const {
    requests,
    loading,
    reviewRequest,
    bulkReviewRequests,
    getPendingRequests,
    getFilteredRequests,
    statistics
  } = useAdminKyc();

  // State
  const [selectedRequests, setSelectedRequests] = useState<Set<string>>(new Set());
  const [reviewDialog, setReviewDialog] = useState<{
    isOpen: boolean;
    request: KycRequest | null;
  }>({ isOpen: false, request: null });
  const [bulkAction, setBulkAction] = useState<ReviewAction | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<string[]>(['']);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  
  // Filters
  const [filters, setFilters] = useState<AdminKycFilters>({
    status: undefined,
    searchQuery: '',
    dateRange: undefined,
    sortBy: 'submittedAt',
    sortOrder: 'desc'
  });

  // Load requests on mount and filter changes
  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    try {
      await getFilteredRequests(filters);
    } catch (error) {
      toast.error('Failed to load KYC requests');
    }
  };

  // Status display helpers
  const getStatusInfo = (status: KycStatus) => {
    switch (status) {
      case 'PENDING':
        return {
          icon: <Clock className="h-4 w-4" />,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-400/10',
          borderColor: 'border-yellow-400/30',
          label: 'Pending'
        };
      case 'APPROVED':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'text-green-400',
          bgColor: 'bg-green-400/10',
          borderColor: 'border-green-400/30',
          label: 'Approved'
        };
      case 'REJECTED':
        return {
          icon: <XCircle className="h-4 w-4" />,
          color: 'text-red-400',
          bgColor: 'bg-red-400/10',
          borderColor: 'border-red-400/30',
          label: 'Rejected'
        };
      case 'REQUIRES_RESUBMISSION':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'text-orange-400',
          bgColor: 'bg-orange-400/10',
          borderColor: 'border-orange-400/30',
          label: 'Resubmission Required'
        };
    }
  };

  // Handle individual review
  const handleReviewRequest = async (requestId: string, action: ReviewAction, feedback?: string[]) => {
    try {
      await reviewRequest(requestId, action, feedback);
      setReviewDialog({ isOpen: false, request: null });
      setReviewFeedback(['']);
      toast.success(`Request ${action.toLowerCase()} successfully`);
      loadRequests();
    } catch (error) {
      toast.error(`Failed to ${action.toLowerCase()} request`);
    }
  };

  // Handle bulk review
  const handleBulkReview = async () => {
    if (!bulkAction || selectedRequests.size === 0) return;

    try {
      await bulkReviewRequests(Array.from(selectedRequests), bulkAction);
      setSelectedRequests(new Set());
      setBulkAction(null);
      toast.success(`${selectedRequests.size} requests ${bulkAction.toLowerCase()} successfully`);
      loadRequests();
    } catch (error) {
      toast.error(`Failed to ${bulkAction.toLowerCase()} requests`);
    }
  };

  // Toggle request selection
  const toggleRequestSelection = (requestId: string) => {
    const newSelection = new Set(selectedRequests);
    if (newSelection.has(requestId)) {
      newSelection.delete(requestId);
    } else {
      newSelection.add(requestId);
    }
    setSelectedRequests(newSelection);
  };

  // Select all visible requests
  const selectAllVisible = () => {
    const allIds = new Set(requests.map(r => r.id));
    setSelectedRequests(allIds);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedRequests(new Set());
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add/remove feedback item
  const addFeedbackItem = () => {
    setReviewFeedback([...reviewFeedback, '']);
  };

  const removeFeedbackItem = (index: number) => {
    setReviewFeedback(reviewFeedback.filter((_, i) => i !== index));
  };

  const updateFeedbackItem = (index: number, value: string) => {
    const updated = [...reviewFeedback];
    updated[index] = value;
    setReviewFeedback(updated);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">KYC Management</h1>
          <p className="text-gray-400 mt-1">
            Review and manage identity verification requests
          </p>
        </div>
        
        <Button
          onClick={loadRequests}
          variant="outline"
          className="border-white/20 hover:bg-white/5"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="card-gradient border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-400/10 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{statistics.pending}</p>
                  <p className="text-sm text-gray-400">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-400/10 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{statistics.approved}</p>
                  <p className="text-sm text-gray-400">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-400/10 rounded-lg">
                  <XCircle className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{statistics.rejected}</p>
                  <p className="text-sm text-gray-400">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-gradient border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-400/10 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{statistics.totalProcessed}</p>
                  <p className="text-sm text-gray-400">Total Processed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="card-gradient border-white/10">
        <CardContent className="p-6">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, or ID..."
                value={filters.searchQuery}
                onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                className="pl-10"
              />
            </div>
            
            {/* Status Filter */}
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => setFilters({ 
                ...filters, 
                status: value === 'all' ? undefined : value as KycStatus 
              })}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="REQUIRES_RESUBMISSION">Resubmission Required</SelectItem>
              </SelectContent>
            </Select>
            
            {/* Sort */}
            <Select
              value={`${filters.sortBy}-${filters.sortOrder}`}
              onValueChange={(value) => {
                const [sortBy, sortOrder] = value.split('-');
                setFilters({ 
                  ...filters, 
                  sortBy: sortBy as any, 
                  sortOrder: sortOrder as 'asc' | 'desc' 
                });
              }}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submittedAt-desc">Newest First</SelectItem>
                <SelectItem value="submittedAt-asc">Oldest First</SelectItem>
                <SelectItem value="fullName-asc">Name A-Z</SelectItem>
                <SelectItem value="fullName-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedRequests.size > 0 && (
        <Alert className="border-blue-400/30 bg-blue-500/10">
          <Shield className="h-4 w-4 text-blue-400" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-blue-300">
              {selectedRequests.size} request(s) selected
            </span>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkAction('APPROVED')}
                className="border-green-400/30 text-green-300 hover:bg-green-400/10"
              >
                Approve All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setBulkAction('REJECTED')}
                className="border-red-400/30 text-red-300 hover:bg-red-400/10"
              >
                Reject All
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={clearSelection}
                className="text-gray-400"
              >
                Clear
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Request List */}
      <Card className="card-gradient border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">
              KYC Requests ({requests.length})
            </CardTitle>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={selectedRequests.size === requests.length ? clearSelection : selectAllVisible}
                className="border-white/20 hover:bg-white/5"
              >
                {selectedRequests.size === requests.length ? 'Deselect All' : 'Select All'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-400">Loading requests...</p>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">No KYC requests found</p>
            </div>
          ) : (
            <div className="space-y-0">
              {requests.map((request, index) => {
                const statusInfo = getStatusInfo(request.status);
                const isSelected = selectedRequests.has(request.id);
                const isExpanded = expandedRequest === request.id;

                return (
                  <div
                    key={request.id}
                    className={`
                      border-b border-white/5 transition-colors
                      ${isSelected ? 'bg-blue-600/10' : 'hover:bg-white/5'}
                      ${index === requests.length - 1 ? 'border-b-0' : ''}
                    `}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        {/* Checkbox & Request Info */}
                        <div className="flex items-start gap-4 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleRequestSelection(request.id)}
                            className="mt-1 w-4 h-4 text-blue-600 bg-transparent border-gray-300 rounded focus:ring-blue-500"
                          />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-medium text-white">
                                {request.fullName}
                              </h3>
                              <Badge className={`${statusInfo.color} ${statusInfo.bgColor} border-0`}>
                                {statusInfo.icon}
                                <span className="ml-1">{statusInfo.label}</span>
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-400">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>ID: {request.id.slice(-8)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(request.submittedAt)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-lg">{getCountryFlag(request.countryOfResidence)}</span>
                                <span>{getCountryName(request.countryOfResidence)}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {request.documentTypes.map((type, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant="outline" 
                                  className="text-xs border-white/20 text-gray-300"
                                >
                                  {type.replace('_', ' ')}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setExpandedRequest(isExpanded ? null : request.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </Button>
                          
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="ghost" className="text-gray-400 hover:text-white">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => setReviewDialog({ isOpen: true, request })}
                              >
                                <Eye className="h-4 w-4 mr-2" />
                                Review
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {request.status === 'PENDING' && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() => handleReviewRequest(request.id, 'APPROVED')}
                                    className="text-green-400"
                                  >
                                    <CheckCircle2 className="h-4 w-4 mr-2" />
                                    Approve
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => setReviewDialog({ isOpen: true, request })}
                                    className="text-red-400"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Reject
                                  </DropdownMenuItem>
                                </>
                              )}
                              <DropdownMenuItem>
                                <Download className="h-4 w-4 mr-2" />
                                Export
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <>
                          <Separator className="bg-white/10 my-4" />
                          <div className="space-y-4 pl-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <label className="text-xs font-medium text-gray-400">Date of Birth</label>
                                <p className="text-sm text-white mt-1">
                                  {new Date(request.dateOfBirth).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </p>
                              </div>
                              <div>
                                <label className="text-xs font-medium text-gray-400">Documents</label>
                                <p className="text-sm text-white mt-1">
                                  {request.documentTypes.length} file(s) + 1 selfie
                                </p>
                              </div>
                            </div>
                            
                            <div>
                              <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                Residential Address
                              </label>
                              <p className="text-sm text-white mt-1 leading-relaxed">
                                {request.residentialAddress}
                              </p>
                            </div>
                            
                            {request.feedback && request.feedback.length > 0 && (
                              <div>
                                <label className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3" />
                                  Previous Feedback
                                </label>
                                <div className="mt-1 space-y-1">
                                  {request.feedback.map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-2 text-sm text-red-300">
                                      <span className="text-red-400 mt-1">•</span>
                                      <span>{item}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={reviewDialog.isOpen} onOpenChange={(open) => {
        if (!open) {
          setReviewDialog({ isOpen: false, request: null });
          setReviewFeedback(['']);
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Review KYC Request
            </DialogTitle>
          </DialogHeader>
          
          {reviewDialog.request && (
            <div className="space-y-6">
              {/* Request Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-400">Full Name</label>
                  <p className="text-white mt-1">{reviewDialog.request.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-400">Status</label>
                  <div className="mt-1">
                    {(() => {
                      const statusInfo = getStatusInfo(reviewDialog.request.status);
                      return (
                        <Badge className={`${statusInfo.color} ${statusInfo.bgColor} border-0`}>
                          {statusInfo.icon}
                          <span className="ml-1">{statusInfo.label}</span>
                        </Badge>
                      );
                    })()}
                  </div>
                </div>
              </div>
              
              {/* Feedback Section */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-white">Review Feedback</label>
                {reviewFeedback.map((feedback, index) => (
                  <div key={index} className="flex gap-2">
                    <Textarea
                      value={feedback}
                      onChange={(e) => updateFeedbackItem(index, e.target.value)}
                      placeholder="Enter feedback for the user..."
                      className="flex-1"
                    />
                    {reviewFeedback.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFeedbackItem(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFeedbackItem}
                  className="border-white/20 hover:bg-white/5"
                >
                  Add Feedback Item
                </Button>
              </div>
            </div>
          )}
          
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setReviewDialog({ isOpen: false, request: null })}
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={() => reviewDialog.request && handleReviewRequest(
                reviewDialog.request.id, 
                'REQUIRES_RESUBMISSION',
                reviewFeedback.filter(f => f.trim())
              )}
              className="border-orange-400/30 text-orange-300 hover:bg-orange-400/10"
            >
              Request Resubmission
            </Button>
            <Button
              variant="outline"
              onClick={() => reviewDialog.request && handleReviewRequest(
                reviewDialog.request.id, 
                'REJECTED',
                reviewFeedback.filter(f => f.trim())
              )}
              className="border-red-400/30 text-red-300 hover:bg-red-400/10"
            >
              Reject
            </Button>
            <Button
              onClick={() => reviewDialog.request && handleReviewRequest(
                reviewDialog.request.id, 
                'APPROVED'
              )}
              className="bg-green-600 hover:bg-green-700"
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Action Confirmation */}
      {bulkAction && (
        <Dialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Bulk Action</DialogTitle>
            </DialogHeader>
            <p className="text-gray-300">
              Are you sure you want to {bulkAction.toLowerCase()} {selectedRequests.size} request(s)?
              This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkAction(null)}>
                Cancel
              </Button>
              <Button onClick={handleBulkReview} className="btn-primary">
                Confirm {bulkAction}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminKycManagement;