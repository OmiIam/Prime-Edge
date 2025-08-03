import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import {
  FileText,
  Download,
  Mail,
  Smartphone,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  Eye,
  Trash2,
  Star,
  Filter,
  Search,
  RefreshCw,
  FileDown,
  Settings as SettingsIcon
} from "lucide-react";

interface StatementSettings {
  id: string;
  userId: string;
  preferredFormat: 'PDF' | 'EMAIL' | 'MOBILE';
  autoSubscription: boolean;
  deliveryMethod: 'EMAIL' | 'PUSH' | 'BOTH';
  statementFrequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
  includeImages: boolean;
  includeDetails: boolean;
  paperlessConsent: boolean;
  deliveryDay: number; // Day of month (1-28)
  language: string;
  timezone: string;
  createdAt: string;
  updatedAt: string;
}

interface Statement {
  id: string;
  userId: string;
  month: number;
  year: number;
  type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
  status: 'GENERATING' | 'READY' | 'DELIVERED' | 'FAILED';
  fileUrl?: string;
  generatedAt: string;
  deliveredAt?: string;
  fileSize?: number;
}

interface Document {
  id: string;
  userId: string;
  type: 'DRIVERS_LICENSE' | 'PASSPORT' | 'UTILITY_BILL' | 'BANK_STATEMENT' | 'TAX_DOCUMENT' | 'IDENTITY_VERIFICATION';
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
  expiresAt?: string;
}

