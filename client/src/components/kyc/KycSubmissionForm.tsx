// KYC Submission Form Component
// Secure form for users to submit identity verification documents and information

import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'wouter';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  X, 
  FileImage, 
  FileText, 
  User, 
  MapPin, 
  Calendar,
  AlertCircle,
  CheckCircle2,
  Camera,
  Shield
} from 'lucide-react';

// Local imports
import { useKycSubmission } from '../../hooks/useKyc';
import { KycSubmissionData, DocumentType, DocumentPreview, SelfiePreview } from '../../types/kyc';
import CountrySelect from './CountrySelect';
import DocumentTypeSelect from './DocumentTypeSelect';
import FileUploadZone from './FileUploadZone';
import UploadProgress from './UploadProgress';

interface KycSubmissionFormProps {
  isResubmission?: boolean;
  existingData?: Partial<KycSubmissionData>;
}

const KycSubmissionForm: React.FC<KycSubmissionFormProps> = ({ 
  isResubmission = false, 
  existingData 
}) => {
  const navigate = useNavigate();
  const { 
    formState, 
    uploadProgress, 
    submitKyc, 
    resubmitKyc, 
    validateFile, 
    resetFormState,
    FILE_CONSTRAINTS
  } = useKycSubmission();

  // Form data state
  const [formData, setFormData] = useState<Partial<KycSubmissionData>>({
    fullName: existingData?.fullName || '',
    dateOfBirth: existingData?.dateOfBirth || '',
    countryOfResidence: existingData?.countryOfResidence || '',
    residentialAddress: existingData?.residentialAddress || '',
    documentTypes: existingData?.documentTypes || [],
    documents: undefined,
    selfie: undefined
  });

  // File preview state
  const [documentPreviews, setDocumentPreviews] = useState<DocumentPreview[]>([]);
  const [selfiePreview, setSelfiePreview] = useState<SelfiePreview | null>(null);

  // Validation state
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Mark field as touched
  const markFieldTouched = useCallback((fieldName: string) => {
    setTouchedFields(prev => new Set([...prev, fieldName]));
  }, []);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof KycSubmissionData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    markFieldTouched(field);
  }, [markFieldTouched]);

  // Handle document file selection
  const handleDocumentFilesChange = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    // Validate each file
    const previews: DocumentPreview[] = [];
    const validFiles: File[] = [];
    
    fileArray.forEach((file, index) => {
      const validation = validateFile(file, true);
      const documentType = formData.documentTypes?.[index] || 'PASSPORT';
      
      previews.push({
        file,
        preview: URL.createObjectURL(file),
        type: documentType,
        isValid: validation.isValid,
        errors: validation.errors
      });
      
      if (validation.isValid) {
        validFiles.push(file);
      }
    });
    
    setDocumentPreviews(previews);
    handleInputChange('documents', validFiles);
  }, [formData.documentTypes, handleInputChange, validateFile]);

  // Handle selfie file selection
  const handleSelfieFileChange = useCallback((files: FileList | File[]) => {
    const file = Array.from(files)[0];
    
    if (file) {
      const validation = validateFile(file, false);
      
      const preview: SelfiePreview = {
        file,
        preview: URL.createObjectURL(file),
        isValid: validation.isValid,
        errors: validation.errors
      };
      
      setSelfiePreview(preview);
      
      if (validation.isValid) {
        handleInputChange('selfie', [file]);
      }
    }
  }, [handleInputChange, validateFile]);

  // Handle document type changes
  const handleDocumentTypesChange = useCallback((types: DocumentType[]) => {
    handleInputChange('documentTypes', types);
    
    // Update existing previews with new types
    setDocumentPreviews(prev => 
      prev.map((preview, index) => ({
        ...preview,
        type: types[index] || 'PASSPORT'
      }))
    );
  }, [handleInputChange]);

  // Remove document preview
  const removeDocumentPreview = useCallback((index: number) => {
    setDocumentPreviews(prev => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index].preview);
      newPreviews.splice(index, 1);
      
      // Update form data
      const remainingFiles = newPreviews.map(p => p.file);
      const remainingTypes = formData.documentTypes?.slice(0, remainingFiles.length) || [];
      
      handleInputChange('documents', remainingFiles);
      handleInputChange('documentTypes', remainingTypes);
      
      return newPreviews;
    });
  }, [formData.documentTypes, handleInputChange]);

  // Remove selfie preview
  const removeSelfiePreview = useCallback(() => {
    if (selfiePreview) {
      URL.revokeObjectURL(selfiePreview.preview);
      setSelfiePreview(null);
      handleInputChange('selfie', undefined);
    }
  }, [selfiePreview, handleInputChange]);

  // Calculate form completion progress
  const calculateProgress = useCallback((): number => {
    const requiredFields = [
      'fullName', 
      'dateOfBirth', 
      'countryOfResidence', 
      'residentialAddress'
    ];
    
    let completed = 0;
    requiredFields.forEach(field => {
      if (formData[field as keyof KycSubmissionData]) completed++;
    });
    
    // Check documents
    if (documentPreviews.length > 0 && documentPreviews.every(p => p.isValid)) {
      completed++;
    }
    
    // Check selfie
    if (selfiePreview?.isValid) {
      completed++;
    }
    
    return (completed / (requiredFields.length + 2)) * 100;
  }, [formData, documentPreviews, selfiePreview]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allFields = ['fullName', 'dateOfBirth', 'countryOfResidence', 'residentialAddress'];
    setTouchedFields(new Set(allFields));
    
    // Prepare submission data
    const submissionData: KycSubmissionData = {
      fullName: formData.fullName || '',
      dateOfBirth: formData.dateOfBirth || '',
      countryOfResidence: formData.countryOfResidence || '',
      residentialAddress: formData.residentialAddress || '',
      documentTypes: formData.documentTypes || [],
      documents: formData.documents || [],
      selfie: formData.selfie || []
    };
    
    try {
      const result = isResubmission 
        ? await resubmitKyc(submissionData)
        : await submitKyc(submissionData);
      
      if (result) {
        // Navigate to status page on success
        navigate('/kyc/status');
      }
    } catch (error) {
      // Error handling is done in the hook
      console.error('Form submission error:', error);
    }
  }, [formData, isResubmission, navigate, resubmitKyc, submitKyc]);

  // Cleanup previews on unmount
  useEffect(() => {
    return () => {
      documentPreviews.forEach(preview => {
        URL.revokeObjectURL(preview.preview);
      });
      if (selfiePreview) {
        URL.revokeObjectURL(selfiePreview.preview);
      }
    };
  }, []); // Empty dependency array for cleanup only

  const progress = calculateProgress();
  const hasErrors = Object.keys(formState.errors).length > 0;
  const isFormValid = progress === 100 && !hasErrors;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-4">
          {isResubmission ? 'Resubmit Identity Verification' : 'Identity Verification'}
        </h1>
        <p className="text-gray-300">
          Securely verify your identity to access all banking features. Your information is encrypted and protected.
        </p>
      </div>

      {/* Progress Indicator */}
      <Card className="card-gradient border-white/10">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <Shield className="h-6 w-6 text-blue-400" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-white">Completion Progress</span>
                <span className="text-sm text-gray-300">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {formState.apiError && (
        <Alert className="border-red-400/30 bg-red-500/10">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            {formState.apiError}
          </AlertDescription>
        </Alert>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information Section */}
        <Card className="card-gradient border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Full Name */}
            <div>
              <Label htmlFor="fullName" className="text-white">
                Full Name *
              </Label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName || ''}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                onBlur={() => markFieldTouched('fullName')}
                placeholder="Enter your full legal name"
                className="mt-2 focus-ring"
                disabled={formState.isSubmitting}
              />
              {touchedFields.has('fullName') && formState.errors.fullName && (
                <p className="text-red-400 text-sm mt-1">{formState.errors.fullName}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <Label htmlFor="dateOfBirth" className="text-white">
                Date of Birth *
              </Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth || ''}
                onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                onBlur={() => markFieldTouched('dateOfBirth')}
                className="mt-2 focus-ring"
                disabled={formState.isSubmitting}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]}
              />
              {touchedFields.has('dateOfBirth') && formState.errors.dateOfBirth && (
                <p className="text-red-400 text-sm mt-1">{formState.errors.dateOfBirth}</p>
              )}
              <p className="text-gray-400 text-xs mt-1">Must be 18 years or older</p>
            </div>

            {/* Country of Residence */}
            <div>
              <Label htmlFor="countryOfResidence" className="text-white">
                Country of Residence *
              </Label>
              <CountrySelect
                value={formData.countryOfResidence || ''}
                onChange={(value) => handleInputChange('countryOfResidence', value)}
                onBlur={() => markFieldTouched('countryOfResidence')}
                disabled={formState.isSubmitting}
                className="mt-2"
              />
              {touchedFields.has('countryOfResidence') && formState.errors.countryOfResidence && (
                <p className="text-red-400 text-sm mt-1">{formState.errors.countryOfResidence}</p>
              )}
            </div>

            {/* Residential Address */}
            <div>
              <Label htmlFor="residentialAddress" className="text-white">
                Residential Address *
              </Label>
              <Textarea
                id="residentialAddress"
                value={formData.residentialAddress || ''}
                onChange={(e) => handleInputChange('residentialAddress', e.target.value)}
                onBlur={() => markFieldTouched('residentialAddress')}
                placeholder="Enter your full residential address"
                className="mt-2 focus-ring min-h-[100px]"
                disabled={formState.isSubmitting}
              />
              {touchedFields.has('residentialAddress') && formState.errors.residentialAddress && (
                <p className="text-red-400 text-sm mt-1">{formState.errors.residentialAddress}</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Separator className="bg-white/10" />

        {/* Document Upload Section */}
        <Card className="card-gradient border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5" />
              Identity Documents
            </CardTitle>
            <p className="text-gray-300 text-sm">
              Upload 1-3 clear photos of your identity documents. Accepted formats: JPG, PNG, PDF (max 5MB each).
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Document Type Selection */}
            <DocumentTypeSelect
              values={formData.documentTypes || []}
              onChange={handleDocumentTypesChange}
              maxSelections={FILE_CONSTRAINTS.maxDocuments}
              disabled={formState.isSubmitting}
            />

            {/* Document Upload Zone */}
            <FileUploadZone
              onFilesChange={handleDocumentFilesChange}
              maxFiles={FILE_CONSTRAINTS.maxDocuments}
              maxSize={FILE_CONSTRAINTS.maxSize}
              acceptedTypes={FILE_CONSTRAINTS.allowedTypes}
              disabled={formState.isSubmitting}
              multiple={true}
            />

            {/* Document Previews */}
            {documentPreviews.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-white">Uploaded Documents</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {documentPreviews.map((preview, index) => (
                    <div key={index} className="relative border border-white/10 rounded-lg p-4 bg-white/5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {preview.file.type.startsWith('image/') ? (
                            <FileImage className="h-4 w-4 text-blue-400" />
                          ) : (
                            <FileText className="h-4 w-4 text-red-400" />
                          )}
                          <span className="text-sm font-medium text-white truncate">
                            {preview.file.name}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocumentPreview(index)}
                          className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={preview.isValid ? 'default' : 'destructive'} className="text-xs">
                          {preview.type.replace('_', ' ')}
                        </Badge>
                        {preview.isValid ? (
                          <CheckCircle2 className="h-4 w-4 text-green-400" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>

                      {preview.file.type.startsWith('image/') && (
                        <img
                          src={preview.preview}
                          alt="Document preview"
                          className="w-full h-24 object-cover rounded"
                        />
                      )}

                      {!preview.isValid && (
                        <div className="mt-2">
                          {preview.errors.map((error, errorIndex) => (
                            <p key={errorIndex} className="text-red-400 text-xs">
                              {error}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {formState.errors.documents && (
              <p className="text-red-400 text-sm">{formState.errors.documents}</p>
            )}
          </CardContent>
        </Card>

        <Separator className="bg-white/10" />

        {/* Selfie Upload Section */}
        <Card className="card-gradient border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Camera className="h-5 w-5" />
              Selfie Verification
            </CardTitle>
            <p className="text-gray-300 text-sm">
              Take a clear selfie for identity verification. Make sure your face is well-lit and clearly visible.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <FileUploadZone
              onFilesChange={handleSelfieFileChange}
              maxFiles={1}
              maxSize={FILE_CONSTRAINTS.maxSize}
              acceptedTypes={FILE_CONSTRAINTS.allowedTypes.filter(type => type.startsWith('image/'))}
              disabled={formState.isSubmitting}
              multiple={false}
              accept="image/*"
              capture="user"
            />

            {/* Selfie Preview */}
            {selfiePreview && (
              <div className="border border-white/10 rounded-lg p-4 bg-white/5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="h-4 w-4 text-green-400" />
                    <span className="text-sm font-medium text-white">
                      {selfiePreview.file.name}
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeSelfiePreview}
                    className="text-red-400 hover:text-red-300 h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <img
                    src={selfiePreview.preview}
                    alt="Selfie preview"
                    className="w-24 h-24 object-cover rounded-full"
                  />
                  <div className="flex-1">
                    {selfiePreview.isValid ? (
                      <div className="flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Selfie looks good!</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertCircle className="h-4 w-4" />
                          <span className="text-sm">Issues found:</span>
                        </div>
                        {selfiePreview.errors.map((error, index) => (
                          <p key={index} className="text-red-400 text-xs">
                            {error}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {formState.errors.selfie && (
              <p className="text-red-400 text-sm">{formState.errors.selfie}</p>
            )}
          </CardContent>
        </Card>

        {/* Upload Progress */}
        {uploadProgress.length > 0 && (
          <Card className="card-gradient border-white/10">
            <CardContent className="p-6">
              <UploadProgress uploads={uploadProgress} />
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-center pt-6">
          <Button
            type="submit"
            size="lg"
            disabled={!isFormValid || formState.isSubmitting}
            className="btn-primary px-8 py-3 text-lg font-semibold min-w-[200px]"
          >
            {formState.isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {isResubmission ? 'Resubmitting...' : 'Submitting...'}
              </div>
            ) : (
              <>
                {isResubmission ? 'Resubmit Verification' : 'Submit for Verification'}
              </>
            )}
          </Button>
        </div>

        {/* Security Notice */}
        <div className="text-center text-sm text-gray-400">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="h-4 w-4" />
            <span>Your data is encrypted and secure</span>
          </div>
          <p>
            Review typically takes 1-3 business days. You'll be notified via email when complete.
          </p>
        </div>
      </form>
    </div>
  );
};

export default KycSubmissionForm;