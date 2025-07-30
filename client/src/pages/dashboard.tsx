import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { authManager } from "@/lib/auth";
import Navbar from "@/components/navbar";
import TrustIndicators, { SecurityStatus } from "@/components/TrustIndicators";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading";

// Lazy load heavy dashboard components
const QuickActions = lazy(() => import("@/components/dashboard/QuickActions"));
const FinancialInsights = lazy(() => import("@/components/dashboard/FinancialInsights"));
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, ShoppingCart, CreditCard, Home, Briefcase, Send, Plus, Receipt, Smartphone, MapPin, Calculator, PiggyBank, Target, BarChart3, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { formatCurrency, formatAccountNumber, formatFinancialDate, formatTransactionAmount } from "@/lib/formatters";

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
  const [depositOpen, setDepositOpen] = useState(false);
  const [billPayOpen, setBillPayOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("bank_transfer");
  const [payeeSelection, setPayeeSelection] = useState("");

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
            className="btn-prime-primary"
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

  const handleDeposit = () => {
    // In a real app, this would make an API call
    console.log('Deposit:', { amount: depositAmount, method: depositMethod });
    setDepositOpen(false);
    setDepositAmount("");
    setDepositMethod("bank_transfer");
  };

  const handleBillPay = () => {
    // In a real app, this would make an API call
    console.log('Bill Pay:', { payee: payeeSelection });
    setBillPayOpen(false);
    setPayeeSelection("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
        <div className="container-prime">
          {/* Header */}
          <header className="mb-6 sm:mb-8" role="banner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                  role="img"
                  aria-label={`Profile avatar for ${data.user.name}`}
                >
                  <span className="text-white font-bold text-sm sm:text-lg">
                    {data.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                    <span className="sr-only">Dashboard for </span>
                    Welcome back, {data.user.name.split(' ')[0]}! 
                    <span role="img" aria-label="waving hand">👋</span>
                  </h1>
                  <p className="text-blue-200 text-xs sm:text-sm lg:text-base">Here's your financial overview for today.</p>
                </div>
              </div>
              
              <Button 
                className="btn-prime-primary touch-target focus-ring"
                aria-label="Open quick transfer dialog"
              >
                <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Quick Transfer</span>
                <span className="sm:hidden">Transfer</span>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Last updated: {new Date().toLocaleString()}</span>
              </div>
              <SecurityStatus className="text-xs" />
            </div>
          </header>

          {/* Account Information */}
          <section aria-labelledby="account-info-heading">
            <h2 id="account-info-heading" className="sr-only">Account Information</h2>
            <Card className="card-gradient mb-6 sm:mb-8" role="region" aria-label="Account details">
              <CardContent className="p-4 sm:p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="text-center sm:text-left">
                    <div className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide" id="account-holder-label">Account Holder</div>
                    <div className="text-base sm:text-lg font-bold text-white mb-1 truncate" aria-labelledby="account-holder-label">{data.user.name}</div>
                    <div className="text-xs sm:text-sm text-blue-200 truncate" aria-label={`Email address: ${data.user.email}`}>{data.user.email}</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide" id="account-details-label">Account Details</div>
                    <div 
                      className="text-base sm:text-lg font-mono font-bold text-white mb-1"
                      aria-label={`Account number ending in ${(data.user.accountNumber || '').slice(-4)}`}
                    >
                      {formatAccountNumber(data.user.accountNumber || '')}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <div className="text-xs sm:text-sm text-blue-200 uppercase">{data.user.accountType || 'BUSINESS'}</div>
                      <span className="w-1 h-1 bg-blue-300 rounded-full" aria-hidden="true"></span>
                      <div className="text-xs sm:text-sm text-blue-200">Account</div>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide" id="status-label">Status</div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2" role="status" aria-live="polite">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
                      <div className="text-base sm:text-lg font-bold text-green-400">Active</div>
                    </div>
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="text-xs text-blue-300 mb-2 font-medium uppercase tracking-wide" id="last-updated-label">Last Updated</div>
                    <div className="text-xs sm:text-sm text-blue-200" aria-labelledby="last-updated-label">
                      <time dateTime={new Date().toISOString()}>
                        {format(new Date(), 'MMM d, yyyy')}
                      </time>
                    </div>
                    <div className="text-xs sm:text-sm text-blue-200">
                      <time dateTime={new Date().toISOString()}>
                        {format(new Date(), 'h:mm a')}
                      </time>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Primary Balance Card - Hero Element */}
          <section aria-labelledby="balance-heading">
            <Card className="card-gradient mb-6 sm:mb-8 border-2 border-green-400/20" role="region" aria-label="Account balance">
              <CardContent className="p-6 sm:p-8 text-center">
                <div className="mb-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" aria-hidden="true">
                    <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-green-400" />
                  </div>
                  <h2 id="balance-heading" className="text-sm text-green-300 font-semibold uppercase tracking-wider mb-2">Available Balance</h2>
                </div>
                <div 
                  className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4 tracking-tight"
                  aria-label={`Your available balance is ${formatCurrency(data.user.balance)}`}
                  role="status"
                  aria-live="polite"
                >
                  {formatCurrency(data.user.balance)}
                </div>
                <div className="flex items-center justify-center gap-3" role="status">
                  <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" aria-hidden="true"></div>
                  <div className="text-lg text-green-300 font-medium">Ready to Use</div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Secondary Stats - Compact Display */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 mb-8">
            <Card className="card-stats">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
                  </div>
                  <div className="text-xs text-blue-300 font-semibold uppercase tracking-wide">Monthly Spending</div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {formatCurrency(monthlySpending)}
                </div>
                <div className="text-xs text-blue-300">This Month</div>
              </CardContent>
            </Card>
            
            <Card className="card-stats">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <ArrowUpRight className="h-4 w-4 sm:h-5 sm:w-5 text-purple-400" />
                  </div>
                  <div className="text-xs text-purple-300 font-semibold uppercase tracking-wide">Transactions</div>
                </div>
                <div className="text-xl sm:text-2xl font-bold text-white mb-2">{monthlyTransactions}</div>
                <div className="text-xs text-purple-300">This Month</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="card-gradient">
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
                    const formattedAmount = formatTransactionAmount(transaction.amount, transaction.type as 'CREDIT' | 'DEBIT');
                    return (
                      <div key={transaction.id} className="p-6 hover:bg-white/5 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${
                              formattedAmount.isPositive 
                                ? 'bg-green-500/10 border-green-400/20' 
                                : 'bg-red-500/10 border-red-400/20'
                            }`}>
                              <IconComponent className={`h-5 w-5 ${formattedAmount.colorClass}`} />
                            </div>
                            <div>
                              <div className="font-semibold text-white mb-1">{transaction.description}</div>
                              <div className="flex items-center gap-2 text-sm text-blue-300">
                                <span>{formatFinancialDate(transaction.createdAt)}</span>
                                <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                                <span>{format(new Date(transaction.createdAt), 'h:mm a')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`text-lg font-bold ${formattedAmount.colorClass}`}>
                              {formattedAmount.display}
                            </div>
                            <div className={`text-xs font-medium px-2 py-1 rounded-full mt-1 ${
                              formattedAmount.isPositive 
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

          {/* Enhanced Dashboard Components */}
          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Suspense fallback={
                <Card className="card-gradient border-white/10 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center h-48">
                      <LoadingSpinner size="md" label="Loading quick actions" />
                    </div>
                  </CardContent>
                </Card>
              }>
                <QuickActions 
                  onDeposit={handleDeposit}
                  onTransfer={handleTransfer}
                  onBillPay={handleBillPay}
                />
              </Suspense>
            </div>
            
            {/* Financial Insights */}
            <div className="lg:col-span-2">
              <Suspense fallback={
                <Card className="card-gradient border-white/10 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center h-64">
                      <LoadingSpinner size="md" label="Loading financial insights" />
                    </div>
                  </CardContent>
                </Card>
              }>
                <FinancialInsights 
                  transactions={data.recentTransactions}
                  monthlySpending={monthlySpending}
                  balance={data.user.balance}
                />
              </Suspense>
            </div>
          </div>

          {/* Trust Indicators */}
          <section className="mt-12" aria-label="Security and compliance information">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Your Security & Trust</h3>
            <TrustIndicators variant="dashboard" />
          </section>
        </div>
      </div>
    </div>
  );
}
