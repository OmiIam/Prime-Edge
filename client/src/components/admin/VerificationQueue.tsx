import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authManager } from "@/lib/auth";
import UserVerificationDetail from "./UserVerificationDetail";
import {
  Clock,
  User,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  FileText,
  Calendar,
  Flag,
  ChevronRight,
  Filter,
  RefreshCw
} from "lucide-react";

interface VerificationRequest {
  id: string;
  userId: string;
  requestType: string;
  status: string;
  priority: string;
  requestedAt: string;
  dueDate?: string;
  user: {
    id: string;
    name: string;
    email: string;
    kycStatus: string;
    riskLevel: string;
    isPep: boolean;
    createdAt: string;
  };
}

interface VerificationStats {
  totalPending: number;
  totalInReview: number;
  totalCompleted: number;
  urgentRequests: number;
  requestsByType: Array<{ requestType: string; _count: number }>;
  averageProcessingTimeHours: number;
}

const VERIFICATION_TYPES = [
  { value: 'IDENTITY', label: 'Identity Verification', icon: User, color: 'bg-blue-500' },
  { value: 'ADDRESS', label: 'Address Verification', icon: Shield, color: 'bg-green-500' },
  { value: 'INCOME', label: 'Income Verification', icon: FileText, color: 'bg-yellow-500' },
  { value: 'EMAIL', label: 'Email Verification', icon: CheckCircle, color: 'bg-cyan-500' },
  { value: 'PHONE', label: 'Phone Verification', icon: CheckCircle, color: 'bg-purple-500' },
  { value: 'FULL_KYC', label: 'Full KYC Review', icon: Shield, color: 'bg-red-500' }
];

const PRIORITY_COLORS = {
  URGENT: 'bg-red-100 text-red-700 border-red-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  NORMAL: 'bg-blue-100 text-blue-700 border-blue-200',
  LOW: 'bg-gray-100 text-gray-700 border-gray-200'
};

const STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  IN_REVIEW: 'bg-blue-100 text-blue-700 border-blue-200',
  APPROVED: 'bg-green-100 text-green-700 border-green-200',
  REJECTED: 'bg-red-100 text-red-700 border-red-200',
  REQUIRES_ADDITIONAL_INFO: 'bg-orange-100 text-orange-700 border-orange-200'
};

