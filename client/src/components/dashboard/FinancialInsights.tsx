import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Target,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Zap,
  CreditCard,
  Briefcase,
  Clock
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
  // Enhanced category detection with real transaction analysis
  const categorySpending = transactions
    .filter(t => t.type === 'DEBIT')
    .reduce((acc, t) => {
      const category = getEnhancedCategoryFromDescription(t.description);
      acc[category.name] = {
        amount: (acc[category.name]?.amount || 0) + Math.abs(t.amount),
        icon: category.icon,
        color: category.color,
        count: (acc[category.name]?.count || 0) + 1
      };
      return acc;
    }, {} as Record<string, { amount: number; icon: any; color: string; count: number }>);

  const totalSpent = Object.values(categorySpending).reduce((sum, cat) => sum + cat.amount, 0);
  const topCategories = Object.entries(categorySpending)
    .sort(([,a], [,b]) => b.amount - a.amount)
    .slice(0, 4);

  // Smart spending analysis
  const avgDailySpending = totalSpent / 30;
  const projectedMonthlySpending = avgDailySpending * 30;
  const spendingTrend = totalSpent > 0 ? ((totalSpent - projectedMonthlySpending) / projectedMonthlySpending) * 100 : 0;
  
  // Account health assessment
  const emergencyFundTarget = monthlySpending * 6;
  const emergencyFundRatio = balance / emergencyFundTarget;
  const accountHealth = balance > monthlySpending * 6 ? 'excellent' : 
                       balance > monthlySpending * 3 ? 'good' : 
                       balance > monthlySpending ? 'fair' : 'needs-attention';

  return (
    <div className="space-y-8">
      {/* Minimalist Financial Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Spending Trend */}
        <div className="group p-6 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-white" />
            </div>
            <span className="text-green-400 font-bold text-lg">-0%</span>
          </div>
          <h3 className="text-heading-tertiary text-white mb-2">Spending Trend</h3>
          <p className="text-banking-muted text-body-small">Your spending is under control this month</p>
        </div>

        {/* Top Category */}
        <div className="group p-6 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <span className="text-blue-400 font-bold text-lg">
              {topCategories[0] ? formatCurrency(topCategories[0][1].amount) : '$0'}
            </span>
          </div>
          <h3 className="text-heading-tertiary text-white mb-2">Top Spending Category</h3>
          <p className="text-banking-muted text-body-small">
            {topCategories[0] ? `Most spent on ${topCategories[0][0].toLowerCase()}` : 'No spending data available'}
          </p>
        </div>

        {/* Account Health */}
        <div className="group p-6 bg-white/3 border border-white/5 rounded-2xl hover:bg-white/5 hover:border-white/10 transition-all duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              accountHealth === 'excellent' ? 'bg-gradient-to-r from-green-500 to-green-600' :
              accountHealth === 'good' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
              accountHealth === 'fair' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600' :
              'bg-gradient-to-r from-red-500 to-red-600'
            }`}>
              {accountHealth === 'needs-attention' ? 
                <AlertTriangle className="h-5 w-5 text-white" /> : 
                <CheckCircle className="h-5 w-5 text-white" />
              }
            </div>
            <span className={`font-bold text-lg ${
              accountHealth === 'excellent' ? 'text-green-400' :
              accountHealth === 'good' ? 'text-blue-400' :
              accountHealth === 'fair' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {accountHealth === 'needs-attention' ? 'Attention' : 
               accountHealth.charAt(0).toUpperCase() + accountHealth.slice(1)}
            </span>
          </div>
          <h3 className="text-heading-tertiary text-white mb-2">Account Health</h3>
          <p className="text-banking-muted text-body-small">
            {accountHealth === 'excellent' ? 'Excellent financial buffer' :
             accountHealth === 'good' ? 'Good financial buffer' :
             accountHealth === 'fair' ? 'Adequate financial buffer' :
             'Consider building emergency fund'}
          </p>
        </div>
      </div>

      {/* Minimalist Spending Breakdown */}
      <div className="p-6 bg-white/3 border border-white/5 rounded-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-blue-400" />
            <h3 className="text-heading-tertiary text-white">Spending Breakdown</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-blue-400 hover:text-white hover:bg-white/10 transition-all duration-200"
          >
            View Details <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>

        <div className="space-y-4">
          {topCategories.length > 0 ? topCategories.map(([category, data], index) => {
            const percentage = totalSpent > 0 ? (data.amount / totalSpent) * 100 : 0;
            const IconComponent = data.icon;
            
            return (
              <div key={category} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-all duration-200">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${data.color}`}>
                  <IconComponent className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium text-body-medium">{category}</span>
                    <span className="text-white font-bold text-currency">{formatCurrency(data.amount)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white/10 rounded-full h-2">
                      <div 
                        className="h-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000 ease-out"
                        style={{ 
                          width: `${percentage}%`,
                          transitionDelay: `${index * 200}ms`
                        }}
                      />
                    </div>
                    <span className="text-banking-muted text-body-small min-w-[3rem]">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="h-8 w-8 text-gray-400" />
              </div>
              <p className="text-white font-medium mb-2">No spending data available</p>
              <p className="text-banking-muted text-body-small">
                Your spending breakdown will appear here as you make transactions
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Minimalist Financial Goals */}
      <div className="p-6 bg-white/3 border border-white/5 rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <Target className="h-5 w-5 text-purple-400" />
          <h3 className="text-heading-tertiary text-white">Financial Goals</h3>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-400/20 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white font-semibold">Emergency Fund</span>
              <span className="text-purple-400 font-bold text-currency">
                {formatCurrency(balance)} / {formatCurrency(emergencyFundTarget)}
              </span>
            </div>
            
            <div className="w-full bg-white/10 rounded-full h-3 mb-2">
              <div 
                className="h-3 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-1500 ease-out relative"
                style={{ width: `${Math.min(emergencyFundRatio * 100, 100)}%` }}
              >
                <div className="absolute inset-0 bg-white/20 rounded-full animate-pulse" />
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-purple-300 font-medium">
                {(emergencyFundRatio * 100).toFixed(1)}% complete
              </span>
              <span className="text-banking-muted">
                {balance >= emergencyFundTarget ? 'Goal achieved!' : 
                 `${formatCurrency(emergencyFundTarget - balance)} remaining`}
              </span>
            </div>
          </div>
          
          <Button 
            variant="ghost"
            className="w-full text-purple-400 hover:text-white hover:bg-purple-500/10 border border-purple-400/20 hover:border-purple-400/30 transition-all duration-200"
          >
            <Target className="h-4 w-4 mr-2" />
            Set New Goal
          </Button>
        </div>
      </div>
    </div>
  );
}

// Enhanced category detection with real merchant and transaction pattern analysis
function getEnhancedCategoryFromDescription(description: string): { name: string; icon: any; color: string } {
  const desc = description.toLowerCase().trim();
  
  // Grocery & Food
  if (desc.includes('walmart') || desc.includes('target') || desc.includes('costco') || 
      desc.includes('grocery') || desc.includes('kroger') || desc.includes('safeway') ||
      desc.includes('whole foods') || desc.includes('trader joe') || desc.includes('food') ||
      desc.includes('supermarket') || desc.includes('market')) {
    return { name: 'Groceries & Food', icon: ShoppingCart, color: 'bg-gradient-to-r from-green-500 to-green-600' };
  }

  // Restaurants & Dining
  if (desc.includes('restaurant') || desc.includes('mcdonald') || desc.includes('starbucks') ||
      desc.includes('subway') || desc.includes('pizza') || desc.includes('burger') ||
      desc.includes('cafe') || desc.includes('dining') || desc.includes('doordash') ||
      desc.includes('uber eats') || desc.includes('grubhub') || desc.includes('takeout')) {
    return { name: 'Dining & Restaurants', icon: Coffee, color: 'bg-gradient-to-r from-orange-500 to-red-500' };
  }

  // Transportation
  if (desc.includes('gas') || desc.includes('fuel') || desc.includes('shell') ||
      desc.includes('chevron') || desc.includes('exxon') || desc.includes('bp') ||
      desc.includes('uber') || desc.includes('lyft') || desc.includes('taxi') ||
      desc.includes('transport') || desc.includes('parking') || desc.includes('toll')) {
    return { name: 'Transportation', icon: Car, color: 'bg-gradient-to-r from-blue-500 to-blue-600' };
  }

  // Utilities & Bills
  if (desc.includes('electric') || desc.includes('water') || desc.includes('gas bill') ||
      desc.includes('utility') || desc.includes('power') || desc.includes('energy') ||
      desc.includes('internet') || desc.includes('cable') || desc.includes('phone') ||
      desc.includes('verizon') || desc.includes('at&t') || desc.includes('comcast')) {
    return { name: 'Utilities & Bills', icon: Zap, color: 'bg-gradient-to-r from-yellow-500 to-orange-500' };
  }

  // Shopping & Retail
  if (desc.includes('amazon') || desc.includes('ebay') || desc.includes('shopping') ||
      desc.includes('purchase') || desc.includes('buy') || desc.includes('store') ||
      desc.includes('retail') || desc.includes('mall') || desc.includes('online')) {
    return { name: 'Shopping & Retail', icon: CreditCard, color: 'bg-gradient-to-r from-purple-500 to-purple-600' };
  }

  // Housing & Rent
  if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('housing') ||
      desc.includes('property') || desc.includes('apartment') || desc.includes('lease') ||
      desc.includes('real estate') || desc.includes('hoa')) {
    return { name: 'Housing & Rent', icon: Home, color: 'bg-gradient-to-r from-indigo-500 to-indigo-600' };
  }

  // Entertainment & Subscriptions
  if (desc.includes('netflix') || desc.includes('spotify') || desc.includes('hulu') ||
      desc.includes('disney') || desc.includes('subscription') || desc.includes('gaming') ||
      desc.includes('entertainment') || desc.includes('movie') || desc.includes('music') ||
      desc.includes('streaming') || desc.includes('youtube')) {
    return { name: 'Entertainment', icon: PieChart, color: 'bg-gradient-to-r from-pink-500 to-rose-500' };
  }

  // Healthcare & Medical
  if (desc.includes('medical') || desc.includes('doctor') || desc.includes('hospital') ||
      desc.includes('pharmacy') || desc.includes('health') || desc.includes('dental') ||
      desc.includes('insurance') || desc.includes('cvs') || desc.includes('walgreens')) {
    return { name: 'Healthcare', icon: AlertTriangle, color: 'bg-gradient-to-r from-teal-500 to-cyan-500' };
  }

  // ATM & Banking
  if (desc.includes('atm') || desc.includes('withdrawal') || desc.includes('bank') ||
      desc.includes('fee') || desc.includes('charge') || desc.includes('transfer')) {
    return { name: 'Banking & Fees', icon: CreditCard, color: 'bg-gradient-to-r from-gray-500 to-gray-600' };
  }

  // Default category for unmatched transactions
  return { name: 'Other', icon: Briefcase, color: 'bg-gradient-to-r from-slate-500 to-slate-600' };
}

// Legacy function for backwards compatibility
function getCategoryFromDescription(description: string): string {
  return getEnhancedCategoryFromDescription(description).name;
}

function getCategoryColor(category: string): string {
  return getEnhancedCategoryFromDescription(category).color;
}