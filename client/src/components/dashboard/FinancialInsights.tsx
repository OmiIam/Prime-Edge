import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface FinancialInsightsProps {
  transactions: Transaction[];
  monthlySpending: number;
  balance: number;
}

export default function FinancialInsights({ transactions, monthlySpending, balance }: FinancialInsightsProps) {
  // Calculate spending insights
  const totalSpent = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  
  const avgDailySpending = totalSpent / 30; // Assume 30 days
  const projectedMonthlySpending = avgDailySpending * 30;
  
  // Calculate categories
  const categorySpending = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((acc, t) => {
      const category = getCategoryFromDescription(t.description);
      acc[category] = (acc[category] || 0) + Math.abs(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const topCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3);

  // Generate insights
  const insights = [
    {
      type: 'spending_trend',
      title: 'Spending Trend',
      description: monthlySpending > projectedMonthlySpending 
        ? 'Your spending is above average this month' 
        : 'Your spending is under control this month',
      value: `${monthlySpending > projectedMonthlySpending ? '+' : '-'}${Math.abs(monthlySpending - projectedMonthlySpending).toFixed(0)}%`,
      icon: monthlySpending > projectedMonthlySpending ? TrendingUp : TrendingDown,
      color: monthlySpending > projectedMonthlySpending ? 'text-red-400' : 'text-green-400',
      bgColor: monthlySpending > projectedMonthlySpending ? 'bg-red-500/10' : 'bg-green-500/10'
    },
    {
      type: 'top_category',
      title: 'Top Spending Category',
      description: topCategories[0] ? `Most spent on ${topCategories[0][0]}` : 'No spending data',
      value: topCategories[0] ? `$${topCategories[0][1].toFixed(0)}` : '$0',
      icon: BarChart3,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      type: 'balance_health',
      title: 'Account Health',
      description: balance > monthlySpending * 3 
        ? 'Excellent financial buffer' 
        : balance > monthlySpending 
        ? 'Good financial buffer' 
        : 'Consider building emergency fund',
      value: balance > monthlySpending * 3 ? 'Excellent' : balance > monthlySpending ? 'Good' : 'Attention',
      icon: balance > monthlySpending ? CheckCircle : AlertTriangle,
      color: balance > monthlySpending ? 'text-green-400' : 'text-yellow-400',
      bgColor: balance > monthlySpending ? 'bg-green-500/10' : 'bg-yellow-500/10'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Financial Insights Card */}
      <Card className="card-gradient border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-prime-accent" />
            Financial Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {insights.map((insight, index) => {
              const IconComponent = insight.icon;
              return (
                <div 
                  key={index}
                  className={`p-4 rounded-xl border border-white/10 ${insight.bgColor} backdrop-blur-sm`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-10 h-10 rounded-lg ${insight.bgColor} flex items-center justify-center`}>
                      <IconComponent className={`h-5 w-5 ${insight.color}`} />
                    </div>
                    <span className={`text-lg font-bold ${insight.color}`}>
                      {insight.value}
                    </span>
                  </div>
                  <h4 className="text-white font-semibold text-sm mb-1">{insight.title}</h4>
                  <p className="text-white/70 text-xs">{insight.description}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Spending Breakdown */}
      <Card className="card-gradient border-white/10 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <PieChart className="h-5 w-5 text-prime-accent" />
              Spending Breakdown
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-prime-accent hover:text-white hover:bg-white/10"
            >
              View Details <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topCategories.slice(0, 5).map(([category, amount], index) => {
              const percentage = (amount / totalSpent) * 100;
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`} />
                    <span className="text-white text-sm font-medium capitalize">
                      {category.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-20 bg-white/10 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getCategoryColor(category)}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-white/70 text-sm min-w-[60px] text-right">
                      ${amount.toFixed(0)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Financial Goals */}
      <Card className="card-gradient border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="h-5 w-5 text-prime-accent" />
            Financial Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-white font-semibold">Emergency Fund</h4>
                <span className="text-prime-accent text-sm">
                  ${balance.toFixed(0)} / ${(monthlySpending * 6).toFixed(0)}
                </span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="h-2 bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                  style={{ width: `${Math.min((balance / (monthlySpending * 6)) * 100, 100)}%` }}
                />
              </div>
              <p className="text-white/70 text-xs mt-2">
                {balance >= monthlySpending * 6 
                  ? "Goal achieved! You have 6+ months of expenses saved."
                  : `${((balance / (monthlySpending * 6)) * 100).toFixed(0)}% complete`
                }
              </p>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              <Target className="h-4 w-4 mr-2" />
              Set New Goal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getCategoryFromDescription(description: string): string {
  const desc = description.toLowerCase();
  if (desc.includes('amazon') || desc.includes('purchase') || desc.includes('shopping')) {
    return 'shopping';
  }
  if (desc.includes('salary') || desc.includes('payroll') || desc.includes('income')) {
    return 'income';
  }
  if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('housing')) {
    return 'housing';
  }
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('transport')) {
    return 'transportation';
  }
  if (desc.includes('restaurant') || desc.includes('food') || desc.includes('dining')) {
    return 'dining';
  }
  if (desc.includes('utility') || desc.includes('electric') || desc.includes('water')) {
    return 'utilities';
  }
  return 'other';
}

function getCategoryColor(category: string): string {
  const colors = {
    shopping: 'bg-blue-400',
    housing: 'bg-green-400',
    transportation: 'bg-yellow-400',
    dining: 'bg-red-400',
    utilities: 'bg-purple-400',
    income: 'bg-emerald-400',
    other: 'bg-gray-400'
  };
  return colors[category as keyof typeof colors] || colors.other;
}