export default function VerificationQueue() {
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [reviewAction, setReviewAction] = useState<string>('');
  const [reviewNotes, setReviewNotes] = useState<string>('');
  const [page, setPage] = useState(1);
  const [showUserDetail, setShowUserDetail] = useState<string | null>(null);

  // Fetch verification queue
  const { data: queueData, isLoading: queueLoading, refetch } = useQuery({
    queryKey: ['/api/admin/verifications/queue', page, selectedType, selectedPriority],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      if (selectedType) params.append('type', selectedType);
      if (selectedPriority) params.append('priority', selectedPriority);

      const response = await fetch(`/api/admin/verifications/queue?${params}`, {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch verification queue');
      return response.json();
    }
  });

  // Fetch verification statistics
  const { data: statsData } = useQuery({
    queryKey: ['/api/admin/verifications/stats'],
    queryFn: async () => {
      const response = await fetch('/api/admin/verifications/stats', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) throw new Error('Failed to fetch verification stats');
      return response.json();
    }
  });

  // Review verification mutation
  const reviewMutation = useMutation({
    mutationFn: async (data: { requestId: string; action: string; notes: string }) => {
      const response = await fetch(`/api/admin/verifications/${data.requestId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify({
          action: data.action,
          notes: data.notes,
          documentIds: []
        })
      });
      if (!response.ok) throw new Error('Failed to review verification');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications/queue'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/verifications/stats'] });
      setSelectedRequest(null);
      setReviewAction('');
      setReviewNotes('');
    }
  });

  const requests: VerificationRequest[] = queueData?.requests || [];
  const stats: VerificationStats = statsData || {
    totalPending: 0,
    totalInReview: 0,
    totalCompleted: 0,
    urgentRequests: 0,
    requestsByType: [],
    averageProcessingTimeHours: 0
  };

  const handleReview = () => {
    if (selectedRequest && reviewAction) {
      reviewMutation.mutate({
        requestId: selectedRequest.id,
        action: reviewAction,
        notes: reviewNotes
      });
    }
  };

  const getVerificationTypeInfo = (type: string) => {
    return VERIFICATION_TYPES.find(vt => vt.value === type) || VERIFICATION_TYPES[0];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="card-gradient border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pending</p>
                <p className="text-2xl font-bold text-white">{stats.totalPending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">In Review</p>
                <p className="text-2xl font-bold text-white">{stats.totalInReview}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Urgent</p>
                <p className="text-2xl font-bold text-white">{stats.urgentRequests}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="card-gradient border-white/10">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Time</p>
                <p className="text-2xl font-bold text-white">{stats.averageProcessingTimeHours}h</p>
              </div>
              <Clock className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="card-gradient border-white/10">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-400" />
              Verification Queue
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  {VERIFICATION_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  <SelectItem value="URGENT">Urgent</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="LOW">Low</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => refetch()}
                size="sm"
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {queueLoading ? (
              <div className="text-center py-8 text-gray-400">Loading verification queue...</div>
            ) : requests.length === 0 ? (
              <div className="text-center py-8 text-gray-400">No pending verifications</div>
            ) : (
              requests.map((request) => {
                const typeInfo = getVerificationTypeInfo(request.requestType);
                const IconComponent = typeInfo.icon;

                return (
                  <div
                    key={request.id}
                    className="p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`w-10 h-10 ${typeInfo.color} rounded-lg flex items-center justify-center`}>
                          <IconComponent className="h-5 w-5 text-white" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-white">{request.user.name}</h3>
                            <Badge className={PRIORITY_COLORS[request.priority as keyof typeof PRIORITY_COLORS]}>
                              {request.priority}
                            </Badge>
                            <Badge className={STATUS_COLORS[request.status as keyof typeof STATUS_COLORS]}>
                              {request.status.replace('_', ' ')}
                            </Badge>
                            {request.user.isPep && (
                              <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                                PEP
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-400 mb-2">{typeInfo.label}</p>
                          <p className="text-xs text-gray-500">{request.user.email}</p>
                          
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Requested: {formatDate(request.requestedAt)}</span>
                            <span>Risk: {request.user.riskLevel}</span>
                            <span>KYC: {request.user.kycStatus}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowUserDetail(request.userId)}
                          className="border-white/20 text-white hover:bg-white/10"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Review
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Review Modal */}
      {selectedRequest && (
        <Card className="card-gradient border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Review Verification Request</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedRequest(null)}
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-white mb-3">User Information</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Name:</span>
                    <span className="text-white">{selectedRequest.user.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email:</span>
                    <span className="text-white">{selectedRequest.user.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Risk Level:</span>
                    <span className="text-white">{selectedRequest.user.riskLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">KYC Status:</span>
                    <span className="text-white">{selectedRequest.user.kycStatus}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-white mb-3">Request Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Type:</span>
                    <span className="text-white">{getVerificationTypeInfo(selectedRequest.requestType).label}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Priority:</span>
                    <Badge className={PRIORITY_COLORS[selectedRequest.priority as keyof typeof PRIORITY_COLORS]}>
                      {selectedRequest.priority}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Requested:</span>
                    <span className="text-white">{formatDate(selectedRequest.requestedAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-4">
              <div>
                <Label className="text-white font-medium">Review Action</Label>
                <Select value={reviewAction} onValueChange={setReviewAction}>
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue placeholder="Select action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVE">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Approve
                      </div>
                    </SelectItem>
                    <SelectItem value="REJECT">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-4 w-4 text-red-500" />
                        Reject
                      </div>
                    </SelectItem>
                    <SelectItem value="REQUEST_MORE_INFO">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        Request More Info
                      </div>
                    </SelectItem>
                    <SelectItem value="ESCALATE">
                      <div className="flex items-center gap-2">
                        <Flag className="h-4 w-4 text-orange-500" />
                        Escalate
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white font-medium">Review Notes</Label>
                <Textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder="Add notes about your decision..."
                  className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  rows={3}
                />
              </div>

              <div className="flex items-center justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setSelectedRequest(null)}
                  className="border-white/20 text-gray-300 hover:bg-white/10"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleReview}
                  disabled={!reviewAction || reviewMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {reviewMutation.isPending ? 'Processing...' : 'Submit Review'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* User Verification Detail Modal */}
      {showUserDetail && (
        <UserVerificationDetail
          userId={showUserDetail}
          onClose={() => setShowUserDetail(null)}
        />
      )}
    </div>
  );
}