import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { formatCurrency } from "@/lib/formatters";
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Building2,
  User,
  Calendar,
  Shield,
  Filter,
  Eye,
  RefreshCw,
  TrendingUp,
  AlertCircle,
  FileText,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";

interface Transfer {
  id: string;
  userId: string;
  amount: number;
  description: string;
  createdAt: string;
  status: string;
  metadata: {
    transferType: string;
    bankName: string;
    recipientInfo: string;
    fullAccountInfo: string;
    status: string;
    submittedAt: string;
    riskLevel: string;
    reason: string;
  };
  user: {
    id: string;
    name: string;
    email: string;
    accountNumber: string;
    balance: number;
    riskLevel: string;
    kycStatus: string;
  };
  riskScore?: number;
  riskFactors?: string[];
  urgency?: string;
  priority?: string;
}

interface TransferStats {
  pending: { count: number; amount: number };
  today: { approved: number; rejected: number };
  thisWeek: { count: number; amount: number };
  highRiskPending: number;
}

const RISK_COLORS = {
  LOW: 'bg-green-100 text-green-700 border-green-200',
  MEDIUM: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  HIGH: 'bg-orange-100 text-orange-700 border-orange-200',
  URGENT: 'bg-red-100 text-red-700 border-red-200'
};

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700'
};

