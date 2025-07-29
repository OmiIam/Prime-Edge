import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  DollarSign,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  Ban,
  UserCheck,
  UserX,
  Plus,
  Minus,
  FileText,
  Download,
  Eye,
  RefreshCw,
  CreditCard,
  TrendingUp,
  Settings
} from "lucide-react";
import { format } from "date-fns";

interface UserDetail {
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
  role: 'USER' | 'ADMIN';
  accountType: 'CHECKING' | 'SAVINGS' | 'BUSINESS';
  balance: number;
  isActive: boolean;
  kycStatus: 'pending' | 'verified' | 'rejected';
  kycDocuments: Array<{
    id: string;
    type: string;
    status: 'pending' | 'approved' | 'rejected';
    uploadedAt: Date;
    reviewedAt?: Date;
    reviewedBy?: string;
    rejectionReason?: string;
  }>;
  lastLogin: Date;
  createdAt: Date;
  riskScore: number;
  creditScore?: number;
  totalTransactions: number;
  monthlyTransactionVolume: number;
  flags: Array<{
    id: string;
    type: 'fraud_alert' | 'high_risk' | 'kyc_expired' | 'suspicious_activity';
    description: string;
    createdAt: Date;
    severity: 'low' | 'medium' | 'high';
    resolved: boolean;
  }>;
}

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: Date;
  category: string;
  recipientAccount?: string;
}

export default function UserDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const authState = authManager.getState();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<UserDetail | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [balanceAdjustment, setBalanceAdjustment] = useState('');
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'ADD' | 'SUBTRACT'>('ADD');

  // Mock user data - in real app would fetch from API based on params.id
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockUser: UserDetail = {
        id: params.id || '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (938) 271-8041',
        dateOfBirth: '1990-05-15',
        address: {
          street: '123 Main Street',
          city: 'San Francisco',
          state: 'CA',
          zipCode: '94105',
          country: 'United States'
        },
        role: 'USER',
        accountType: 'CHECKING',
        balance: 15420.50,
        isActive: true,
        kycStatus: 'verified',
        kycDocuments: [
          {
            id: 'doc1',
            type: 'Driver License',
            status: 'approved',
            uploadedAt: new Date('2024-01-15'),
            reviewedAt: new Date('2024-01-16'),
            reviewedBy: 'admin@primeedge.com'
          },
          {
            id: 'doc2',
            type: 'Proof of Address',
            status: 'approved',
            uploadedAt: new Date('2024-01-15'),
            reviewedAt: new Date('2024-01-16'),
            reviewedBy: 'admin@primeedge.com'
          }
        ],
        lastLogin: new Date('2024-07-27T14:30:00'),
        createdAt: new Date('2023-12-01'),
        riskScore: 23,
        creditScore: 742,
        totalTransactions: 142,
        monthlyTransactionVolume: 8450.20,
        flags: [
          {
            id: 'flag1',
            type: 'high_risk',
            description: 'Large cash deposit pattern detected',
            createdAt: new Date('2024-07-20'),
            severity: 'medium',
            resolved: false
          }
        ]
      };

      const mockTransactions: Transaction[] = [
        {
          id: 'tx1',
          type: 'CREDIT',
          amount: 2500.00,
          description: 'Direct Deposit - Salary',
          status: 'completed',
          createdAt: new Date('2024-07-26'),
          category: 'Income'
        },
        {
          id: 'tx2',
          type: 'DEBIT',
          amount: 1200.00,
          description: 'Rent Payment',
          status: 'completed',
          createdAt: new Date('2024-07-25'),
          category: 'Housing',
          recipientAccount: '****8901'
        },
        {
          id: 'tx3',
          type: 'DEBIT',
          amount: 45.67,
          description: 'Grocery Store Purchase',
          status: 'completed',
          createdAt: new Date('2024-07-24'),
          category: 'Food & Dining'
        }
      ];

      setUser(mockUser);
      setTransactions(mockTransactions);
      setIsLoading(false);
    };

    fetchUserData();
  }, [params.id]);

  if (!authState.isAuthenticated || authState.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-8">
              <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">Admin privileges required to view user details.</p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setLocation("/admin")}
              >
                Return to Admin Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleStatusToggle = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setUser(prev => prev ? { ...prev, isActive: !prev.isActive } : null);
      
      toast({
        title: "Status updated",
        description: `User ${user.isActive ? 'deactivated' : 'activated'} successfully.`,
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBalanceAdjustment = async () => {
    if (!user || !balanceAdjustment || !adjustmentReason) {
      toast({
        title: "Missing information",
        description: "Please provide amount and reason for adjustment.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const amount = parseFloat(balanceAdjustment);
      const newBalance = adjustmentType === 'ADD' 
        ? user.balance + amount 
        : user.balance - amount;
      
      setUser(prev => prev ? { ...prev, balance: newBalance } : null);
      setBalanceAdjustment('');
      setAdjustmentReason('');
      
      toast({
        title: "Balance adjusted",
        description: `${adjustmentType === 'ADD' ? 'Added' : 'Subtracted'} $${amount.toLocaleString()} ${adjustmentType === 'ADD' ? 'to' : 'from'} account.`,
      });
    } catch (error) {
      toast({
        title: "Adjustment failed",
        description: "Failed to adjust account balance.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score <= 30) return 'bg-green-100 text-green-700 border-green-200';
    if (score <= 70) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-red-100 text-red-700 border-red-200';
  };

  const getRiskScoreLabel = (score: number) => {
    if (score <= 30) return 'Low Risk';
    if (score <= 70) return 'Medium Risk';
    return 'High Risk';
  };

  const getKycStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': 
      case 'approved': return CheckCircle;
      case 'pending': return Clock;
      case 'rejected': return XCircle;
      default: return AlertTriangle;
    }
  };

  if (isLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user!} />
        <div className="pt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-white/10 rounded w-1/4"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="h-64 bg-white/10 rounded-lg"></div>
                  <div className="h-96 bg-white/10 rounded-lg"></div>
                </div>
                <div className="space-y-6">
                  <div className="h-48 bg-white/10 rounded-lg"></div>
                  <div className="h-32 bg-white/10 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => setLocation("/admin")}
                className="text-gray-300 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Admin
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-white">User Details</h1>
                <p className="text-gray-300">Comprehensive user account management</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-gray-300 hover:bg-white/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* User Profile Card */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center shadow-lg">
                        {user.avatar ? (
                          <img src={user.avatar} alt="User avatar" className="w-full h-full rounded-2xl object-cover" />
                        ) : (
                          <User className="h-8 w-8 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
                          <Badge className={user.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                          <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                            {user.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {user.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {user.phone}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant={user.isActive ? "destructive" : "default"}
                          >
                            {user.isActive ? (
                              <>
                                <UserX className="h-4 w-4 mr-2" />
                                Deactivate
                              </>
                            ) : (
                              <>
                                <UserCheck className="h-4 w-4 mr-2" />
                                Activate
                              </>
                            )}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white">
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {user.isActive ? 'Deactivate' : 'Activate'} User Account
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to {user.isActive ? 'deactivate' : 'activate'} {user.name}'s account? 
                              {user.isActive && ' This will prevent them from accessing their account and performing transactions.'}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={handleStatusToggle}
                              className={user.isActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                            >
                              {user.isActive ? 'Deactivate' : 'Activate'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Account Type</Label>
                        <p className="mt-1 text-gray-900">{user.accountType}</p>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Date of Birth</Label>
                        <p className="mt-1 text-gray-900">{format(new Date(user.dateOfBirth), 'MMMM dd, yyyy')}</p>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Member Since</Label>
                        <p className="mt-1 text-gray-900">{format(user.createdAt, 'MMMM dd, yyyy')}</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Address</Label>
                        <p className="mt-1 text-gray-900">
                          {user.address.street}<br />
                          {user.address.city}, {user.address.state} {user.address.zipCode}<br />
                          {user.address.country}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Last Login</Label>
                        <p className="mt-1 text-gray-900">{format(user.lastLogin, 'MMMM dd, yyyy HH:mm')}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Account Overview */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Account Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600 mb-1">
                        ${user.balance.toLocaleString()}
                      </div>
                      <div className="text-sm text-green-700">Current Balance</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {user.totalTransactions}
                      </div>
                      <div className="text-sm text-blue-700">Total Transactions</div>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600 mb-1">
                        ${user.monthlyTransactionVolume.toLocaleString()}
                      </div>
                      <div className="text-sm text-purple-700">Monthly Volume</div>
                    </div>
                  </div>

                  {/* Balance Adjustment */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-gray-900 mb-4">Balance Adjustment</h4>
                    <div className="grid md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="adjustment-type">Type</Label>
                        <Select value={adjustmentType} onValueChange={(value: 'ADD' | 'SUBTRACT') => setAdjustmentType(value)}>
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADD">Add Funds</SelectItem>
                            <SelectItem value="SUBTRACT">Subtract Funds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="adjustment-amount">Amount ($)</Label>
                        <Input
                          id="adjustment-amount"
                          type="number"
                          step="0.01"
                          value={balanceAdjustment}
                          onChange={(e) => setBalanceAdjustment(e.target.value)}
                          placeholder="0.00"
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="adjustment-reason">Reason</Label>
                        <Input
                          id="adjustment-reason"
                          value={adjustmentReason}
                          onChange={(e) => setAdjustmentReason(e.target.value)}
                          placeholder="Adjustment reason"
                          className="mt-1"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button
                          onClick={handleBalanceAdjustment}
                          disabled={!balanceAdjustment || !adjustmentReason || isLoading}
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {adjustmentType === 'ADD' ? (
                            <Plus className="h-4 w-4 mr-2" />
                          ) : (
                            <Minus className="h-4 w-4 mr-2" />
                          )}
                          Adjust
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Transaction History */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Recent Transactions
                    </CardTitle>
                    <Button variant="outline" size="sm">
                      View All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'CREDIT' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'CREDIT' ? (
                              <Plus className="h-5 w-5" />
                            ) : (
                              <Minus className="h-5 w-5" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{transaction.description}</p>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{transaction.category}</span>
                              <span>•</span>
                              <span>{format(transaction.createdAt, 'MMM dd, yyyy')}</span>
                              <Badge className={
                                transaction.status === 'completed' ? 'bg-green-100 text-green-700' :
                                transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-red-100 text-red-700'
                              }>
                                {transaction.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${
                            transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.type === 'CREDIT' ? '+' : '-'}${transaction.amount.toLocaleString()}
                          </p>
                          {transaction.recipientAccount && (
                            <p className="text-sm text-gray-500">To: {transaction.recipientAccount}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Risk Assessment */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Risk Score</span>
                      <Badge className={getRiskScoreColor(user.riskScore)}>
                        {getRiskScoreLabel(user.riskScore)}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          user.riskScore <= 30 ? 'bg-green-500' :
                          user.riskScore <= 70 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${user.riskScore}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{user.riskScore}/100</p>
                  </div>
                  
                  {user.creditScore && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Credit Score</span>
                        <span className="text-sm font-bold text-gray-900">{user.creditScore}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-green-500"
                          style={{ width: `${(user.creditScore / 850) * 100}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Excellent (740-850)</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* KYC Status */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    KYC Verification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <Badge className={getKycStatusColor(user.kycStatus)}>
                        {user.kycStatus.toUpperCase()}
                      </Badge>
                    </div>
                    
                    {user.kycDocuments.map((doc) => {
                      const StatusIcon = getStatusIcon(doc.status);
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <StatusIcon className={`h-4 w-4 ${
                              doc.status === 'approved' ? 'text-green-600' :
                              doc.status === 'pending' ? 'text-yellow-600' : 'text-red-600'
                            }`} />
                            <span className="text-sm text-gray-900">{doc.type}</span>
                          </div>
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Flags & Alerts */}
              {user.flags.length > 0 && (
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Active Flags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {user.flags.map((flag) => (
                        <Alert key={flag.id} className={
                          flag.severity === 'high' ? 'bg-red-50 border-red-200' :
                          flag.severity === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                          'bg-blue-50 border-blue-200'
                        }>
                          <AlertTriangle className={`h-4 w-4 ${
                            flag.severity === 'high' ? 'text-red-600' :
                            flag.severity === 'medium' ? 'text-yellow-600' :
                            'text-blue-600'
                          }`} />
                          <AlertDescription className="text-sm">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{flag.description}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {format(flag.createdAt, 'MMM dd, yyyy')}
                                </p>
                              </div>
                              {!flag.resolved && (
                                <Button size="sm" variant="outline">
                                  Resolve
                                </Button>
                              )}
                            </div>
                          </AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Issue Card
                  </Button>
                  <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700">
                    <Ban className="h-4 w-4 mr-2" />
                    Freeze Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}