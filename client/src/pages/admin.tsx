import { useState } from "react";
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
  UserX
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
import { format } from "date-fns";

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
      <div className="min-h-screen bg-gray-50">
        <Navbar user={authState.user || { name: '', email: '', role: 'USER' }} />
        <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <Shield className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
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
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-10">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Admin Dashboard</h1>
                <p className="text-blue-200 text-lg mt-1">Comprehensive banking administration portal</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-300">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>

        <Tabs defaultValue="overview" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-xl p-1.5">
            <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full font-medium text-sm sm:text-base py-2.5">
              <BarChart3 className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Stats</span>
              <span className="sm:hidden">📊</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full font-medium text-sm sm:text-base py-2.5">
              <Users className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">👥</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full font-medium text-sm sm:text-base py-2.5">
              <Receipt className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Transactions</span>
              <span className="sm:hidden">💳</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg text-blue-200 hover:text-white hover:bg-white/10 transition-all duration-200 rounded-full font-medium text-sm sm:text-base py-2.5">
              <History className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logs</span>
              <span className="sm:hidden">📋</span>
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-semibold text-blue-200 uppercase tracking-wide">Total Users</CardTitle>
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center group-hover:bg-blue-500/30 transition-colors">
                    <Users className="h-5 w-5 text-blue-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-white mb-2">
                    {statsLoading ? <Skeleton className="h-9 w-20 bg-white/20" /> : dashboardStats?.totalUsers || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <p className="text-sm text-green-400 font-medium">+2.5% from last month</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-semibold text-blue-200 uppercase tracking-wide">Active Users</CardTitle>
                  <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                    <UserCheck className="h-5 w-5 text-green-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-white mb-2">
                    {statsLoading ? <Skeleton className="h-9 w-20 bg-white/20" /> : dashboardStats?.activeUsers || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <p className="text-sm text-green-400 font-medium">98.5% active rate</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-semibold text-blue-200 uppercase tracking-wide">Total Transactions</CardTitle>
                  <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                    <Activity className="h-5 w-5 text-purple-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-white mb-2">
                    {statsLoading ? <Skeleton className="h-9 w-20 bg-white/20" /> : dashboardStats?.totalTransactions || 0}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
                    <p className="text-sm text-blue-400 font-medium">+15% this week</p>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                  <CardTitle className="text-sm font-semibold text-blue-200 uppercase tracking-wide">Total Balance</CardTitle>
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center group-hover:bg-amber-500/30 transition-colors">
                    <DollarSign className="h-5 w-5 text-amber-400" />
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-3xl font-bold text-white mb-2">
                    {statsLoading ? (
                      <Skeleton className="h-9 w-24 bg-white/20" />
                    ) : (
                      `$${(dashboardStats?.totalBalance || 0).toLocaleString()}`
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                    <p className="text-sm text-green-400 font-medium">+8.2% growth</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Transactions */}
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
              <CardHeader className="border-b border-white/10 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl font-bold text-white">Recent Transactions</CardTitle>
                      <p className="text-sm text-blue-200 mt-1">Latest financial activity</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="text-blue-300 border-blue-400/30 bg-white/5 hover:bg-white/10 hover:border-blue-300 transition-colors font-medium backdrop-blur-sm">
                    View All
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {statsLoading ? (
                  <div className="p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-4">
                        <Skeleton className="h-12 w-12 rounded-full bg-white/20" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-40 bg-white/20" />
                          <Skeleton className="h-3 w-24 bg-white/20" />
                        </div>
                        <Skeleton className="h-6 w-20 bg-white/20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {dashboardStats?.recentTransactions?.map((transaction, index) => (
                      <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                              transaction.type === 'CREDIT' 
                                ? 'bg-green-500/20 border-2 border-green-400/30' 
                                : 'bg-red-500/20 border-2 border-red-400/30'
                            }`}>
                              {transaction.type === 'CREDIT' ? 
                                <Plus className="h-5 w-5 text-green-400" /> : 
                                <Minus className="h-5 w-5 text-red-400" />
                              }
                            </div>
                            <div>
                              <p className="font-semibold text-white">{transaction.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <p className="text-sm text-blue-200">{transaction.user.name}</p>
                                <span className="text-blue-300">•</span>
                                <p className="text-sm text-blue-300">
                                  {format(new Date(transaction.createdAt), 'MMM dd, HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-lg font-bold ${
                              transaction.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'CREDIT' ? '+' : '-'}${transaction.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <div className={`w-2 h-2 rounded-full ${
                                transaction.type === 'CREDIT' ? 'bg-green-400' : 'bg-red-400'
                              }`}></div>
                              <span className="text-xs text-blue-300 uppercase tracking-wide">
                                {transaction.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )) || (
                      <div className="p-12 text-center">
                        <Receipt className="h-12 w-12 text-blue-300 mx-auto mb-4" />
                        <p className="text-blue-200">No recent transactions</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-8">
            <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
              <CardHeader className="border-b border-white/10 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-400" />
                      </div>
                      <CardTitle className="text-xl font-bold text-white">User Management</CardTitle>
                    </div>
                    <p className="text-sm text-blue-200">Manage user accounts, balances, and permissions</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="text-blue-200 border-blue-400/30 bg-white/5 hover:bg-white/10 hover:border-blue-300 transition-colors font-medium backdrop-blur-sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Settings
                    </Button>
                    <Button variant="outline" size="sm" className="text-blue-300 border-blue-400/30 bg-white/5 hover:bg-white/10 hover:border-blue-300 transition-colors font-medium backdrop-blur-sm">
                      Export
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
                      <div key={user.id} className="p-6 hover:bg-gray-50/80 transition-all duration-200 border-l-4 border-l-transparent hover:border-l-blue-500">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                          <div className="flex items-center space-x-4 flex-1 min-w-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                              <span className="text-white font-bold text-lg">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="font-bold text-gray-800 text-lg truncate">{user.name}</h3>
                                <div className="flex gap-2 flex-wrap">
                                  <Badge 
                                    variant={user.role === 'ADMIN' ? 'default' : 'secondary'}
                                    className={user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 border-purple-200 text-xs font-semibold px-2.5 py-1' : 'bg-gray-100 text-gray-600 border-gray-200 text-xs font-semibold px-2.5 py-1'}
                                  >
                                    {user.role}
                                  </Badge>
                                  <Badge 
                                    variant={user.isActive ? 'default' : 'destructive'}
                                    className={user.isActive ? 'bg-green-100 text-green-700 border-green-200 text-xs font-semibold px-2.5 py-1' : 'bg-red-100 text-red-700 border-red-200 text-xs font-semibold px-2.5 py-1'}
                                  >
                                    {user.isActive ? 'Active' : 'Inactive'}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-gray-600 mb-3 truncate">{user.email}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  <p className="text-sm font-semibold text-gray-700">
                                    Balance: <span className="text-green-600 font-bold text-base">${user.balance.toLocaleString()}</span>
                                  </p>
                                </div>
                                <p className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full font-medium">
                                  {user.accountType} Account
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-end gap-2 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white border-gray-200 text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 transition-all duration-200 p-2.5 rounded-lg shadow-sm hover:shadow-md"
                              onClick={() => handleEditUser(user)}
                              title="Edit User"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-white border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all duration-200 p-2.5 rounded-lg shadow-sm hover:shadow-md"
                              onClick={() => handleBalanceUpdate(user)}
                              title="Update Balance"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className={user.isActive 
                                ? 'bg-white border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200 p-2.5 rounded-lg shadow-sm hover:shadow-md' 
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300 transition-all duration-200 p-2.5 rounded-lg shadow-sm hover:shadow-md'
                              }
                              onClick={() => toggleUserStatusMutation.mutate(user.id)}
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                            </Button>
                            {user.role !== 'ADMIN' && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    className="bg-white border-gray-200 text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all duration-200 p-2.5 rounded-lg shadow-sm hover:shadow-md"
                                    title="Delete User"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-white mx-4 max-w-md">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="text-gray-900">Delete User</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-600">
                                      Are you sure you want to delete {user.name}? This action cannot be undone and will permanently remove all user data.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter className="flex gap-2">
                                    <AlertDialogCancel className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteUserMutation.mutate(user.id)}
                                      className="bg-red-600 hover:bg-red-700 text-white border-red-600"
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
          <TabsContent value="transactions" className="space-y-8">
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-100 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-green-600" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-800">Transaction Management</CardTitle>
                    </div>
                    <p className="text-sm text-gray-500">View and manage all system transactions</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium">
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors font-medium">
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
                      <div key={transaction.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center space-x-3 sm:space-x-4 flex-1 min-w-0">
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                              transaction.type === 'CREDIT' 
                                ? 'bg-green-100 border-2 border-green-200' 
                                : 'bg-red-100 border-2 border-red-200'
                            }`}>
                              {transaction.type === 'CREDIT' ? 
                                <Plus className="h-5 w-5 text-green-600" /> : 
                                <Minus className="h-5 w-5 text-red-600" />
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{transaction.description}</p>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mt-1">
                                <p className="text-sm text-gray-600 truncate">{transaction.user.name}</p>
                                <span className="text-gray-300 hidden sm:inline">•</span>
                                <p className="text-sm text-gray-500">
                                  {format(new Date(transaction.createdAt), 'MMM dd, HH:mm')}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-lg font-bold ${
                              transaction.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.type === 'CREDIT' ? '+' : '-'}${transaction.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <div className={`w-2 h-2 rounded-full ${
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
                        <Receipt className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No transactions available</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Logs Tab */}
          <TabsContent value="logs" className="space-y-8">
            <Card className="bg-white border border-gray-200 shadow-md">
              <CardHeader className="border-b border-gray-100 pb-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                        <History className="h-5 w-5 text-indigo-600" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-800">Activity Logs</CardTitle>
                    </div>
                    <p className="text-sm text-gray-500">Track all administrative actions and system activities</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="text-gray-600 border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium">
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-colors font-medium">
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
                      <div key={log.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center">
                              <History className="h-5 w-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="font-semibold text-gray-900">
                                  {log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </p>
                                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
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
                                <p className="text-sm text-gray-600 mt-1 italic">{log.description}</p>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            {log.amount && (
                              <p className="font-bold text-lg text-green-600 mb-1">
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
                        <History className="h-12 w-12 text-gray-300 mx-auto mb-4" />
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
        <DialogContent className="bg-white mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Update User Balance</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update the balance for {selectedUser?.name}. Current balance: ${selectedUser?.balance.toLocaleString()}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="action" className="text-gray-700">Action</Label>
              <Select value={balanceAction} onValueChange={(value: 'ADD' | 'SUBTRACT') => setBalanceAction(value)}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADD">Add Funds</SelectItem>
                  <SelectItem value="SUBTRACT">Subtract Funds</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="amount" className="text-gray-700">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={balanceAmount}
                onChange={(e) => setBalanceAmount(e.target.value)}
                placeholder="0.00"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-700">Description</Label>
              <Input
                id="description"
                value={balanceDescription}
                onChange={(e) => setBalanceDescription(e.target.value)}
                placeholder="Reason for balance update"
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setBalanceModalOpen(false)} className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitBalanceUpdate}
              disabled={updateBalanceMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateBalanceMutation.isPending ? 'Updating...' : 'Update Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-white mx-4 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Edit User</DialogTitle>
            <DialogDescription className="text-gray-600">
              Update user information for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name" className="text-gray-700">Name</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-email" className="text-gray-700">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData(prev => ({ ...prev, email: e.target.value }))}
                className="border-gray-300 focus:border-blue-500"
              />
            </div>
            <div>
              <Label htmlFor="edit-role" className="text-gray-700">Role</Label>
              <Select value={editFormData.role} onValueChange={(value: 'USER' | 'ADMIN') => setEditFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-account-type" className="text-gray-700">Account Type</Label>
              <Select value={editFormData.accountType} onValueChange={(value: 'CHECKING' | 'SAVINGS' | 'BUSINESS') => setEditFormData(prev => ({ ...prev, accountType: value }))}>
                <SelectTrigger className="border-gray-300 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHECKING">Checking</SelectItem>
                  <SelectItem value="SAVINGS">Savings</SelectItem>
                  <SelectItem value="BUSINESS">Business</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="edit-active"
                checked={editFormData.isActive}
                onChange={(e) => setEditFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                className="border-gray-300 focus:ring-blue-500"
              />
              <Label htmlFor="edit-active" className="text-gray-700">Active Account</Label>
            </div>
          </div>
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setEditModalOpen(false)} className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-300">
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitEditUser}
              disabled={updateUserMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {updateUserMutation.isPending ? 'Updating...' : 'Update User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}