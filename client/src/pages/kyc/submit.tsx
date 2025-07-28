import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { 
  Upload, 
  FileText, 
  Camera, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  User,
  CreditCard,
  Home,
  FileCheck,
  ArrowRight,
  ArrowLeft,
  Eye,
  Trash2,
  RotateCcw
} from "lucide-react";

interface Document {
  id: string;
  type: 'id_front' | 'id_back' | 'proof_address' | 'selfie';
  file: File;
  status: 'pending' | 'uploaded' | 'verified' | 'rejected';
  preview: string;
  rejectionReason?: string;
}

interface KycStatus {
  overall: 'not_started' | 'in_progress' | 'under_review' | 'verified' | 'rejected';
  documents: {
    id_verification: 'pending' | 'uploaded' | 'verified' | 'rejected';
    address_verification: 'pending' | 'uploaded' | 'verified' | 'rejected';
    selfie_verification: 'pending' | 'uploaded' | 'verified' | 'rejected';
  };
  submittedAt?: Date;
  reviewedAt?: Date;
  estimatedCompletion?: Date;
}

export default function KycSubmit() {
  const [, setLocation] = useLocation();
  const authState = authManager.getState();
  const [currentStep, setCurrentStep] = useState(1);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [dragActive, setDragActive] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  // Mock KYC status - in real app would come from API
  const [kycStatus] = useState<KycStatus>({
    overall: 'in_progress',
    documents: {
      id_verification: 'pending',
      address_verification: 'pending', 
      selfie_verification: 'pending'
    },
    submittedAt: new Date(),
    estimatedCompletion: new Date(Date.now() + 48 * 60 * 60 * 1000) // 48 hours from now
  });

  const documentTypes = [
    {
      type: 'id_front' as const,
      title: 'Government ID (Front)',
      description: 'Driver\'s license, passport, or state ID - front side',
      icon: CreditCard,
      required: true,
      accepted: 'JPEG, PNG, PDF (max 10MB)'
    },
    {
      type: 'id_back' as const, 
      title: 'Government ID (Back)',
      description: 'Back side of your driver\'s license or state ID',
      icon: CreditCard,
      required: true,
      accepted: 'JPEG, PNG, PDF (max 10MB)'
    },
    {
      type: 'proof_address' as const,
      title: 'Proof of Address', 
      description: 'Utility bill, bank statement, or lease agreement (within 90 days)',
      icon: Home,
      required: true,
      accepted: 'JPEG, PNG, PDF (max 10MB)'
    },
    {
      type: 'selfie' as const,
      title: 'Selfie Verification',
      description: 'Clear photo of yourself holding your ID',
      icon: User,
      required: true,
      accepted: 'JPEG, PNG (max 5MB)'
    }
  ];

  const steps = [
    { number: 1, title: "Document Upload", description: "Upload required documents" },
    { number: 2, title: "Review & Submit", description: "Review and submit for verification" },
    { number: 3, title: "Verification", description: "Wait for verification to complete" }
  ];

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-8">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-6">Please sign in to access KYC verification.</p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleDrag = useCallback((e: React.DragEvent, documentType: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(documentType);
    } else if (e.type === "dragleave") {
      setDragActive(null);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, documentType: Document['type']) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(documentType, e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = async (type: Document['type'], file: File) => {
    // Validate file
    const maxSize = type === 'selfie' ? 5 * 1024 * 1024 : 10 * 1024 * 1024; // 5MB for selfie, 10MB for others
    if (file.size > maxSize) {
      alert(`File too large. Maximum size is ${maxSize / (1024 * 1024)}MB`);
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      alert('Invalid file type. Please upload JPEG, PNG, or PDF files only.');
      return;
    }

    // Create preview
    const preview = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.readAsDataURL(file);
    });

    const newDocument: Document = {
      id: Date.now().toString(),
      type,
      file,
      status: 'pending',
      preview,
    };

    // Remove any existing document of this type
    setDocuments(prev => [
      ...prev.filter(doc => doc.type !== type),
      newDocument
    ]);
  };

  const removeDocument = (id: string) => {
    setDocuments(prev => prev.filter(doc => doc.id !== id));
  };

  const getDocumentForType = (type: Document['type']) => {
    return documents.find(doc => doc.type === type);
  };

  const allRequiredDocumentsUploaded = documentTypes
    .filter(dt => dt.required)
    .every(dt => getDocumentForType(dt.type));

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real app, would upload documents to API
    console.log('Submitting documents:', documents);
    
    setIsSubmitting(false);
    setCurrentStep(3);
  };

  const getStatusColor = (status: KycStatus['overall']) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-700 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
      case 'under_review': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: KycStatus['overall']) => {
    switch (status) {
      case 'verified': return CheckCircle;
      case 'rejected': return XCircle;
      case 'under_review': return Clock;
      default: return AlertTriangle;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileCheck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Identity Verification</h1>
                <p className="text-gray-300">Complete your KYC verification to unlock all features</p>
              </div>
            </div>

            {/* Status Card */}
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl mb-6">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold text-gray-900">Verification Status:</span>
                      <Badge className={getStatusColor(kycStatus.overall)}>
                        {kycStatus.overall.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  {kycStatus.estimatedCompletion && (
                    <div className="text-sm text-gray-600">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Est. completion: {kycStatus.estimatedCompletion.toLocaleDateString()}
                    </div>
                  )}
                </div>
                
                {kycStatus.overall === 'in_progress' && (
                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertTriangle className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      Your verification is in progress. Please upload all required documents to continue.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Progress Steps */}
            <div className="flex items-center justify-between mb-8">
              {steps.map((step, index) => (
                <div key={step.number} className="flex items-center">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    currentStep >= step.number 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/20 text-gray-400'
                  }`}>
                    {currentStep > step.number ? (
                      <CheckCircle className="h-6 w-6" />
                    ) : (
                      <span className="font-semibold">{step.number}</span>
                    )}
                  </div>
                  <div className="ml-3 hidden sm:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.number ? 'text-white' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-400">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`hidden sm:block w-24 h-1 mx-4 rounded ${
                      currentStep > step.number ? 'bg-blue-600' : 'bg-white/20'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 1: Document Upload */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Upload Required Documents
                  </CardTitle>
                  <p className="text-gray-600">
                    Please upload clear, high-quality images of your documents. All information must be clearly visible.
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  {documentTypes.map((docType) => {
                    const IconComponent = docType.icon;
                    const existingDoc = getDocumentForType(docType.type);
                    const isActive = dragActive === docType.type;

                    return (
                      <div key={docType.type} className="border border-gray-200 rounded-lg p-6">
                        <div className="flex items-start gap-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-gray-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{docType.title}</h3>
                              {docType.required && (
                                <Badge variant="secondary" className="bg-red-100 text-red-700 text-xs">
                                  Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{docType.description}</p>
                            <p className="text-xs text-gray-500">{docType.accepted}</p>
                          </div>
                        </div>

                        {existingDoc ? (
                          <div className="flex items-center gap-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="w-16 h-16 bg-white rounded-lg overflow-hidden shadow-sm">
                              <img 
                                src={existingDoc.preview} 
                                alt="Document preview"
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{existingDoc.file.name}</p>
                              <p className="text-sm text-gray-600">
                                {(existingDoc.file.size / (1024 * 1024)).toFixed(2)} MB
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setPreviewDocument(existingDoc)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeDocument(existingDoc.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                              isActive 
                                ? 'border-blue-400 bg-blue-50' 
                                : 'border-gray-300 hover:border-gray-400'
                            }`}
                            onDragEnter={(e) => handleDrag(e, docType.type)}
                            onDragLeave={(e) => handleDrag(e, docType.type)}
                            onDragOver={(e) => handleDrag(e, docType.type)}
                            onDrop={(e) => handleDrop(e, docType.type)}
                          >
                            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-lg font-medium text-gray-900 mb-2">
                              Drop your file here, or click to browse
                            </p>
                            <p className="text-sm text-gray-600 mb-4">
                              {docType.accepted}
                            </p>
                            <div className="flex gap-2 justify-center">
                              <Button
                                variant="outline"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = '.jpg,.jpeg,.png,.pdf';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) handleFileSelect(docType.type, file);
                                  };
                                  input.click();
                                }}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                Choose File
                              </Button>
                              {docType.type === 'selfie' && (
                                <Button variant="outline">
                                  <Camera className="h-4 w-4 mr-2" />
                                  Take Photo
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  size="lg"
                  disabled={!allRequiredDocumentsUploaded}
                  onClick={() => setCurrentStep(2)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Continue to Review
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Review & Submit */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Review Your Documents
                  </CardTitle>
                  <p className="text-gray-600">
                    Please review all uploaded documents before submitting for verification.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {documents.map((doc) => {
                    const docType = documentTypes.find(dt => dt.type === doc.type);
                    return (
                      <div key={doc.id} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                        <div className="w-20 h-20 bg-white rounded-lg overflow-hidden shadow-sm">
                          <img 
                            src={doc.preview} 
                            alt="Document preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{docType?.title}</h3>
                          <p className="text-sm text-gray-600">{doc.file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(doc.file.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentStep(1)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Replace
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Important:</strong> Make sure all documents are clear and all information is visible. 
                  Blurry or incomplete documents may cause delays in verification.
                </AlertDescription>
              </Alert>

              <div className="flex justify-between">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  className="border-white/20 text-gray-300 hover:bg-white/10"
                >
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Back to Upload
                </Button>
                <Button
                  size="lg"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit for Verification
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Verification Status */}
          {currentStep === 3 && (
            <div className="text-center">
              <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                <CardContent className="p-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Documents Submitted Successfully!
                  </h2>
                  <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                    Your documents have been submitted for verification. Our team will review them within 24-48 hours. 
                    You'll receive an email notification once the review is complete.
                  </p>
                  <div className="flex gap-4 justify-center">
                    <Button 
                      size="lg"
                      onClick={() => setLocation("/dashboard")}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Return to Dashboard
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={() => setCurrentStep(1)}
                    >
                      Submit Additional Documents
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Document Preview Modal */}
          {previewDocument && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
                <div className="flex items-center justify-between p-4 border-b">
                  <h3 className="text-lg font-semibold">Document Preview</h3>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPreviewDocument(null)}
                  >
                    <XCircle className="h-5 w-5" />
                  </Button>
                </div>
                <div className="p-4">
                  <img 
                    src={previewDocument.preview}
                    alt="Document preview"
                    className="max-w-full max-h-[70vh] object-contain mx-auto"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}