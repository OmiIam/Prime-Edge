import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/formatters";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar,
  MoreHorizontal,
  ArrowUpRight,
  ArrowDownRight,
  Minus
} from "lucide-react";

interface SpendingData {
  category: string;
  amount: number;
  percentage: number;
  change: number;
  trend: 'up' | 'down' | 'neutral';
  color: string;
  icon: React.ReactNode;
}

interface SpendingChartProps {
  data: SpendingData[];
  totalSpent: number;
  period: string;
  showComparison?: boolean;
}

export default function SpendingChart({ 
  data, 
  totalSpent, 
  period = "This Month",
  showComparison = true 
}: SpendingChartProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [animatedData, setAnimatedData] = useState<SpendingData[]>(data.map(item => ({ ...item, percentage: 0 })));

  // Animate chart data on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedData(data.map((item, index) => ({
        ...item,
        percentage: item.percentage
      })));
    }, 200);

    return () => clearTimeout(timer);
  }, [data]);

  const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return <ArrowUpRight className="h-3 w-3" />;
      case 'down':
        return <ArrowDownRight className="h-3 w-3" />;
      default:
        return <Minus className="h-3 w-3" />;
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
    switch (trend) {
      case 'up':
        return 'text-red-400';
      case 'down':
        return 'text-green-400';
      default:
        return 'text-gray-400';
    }
  };

  const maxAmount = Math.max(...data.map(item => item.amount));

  return (
    <Card className="card-elevated slide-in">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Spending Analysis</CardTitle>
              <p className="text-sm text-white/60">Breakdown by category • {period}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-right">
              <div className="text-2xl font-bold text-white text-currency">
                {formatCurrency(totalSpent)}
              </div>
              <div className="text-xs text-white/60 uppercase tracking-wider">
                Total Spent
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-4">
          {animatedData.map((item, index) => {
            const isSelected = selectedCategory === item.category;
            const barWidth = (item.amount / maxAmount) * 100;
            
            return (
              <div
                key={item.category}
                className={`
                  group cursor-pointer p-4 rounded-xl transition-all duration-300 border
                  ${isSelected 
                    ? 'bg-white/10 border-white/20 scale-[1.02]' 
                    : 'bg-white/5 border-white/10 hover:bg-white/8 hover:border-white/15'
                  }
                `}
                onClick={() => setSelectedCategory(isSelected ? null : item.category)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-md ${item.color}`}>
                      {item.icon}
                    </div>
                    <div>
                      <div className="font-semibold text-white group-hover:text-blue-200 transition-colors">
                        {item.category}
                      </div>
                      <div className="text-xs text-white/60">
                        {item.percentage.toFixed(1)}% of total spending
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {showComparison && (
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        item.trend === 'up' ? 'bg-red-400/20 text-red-300' :
                        item.trend === 'down' ? 'bg-green-400/20 text-green-300' :
                        'bg-gray-400/20 text-gray-300'
                      }`}>
                        {getTrendIcon(item.trend)}
                        <span>{Math.abs(item.change)}%</span>
                      </div>
                    )}
                    <div className="text-right">
                      <div className="font-bold text-white text-currency">
                        {formatCurrency(item.amount)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="relative">
                  <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${item.color}`}
                      style={{ 
                        width: `${barWidth}%`,
                        transitionDelay: `${index * 150}ms`
                      }}
                    />
                  </div>
                  
                  {/* Progress indicator */}
                  <div 
                    className="absolute -top-1 w-1 h-4 bg-white/60 rounded-full transition-all duration-1000 ease-out"
                    style={{ 
                      left: `${barWidth}%`,
                      transform: 'translateX(-50%)',
                      transitionDelay: `${index * 150}ms`
                    }}
                  />
                </div>

                {/* Expanded Details */}
                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-white/10 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-white text-currency">
                          {item.percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-white/60 uppercase tracking-wider">
                          Of Budget
                        </div>
                      </div>
                      <div>
                        <div className={`text-lg font-bold text-currency ${getTrendColor(item.trend)}`}>
                          {item.change > 0 ? '+' : ''}{item.change}%
                        </div>
                        <div className="text-xs text-white/60 uppercase tracking-wider">
                          vs Last Period
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-white text-currency">
                          {Math.round(item.amount / (totalSpent / 30))}
                        </div>
                        <div className="text-xs text-white/60 uppercase tracking-wider">
                          Daily Avg
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-white/60">
              <Calendar className="h-4 w-4" />
              <span>Updated 2 hours ago</span>
            </div>
            <div className="text-white/50">
              Click categories for detailed breakdown
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}