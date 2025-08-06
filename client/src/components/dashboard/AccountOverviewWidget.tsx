import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ArrowUpRight,
  ArrowDownLeft,
  PieChart,
  BarChart3,
  Target,
  Calendar,
  Info,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";

interface AccountMetrics {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  savingsRate: number;
  creditUtilization: number;
  accountHealth: 'excellent' | 'good' | 'fair' | 'needs-attention';
  goals: {
    savingsGoal: number;
    currentSavings: number;
    targetDate: string;
  };
  trends: {
    incomeChange: number;
    expenseChange: number;
    balanceChange: number;
  };
}

interface AccountOverviewWidgetProps {
  metrics: AccountMetrics;
  period?: string;
}

export default function AccountOverviewWidget({ 
  metrics, 
  period = "This Month" 
}: AccountOverviewWidgetProps) {
  const [animatedMetrics, setAnimatedMetrics] = useState({
    totalBalance: 0,
    monthlyIncome: 0,
    monthlyExpenses: 0,
    savingsRate: 0,
    creditUtilization: 0,
    goalProgress: 0
  });

  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  // Animate metrics on mount
  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = duration / steps;
    
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      
      setAnimatedMetrics({
        totalBalance: metrics.totalBalance * easeOutQuart,
        monthlyIncome: metrics.monthlyIncome * easeOutQuart,
        monthlyExpenses: metrics.monthlyExpenses * easeOutQuart,
        savingsRate: metrics.savingsRate * easeOutQuart,
        creditUtilization: metrics.creditUtilization * easeOutQuart,
        goalProgress: (metrics.goals.currentSavings / metrics.goals.savingsGoal) * 100 * easeOutQuart
      });
      
      if (currentStep >= steps) {
        clearInterval(timer);
      }
    }, increment);

    return () => clearInterval(timer);
  }, [metrics]);

  const getHealthStatus = (health: string) => {
    switch (health) {
      case 'excellent':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'bg-green-500/20 text-green-300 border-green-400/30',
          label: 'Excellent'
        };
      case 'good':
        return {
          icon: <CheckCircle2 className="h-4 w-4" />,
          color: 'bg-blue-500/20 text-blue-300 border-blue-400/30',
          label: 'Good'
        };
      case 'fair':
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30',
          label: 'Fair'
        };
      case 'needs-attention':
        return {
          icon: <AlertTriangle className="h-4 w-4" />,
          color: 'bg-red-500/20 text-red-300 border-red-400/30',
          label: 'Needs Attention'
        };
      default:
        return {
          icon: <Info className="h-4 w-4" />,
          color: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
          label: 'Unknown'
        };
    }
  };

  const healthStatus = getHealthStatus(metrics.accountHealth);
  const netCashFlow = metrics.monthlyIncome - metrics.monthlyExpenses;
  const goalProgress = (metrics.goals.currentSavings / metrics.goals.savingsGoal) * 100;

  return (
    <Card className="card-elevated slide-in">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Account Overview</CardTitle>
              <p className="text-sm text-white/60">Financial health • {period}</p>
            </div>
          </div>
          
          <Badge className={`${healthStatus.color} text-xs px-3 py-1`}>
            {healthStatus.icon}
            <span className="ml-1">{healthStatus.label}</span>
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* Total Balance */}
          <div 
            className={`
              group cursor-pointer p-4 rounded-xl transition-all duration-300 border
              ${selectedMetric === 'balance' 
                ? 'bg-blue-500/20 border-blue-400/30 scale-[1.02]' 
                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
              }
            `}
            onClick={() => setSelectedMetric(selectedMetric === 'balance' ? null : 'balance')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                metrics.trends.balanceChange >= 0 
                  ? 'bg-green-400/20 text-green-300' 
                  : 'bg-red-400/20 text-red-300'
              }`}>
                {metrics.trends.balanceChange >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(metrics.trends.balanceChange)}%</span>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white text-currency mb-1 break-all">
              {formatCurrency(animatedMetrics.totalBalance)}
            </div>
            <div className="text-xs text-white/60 uppercase tracking-wider">
              Total Balance
            </div>
          </div>

          {/* Monthly Income */}
          <div 
            className={`
              group cursor-pointer p-4 rounded-xl transition-all duration-300 border
              ${selectedMetric === 'income' 
                ? 'bg-green-500/20 border-green-400/30 scale-[1.02]' 
                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
              }
            `}
            onClick={() => setSelectedMetric(selectedMetric === 'income' ? null : 'income')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <ArrowDownLeft className="h-4 w-4 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                metrics.trends.incomeChange >= 0 
                  ? 'bg-green-400/20 text-green-300' 
                  : 'bg-red-400/20 text-red-300'
              }`}>
                {metrics.trends.incomeChange >= 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                <span>{Math.abs(metrics.trends.incomeChange)}%</span>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white text-currency mb-1 break-all">
              {formatCurrency(animatedMetrics.monthlyIncome)}
            </div>
            <div className="text-xs text-white/60 uppercase tracking-wider">
              Monthly Income
            </div>
          </div>

          {/* Monthly Expenses */}
          <div 
            className={`
              group cursor-pointer p-4 rounded-xl transition-all duration-300 border
              ${selectedMetric === 'expenses' 
                ? 'bg-red-500/20 border-red-400/30 scale-[1.02]' 
                : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
              }
            `}
            onClick={() => setSelectedMetric(selectedMetric === 'expenses' ? null : 'expenses')}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <ArrowUpRight className="h-4 w-4 text-white" />
              </div>
              <div className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                metrics.trends.expenseChange <= 0 
                  ? 'bg-green-400/20 text-green-300' 
                  : 'bg-red-400/20 text-red-300'
              }`}>
                {metrics.trends.expenseChange <= 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : (
                  <TrendingUp className="h-3 w-3" />
                )}
                <span>{Math.abs(metrics.trends.expenseChange)}%</span>
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white text-currency mb-1 break-all">
              {formatCurrency(animatedMetrics.monthlyExpenses)}
            </div>
            <div className="text-xs text-white/60 uppercase tracking-wider">
              Monthly Expenses
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
          {/* Net Cash Flow */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white/80">Net Cash Flow</div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                netCashFlow >= 0 ? 'bg-green-400/20 text-green-300' : 'bg-red-400/20 text-red-300'
              }`}>
                {netCashFlow >= 0 ? 'Positive' : 'Negative'}
              </div>
            </div>
            <div className={`text-base sm:text-lg font-bold text-currency break-all ${
              netCashFlow >= 0 ? 'text-green-300' : 'text-red-300'
            }`}>
              {formatCurrency(netCashFlow)}
            </div>
          </div>

          {/* Savings Rate */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white/80">Savings Rate</div>
              <div className="text-xs text-white/60">{animatedMetrics.savingsRate.toFixed(1)}%</div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="h-2 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${Math.min(animatedMetrics.savingsRate, 100)}%` }}
              />
            </div>
          </div>

          {/* Credit Utilization */}
          <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-white/80">Credit Usage</div>
              <div className="text-xs text-white/60">{animatedMetrics.creditUtilization.toFixed(1)}%</div>
            </div>
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ease-out ${
                  animatedMetrics.creditUtilization <= 30 
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                    : animatedMetrics.creditUtilization <= 70
                    ? 'bg-gradient-to-r from-yellow-500 to-orange-500'
                    : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
                style={{ width: `${Math.min(animatedMetrics.creditUtilization, 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Savings Goal Progress */}
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-400/20 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-purple-400" />
              <span className="font-semibold text-white">Savings Goal Progress</span>
            </div>
            <span className="text-sm text-white/60 break-all">
              {formatCurrency(metrics.goals.currentSavings)} / {formatCurrency(metrics.goals.savingsGoal)}
            </span>
          </div>
          
          <div className="w-full bg-white/10 rounded-full h-3 mb-2">
            <div
              className="h-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1500 ease-out relative"
              style={{ width: `${Math.min(animatedMetrics.goalProgress, 100)}%` }}
            >
              <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{animatedMetrics.goalProgress.toFixed(1)}% complete</span>
            <span>Target: {metrics.goals.targetDate}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-sm text-white/60">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Last updated: Just now</span>
          </div>
          <span>Click metrics for detailed view</span>
        </div>
      </CardContent>
    </Card>
  );
}