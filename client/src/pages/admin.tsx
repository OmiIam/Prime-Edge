import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { authManager } from "@/lib/auth";
import Navbar from "@/components/navbar";
import FundModal from "@/components/fund-modal";
import EditUserModal from "@/components/edit-user-modal";
import TransactionModal from "@/components/transaction-modal";
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
  CreditCard
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
import { format } from "date-fns";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  balance: string;
  accountNumber: string;
  accountType: string;
  createdAt: string;
  lastLogin: string | null;
}

interface AdminLog {
  id: number;
  adminId: number;
  action: string;
  targetUserId: number | null;
  amount: string | null;
  createdAt: string;
  adminName: string;
  targetUserName: string | null;
}

export default function Admin() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const authState = authManager.getState();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [fundModalOpen, setFundModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ['/api/admin/users'],
    enabled: authState.isAuthenticated && authState.user?.role === 'admin',
  });

  const { data: logs, isLoading: logsLoading } = useQuery<AdminLog[]>({
    queryKey: ['/api/admin/logs'],
    enabled: authState.isAuthenticated && authState.user?.role === 'admin',
  });

  const { data: statistics, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/statistics'],
    enabled: authState.isAuthenticated && authState.user?.role === 'admin',
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const response = await apiRequest("DELETE", `/api/admin/users/${userId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logs'] });
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

  const handleFundManagement = (user: User) => {
    setSelectedUser(user);
    setFundModalOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setEditModalOpen(true);
  };

  const handleCreateTransaction = (user: User) => {
    setSelectedUser(user);
    setTransactionModalOpen(true);
  };

  const handleDeleteUser = (userId: number) => {
    deleteUserMutation.mutate(userId);
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'add_funds':
        return <Plus className="h-4 w-4 text-prime-success" />;
      case 'subtract_funds':
        return <Minus className="h-4 w-4 text-prime-error" />;
      case 'delete_user':
        return <Trash2 className="h-4 w-4 text-prime-error" />;
      case 'edit_user':
        return <Edit className="h-4 w-4 text-prime-accent" />;
      case 'manual_transaction':
        return <Receipt className="h-4 w-4 text-prime-accent" />;
      default:
        return <AlertCircle className="h-4 w-4 text-prime-warning" />;
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'add_funds':
        return 'Added Funds';
      case 'subtract_funds':
        return 'Removed Funds';
      case 'delete_user':
        return 'Deleted User';
      case 'edit_user':
        return 'Edited User';
      case 'manual_transaction':
        return 'Manual Transaction';
      default:
        return action.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  if (usersLoading || logsLoading) {
    return (
      <div className="min-h-screen bg-prime-navy text-white">
        <Navbar user={authState.user!} />
        <div className="pt-16 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2 bg-prime-slate" />
              <Skeleton className="h-4 w-96 bg-prime-slate" />
            </div>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <Card key={i} className="gradient-card border-prime-slate/30">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2 bg-prime-slate" />
                    <Skeleton className="h-8 w-32 mb-1 bg-prime-slate" />
                    <Skeleton className="h-3 w-20 bg-prime-slate" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!users || !logs) {
    return (
      <div className="min-h-screen bg-prime-navy text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to load admin panel</h2>
          <p className="text-gray-300">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const displayStats = statistics || {
    totalUsers: users.length,
    totalAssets: users.reduce((sum, user) => sum + parseFloat(user.balance), 0),
    dailyTransactions: logs.filter(log => 
      new Date(log.createdAt).toDateString() === new Date().toDateString()
    ).length,
    totalTransactions: logs.length,
  };

  return (
    <div className="min-h-screen bg-prime-navy text-white">
      <Navbar user={authState.user!} />
      
      <div className="pt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Administrative Control Panel</h1>
            <p className="text-gray-300">Complete user and fund management capabilities.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card className="gradient-card border-prime-slate/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Total Users</span>
                  <Users className="h-5 w-5 text-prime-accent" />
                </div>
                <div className="text-3xl font-bold text-white">{displayStats.totalUsers.toLocaleString()}</div>
                <div className="text-sm text-prime-success mt-1">All accounts</div>
              </CardContent>
            </Card>
            
            <Card className="gradient-card border-prime-slate/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Total Assets</span>
                  <DollarSign className="h-5 w-5 text-prime-accent" />
                </div>
                <div className="text-3xl font-bold text-white">${displayStats.totalAssets.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div className="text-sm text-prime-success mt-1">Under management</div>
              </CardContent>
            </Card>
            
            <Card className="gradient-card border-prime-slate/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Daily Transactions</span>
                  <Activity className="h-5 w-5 text-prime-accent" />
                </div>
                <div className="text-3xl font-bold text-white">{displayStats.dailyTransactions}</div>
                <div className="text-sm text-gray-400 mt-1">Today</div>
              </CardContent>
            </Card>
            
            <Card className="gradient-card border-prime-slate/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Total Transactions</span>
                  <BarChart3 className="h-5 w-5 text-prime-accent" />
                </div>
                <div className="text-3xl font-bold text-white">{displayStats.totalTransactions}</div>
                <div className="text-sm text-gray-400 mt-1">All time</div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-prime-charcoal border border-prime-slate/30">
              <TabsTrigger value="users" className="data-[state=active]:bg-prime-accent data-[state=active]:text-white">
                User Management
              </TabsTrigger>
              <TabsTrigger value="logs" className="data-[state=active]:bg-prime-accent data-[state=active]:text-white">
                Activity Logs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users">
              <Card className="gradient-card border-prime-slate/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    User Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {users.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-prime-navy/30 rounded-lg border border-prime-slate/20">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-prime-accent to-blue-500 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold">
                              {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white">{user.name}</div>
                            <div className="text-sm text-gray-400">{user.email}</div>
                            <div className="text-xs text-gray-500 font-mono">Account: {user.accountNumber}</div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge 
                                variant={user.role === 'admin' ? 'default' : 'secondary'}
                                className={user.role === 'admin' 
                                  ? 'bg-prime-accent text-white' 
                                  : 'bg-prime-slate text-gray-200'
                                }
                              >
                                {user.role}
                              </Badge>
                              <Badge 
                                variant="outline" 
                                className="border-prime-blue text-gray-300 text-xs"
                              >
                                {user.accountType}
                              </Badge>
                              {user.lastLogin && (
                                <span className="text-xs text-gray-500">
                                  Last: {format(new Date(user.lastLogin), 'MMM d')}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold text-white">
                              ${parseFloat(user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-sm text-gray-400">Account Balance</div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-prime-blue text-prime-blue hover:bg-prime-blue hover:text-white"
                              onClick={() => handleEditUser(user)}
                              title="Edit user profile"
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-prime-accent text-prime-accent hover:bg-prime-accent hover:text-white"
                              onClick={() => handleFundManagement(user)}
                              title="Adjust account balance"
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-prime-success text-prime-success hover:bg-prime-success hover:text-white"
                              onClick={() => handleCreateTransaction(user)}
                              title="Create manual transaction"
                            >
                              <CreditCard className="h-4 w-4" />
                            </Button>
                            {user.id !== authState.user?.id && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-prime-error text-prime-error hover:bg-prime-error hover:text-white"
                                    title="Delete user account"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="bg-prime-charcoal border-prime-slate/30 text-white">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User Account</AlertDialogTitle>
                                    <AlertDialogDescription className="text-gray-300">
                                      Are you sure you want to delete {user.name}'s account? This action cannot be undone and will permanently remove all user data and transaction history.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="border-prime-slate/30 text-gray-300 hover:bg-prime-slate/20">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-prime-error hover:bg-red-600 text-white"
                                      onClick={() => handleDeleteUser(user.id)}
                                      disabled={deleteUserMutation.isPending}
                                    >
                                      {deleteUserMutation.isPending ? "Deleting..." : "Delete User"}
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logs">
              <Card className="gradient-card border-prime-slate/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-white flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Recent Admin Actions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {logs.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-gray-400">No admin actions recorded yet.</p>
                        <p className="text-sm text-gray-500 mt-1">Activity logs will appear here as actions are performed.</p>
                      </div>
                    ) : (
                      logs.map((log) => (
                        <div key={log.id} className="flex items-start gap-3 p-3 bg-prime-navy/30 rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            {getActionIcon(log.action)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-white">
                              <span className="font-medium">{getActionText(log.action)}:</span>
                              {log.amount && (
                                <span className="ml-1">
                                  ${parseFloat(log.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </span>
                              )}
                              {log.targetUserName && (
                                <span className="ml-1">
                                  {log.action === 'delete_user' ? 'deleted' : 'for'} {log.targetUserName}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              By {log.adminName} • {format(new Date(log.createdAt), 'MMM d, yyyy • h:mm a')}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <FundModal
        isOpen={fundModalOpen}
        onClose={() => {
          setFundModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <EditUserModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />

      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => {
          setTransactionModalOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
}
