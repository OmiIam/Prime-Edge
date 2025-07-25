import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { authManager } from "@/lib/auth";
import Navbar from "@/components/navbar";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, ShoppingCart, CreditCard, Home, Briefcase, Send, Plus } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    balance: number;
    accountNumber: string;
    accountType: string;
    lastLogin: string | null;
  };
  recentTransactions: Transaction[];
  monthlyStats: {
    spent: number;
    received: number;
    transactionCount: number;
  };
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
  return type === 'CREDIT' ? 'text-prime-success' : 'text-prime-error';
};

export default function Dashboard() {
  const authState = authManager.getState();
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [transferOpen, setTransferOpen] = useState(false);

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/user/dashboard'],
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

  const monthlySpending = data.monthlyStats.spent;
  const monthlyTransactions = data.monthlyStats.transactionCount;

  const handleTransfer = () => {
    // In a real app, this would make an API call
    console.log('Transfer:', { amount: transferAmount, recipient: recipientEmail });
    setTransferOpen(false);
    setTransferAmount("");
    setRecipientEmail("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm sm:text-lg">
                    {data.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                    Welcome back, {data.user.name.split(' ')[0]}! 👋
                  </h1>
                  <p className="text-blue-200 text-xs sm:text-sm lg:text-base">Here's your financial overview for today.</p>
                </div>
              </div>
              
              <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-prime-accent hover:bg-blue-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-sm sm:text-base">
                    <Send className="h-4 w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Transfer Money</span>
                    <span className="sm:hidden">Transfer</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-slate-800 border-slate-700 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">Send Money</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="recipient" className="text-sm font-medium text-gray-300">Recipient Email</Label>
                      <Input
                        id="recipient"
                        type="email"
                        placeholder="recipient@example.com"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="amount" className="text-sm font-medium text-gray-300">Amount ($)</Label>
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        className="bg-slate-700 border-slate-600 text-white mt-1"
                      />
                    </div>
                    <Button 
                      onClick={handleTransfer}
                      disabled={!transferAmount || !recipientEmail}
                      className="w-full bg-prime-accent hover:bg-blue-600 text-white py-3 rounded-xl font-semibold"
                    >
                      Send ${transferAmount || '0.00'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-300">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>Last updated: {new Date().toLocaleString()}</span>
            </div>
          </div>

          {/* Account Information */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl mb-6 sm:mb-8 hover:bg-white/10 transition-all duration-300">
            <CardContent className="p-4 sm:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="text-center sm:text-left">
                  <div className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide">Account Holder</div>
                  <div className="text-base sm:text-lg font-bold text-white mb-1 truncate">{data.user.name}</div>
                  <div className="text-xs sm:text-sm text-blue-200 truncate">{data.user.email}</div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide">Account Details</div>
                  <div className="text-base sm:text-lg font-mono font-bold text-white mb-1">
                    ••••••{data.user.accountNumber?.slice(-4) || '6915'}
                  </div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <div className="text-xs sm:text-sm text-blue-200 uppercase">{data.user.accountType || 'BUSINESS'}</div>
                    <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                    <div className="text-xs sm:text-sm text-blue-200">Account</div>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide">Status</div>
                  <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <div className="text-base sm:text-lg font-bold text-green-400">Active</div>
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <div className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide">Last Updated</div>
                  <div className="text-xs sm:text-sm text-blue-200">
                    {format(new Date(), 'MMM d, yyyy')}
                  </div>
                  <div className="text-xs sm:text-sm text-blue-200">
                    {format(new Date(), 'h:mm a')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 backdrop-blur-sm border border-green-400/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-green-400" />
                  </div>
                  <div className="text-xs text-green-300 font-medium uppercase tracking-wide">BALANCE</div>
                </div>
                <div className="text-3xl font-bold text-white mb-2">
                  ${data.user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div className="text-sm text-green-300">Available Now</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 backdrop-blur-sm border border-blue-400/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-blue-400" />
                  </div>
                  <div className="text-xs text-blue-300 font-medium uppercase tracking-wide">SPENDING</div>
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
            
            <Card className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 backdrop-blur-sm border border-purple-400/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 sm:col-span-2 lg:col-span-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="text-xs text-purple-300 font-medium uppercase tracking-wide">ACTIVITY</div>
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
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 shadow-xl">
            <CardHeader className="border-b border-white/10 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <ArrowUpRight className="h-5 w-5 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white">Recent Activity</CardTitle>
                </div>
                <div className="text-sm text-blue-300">
                  {data.recentTransactions.length} recent
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {data.recentTransactions.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-white font-medium mb-2">No transactions yet</p>
                  <p className="text-sm text-blue-300">Your transaction history will appear here</p>
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {data.recentTransactions.map((transaction, index) => {
                    const IconComponent = getTransactionIcon(transaction.description);
                    return (
                      <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                              transaction.type === 'CREDIT' 
                                ? 'bg-green-500/10 border-green-400/20' 
                                : 'bg-red-500/10 border-red-400/20'
                            }`}>
                              <IconComponent className={`h-5 w-5 ${
                                transaction.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
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
                            <div className={`text-lg font-bold ${
                              transaction.type === 'CREDIT' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {transaction.type === 'CREDIT' ? '+' : '-'}${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                            <div className={`text-xs font-medium px-2 py-1 rounded-full mt-1 ${
                              transaction.type === 'CREDIT' 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {transaction.type}
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
