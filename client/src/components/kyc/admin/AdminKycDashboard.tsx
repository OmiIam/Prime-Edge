// Admin KYC Metrics Dashboard
// Comprehensive analytics and insights for KYC operations

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Users,
  FileText,
  Globe,
  Calendar,
  Activity,
  Download,
  RefreshCw,
  Eye,
  Target
} from 'lucide-react';

// Local imports
import { useAdminKyc } from '../../../hooks/useAdminKyc';
import { 
  AdminKycStatistics,
  KycMetrics,
  TimeRange
} from '../../../types/kyc';
import { getCountryName, getCountryFlag } from '../../../lib/countries';

interface AdminKycDashboardProps {
  className?: string;
}

const AdminKycDashboard: React.FC<AdminKycDashboardProps> = ({ 
  className = '' 
}) => {
  const {
    getMetrics,
    getStatistics,
    loading
  } = useAdminKyc();

  // State
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [metrics, setMetrics] = useState<KycMetrics | null>(null);
  const [statistics, setStatistics] = useState<AdminKycStatistics | null>(null);

  // Load data on mount and time range changes
  useEffect(() => {
    loadDashboardData();
  }, [timeRange]);

  const loadDashboardData = async () => {
    try {
      const [metricsData, statsData] = await Promise.all([
        getMetrics(timeRange),
        getStatistics(timeRange)
      ]);
      setMetrics(metricsData);
      setStatistics(statsData);
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  // Calculate percentage change
  const calculatePercentageChange = (current: number, previous: number): number => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  // Format percentage
  const formatPercentage = (value: number): string => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  // Format duration
  const formatDuration = (hours: number): string => {
    if (hours < 24) {
      return `${hours.toFixed(1)}h`;
    }
    return `${(hours / 24).toFixed(1)}d`;
  };

  // Get approval rate color
  const getApprovalRateColor = (rate: number): string => {
    if (rate >= 90) return 'text-green-400';
    if (rate >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get trend indicator
  const getTrendIndicator = (change: number) => {
    const isPositive = change >= 0;
    return (
      <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
        <TrendingUp className={`h-3 w-3 ${isPositive ? '' : 'rotate-180'}`} />
        <span className="text-xs font-medium">
          {formatPercentage(Math.abs(change))}
        </span>
      </div>
    );
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">KYC Analytics</h1>
          <p className="text-gray-400 mt-1">
            Monitor verification performance and trends
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
              <SelectItem value="365d">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            onClick={loadDashboardData}
            variant="outline"
            className="border-white/20 hover:bg-white/5"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 border-2 border-white/20 border-t-blue-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Submissions */}
              <Card className="card-gradient border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-400/10 rounded-lg">
                      <FileText className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {statistics.totalSubmissions.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">Total Submissions</p>
                    </div>
                  </div>
                  {metrics && getTrendIndicator(
                    calculatePercentageChange(
                      statistics.totalSubmissions,
                      statistics.totalSubmissions - metrics.newSubmissions
                    )
                  )}
                </CardContent>
              </Card>

              {/* Approval Rate */}
              <Card className="card-gradient border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-400/10 rounded-lg">
                      <Target className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <p className={`text-2xl font-bold ${getApprovalRateColor(statistics.approvalRate)}`}>
                        {statistics.approvalRate.toFixed(1)}%
                      </p>
                      <p className="text-sm text-gray-400">Approval Rate</p>
                    </div>
                  </div>
                  {metrics && getTrendIndicator(
                    calculatePercentageChange(
                      statistics.approvalRate,
                      metrics.previousApprovalRate || statistics.approvalRate
                    )
                  )}
                </CardContent>
              </Card>

              {/* Avg Processing Time */}
              <Card className="card-gradient border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-yellow-400/10 rounded-lg">
                      <Clock className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {formatDuration(statistics.avgProcessingTime)}
                      </p>
                      <p className="text-sm text-gray-400">Avg Processing</p>
                    </div>
                  </div>
                  {metrics && getTrendIndicator(
                    -calculatePercentageChange(
                      statistics.avgProcessingTime,
                      metrics.previousAvgProcessingTime || statistics.avgProcessingTime
                    )
                  )}
                </CardContent>
              </Card>

              {/* Active Users */}
              <Card className="card-gradient border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-400/10 rounded-lg">
                      <Users className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-white">
                        {statistics.activeUsers.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-400">Active Users</p>
                    </div>
                  </div>
                  {metrics && getTrendIndicator(
                    calculatePercentageChange(
                      statistics.activeUsers,
                      metrics.previousActiveUsers || statistics.activeUsers
                    )
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Status Breakdown */}
          {statistics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Status Distribution */}
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Activity className="h-5 w-5" />
                    Status Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                      <span className="text-white">Pending Review</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{statistics.pending}</p>
                      <p className="text-xs text-gray-400">
                        {((statistics.pending / statistics.totalSubmissions) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-white">Approved</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{statistics.approved}</p>
                      <p className="text-xs text-gray-400">
                        {((statistics.approved / statistics.totalSubmissions) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                      <span className="text-white">Rejected</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{statistics.rejected}</p>
                      <p className="text-xs text-gray-400">
                        {((statistics.rejected / statistics.totalSubmissions) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                      <span className="text-white">Resubmission Required</span>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{statistics.resubmissionRequired}</p>
                      <p className="text-xs text-gray-400">
                        {((statistics.resubmissionRequired / statistics.totalSubmissions) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Document Types */}
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <FileText className="h-5 w-5" />
                    Popular Document Types
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {metrics?.documentTypeBreakdown?.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-white">{item.type.replace('_', ' ')}</span>
                      <div className="text-right">
                        <p className="text-white font-semibold">{item.count}</p>
                        <p className="text-xs text-gray-400">
                          {item.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )) || (
                    <p className="text-gray-400 text-center">No data available</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Geographic Distribution */}
          {metrics?.countryBreakdown && (
            <Card className="card-gradient border-white/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Globe className="h-5 w-5" />
                  Top Countries ({timeRange})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.countryBreakdown.slice(0, 12).map((country, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{getCountryFlag(country.code)}</span>
                        <span className="text-white font-medium">
                          {getCountryName(country.code)}
                        </span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{country.count}</p>
                        <p className="text-xs text-gray-400">
                          {country.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          {metrics && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Processing Times */}
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Clock className="h-5 w-5" />
                    Processing Times
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Fastest</span>
                    <span className="text-green-400 font-semibold">
                      {formatDuration(metrics.fastestProcessingTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Average</span>
                    <span className="text-white font-semibold">
                      {formatDuration(metrics.avgProcessingTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Slowest</span>
                    <span className="text-red-400 font-semibold">
                      {formatDuration(metrics.slowestProcessingTime)}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Review Quality */}
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <CheckCircle2 className="h-5 w-5" />
                    Review Quality
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">First-time Approval</span>
                    <span className="text-green-400 font-semibold">
                      {metrics.firstTimeApprovalRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Resubmission Rate</span>
                    <span className="text-orange-400 font-semibold">
                      {metrics.resubmissionRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Rejection Rate</span>
                    <span className="text-red-400 font-semibold">
                      {metrics.rejectionRate.toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Peak Times */}
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-white">
                    <Calendar className="h-5 w-5" />
                    Peak Activity
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Peak Hour</span>
                    <span className="text-white font-semibold">
                      {metrics.peakSubmissionHour}:00
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Peak Day</span>
                    <span className="text-white font-semibold">
                      {metrics.peakSubmissionDay}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Submissions Today</span>
                    <span className="text-blue-400 font-semibold">
                      {metrics.todaySubmissions}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Export Actions */}
          <div className="flex justify-center">
            <Button
              variant="outline"
              className="border-white/20 hover:bg-white/5"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Analytics Report
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminKycDashboard;