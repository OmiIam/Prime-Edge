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
    <div className="min-h-screen bg-prime-navy text-white">
      <Navbar user={data.user} />
      
      <div className="pt-16 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Welcome back, {data.user.name.split(' ')[0]}!</h1>
            <p className="text-gray-300">Here's your financial overview for today.</p>
          </div>

          {/* Account Information */}
          <Card className="gradient-card border-prime-slate/30 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Account Holder</div>
                  <div className="text-lg font-semibold text-white">{data.user.name}</div>
                  <div className="text-sm text-gray-400">{data.user.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Account Number</div>
                  <div className="text-lg font-mono font-semibold text-white">{data.user.accountNumber}</div>
                  <div className="text-sm text-gray-400 capitalize">{data.user.accountType} Account</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Account Status</div>
                  <div className="text-lg font-semibold text-prime-success">Active</div>
                  {data.user.lastLogin && (
                    <div className="text-sm text-gray-400">
                      Last login: {format(new Date(data.user.lastLogin), 'MMM d, yyyy')}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="gradient-card border-prime-slate/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Current Balance</span>
                  <Wallet className="h-5 w-5 text-prime-accent" />
                </div>
                <div className="text-3xl font-bold text-white">${parseFloat(data.user.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div className="text-sm text-prime-success mt-1">Account Active</div>
              </CardContent>
            </Card>
            
            <Card className="gradient-card border-prime-slate/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Monthly Spending</span>
                  <TrendingUp className="h-5 w-5 text-prime-accent" />
                </div>
                <div className="text-3xl font-bold text-white">${monthlySpending.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                <div className="text-sm text-gray-400 mt-1">This month</div>
              </CardContent>
            </Card>
            
            <Card className="gradient-card border-prime-slate/30 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Transactions</span>
                  <ArrowUpRight className="h-5 w-5 text-prime-accent" />
                </div>
                <div className="text-3xl font-bold text-white">{monthlyTransactions}</div>
                <div className="text-sm text-gray-400 mt-1">This month</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Transactions */}
          <Card className="gradient-card border-prime-slate/30 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-white">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {data.transactions.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400">No transactions yet.</p>
                  <p className="text-sm text-gray-500 mt-1">Your transaction history will appear here.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {data.transactions.map((transaction) => {
                    const IconComponent = getTransactionIcon(transaction.description);
                    return (
                      <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-prime-slate/20 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            transaction.type === 'credit' ? 'bg-prime-success/20' : 'bg-prime-error/20'
                          }`}>
                            <IconComponent className={`h-5 w-5 ${
                              transaction.type === 'credit' ? 'text-prime-success' : 'text-prime-error'
                            }`} />
                          </div>
                          <div>
                            <div className="font-medium text-white">{transaction.description}</div>
                            <div className="text-sm text-gray-400">
                              {format(new Date(transaction.createdAt), 'MMM d, yyyy • h:mm a')}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                            {transaction.type === 'credit' ? '+' : '-'}${parseFloat(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
