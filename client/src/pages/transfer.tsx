import { useState } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, ArrowLeft, Check, Clock, DollarSign, Send } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { authManager } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function Transfer() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'review' | 'success'>('form');
  
  const [formData, setFormData] = useState({
    recipientAccount: '',
    recipientName: '',
    amount: '',
    transferType: 'internal' as 'internal' | 'external',
    description: '',
    priority: 'standard' as 'standard' | 'urgent'
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.recipientAccount) {
      newErrors.recipientAccount = 'Recipient account is required';
    } else if (formData.transferType === 'external' && formData.recipientAccount.length < 10) {
      newErrors.recipientAccount = 'External account number must be at least 10 digits';
    }
    
    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'Recipient name is required';
    }
    
    if (!formData.amount) {
      newErrors.amount = 'Amount is required';
    } else if (parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (parseFloat(formData.amount) > 50000) {
      newErrors.amount = 'Amount cannot exceed $50,000 per transfer';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (step === 'form') {
      setStep('review');
      return;
    }

    if (step === 'review') {
      setIsLoading(true);
      
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        toast({
          title: "Transfer Initiated",
          description: `$${formData.amount} transfer to ${formData.recipientName} has been submitted.`,
        });
        
        setStep('success');
      } catch (error) {
        toast({
          title: "Transfer Failed",
          description: "There was an error processing your transfer. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleEdit = () => {
    setStep('form');
  };

  const getFee = () => {
    if (formData.transferType === 'external') {
      return formData.priority === 'urgent' ? 5.99 : 2.99;
    }
    return formData.priority === 'urgent' ? 1.99 : 0;
  };

  const getProcessingTime = () => {
    if (formData.priority === 'urgent') {
      return 'Within 2 hours';
    }
    if (formData.transferType === 'external') {
      return '1-3 business days';
    }
    return 'Instant';
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <Button
            variant="ghost"
            onClick={() => setLocation('/dashboard')}
            className="mb-6 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="text-center pt-8 pb-8">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-green-800 mb-2">
                Transfer Successful!
              </h1>
              <p className="text-green-600 mb-6">
                Your transfer of ${formData.amount} to {formData.recipientName} has been initiated.
              </p>
              
              <div className="bg-white rounded-lg p-4 mb-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transfer ID:</span>
                  <span className="font-mono">TXN-{Date.now().toString().slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Processing Time:</span>
                  <span>{getProcessingTime()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                    <Clock className="w-3 h-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <Button onClick={() => setLocation('/dashboard')} className="w-full">
                  View Dashboard
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setStep('form');
                    setFormData({
                      recipientAccount: '',
                      recipientName: '',
                      amount: '',
                      transferType: 'internal',
                      description: '',
                      priority: 'standard'
                    });
                  }}
                  className="w-full"
                >
                  Make Another Transfer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <Button
          variant="ghost"
          onClick={() => setLocation('/dashboard')}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <Card className="glass-enhanced card-glass border-white/20 shadow-2xl">
          <CardHeader className="text-white">
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              {step === 'form' ? 'Send Money' : 'Review Transfer'}
            </CardTitle>
            <CardDescription className="text-gray-300">
              {step === 'form' 
                ? 'Transfer money to another account securely' 
                : 'Please review your transfer details before confirming'
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {step === 'form' ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="transferType" className="text-white">Transfer Type</Label>
                    <Select 
                      value={formData.transferType} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, transferType: value as 'internal' | 'external' }))
                      }
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="internal">Internal (PrimeEdge Account)</SelectItem>
                        <SelectItem value="external">External Bank Account</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority" className="text-white">Priority</Label>
                    <Select 
                      value={formData.priority} 
                      onValueChange={(value) => 
                        setFormData(prev => ({ ...prev, priority: value as 'standard' | 'urgent' }))
                      }
                    >
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="urgent">Urgent (+fee)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientAccount" className="text-white">
                    {formData.transferType === 'internal' ? 'PrimeEdge Account Number' : 'Bank Account Number'}
                  </Label>
                  <Input
                    id="recipientAccount"
                    value={formData.recipientAccount}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientAccount: e.target.value }))}
                    placeholder={formData.transferType === 'internal' ? 'PE-12345678' : 'Account number'}
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  {errors.recipientAccount && (
                    <p className="text-red-400 text-sm">{errors.recipientAccount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipientName" className="text-white">Recipient Name</Label>
                  <Input
                    id="recipientName"
                    value={formData.recipientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipientName: e.target.value }))}
                    placeholder="Full name of recipient"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                  />
                  {errors.recipientName && (
                    <p className="text-red-400 text-sm">{errors.recipientName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white">Amount</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      max="50000"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
                      placeholder="0.00"
                      className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                  {errors.amount && (
                    <p className="text-red-400 text-sm">{errors.amount}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="What's this transfer for?"
                    className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                    rows={3}
                  />
                </div>

                {getFee() > 0 && (
                  <Alert className="border-blue-400 bg-blue-500/10">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-blue-100">
                      This transfer will incur a ${getFee()} processing fee.
                    </AlertDescription>
                  </Alert>
                )}

                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  Review Transfer
                </Button>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="bg-white/5 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">Transfer Type:</span>
                    <Badge variant={formData.transferType === 'internal' ? 'default' : 'secondary'}>
                      {formData.transferType === 'internal' ? 'Internal' : 'External'}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Recipient:</span>
                    <div className="text-right">
                      <div className="text-white font-medium">{formData.recipientName}</div>
                      <div className="text-gray-400 text-sm">{formData.recipientAccount}</div>
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Amount:</span>
                    <span className="text-white font-bold text-lg">${formData.amount}</span>
                  </div>
                  {getFee() > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Processing Fee:</span>
                      <span className="text-red-400">${getFee()}</span>
                    </div>
                  )}
                  <hr className="border-white/20" />
                  <div className="flex justify-between">
                    <span className="text-gray-300">Total:</span>
                    <span className="text-white font-bold text-lg">
                      ${(parseFloat(formData.amount) + getFee()).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Processing Time:</span>
                    <span className="text-white">{getProcessingTime()}</span>
                  </div>
                  {formData.description && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Description:</span>
                      <span className="text-white max-w-48 text-right">{formData.description}</span>
                    </div>
                  )}
                </div>

                <Alert className="border-yellow-400 bg-yellow-500/10">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-yellow-100">
                    Please verify all details are correct. This action cannot be undone once confirmed.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleEdit}
                    className="flex-1 border-white/20 text-white hover:bg-white/10"
                  >
                    Edit Details
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? (
                      <LoadingSpinner className="w-4 h-4 mr-2" />
                    ) : (
                      <Send className="w-4 h-4 mr-2" />
                    )}
                    {isLoading ? 'Processing...' : 'Confirm Transfer'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}