export default function StatementsDocumentsSettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('settings');
  const [statementFilter, setStatementFilter] = useState('all');
  const [documentFilter, setDocumentFilter] = useState('all');

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch statement settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/user/statements/settings'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/user/statements/settings', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch statement settings');
      }
      return response.json();
    }
  });

  // Fetch statements
  const { data: statementsData, isLoading: statementsLoading } = useQuery({
    queryKey: ['/api/statements'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/statements', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch statements');
      }
      return response.json();
    }
  });

  // Fetch documents
  const { data: documentsData, isLoading: documentsLoading } = useQuery({
    queryKey: ['/api/documents'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/documents', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }
      return response.json();
    }
  });

  const statementSettings: StatementSettings = settingsData?.settings || {} as StatementSettings;
  const statements: Statement[] = statementsData?.statements || [];
  const documents: Document[] = documentsData?.documents || [];

  // Update statement settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<StatementSettings>) => {
      const response = await fetch('/api/user/statements/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update statement settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/statements/settings'] });
    }
  });

  // Generate statement
  const generateStatementMutation = useMutation({
    mutationFn: async (data: { year: number; month: number; type: string }) => {
      const response = await fetch('/api/statements/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to generate statement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/statements'] });
    }
  });

  const handleSettingChange = (key: keyof StatementSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'READY':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Ready</Badge>;
      case 'GENERATING':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Generating</Badge>;
      case 'DELIVERED':
        return <Badge className="bg-purple-100 text-purple-700 border-purple-200"><Mail className="h-3 w-3 mr-1" />Delivered</Badge>;
      case 'FAILED':
        return <Badge className="bg-red-100 text-red-700 border-red-200"><AlertTriangle className="h-3 w-3 mr-1" />Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeMap = {
      'DRIVERS_LICENSE': 'Driver\'s License',
      'PASSPORT': 'Passport',
      'UTILITY_BILL': 'Utility Bill',
      'BANK_STATEMENT': 'Bank Statement',
      'TAX_DOCUMENT': 'Tax Document',
      'IDENTITY_VERIFICATION': 'ID Verification'
    };
    return typeMap[type as keyof typeof typeMap] || type;
  };

  const filteredStatements = statements.filter(statement => {
    if (statementFilter === 'all') return true;
    return statement.status === statementFilter.toUpperCase();
  });

  const filteredDocuments = documents.filter(document => {
    if (documentFilter === 'all') return true;
    if (documentFilter === 'verified') return document.verified;
    if (documentFilter === 'pending') return !document.verified;
    return document.type === documentFilter.toUpperCase();
  });

  const isLoading = settingsLoading || statementsLoading || documentsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading statements and documents...</div>
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
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/settings')}
                className="text-blue-200 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">Statements & Documents</h1>
            <p className="text-blue-200">Manage your statement preferences and document library</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1">
              <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
              <TabsTrigger value="statements" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                <FileText className="h-4 w-4 mr-2" />
                Statements
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-white/20 data-[state=active]:text-white">
                <FileDown className="h-4 w-4 mr-2" />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Statement Preferences */}
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      Statement Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-white font-medium">Preferred Format</Label>
                        <Select
                          value={statementSettings.preferredFormat || 'PDF'}
                          onValueChange={(value) => handleSettingChange('preferredFormat', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PDF">PDF Download</SelectItem>
                            <SelectItem value="EMAIL">Email Delivery</SelectItem>
                            <SelectItem value="MOBILE">Mobile Notification</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-medium">Statement Frequency</Label>
                        <Select
                          value={statementSettings.statementFrequency || 'MONTHLY'}
                          onValueChange={(value) => handleSettingChange('statementFrequency', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MONTHLY">Monthly</SelectItem>
                            <SelectItem value="QUARTERLY">Quarterly</SelectItem>
                            <SelectItem value="ANNUALLY">Annually</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-medium">Delivery Day</Label>
                        <Select
                          value={statementSettings.deliveryDay?.toString() || '1'}
                          onValueChange={(value) => handleSettingChange('deliveryDay', parseInt(value))}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                              <SelectItem key={day} value={day.toString()}>
                                {day}{day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of month
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-medium">Delivery Method</Label>
                        <Select
                          value={statementSettings.deliveryMethod || 'EMAIL'}
                          onValueChange={(value) => handleSettingChange('deliveryMethod', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMAIL">Email Only</SelectItem>
                            <SelectItem value="PUSH">Push Notification</SelectItem>
                            <SelectItem value="BOTH">Email + Push</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Label className="text-white font-medium block">
                            Auto-Generate Statements
                          </Label>
                          <p className="text-sm text-gray-400 mt-1">Automatically generate monthly statements</p>
                        </div>
                        <Switch
                          checked={statementSettings.autoSubscription !== false}
                          onCheckedChange={(value) => handleSettingChange('autoSubscription', value)}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Label className="text-white font-medium block">
                            Include Transaction Images
                          </Label>
                          <p className="text-sm text-gray-400 mt-1">Include receipt and check images in statements</p>
                        </div>
                        <Switch
                          checked={statementSettings.includeImages || false}
                          onCheckedChange={(value) => handleSettingChange('includeImages', value)}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Label className="text-white font-medium block">
                            Detailed Transaction Info
                          </Label>
                          <p className="text-sm text-gray-400 mt-1">Include detailed merchant and location data</p>
                        </div>
                        <Switch
                          checked={statementSettings.includeDetails !== false}
                          onCheckedChange={(value) => handleSettingChange('includeDetails', value)}
                        />
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <Label className="text-white font-medium block">
                            Paperless Consent
                          </Label>
                          <p className="text-sm text-gray-400 mt-1">Opt out of paper statements (eco-friendly)</p>
                        </div>
                        <Switch
                          checked={statementSettings.paperlessConsent || false}
                          onCheckedChange={(value) => handleSettingChange('paperlessConsent', value)}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-green-400" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Button
                        onClick={() => generateStatementMutation.mutate({ 
                          year: new Date().getFullYear(), 
                          month: new Date().getMonth() + 1, 
                          type: 'MONTHLY' 
                        })}
                        disabled={generateStatementMutation.isPending}
                        className="justify-start h-auto p-4 bg-blue-600 hover:bg-blue-700"
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <FileText className="h-4 w-4" />
                            <span className="font-medium">Generate Current Statement</span>
                          </div>
                          <p className="text-xs opacity-80">Create statement for current month</p>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 border-white/20 hover:bg-white/10 text-white"
                        onClick={() => setActiveTab('statements')}
                      >
                        <div className="text-left">
                          <div className="flex items-center gap-2 mb-1">
                            <Download className="h-4 w-4 text-green-400" />
                            <span className="font-medium">Download All Statements</span>
                          </div>
                          <p className="text-xs text-gray-400">Get archive of all statements</p>
                        </div>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Statements Tab */}
            <TabsContent value="statements">
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      Account Statements
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={statementFilter} onValueChange={setStatementFilter}>
                        <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="ready">Ready</SelectItem>
                          <SelectItem value="generating">Generating</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredStatements.map((statement) => (
                      <div key={statement.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                              <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">
                                {new Date(statement.year, statement.month - 1).toLocaleDateString('en-US', { 
                                  month: 'long', 
                                  year: 'numeric' 
                                })} Statement
                              </h3>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <span>Generated {new Date(statement.generatedAt).toLocaleDateString()}</span>
                                {statement.fileSize && <span>{formatFileSize(statement.fileSize)}</span>}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(statement.status)}
                            {statement.status === 'READY' && statement.fileUrl && (
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Download className="h-4 w-4 mr-2" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredStatements.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No statements found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents">
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileDown className="h-5 w-5 text-purple-400" />
                      Documents
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={documentFilter} onValueChange={setDocumentFilter}>
                        <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="verified">Verified</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredDocuments.map((document) => (
                      <div key={document.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                              <FileDown className="h-5 w-5 text-purple-400" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-white">{document.originalName}</h3>
                              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                                <Badge variant="outline" className="text-gray-300">
                                  {getDocumentTypeBadge(document.type)}
                                </Badge>
                                <span>Uploaded {new Date(document.uploadedAt).toLocaleDateString()}</span>
                                <span>{formatFileSize(document.size)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {document.verified ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            ) : (
                              <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                <Clock className="h-3 w-3 mr-1" />
                                Under Review
                              </Badge>
                            )}
                            <Button size="sm" variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}

                    {filteredDocuments.length === 0 && (
                      <div className="text-center py-8">
                        <FileDown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No documents found</p>
                      </div>
                    )}
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