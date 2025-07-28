import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Server, 
  Database, 
  Wifi, 
  Shield, 
  Clock,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SystemMetric {
  id: string;
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  lastChecked: Date;
  uptime?: number;
  responseTime?: number;
}

export default function SystemStatus() {
  const [metrics, setMetrics] = useState<SystemMetric[]>([
    {
      id: 'api',
      name: 'API Server',
      status: 'healthy',
      value: '99.9%',
      description: 'All endpoints responding normally',
      icon: Server,
      lastChecked: new Date(),
      uptime: 99.9,
      responseTime: 145
    },
    {
      id: 'database',
      name: 'Database',
      status: 'healthy',
      value: '< 50ms',
      description: 'Query performance optimal',
      icon: Database,
      lastChecked: new Date(),
      uptime: 99.8,
      responseTime: 35
    },
    {
      id: 'network',
      name: 'Network',
      status: 'warning',
      value: '98.7%',
      description: 'Minor latency detected',
      icon: Wifi,
      lastChecked: new Date(),
      uptime: 98.7,
      responseTime: 280
    },
    {
      id: 'security',
      name: 'Security',
      status: 'healthy',
      value: 'Active',
      description: 'All security protocols operational',
      icon: Shield,
      lastChecked: new Date(),
      uptime: 100,
      responseTime: 0
    }
  ]);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  const getStatusColor = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: SystemMetric['status']) => {
    switch (status) {
      case 'healthy':
        return CheckCircle;
      case 'warning':
      case 'critical':
        return AlertTriangle;
      default:
        return Activity;
    }
  };

  const overallStatus = metrics.every(m => m.status === 'healthy') 
    ? 'healthy' 
    : metrics.some(m => m.status === 'critical') 
    ? 'critical' 
    : 'warning';

  const averageUptime = metrics.reduce((sum, metric) => sum + (metric.uptime || 0), 0) / metrics.length;

  const refreshMetrics = async () => {
    setIsRefreshing(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update metrics with new random values
    setMetrics(prev => prev.map(metric => ({
      ...metric,
      lastChecked: new Date(),
      uptime: Math.max(95, Math.random() * 5 + 95), // 95-100%
      responseTime: Math.floor(Math.random() * 200) + 50, // 50-250ms
      status: Math.random() > 0.8 ? 'warning' : 'healthy' as SystemMetric['status']
    })));
    
    setLastRefresh(new Date());
    setIsRefreshing(false);
  };

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-gray-600" />
            <CardTitle className="text-lg font-semibold">System Status</CardTitle>
            <Badge className={cn("ml-2", getStatusColor(overallStatus))}>
              {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Updated {lastRefresh.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshMetrics}
              disabled={isRefreshing}
              className="h-8 w-8 p-0"
            >
              <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
            </Button>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-600">Overall Uptime</span>
            <span className="font-medium">{averageUptime.toFixed(1)}%</span>
          </div>
          <Progress 
            value={averageUptime} 
            className="h-2"
          />
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {metrics.map((metric) => {
            const IconComponent = metric.icon;
            const StatusIcon = getStatusIcon(metric.status);
            
            return (
              <div
                key={metric.id}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <IconComponent className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{metric.name}</h4>
                      <p className="text-xs text-gray-500">{metric.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <StatusIcon className={cn(
                      "h-4 w-4",
                      metric.status === 'healthy' && "text-green-600",
                      metric.status === 'warning' && "text-yellow-600",
                      metric.status === 'critical' && "text-red-600"
                    )} />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge className={cn("text-xs", getStatusColor(metric.status))}>
                      {metric.value}
                    </Badge>
                  </div>
                  
                  {metric.uptime !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Uptime</span>
                      <span className="text-sm font-medium">{metric.uptime.toFixed(1)}%</span>
                    </div>
                  )}
                  
                  {metric.responseTime !== undefined && metric.responseTime > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Response</span>
                      <span className="text-sm font-medium">{metric.responseTime}ms</span>
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-gray-100">
                    <div className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Checked {metric.lastChecked.toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}