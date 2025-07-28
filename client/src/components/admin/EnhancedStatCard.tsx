import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  RefreshCw,
  ExternalLink,
  Clock,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  change: {
    value: number;
    period: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon: React.ComponentType<{ className?: string }>;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
  trend?: number[];
  loading?: boolean;
  lastUpdated?: Date;
  onClick?: () => void;
  onRefresh?: () => void;
  subtitle?: string;
}

export default function EnhancedStatCard({
  title,
  value,
  change,
  icon: Icon,
  color,
  trend = [],
  loading = false,
  lastUpdated,
  onClick,
  onRefresh,
  subtitle
}: StatCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-blue-500',
      text: 'text-blue-600',
      border: 'border-blue-200',
      hover: 'hover:border-blue-300 hover:bg-blue-50/80'
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-green-500',
      text: 'text-green-600',
      border: 'border-green-200',
      hover: 'hover:border-green-300 hover:bg-green-50/80'
    },
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-purple-500',
      text: 'text-purple-600',
      border: 'border-purple-200',
      hover: 'hover:border-purple-300 hover:bg-purple-50/80'
    },
    orange: {
      bg: 'bg-orange-50',
      icon: 'bg-orange-500',
      text: 'text-orange-600',
      border: 'border-orange-200',
      hover: 'hover:border-orange-300 hover:bg-orange-50/80'
    },
    red: {
      bg: 'bg-red-50',
      icon: 'bg-red-500',
      text: 'text-red-600',
      border: 'border-red-200',
      hover: 'hover:border-red-300 hover:bg-red-50/80'
    }
  };

  const config = colorConfig[color];

  const handleRefresh = async () => {
    if (onRefresh) {
      setIsRefreshing(true);
      await onRefresh();
      setTimeout(() => setIsRefreshing(false), 1000);
    }
  };

  const getTrendIcon = () => {
    if (change.type === 'positive') return TrendingUp;
    if (change.type === 'negative') return TrendingDown;
    return Minus;
  };

  const TrendIcon = getTrendIcon();

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (val >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`;
      }
      if (val >= 1000) {
        return `${(val / 1000).toFixed(1)}K`;
      }
      return val.toLocaleString();
    }
    return val;
  };

  if (loading) {
    return (
      <Card className="bg-white border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-8 w-20 mb-2" />
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-12 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      className={cn(
        "bg-white border shadow-sm transition-all duration-200 hover:shadow-md group cursor-pointer",
        config.border,
        config.hover,
        onClick && "hover:scale-[1.02]"
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 px-4 pt-4">
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {title}
          </p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleRefresh();
            }}
            className="h-6 w-6 p-0 hover:bg-gray-100"
            disabled={isRefreshing}
          >
            <RefreshCw className={cn("h-3 w-3 text-gray-400", isRefreshing && "animate-spin")} />
          </Button>
          <div className={cn("rounded-lg p-2 shadow-sm", config.bg)}>
            <Icon className={cn("h-4 w-4 text-white", config.icon.replace('bg-', 'text-'))} />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-4 pb-4">
        <div className="space-y-3">
          {/* Main Value */}
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold text-gray-900">
              {formatValue(value)}
            </div>
            {onClick && (
              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
            )}
          </div>

          {/* Change Indicator */}
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={cn(
                "px-2 py-1 text-xs font-medium",
                change.type === 'positive' && "bg-green-100 text-green-700 border-green-200",
                change.type === 'negative' && "bg-red-100 text-red-700 border-red-200",
                change.type === 'neutral' && "bg-gray-100 text-gray-700 border-gray-200"
              )}
            >
              <TrendIcon className="h-3 w-3 mr-1" />
              {change.type === 'positive' ? '+' : change.type === 'negative' ? '' : ''}
              {Math.abs(change.value)}% {change.period}
            </Badge>
            {lastUpdated && (
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                {mounted && lastUpdated.toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
            )}
          </div>

          {/* Mini Sparkline Chart */}
          {trend.length > 0 && (
            <div className="h-12 flex items-end justify-between gap-1 pt-2 border-t border-gray-100">
              {trend.map((point, index) => {
                const maxPoint = Math.max(...trend);
                const height = maxPoint > 0 ? (point / maxPoint) * 100 : 0;
                return (
                  <div
                    key={index}
                    className={cn(
                      "flex-1 rounded-t-sm transition-all duration-300 hover:opacity-80",
                      config.icon.replace('bg-', 'bg-'),
                      "opacity-70"
                    )}
                    style={{ height: `${Math.max(height, 8)}%` }}
                    title={`${point}`}
                  />
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}