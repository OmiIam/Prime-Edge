import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import {
  FileText,
  Download,
  Calendar,
  Filter,
  Search,
  Eye,
  Mail,
  Printer,
  CreditCard,
  PiggyBank,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Loader2
} from "lucide-react";

interface Statement {
  id: string;
  type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'TAX';
  period: string;
  startDate: string;
  endDate: string;
  status: 'AVAILABLE' | 'PROCESSING' | 'FAILED';
  size: number;
  downloadUrl?: string;
  createdAt: string;
}

interface StatementSummary {
  totalStatements: number;
  availableStatements: number;
  totalDownloads: number;
  lastGenerated: string;
}

export default function StatementsPage() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterYear, setFilterYear] = useState<string>('ALL');

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch statements data
  const { data: statementsData, isLoading } = useQuery({
    queryKey: ['/api/statements'],
    enabled: authState.isAuthenticated
  });

  const statements: Statement[] = statementsData?.statements || [];
  const summary: StatementSummary = statementsData?.summary || {
    totalStatements: 0,
    availableStatements: 0,
    totalDownloads: 0,
    lastGenerated: new Date().toISOString()
  };

  // Filter statements
  const filteredStatements = statements.filter(statement => {
    const matchesSearch = statement.period.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || statement.type === filterType;
    const matchesYear = filterYear === 'ALL' || new Date(statement.startDate).getFullYear().toString() === filterYear;
    return matchesSearch && matchesType && matchesYear;
  });

  // Get available years
  const availableYears = [...new Set(statements.map(s => new Date(s.startDate).getFullYear()))].sort((a, b) => b - a);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return 'bg-green-100 text-green-700 border-green-200';
      case 'PROCESSING': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'FAILED': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle className="h-3 w-3" />;
      case 'PROCESSING': return <Clock className="h-3 w-3" />;
      case 'FAILED': return <AlertTriangle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'MONTHLY': return <Calendar className="h-4 w-4 text-blue-500" />;
      case 'QUARTERLY': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'ANNUAL': return <PiggyBank className="h-4 w-4 text-purple-500" />;
      case 'TAX': return <FileText className="h-4 w-4 text-orange-500" />;
      default: return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const handleDownload = (statement: Statement) => {
    if (statement.downloadUrl) {
      window.open(statement.downloadUrl, '_blank');
    }
  };

  const requestStatement = (type: string, period: string) => {
    // This would typically make an API call to request a new statement
    console.log('Requesting statement:', type, period);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                Loading statements...
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user} />
      
      <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Account Statements</h1>
            <p className="text-blue-200">Download and manage your account statements and tax documents</p>
          </div>

          {/* Summary Cards */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="card-gradient border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Statements</p>
                    <p className="text-2xl font-bold text-white">{summary.totalStatements}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Available</p>
                    <p className="text-2xl font-bold text-white">{summary.availableStatements}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Download className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Downloads</p>
                    <p className="text-2xl font-bold text-white">{summary.totalDownloads}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-orange-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Last Generated</p>
                    <p className="text-sm font-semibold text-white">{formatDate(summary.lastGenerated)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="statements" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1">
              <TabsTrigger value="statements" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                Account Statements
              </TabsTrigger>
              <TabsTrigger value="tax" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                Tax Documents
              </TabsTrigger>
            </TabsList>

            {/* Account Statements */}
            <TabsContent value="statements">
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <CardTitle className="text-white">Account Statements</CardTitle>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search statements..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                        />
                      </div>
                      <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Types</SelectItem>
                          <SelectItem value="MONTHLY">Monthly</SelectItem>
                          <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                          <SelectItem value="ANNUAL">Annual</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterYear} onValueChange={setFilterYear}>
                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ALL">All Years</SelectItem>
                          {availableYears.map(year => (
                            <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredStatements.map((statement) => (
                      <div key={statement.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                              {getTypeIcon(statement.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                                <h3 className="font-semibold text-white">{statement.period}</h3>
                                <Badge className={getStatusColor(statement.status)}>
                                  {getStatusIcon(statement.status)}
                                  <span className="ml-1">{statement.status}</span>
                                </Badge>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                                <span>{formatDate(statement.startDate)} - {formatDate(statement.endDate)}</span>
                                <span>{formatFileSize(statement.size)}</span>
                                <span>{statement.type.toLowerCase().replace('_', ' ')}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/20 text-gray-300 hover:bg-white/10"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </Button>
                            {statement.status === 'AVAILABLE' && (
                              <Button
                                size="sm"
                                onClick={() => handleDownload(statement)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredStatements.length === 0 && (
                      <div className="text-center py-12">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">No Statements Found</h3>
                        <p className="text-gray-400">No statements match your current filters.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tax Documents */}
            <TabsContent value="tax">
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Tax Documents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Tax Documents</h3>
                    <p className="text-gray-400 mb-6">
                      Tax documents for the current year will be available in January.
                    </p>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <Mail className="h-4 w-4 mr-2" />
                      Email When Ready
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}