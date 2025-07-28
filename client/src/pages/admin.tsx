import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import Navbar from "@/components/navbar";
import EnhancedStatCard from "@/components/admin/EnhancedStatCard";
import NotificationCenter from "@/components/admin/NotificationCenter";
import SystemStatus from "@/components/admin/SystemStatus";
import TimeRangeFilter, { type TimeRange } from "@/components/admin/TimeRangeFilter";
import {
  Users,
  DollarSign,
  Activity,
  BarChart3,
  Edit,
  Trash2,
  Plus,
  Minus,
  AlertCircle,
  Clock,
  Shield,
  TrendingUp,
  Receipt,
  Settings,
  History,
  CreditCard,
  UserCheck,
  UserX,
  Menu,
  X,
  Zap
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays } from "date-fns";

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  balance: number;
  accountType: 'CHECKING' | 'SAVINGS' | 'BUSINESS';
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
}

interface AdminLog {
  id: string;
  action: string;
  targetUserId: string | null;
  amount: number | null;
  description: string | null;
  createdAt: string;
  admin: {
    name: string;
    email: string;
  };
  targetUser: {
    name: string;
    email: string;
  } | null;
}

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalTransactions: number;
  totalBalance: number;
  recentTransactions: Array<{
    id: string;
    type: 'CREDIT' | 'DEBIT';
    amount: number;
    description: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
}

