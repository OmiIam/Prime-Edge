import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { authManager } from "@/lib/auth";
import Navbar from "@/components/navbar";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, ShoppingCart, CreditCard, Home, Briefcase } from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: number;
  type: string;
  amount: string;
  description: string;
  createdAt: string;
}

interface DashboardData {
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    balance: string;
    accountNumber: string;
    accountType: string;
    lastLogin: string | null;
  };
  transactions: Transaction[];
}

const getTransactionIcon = (description: string) => {
  const desc = description.toLowerCase();
  if (desc.includes('amazon') || desc.includes('purchase') || desc.includes('shopping')) {
    return ShoppingCart;
  }
  if (desc.includes('salary') || desc.includes('deposit') || desc.includes('credit')) {
    return ArrowDownRight;
  }
  if (desc.includes('rent') || desc.includes('mortgage')) {
    return Home;
  }
  if (desc.includes('card') || desc.includes('payment')) {
    return CreditCard;
  }
  return Briefcase;
};

const getTransactionColor = (type: string) => {
  return type === 'credit' ? 'text-prime-success' : 'text-prime-error';
};

export default function Dashboard() {
  const authState = authManager.getState();

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/dashboard'],
    enabled: authState.isAuthenticated,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-prime-navy text-white">
        <Navbar user={authState.user!} />
        <div className="pt-16 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2 bg-prime-slate" />
              <Skeleton className="h-4 w-96 bg-prime-slate" />
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
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

  if (error) {
    return (
      <div className="min-h-screen bg-prime-navy text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to load dashboard</h2>
          <p className="text-gray-300 mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-prime-accent hover:bg-blue-600 text-white px-4 py-2 rounded"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-prime-navy text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to load dashboard</h2>
          <p className="text-gray-300">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const monthlySpending = data.transactions
    .filter(t => t.type === 'debit' && new Date(t.createdAt).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyTransactions = data.transactions
    .filter(t => new Date(t.createdAt).getMonth() === new Date().getMonth())
    .length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-2xl">
                  {data.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">
                  Welcome back, {data.user.name.split(' ')[0]}! 👋
                </h1>
                <p className="text-blue-200">Here's your financial overview for today.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm text-blue-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Account Information */}
          <Card className="bg-white/10 backdrop-blur-md border-0 shadow-2xl mb-6 hover:bg-white/15 transition-all duration-300">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center md:text-left">
                  <div className="text-sm text-blue-300 mb-2 font-medium">Account Holder</div>
                  <div className="text-xl font-bold text-white mb-1">{data.user.name}</div>
                  <div className="text-sm text-blue-200">{data.user.email}</div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-sm text-blue-300 mb-2 font-medium">Account Details</div>
                  <div className="text-lg font-mono font-bold text-white mb-1">
                    ••••••{data.user.accountNumber?.slice(-4) || '0000'}
                  </div>
                  <div className="flex items-center justify-center md:justify-start gap-2">
                    <div className="text-sm text-blue-200 capitalize">{data.user.accountType}</div>
                    <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                    <div className="text-sm text-blue-200">Account</div>
                  </div>
                </div>
                <div className="text-center md:text-left">
                  <div className="text-sm text-blue-300 mb-2 font-medium">Status</div>
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="text-lg font-bold text-green-400">Active</div>
                  </div>
                  {data.user.lastLogin && (
                    <div className="text-sm text-blue-200">
                      Last login: {format(new Date(data.user.lastLogin), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-md border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-green-300 font-medium">BALANCE</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ${parseFloat(data.user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="text-sm text-green-300">Available Now</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-md border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-blue-300 font-medium">SPENDING</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ${monthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div className="text-sm text-blue-300">This Month</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-md border-0 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-purple-300 font-medium">ACTIVITY</div>
                  </div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">{monthlyTransactions}</div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div className="text-sm text-purple-300">Transactions</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="bg-white/10 backdrop-blur-md border-0 shadow-2xl">
            <CardHeader className="border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Recent Transactions</CardTitle>
                </div>
                <div className="text-sm text-blue-300">
                  {data.transactions.length} total
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.transactions.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-white font-medium mb-2">No transactions yet</p>
                  <p className="text-sm text-blue-300">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {data.transactions.map((transaction, index) => {
                    const IconComponent = getTransactionIcon(transaction.description);
                    return (
                      <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${
                              transaction.type === 'credit' 
                                ? 'bg-green-500/20 border-green-400/30' 
                                : 'bg-red-500/20 border-red-400/30'
                            }`}>
                              <IconComponent className={`h-6 w-6 ${
                                transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                              }`} />
                            </div>
                            <div>
                              <div className="font-semibold text-white mb-1">{transaction.description}</div>
                              <div className="flex items-center gap-2 text-sm text-blue-300">
                                <span>{format(new Date(transaction.createdAt), 'MMM d, yyyy')}</span>
                                <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                                <span>{format(new Date(transaction.createdAt), 'h:mm a')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-xl font-bold ${
                              transaction.type === 'credit' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'credit' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-xs font-medium px-2 py-1 rounded-full ${
                              transaction.type === 'credit' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {transaction.type.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
