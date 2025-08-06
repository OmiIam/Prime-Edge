import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { 
  Wallet, 
  Eye, 
  EyeOff, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  DollarSign,
  PiggyBank,
  CreditCard
} from "lucide-react";

interface BalanceCardProps {
  balance: number;
  accountType: string;
  accountNumber: string;
  monthlyChange?: {
    amount: number;
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
  };
  quickStats?: {
    available: number;
    pending: number;
    reserved: number;
  };
}

export default function BalanceCard({ 
  balance, 
  accountType, 
  accountNumber,
  monthlyChange,
  quickStats 
}: BalanceCardProps) {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [animatedBalance, setAnimatedBalance] = useState(0);

  // Animate balance counter on mount or balance change
  useEffect(() => {
    if (!isBalanceVisible) return;
    
    let startTime: number;
    const duration = 1200; // 1.2 seconds
    const startValue = animatedBalance;
    const endValue = balance;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function for smooth animation
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentValue = startValue + (endValue - startValue) * easeOutQuart;
      
      setAnimatedBalance(currentValue);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [balance, isBalanceVisible]);

  const toggleBalanceVisibility = () => {
    console.log('Balance visibility toggled:', !isBalanceVisible); // Debug log
    setIsBalanceVisible(!isBalanceVisible);
  };

  const getAccountTypeInfo = (type: string) => {
    switch (type.toUpperCase()) {
      case 'PREMIUM':
        return { 
          icon: PiggyBank, 
          color: 'from-yellow-400 to-orange-500',
          badge: 'status-premium',
          label: 'Premium Account'
        };
      case 'BUSINESS':
        return { 
          icon: CreditCard, 
          color: 'from-blue-500 to-purple-600',
          badge: 'status-info',
          label: 'Business Account'
        };
      case 'SAVINGS':
        return { 
          icon: PiggyBank, 
          color: 'from-green-500 to-emerald-600',
          badge: 'status-success',
          label: 'Savings Account'
        };
      default:
        return { 
          icon: Wallet, 
          color: 'from-blue-500 to-indigo-600',
          badge: 'status-info',
          label: 'Checking Account'
        };
    }
  };

  const accountTypeInfo = getAccountTypeInfo(accountType);
  const IconComponent = accountTypeInfo.icon;

  return (
    <Card className="card-hero hover-lift slide-in glass-enhanced">
      <CardContent className="p-8 text-center relative overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/5 to-transparent rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-400/10 to-transparent rounded-full blur-xl"></div>
        
        {/* Account Type Header */}
        <div className="relative flex items-center justify-between mb-6 z-10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 bg-gradient-to-r ${accountTypeInfo.color} rounded-xl flex items-center justify-center shadow-lg`}>
              <IconComponent className="h-6 w-6 text-white" />
            </div>
            <div className="text-left">
              <div className={`${accountTypeInfo.badge} text-xs px-2 py-1`}>
                {accountTypeInfo.label}
              </div>
              <div className="text-account text-white/70 mt-1">
                ****{accountNumber.slice(-4)}
              </div>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleBalanceVisibility}
            className="relative z-10 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200 hover:scale-110 active:scale-95 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={isBalanceVisible ? "Hide balance" : "Show balance"}
            style={{ pointerEvents: 'auto' }}
          >
            {isBalanceVisible ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Main Balance Display */}
        <div className="mb-6">
          <div className="text-sm text-white/60 font-semibold uppercase tracking-wider mb-3">
            Available Balance
          </div>
          <div className="relative overflow-hidden text-center">
            {isBalanceVisible ? (
              <div className="text-balance text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-2 balance-counter break-all overflow-wrap-anywhere">
                {formatCurrency(animatedBalance)}
              </div>
            ) : (
              <div className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-white mb-2 font-mono">
                ••••••
              </div>
            )}
            
            {/* Monthly Change Indicator */}
            {monthlyChange && isBalanceVisible && (
              <div className="flex items-center justify-center gap-2 mt-3">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                  monthlyChange.trend === 'up' 
                    ? 'bg-green-400/20 text-green-300' 
                    : monthlyChange.trend === 'down'
                    ? 'bg-red-400/20 text-red-300'
                    : 'bg-gray-400/20 text-gray-300'
                }`}>
                  {monthlyChange.trend === 'up' ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : monthlyChange.trend === 'down' ? (
                    <TrendingDown className="h-4 w-4" />
                  ) : (
                    <ArrowUpRight className="h-4 w-4" />
                  )}
                  <span>{Math.abs(monthlyChange.percentage)}%</span>
                </div>
                <span className="text-white/60 text-sm">
                  {monthlyChange.trend === 'up' ? '+' : monthlyChange.trend === 'down' ? '-' : ''}
                  {formatCurrency(Math.abs(monthlyChange.amount))} this month
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        {quickStats && isBalanceVisible && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 pt-6 border-t border-white/10">
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-white text-currency break-all">
                {formatCurrency(quickStats.available)}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide mt-1">Available</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-orange-300 text-currency break-all">
                {formatCurrency(quickStats.pending)}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide mt-1">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-lg sm:text-xl md:text-2xl font-bold text-blue-300 text-currency break-all">
                {formatCurrency(quickStats.reserved)}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wide mt-1">Reserved</div>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="flex items-center justify-center mt-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full status-pulse"></div>
            <span className="text-sm text-white/80 font-medium">Account Active</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}