export default function AdminNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authState = authManager.getState();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [balanceModalOpen, setBalanceModalOpen] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [balanceAction, setBalanceAction] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [balanceDescription, setBalanceDescription] = useState('');
  const [editFormData, setEditFormData] = useState({ 
    name: '', 
    email: '', 
    role: 'USER' as 'USER' | 'ADMIN', 
    accountType: 'CHECKING' as 'CHECKING' | 'SAVINGS' | 'BUSINESS', 
    isActive: true 
  });
  const [selectedTimeRange, setSelectedTimeRange] = useState<TimeRange>({
    key: 'last7days',
    label: 'Last 7 days',
    from: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    to: new Date()
  });
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  // Queries
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users'],
    enabled: authState.isAuthenticated && authState.user?.role === 'ADMIN',
  });

  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/admin/dashboard'],
    enabled: authState.isAuthenticated && authState.user?.role === 'ADMIN',
  });

  const { data: logsData, isLoading: logsLoading } = useQuery({
    queryKey: ['/api/admin/logs'],
    enabled: authState.isAuthenticated && authState.user?.role === 'ADMIN',
  });

  // Mutations
  const updateUserMutation = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: any }) => {
      const response = await apiRequest("PATCH", `/api/admin/users/${userId}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setEditModalOpen(false);
      toast({
        title: "User updated",
        description: "User details have been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Failed to update user. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateBalanceMutation = useMutation({
    mutationFn: async ({ userId, amount, action, description }: {
      userId: string;
      amount: number;
      action: 'ADD' | 'SUBTRACT';
      description: string;
    }) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/balance`, {
        amount,
        action,
        description,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      setBalanceModalOpen(false);
      setBalanceAmount('');
      setBalanceDescription('');
      toast({
        title: "Balance updated",
        description: "User balance has been successfully updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Balance update failed",
        description: error.message || "Failed to update balance. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleUserStatusMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("POST", `/api/admin/users/${userId}/toggle-status`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      toast({
        title: "User status updated",
        description: "User status has been successfully changed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Status update failed",
        description: error.message || "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
      toast({
        title: "User deleted",
        description: "User account has been successfully deleted.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Delete failed",
        description: error.message || "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Event handlers
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      accountType: user.accountType,
      isActive: user.isActive
    });
    setEditModalOpen(true);
  };

  const handleSubmitEditUser = () => {
    if (!selectedUser) return;
    
    updateUserMutation.mutate({
      userId: selectedUser.id,
      updates: editFormData
    });
  };

  const handleBalanceUpdate = (user: User) => {
    setSelectedUser(user);
    setBalanceModalOpen(true);
  };

  const handleSubmitBalanceUpdate = () => {
    if (!selectedUser || !balanceAmount || !balanceDescription) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    updateBalanceMutation.mutate({
      userId: selectedUser.id,
      amount: parseFloat(balanceAmount),
      action: balanceAction,
      description: balanceDescription,
    });
  };

  const users = (usersData as any)?.users || [];
  const logs = (logsData as any)?.logs || [];
  const stats = dashboardStats || {};

  if (!authState.isAuthenticated || authState.user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user || { name: '', email: '', role: 'USER' }} />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-2xl">
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2 text-gray-900">Access Denied</h2>
              <p className="text-gray-600">You need admin privileges to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Admin Dashboard</h1>
                  <p className="text-gray-200 text-xs sm:text-sm lg:text-base mt-1">Comprehensive banking administration portal</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <TimeRangeFilter 
                  value={selectedTimeRange} 
                  onChange={setSelectedTimeRange}
                  className="w-full sm:w-auto"
                />
                <NotificationCenter />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-300 mb-6">
              <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
              <span>Last updated: {format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
            </div>
          </div>

        <Tabs defaultValue="overview" className="space-y-4 sm:space-y-6">
          {/* Mobile Navigation Toggle */}
          <div className="sm:hidden mb-4">
            <Button
              variant="outline"
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="w-full justify-between bg-white/95 backdrop-blur-sm border border-white/20 hover:bg-white/90 transition-colors rounded-xl p-4 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <Menu className="h-4 w-4" />
                <span className="font-semibold">Navigation Menu</span>
              </div>
              {isMobileNavOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
            
            {isMobileNavOpen && (
              <div className="mt-3 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl shadow-xl overflow-hidden">
                <div className="grid grid-cols-1 divide-y divide-gray-100">
                  <button className="flex items-center gap-3 p-4 hover:bg-blue-50 transition-colors text-left">
                    <BarChart3 className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Overview</div>
                      <div className="text-sm text-gray-500">Dashboard stats & analytics</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 hover:bg-green-50 transition-colors text-left">
                    <Users className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Users</div>
                      <div className="text-sm text-gray-500">Manage user accounts</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 hover:bg-purple-50 transition-colors text-left">
                    <Receipt className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Transactions</div>
                      <div className="text-sm text-gray-500">Financial activity</div>
                    </div>
                  </button>
                  <button className="flex items-center gap-3 p-4 hover:bg-orange-50 transition-colors text-left">
                    <History className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-semibold text-gray-900">Activity Logs</div>
                      <div className="text-sm text-gray-500">System audit trail</div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Desktop/Tablet Navigation */}
          <TabsList className="hidden sm:grid w-full grid-cols-4 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-1.5 shadow-lg overflow-hidden">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-[1.02] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-lg font-semibold text-xs sm:text-sm lg:text-base py-3 px-2 sm:px-3 min-h-[44px] flex items-center justify-center gap-1.5">
              <BarChart3 className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Overview</span>
              <span className="sm:hidden text-xs font-medium">Stats</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-[1.02] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-lg font-semibold text-xs sm:text-sm lg:text-base py-3 px-2 sm:px-3 min-h-[44px] flex items-center justify-center gap-1.5">
              <Users className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Users</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-[1.02] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-lg font-semibold text-xs sm:text-sm lg:text-base py-3 px-2 sm:px-3 min-h-[44px] flex items-center justify-center gap-1.5">
              <Receipt className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden sm:inline">Transactions</span>
              <span className="sm:hidden text-xs font-medium">Trans</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:scale-[1.02] text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-all duration-200 rounded-lg font-semibold text-xs sm:text-sm lg:text-base py-3 px-2 sm:px-3 min-h-[44px] flex items-center justify-center gap-1.5">
              <History className="h-4 w-4 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium">Logs</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6">
            {/* Enhanced Stat Cards */}
            <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-4">
              <EnhancedStatCard
                title="Total Users"
                value={dashboardStats?.totalUsers || 0}
                change={{
                  value: 2.5,
                  period: "vs last month",
                  type: "positive"
                }}
                icon={Users}
                color="blue"
                trend={[45, 52, 48, 61, 55, 67, 69, 63]}
                loading={statsLoading}
                lastUpdated={new Date()}
                subtitle="Registered accounts"
                onClick={() => console.log('Navigate to users')}
                onRefresh={async () => {
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
                }}
              />
              
              <EnhancedStatCard
                title="Active Users"
                value={dashboardStats?.activeUsers || 0}
                change={{
                  value: 5.2,
                  period: "vs last week",
                  type: "positive"
                }}
                icon={UserCheck}
                color="green"
                trend={[38, 42, 45, 47, 49, 51, 48, 52]}
                loading={statsLoading}
                lastUpdated={new Date()}
                subtitle="98.5% active rate"
                onClick={() => console.log('Navigate to active users')}
                onRefresh={async () => {
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
                }}
              />
              
              <EnhancedStatCard
                title="Transactions"
                value={dashboardStats?.totalTransactions || 0}
                change={{
                  value: 15.0,
                  period: "this week",
                  type: "positive"
                }}
                icon={Activity}
                color="purple"
                trend={[120, 132, 128, 145, 140, 158, 162, 155]}
                loading={statsLoading}
                lastUpdated={new Date()}
                subtitle="All-time volume"
                onClick={() => console.log('Navigate to transactions')}
                onRefresh={async () => {
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
                }}
              />
              
              <EnhancedStatCard
                title="Total Balance"
                value={`$${(dashboardStats?.totalBalance || 0).toLocaleString()}`}
                change={{
                  value: 8.2,
                  period: "growth",
                  type: "positive"
                }}
                icon={DollarSign}
                color="orange"
                trend={[8500, 9200, 8800, 9600, 9300, 10100, 9900, 10400]}
                loading={statsLoading}
                lastUpdated={new Date()}
                subtitle="System-wide funds"
                onClick={() => console.log('Navigate to financials')}
                onRefresh={async () => {
                  queryClient.invalidateQueries({ queryKey: ['/api/admin/dashboard'] });
                }}
              />
            </div>
            
            {/* System Status and Recent Transactions Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <SystemStatus />
              </div>
              <div className="lg:col-span-1">
                <Card className="bg-white/95 backdrop-blur-sm border border-white/20 shadow-xl h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-green-50 to-green-100 rounded-xl flex items-center justify-center shadow-sm">
                        <Zap className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
                        <p className="text-sm text-gray-500 mt-1">Administrative shortcuts</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full justify-start bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200" variant="ghost">
                      <Users className="h-4 w-4 mr-3" />
                      Manage Users
                    </Button>
                    <Button className="w-full justify-start bg-green-50 text-green-700 hover:bg-green-100 border border-green-200" variant="ghost">
                      <Receipt className="h-4 w-4 mr-3" />
                      Review Transactions
                    </Button>
                    <Button className="w-full justify-start bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200" variant="ghost">
                      <History className="h-4 w-4 mr-3" />
                      Activity Logs
                    </Button>
                    <Button className="w-full justify-start bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200" variant="ghost">
                      <Settings className="h-4 w-4 mr-3" />
                      System Settings
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Recent Transactions */}
            <Card className="bg-white border border-gray-200 shadow-md hover:shadow-lg transition-all duration-300 rounded-2xl overflow-hidden">
              <CardHeader className="border-b border-gray-200 pb-6 px-6 pt-6 bg-gradient-to-r from-gray-50 to-gray-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                      <TrendingUp className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-1">Recent Transactions</CardTitle>
                      <p className="text-base text-gray-700 font-medium">Latest financial activity</p>
                    </div>
                  </div>
                  <Button 
                    variant="default" 
                    size="default" 
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 border-0 min-h-[48px]"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    View All Transactions
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {statsLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-full bg-gray-200" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40 bg-gray-200" />
                          <Skeleton className="h-3 w-24 bg-gray-200" />
                        </div>
                        <Skeleton className="h-6 w-20 bg-gray-200" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {dashboardStats?.recentTransactions?.map((transaction, index) => (
                      <div key={transaction.id} className="p-6 hover:bg-gradient-to-r hover:from-gray-50 hover:to-white transition-all duration-300 hover:shadow-sm cursor-pointer group">
                        <div className="flex items-center justify-between gap-6">
                          <div className="flex items-center space-x-5 flex-1">
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 transition-transform group-hover:scale-105 ${
                              transaction.type === 'CREDIT' 
                                ? 'bg-gradient-to-br from-green-500 to-green-600 border-2 border-green-300' 
                                : 'bg-gradient-to-br from-red-500 to-red-600 border-2 border-red-300'
                            }`}>
                              {transaction.type === 'CREDIT' ? 
                                <Plus className="h-8 w-8 text-white font-bold" /> : 
                                <Minus className="h-8 w-8 text-white font-bold" />
                              }
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-gray-800">{transaction.description}</h3>
                              <div className="flex items-center gap-3">
                                <p className="text-base text-gray-800 font-semibold">{transaction.user.name}</p>
                                <span className="text-gray-400">•</span>
                                <p className="text-sm text-gray-600 font-medium">
                                  {format(new Date(transaction.createdAt), 'MMM dd, yyyy HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-2xl font-black mb-2 ${
                              transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'CREDIT' ? '+' : ''}${transaction.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center justify-end gap-2">
                              <div className={`w-3 h-3 rounded-full shadow-sm ${
                                transaction.type === 'CREDIT' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm ${
                                transaction.type === 'CREDIT' 
                                  ? 'bg-green-100 text-green-800 border border-green-200' 
                                  : 'bg-red-100 text-red-800 border border-red-200'
                              }`}>
                                {transaction.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="p-16 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <Receipt className="h-10 w-10 text-gray-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-3 text-lg">No Recent Transactions</h3>
                        <p className="text-gray-700 font-medium">Transaction activity will appear here once available</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4 sm:space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-3 sm:pb-4 px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
                      </div>
                      <CardTitle className="text-sm sm:text-lg font-semibold text-gray-900">User Management</CardTitle>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 hidden sm:block">Manage user accounts, balances, and permissions</p>
                  </div>
                  <div className="flex gap-1 sm:gap-2">
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm px-2 sm:px-3 hidden sm:inline-flex">
                      <Settings className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors font-medium text-xs sm:text-sm px-2 sm:px-3">
                      <span className="hidden sm:inline">Export</span>
                      <span className="sm:hidden">Export</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {usersLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-48" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                        <Skeleton className="h-8 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {users.map((user: User) => (
                      <div key={user.id} className="p-4 sm:p-5 hover:bg-gray-50 transition-all duration-200 hover:shadow-sm border-b border-gray-100 last:border-b-0">
                        <div className="flex flex-col gap-4">
                          <div className="flex items-start space-x-4 flex-1 min-w-0">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                              <span className="text-blue-700 font-bold text-sm sm:text-base">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-start gap-2 mb-2">
                                <h3 className="font-semibold text-gray-900 truncate text-base sm:text-lg">{user.name}</h3>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge 
                                    variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                                    className={user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200 text-xs px-2 py-1 font-medium' : 'bg-gray-100 text-gray-600 border-gray-200 text-xs px-2 py-1 font-medium'}
                                  >
                                    {user.role}
                                  </Badge>
                                  <Badge 
                                    variant={user.isActive ? 'default' : 'destructive'}
                                    className={user.isActive ? 'bg-green-100 text-green-700 border-green-200 text-xs px-2 py-1 font-medium' : 'bg-red-100 text-red-700 border-red-200 text-xs px-2 py-1 font-medium'}
                                  >
                                    {user.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm sm:text-base text-gray-600 mb-3 truncate">{user.email}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <p className="text-sm sm:text-base text-gray-700">
                                    Balance: <span className="text-green-600 font-bold">${user.balance.toLocaleString()}</span>
                                  </p>
                                </div>
                                <div className="inline-flex items-center px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full border">
                                  {user.accountType}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Mobile-Optimized Action Buttons */}
                          <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 border-t border-gray-100">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-200 rounded-lg font-medium shadow-sm hover:shadow-md"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Edit User</span>
                              <span className="sm:hidden">Edit</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-600 hover:border-green-300 transition-all duration-200 rounded-lg font-medium shadow-sm hover:shadow-md"
                              onClick={() => handleBalanceUpdate(user)}
                            >
                              <DollarSign className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Balance</span>
                              <span className="sm:hidden">$</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={`flex-1 sm:flex-none min-h-[44px] px-4 py-2 border-gray-200 text-gray-600 transition-all duration-200 rounded-lg font-medium shadow-sm hover:shadow-md ${
                                user.isActive 
                                  ? 'hover:bg-red-50 hover:text-red-600 hover:border-red-300' 
                                  : 'hover:bg-green-50 hover:text-green-600 hover:border-green-300'
                              }`}
                              onClick={() => toggleUserStatusMutation.mutate(user.id)}
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Deactivate</span>
                                  <span className="sm:hidden">Disable</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 mr-2" />
                                  <span className="hidden sm:inline">Activate</span>
                                  <span className="sm:hidden">Enable</span>
                                </>
                              )}
                            </Button>
                            {user.role !== 'ADMIN' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="flex-1 sm:flex-none min-h-[44px] px-4 py-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200 rounded-lg font-medium shadow-sm hover:shadow-md"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    <span className="hidden sm:inline">Delete</span>
                                    <span className="sm:hidden">Del</span>
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white mx-4 max-w-md rounded-xl shadow-2xl">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-900 text-lg font-semibold">Delete User</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600 text-base leading-relaxed">
                                      Are you sure you want to delete <span className="font-semibold text-gray-900">{user.name}</span>? This action cannot be undone and will permanently remove all user data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 pt-4">
                                    <AlertDialogCancel className="w-full sm:w-auto bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 min-h-[44px] rounded-lg font-medium">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white border-red-600 min-h-[44px] rounded-lg font-medium shadow-lg hover:shadow-xl"
                                    >
                                      Delete User
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                        <Receipt className="h-4 w-4 text-green-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Transaction Management</CardTitle>
                    </div>
                    <p className="text-sm text-gray-500">View and manage all system transactions</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors font-medium">
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors font-medium">
                      Export
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {statsLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                    {dashboardStats?.recentTransactions?.map((transaction, index) => (
                      <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-center space-x-3 flex-1 min-w-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                              transaction.type === 'CREDIT' 
                                ? 'bg-green-50 border border-green-200' 
                                : 'bg-red-50 border border-red-200'
                            }`}>
                              {transaction.type === 'CREDIT' ? 
                                <Plus className="h-4 w-4 text-green-600" /> : 
                                <Minus className="h-4 w-4 text-red-600" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-0.5">
                                <p className="text-sm text-gray-600 truncate">{transaction.user.name}</p>
                                <span className="text-gray-300 hidden sm:inline">•</span>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(transaction.createdAt), 'MMM dd, HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-base font-semibold ${
                              transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'CREDIT' ? '+' : '-'}${transaction.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-0.5">
                              <div className={`w-1.5 h-1.5 rounded-full ${
                                transaction.type === 'CREDIT' ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <span className="text-xs text-gray-500 uppercase tracking-wide">
                                {transaction.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="p-12 text-center">
                        <Receipt className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No transactions available</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs" className="space-y-6">
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
                        <History className="h-4 w-4 text-indigo-600" />
                      </div>
                      <CardTitle className="text-lg font-semibold text-gray-900">Activity Logs</CardTitle>
                    </div>
                    <p className="text-sm text-gray-500">Track all administrative actions and system activities</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors font-medium">
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 transition-colors font-medium">
                      Export Logs
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {logsLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(8)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-3 w-48" />
                        </div>
                        <Skeleton className="h-4 w-20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {logs.map((log: AdminLog) => (
                      <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center">
                              <History className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-medium text-gray-900">
                                  {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                  {log.action.split('_')[0]}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <span>by</span>
                                <span className="font-medium text-gray-900">{log.admin.name}</span>
                                {log.targetUser && (
                                  <>
                                    <span className="text-gray-400">→</span>
                                    <span className="font-medium text-gray-900">{log.targetUser.name}</span>
                                  </>
                                )}
                              </div>
                              {log.description && (
                                <p className="text-sm text-gray-600 mt-1">{log.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {log.amount && (
                              <p className="font-semibold text-base text-green-600 mb-1">
                                ${Number(log.amount).toLocaleString()}
                              </p>
                            )}
                            <p className="text-sm text-gray-500">
                              {format(new Date(log.createdAt), 'MMM dd, yyyy')}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(log.createdAt), 'HH:mm:ss')}
                            </p>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="p-12 text-center">
                        <History className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No activity logs available</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Balance Update Modal */}
      <Dialog open={balanceModalOpen} onOpenChange={setBalanceModalOpen}>
        <DialogContent className="bg-white mx-4 max-w-md rounded-2xl shadow-2xl border-0">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-gray-900 text-xl font-bold">Update User Balance</DialogTitle>
            <DialogDescription className="text-gray-600 text-base leading-relaxed">
              Update the balance for <span className="font-semibold text-gray-900">{selectedUser?.name}</span>. 
              <br />Current balance: <span className="font-bold text-green-600">${selectedUser?.balance.toLocaleString()}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="action" className="text-gray-700 font-semibold text-base">Action</Label>
              <Select value={balanceAction} onValueChange={(value: 'ADD' | 'SUBTRACT') => setBalanceAction(value)}>
                <SelectTrigger className="min-h-[48px] border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="ADD" className="text-base py-3">Add Funds</SelectItem>
                  <SelectItem value="SUBTRACT" className="text-base py-3">Subtract Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount" className="text-gray-700 font-semibold text-base">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="0.00"
                className="min-h-[48px] border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base px-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-700 font-semibold text-base">Description</Label>
              <Input
                id="description"
                value={balanceDescription}
                onChange={(e) => setBalanceDescription(e.target.value)}
                placeholder="Reason for balance update"
                className="min-h-[48px] border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base px-4"
              />
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setBalanceModalOpen(false)} 
              className="w-full sm:w-auto bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 min-h-[48px] rounded-xl font-semibold text-base"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitBalanceUpdate}
              disabled={updateBalanceMutation.isPending}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {updateBalanceMutation.isPending ? 'Updating...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-white mx-4 max-w-md rounded-2xl shadow-2xl border-0 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-gray-900 text-xl font-bold">Edit User</DialogTitle>
            <DialogDescription className="text-gray-600 text-base leading-relaxed">
              Update user information for <span className="font-semibold text-gray-900">{selectedUser?.name}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="edit-name" className="text-gray-700 font-semibold text-base">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                className="min-h-[48px] border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base px-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email" className="text-gray-700 font-semibold text-base">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                className="min-h-[48px] border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base px-4"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role" className="text-gray-700 font-semibold text-base">Role</Label>
              <Select value={editFormData.role} onValueChange={(value: 'USER' | 'ADMIN') => setEditFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="min-h-[48px] border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="USER" className="text-base py-3">User</SelectItem>
                  <SelectItem value="ADMIN" className="text-base py-3">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-account-type" className="text-gray-700 font-semibold text-base">Account Type</Label>
              <Select value={editFormData.accountType} onValueChange={(value: 'CHECKING' | 'SAVINGS' | 'BUSINESS') => setEditFormData(prev => ({ ...prev, accountType: value }))}>
                <SelectTrigger className="min-h-[48px] border-2 border-gray-200 focus:border-blue-500 rounded-xl text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="CHECKING" className="text-base py-3">Checking</SelectItem>
                  <SelectItem value="SAVINGS" className="text-base py-3">Savings</SelectItem>
                  <SelectItem value="BUSINESS" className="text-base py-3">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-xl">
              <input
                type="checkbox"
                id="edit-active"
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="w-5 h-5 border-2 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <Label htmlFor="edit-active" className="text-gray-700 font-semibold text-base cursor-pointer">Active Account</Label>
            </div>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6">
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)} 
              className="w-full sm:w-auto bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300 min-h-[48px] rounded-xl font-semibold text-base"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEditUser}
              disabled={updateUserMutation.isPending}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white min-h-[48px] rounded-xl font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
            >
              {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}