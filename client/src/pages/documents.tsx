import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import {
  Upload,
  FileText,
  Image,
  Download,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Clock,
  Shield,
  CreditCard,
  Home,
  Receipt,
  FileCheck,
  Loader2,
  Plus,
  Search,
  Filter
} from "lucide-react";

interface Document {
  id: string;
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
  metadata?: any;
}

interface DocumentSummary {
  totalDocuments: number;
  verifiedDocuments: number;
  pendingVerification: number;
  storageUsed: number;
  storageLimit: number;
}

const documentTypes = [
  { value: 'DRIVERS_LICENSE', label: "Driver's License", icon: CreditCard, color: 'blue' },
  { value: 'PASSPORT', label: 'Passport', icon: Shield, color: 'green' },
  { value: 'UTILITY_BILL', label: 'Utility Bill', icon: Home, color: 'yellow' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement', icon: Receipt, color: 'purple' },
  { value: 'TAX_DOCUMENT', label: 'Tax Document', icon: FileText, color: 'orange' },
  { value: 'IDENTITY_VERIFICATION', label: 'Identity Verification', icon: FileCheck, color: 'indigo' }
];

export default function DocumentsPage() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: number}>({});
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch documents data
  const { data: documentsData, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    enabled: authState.isAuthenticated
  });

  const documents: Document[] = documentsData?.documents || [];
  const summary: DocumentSummary = documentsData?.summary || {
    totalDocuments: 0,
    verifiedDocuments: 0,
    pendingVerification: 0,
    storageUsed: 0,
    storageLimit: 100 * 1024 * 1024 // 100MB
  };

  // Upload document mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upload document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setSelectedDocumentType('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  });

  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    }
  });

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || doc.type === filterType;
    const matchesStatus = filterStatus === 'ALL' || 
                         (filterStatus === 'VERIFIED' && doc.verified) ||
                         (filterStatus === 'PENDING' && !doc.verified);
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedDocumentType) return;

    const file = files[0];
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Only JPEG, PNG, and PDF files are allowed');
      return;
    }

    uploadMutation.mutate({ file, type: selectedDocumentType });
  };

  const handleDownload = (document: Document) => {
    window.open(document.url, '_blank');
  };

  const handleDelete = (documentId: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      deleteMutation.mutate(documentId);
    }
  };

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

  const getDocumentTypeConfig = (type: string) => {
    return documentTypes.find(dt => dt.value === type) || documentTypes[0];
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return <Image className="h-4 w-4" />;
    }
    return <FileText className="h-4 w-4" />;
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
                Loading documents...
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
            <h1 className="text-3xl font-bold text-white mb-2">Document Manager</h1>
            <p className="text-blue-200">Upload, manage, and verify your important documents</p>
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
                    <p className="text-sm text-gray-400">Total Documents</p>
                    <p className="text-2xl font-bold text-white">{summary.totalDocuments}</p>
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
                    <p className="text-sm text-gray-400">Verified</p>
                    <p className="text-2xl font-bold text-white">{summary.verifiedDocuments}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-white/10">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                    <Clock className="h-6 w-6 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-white">{summary.pendingVerification}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient border-white/10">
              <CardContent className="p-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-400">Storage Used</p>
                    <p className="text-sm text-white">
                      {formatFileSize(summary.storageUsed)} / {formatFileSize(summary.storageLimit)}
                    </p>
                  </div>
                  <Progress 
                    value={(summary.storageUsed / summary.storageLimit) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upload Section */}
          <Card className="card-gradient border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-400" />
                Upload New Document
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-white">Document Type</Label>
                  <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className="h-4 w-4" />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Choose File</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      onChange={handleFileUpload}
                      disabled={!selectedDocumentType || uploadMutation.isPending}
                      className="bg-white/10 border-white/20 text-white file:bg-blue-600 file:text-white file:border-0 file:rounded-md file:px-3 file:py-1"
                    />
                    {uploadMutation.isPending && (
                      <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
                    )}
                  </div>
                </div>
              </div>

              <Alert className="mt-4 bg-blue-950/50 border-blue-500/30">
                <Upload className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-blue-200">
                  Supported formats: JPEG, PNG, PDF. Maximum file size: 10MB.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Documents List */}
          <Card className="card-gradient border-white/10">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="text-white">Your Documents</CardTitle>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search documents..."
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
                      {documentTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">All Status</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredDocuments.map((document) => {
                  const typeConfig = getDocumentTypeConfig(document.type);
                  return (
                    <div key={document.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            {getFileIcon(document.mimeType)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <h3 className="font-semibold text-white truncate">{document.originalName}</h3>
                              <div className="flex items-center gap-2">
                                <Badge className={`text-xs ${typeConfig.color === 'blue' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                  typeConfig.color === 'green' ? 'bg-green-100 text-green-700 border-green-200' :
                                  typeConfig.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                                  typeConfig.color === 'purple' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                  typeConfig.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                  'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
                                  <typeConfig.icon className="h-3 w-3 mr-1" />
                                  {typeConfig.label}
                                </Badge>
                                {document.verified ? (
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Verified
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-400">
                              <span>Uploaded {formatDate(document.uploadedAt)}</span>
                              <span>{formatFileSize(document.size)}</span>
                              {document.verified && document.verifiedAt && (
                                <span>Verified {formatDate(document.verifiedAt)}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(document)}
                            className="border-white/20 text-gray-300 hover:bg-white/10"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDownload(document)}
                            className="border-white/20 text-gray-300 hover:bg-white/10"
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(document.id)}
                            disabled={deleteMutation.isPending}
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredDocuments.length === 0 && (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">No Documents Found</h3>
                    <p className="text-gray-400">
                      {documents.length === 0 
                        ? "Upload your first document to get started."
                        : "No documents match your current filters."
                      }
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}