export default function TransferReview() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewReason, setReviewReason] = useState('');
  const [filters, setFilters] = useState({
    riskLevel: '',
    amountMin: '',
    amountMax: '',
    dateFrom: '',
    dateTo: ''
  });

  // Fetch pending transfers
  const { data: transfersData, isLoading: transfersLoading, error: transfersError } = useQuery({
    queryKey: ['/api/admin/pending-transfers', filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value.toString());
      });
      
      const response = await apiRequest('GET', `/api/admin/pending-transfers?${queryParams}`);
      return response.json();
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Fetch transfer statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/transfers/stats'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/admin/transfers/stats');
      return response.json();
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Review transfer mutation
  const reviewMutation = useMutation({
    mutationFn: async ({ transferId, action, reason }: { transferId: string; action: string; reason?: string }) => {
      const response = await apiRequest('POST', `/api/admin/transfers/${transferId}/review`, {
        action,
        reason
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Transfer reviewed successfully",
        description: data.message,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-transfers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/transfers/stats'] });
      setReviewDialogOpen(false);
      setSelectedTransfer(null);
      setReviewReason('');
    },
    onError: (error: any) => {
      toast({
        title: "Review failed",
        description: error.message || "Failed to review transfer",
        variant: "destructive",
      });
    },
  });

  const handleReview = () => {
    if (!selectedTransfer) return;
    
    reviewMutation.mutate({
      transferId: selectedTransfer.id,
      action: reviewAction,
      reason: reviewReason
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'HIGH':
      case 'URGENT':
        return <AlertTriangle className="h-4 w-4" />;
      case 'MEDIUM':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'HIGH':
        return 'text-red-600';
      case 'MEDIUM':
        return 'text-yellow-600';
      default:
        return 'text-green-600';
    }
  };

  if (transfersLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-lg">Loading transfers...</span>
      </div>
    );
  }

  if (transfersError) {
    return (
      <Alert className="mx-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load pending transfers. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  const transfers: Transfer[] = transfersData || [];
  const transferStats: TransferStats = stats || {
    pending: { count: 0, amount: 0 },
    today: { approved: 0, rejected: 0 },
    thisWeek: { count: 0, amount: 0 },
    highRiskPending: 0
  };

  return (
    <div className="space-y-6">
      {/* Statistics Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Transfers</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats.pending.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(transferStats.pending.amount)} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Risk Pending</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{transferStats.highRiskPending}</div>
            <p className="text-xs text-muted-foreground">
              Requires immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Actions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {transferStats.today.approved}
            </div>
            <p className="text-xs text-muted-foreground">
              {transferStats.today.rejected} rejected
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Volume</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transferStats.thisWeek.count}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(transferStats.thisWeek.amount)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Transfer Review Interface */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">External Transfer Review</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and approve pending external bank transfers
                </p>
              </div>
            </div>
            <Button
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admin/pending-transfers'] })}
              variant="outline"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {/* Filters */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="risk-filter">Risk Level</Label>
                <Select value={filters.riskLevel} onValueChange={(value) => setFilters({...filters, riskLevel: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="All risks" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All risks</SelectItem>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="amount-min">Min Amount</Label>
                <Input
                  id="amount-min"
                  type="number"
                  placeholder="0"
                  value={filters.amountMin}
                  onChange={(e) => setFilters({...filters, amountMin: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="amount-max">Max Amount</Label>
                <Input
                  id="amount-max"
                  type="number"
                  placeholder="No limit"
                  value={filters.amountMax}
                  onChange={(e) => setFilters({...filters, amountMax: e.target.value})}
                />
              </div>

              <div>
                <Label htmlFor="date-from">From Date</Label>
                <Input
                  id="date-from"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                />
              </div>

              <div className="flex items-end">
                <Button
                  onClick={() => setFilters({ riskLevel: '', amountMin: '', amountMax: '', dateFrom: '', dateTo: '' })}
                  variant="outline"
                  className="w-full"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Clear Filters
                </Button>
              </div>
            </div>
          </div>

          {/* Transfer List */}
          {transfers.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">All caught up!</h3>
              <p className="text-gray-600">No pending transfers require review at this time.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {transfers.map((transfer) => (
                <Card key={transfer.id} className={`border-l-4 hover:shadow-md transition-shadow ${
                  transfer.priority === 'URGENT' ? 'border-l-red-500' :
                  transfer.priority === 'HIGH' ? 'border-l-orange-500' :
                  'border-l-blue-500'
                }`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{formatCurrency(transfer.amount)}</h3>
                            <Badge className={RISK_COLORS[transfer.priority as keyof typeof RISK_COLORS] || RISK_COLORS.LOW}>
                              {getRiskIcon(transfer.priority || 'LOW')}
                              <span className="ml-1">{transfer.priority || 'Normal'}</span>
                            </Badge>
                            {transfer.urgency && (
                              <Badge variant="outline" className={getUrgencyColor(transfer.urgency)}>
                                <Clock className="h-3 w-3 mr-1" />
                                {transfer.urgency}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            To {transfer.metadata.bankName} • {formatDate(transfer.createdAt)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setSelectedTransfer(transfer)}>
                              <Eye className="h-4 w-4 mr-2" />
                              Review
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Transfer Review - {formatCurrency(transfer.amount)}</DialogTitle>
                            </DialogHeader>
                            
                            <div className="space-y-6">
                              {/* Transfer Details */}
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">User</Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <User className="h-4 w-4 text-gray-400" />
                                    <span>{transfer.user.name}</span>
                                  </div>
                                  <p className="text-xs text-gray-500">{transfer.user.email}</p>
                                </div>
                                
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Amount</Label>
                                  <div className="text-xl font-bold text-green-600 mt-1">
                                    {formatCurrency(transfer.amount)}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Destination Bank</Label>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Building2 className="h-4 w-4 text-gray-400" />
                                    <span>{transfer.metadata.bankName}</span>
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Account Info</Label>
                                  <p className="mt-1 font-mono text-sm">{transfer.metadata.recipientInfo}</p>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium text-gray-600">User Balance</Label>
                                  <div className="mt-1">
                                    <span className={transfer.user.balance >= transfer.amount ? 'text-green-600' : 'text-red-600'}>
                                      {formatCurrency(transfer.user.balance)}
                                    </span>
                                    {transfer.user.balance < transfer.amount && (
                                      <p className="text-xs text-red-500">Insufficient funds</p>
                                    )}
                                  </div>
                                </div>

                                <div>
                                  <Label className="text-sm font-medium text-gray-600">KYC Status</Label>
                                  <Badge className={
                                    transfer.user.kycStatus === 'APPROVED' ? 'bg-green-100 text-green-700' :
                                    transfer.user.kycStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-red-100 text-red-700'
                                  }>
                                    {transfer.user.kycStatus}
                                  </Badge>
                                </div>
                              </div>

                              {/* Risk Assessment */}
                              {transfer.riskFactors && transfer.riskFactors.length > 0 && (
                                <div>
                                  <Label className="text-sm font-medium text-gray-600">Risk Factors</Label>
                                  <div className="mt-2 space-y-1">
                                    {transfer.riskFactors.map((factor, index) => (
                                      <div key={index} className="flex items-center gap-2 text-sm">
                                        <AlertTriangle className="h-3 w-3 text-orange-500" />
                                        <span>{factor}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <Separator />

                              {/* Review Actions */}
                              <div className="space-y-4">
                                <Label className="text-sm font-medium">Review Decision</Label>
                                <div className="flex gap-4">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="approve"
                                      name="action"
                                      value="approve"
                                      checked={reviewAction === 'approve'}
                                      onChange={(e) => setReviewAction(e.target.value as 'approve')}
                                    />
                                    <label htmlFor="approve" className="text-sm font-medium text-green-700">
                                      Approve Transfer
                                    </label>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <input
                                      type="radio"
                                      id="reject"
                                      name="action"
                                      value="reject"
                                      checked={reviewAction === 'reject'}
                                      onChange={(e) => setReviewAction(e.target.value as 'reject')}
                                    />
                                    <label htmlFor="reject" className="text-sm font-medium text-red-700">
                                      Reject Transfer
                                    </label>
                                  </div>
                                </div>

                                <div>
                                  <Label htmlFor="reason">
                                    {reviewAction === 'approve' ? 'Approval Notes (Optional)' : 'Rejection Reason (Required)'}
                                  </Label>
                                  <Textarea
                                    id="reason"
                                    placeholder={
                                      reviewAction === 'approve' 
                                        ? 'Add any notes about this approval...'
                                        : 'Please provide a reason for rejecting this transfer...'
                                    }
                                    value={reviewReason}
                                    onChange={(e) => setReviewReason(e.target.value)}
                                    className="mt-1"
                                    rows={3}
                                  />
                                </div>

                                <div className="flex justify-end gap-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => {
                                      setSelectedTransfer(null);
                                      setReviewReason('');
                                      setReviewAction('approve');
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleReview}
                                    disabled={reviewMutation.isPending || (reviewAction === 'reject' && !reviewReason.trim())}
                                    className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                                  >
                                    {reviewMutation.isPending ? (
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    ) : reviewAction === 'approve' ? (
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-2" />
                                    )}
                                    {reviewAction === 'approve' ? 'Approve Transfer' : 'Reject Transfer'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">User:</span>
                        <p className="font-medium">{transfer.user.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Balance:</span>
                        <p className={`font-medium ${transfer.user.balance >= transfer.amount ? 'text-green-600' : 'text-red-600'}`}>
                          {formatCurrency(transfer.user.balance)}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Risk Level:</span>
                        <p className="font-medium">{transfer.user.riskLevel}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">KYC Status:</span>
                        <Badge variant="outline" className={
                          transfer.user.kycStatus === 'APPROVED' ? 'border-green-500 text-green-700' :
                          transfer.user.kycStatus === 'PENDING' ? 'border-yellow-500 text-yellow-700' :
                          'border-red-500 text-red-700'
                        }>
                          {transfer.user.kycStatus}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}