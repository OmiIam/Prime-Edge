import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { LoadingSpinner } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Send, 
  Receipt, 
  Smartphone, 
  MapPin, 
  Calculator,
  PiggyBank,
  Target,
  CreditCard,
  DollarSign,
  ArrowUpRight
} from "lucide-react";

interface QuickActionsProps {
  onDeposit: (amount: string, method: string) => void;
  onTransfer: (amount: string, recipientInfo: string, transferType: string) => void;
  onBillPay: (payee: string, amount: string) => void;
}

export default function QuickActions({ onDeposit, onTransfer, onBillPay }: QuickActionsProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [billPayOpen, setBillPayOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("bank_transfer");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientInfo, setRecipientInfo] = useState("");
  const [transferType, setTransferType] = useState("email");
  const [billAmount, setBillAmount] = useState("");
  const [selectedPayee, setSelectedPayee] = useState("");
  
  // Loading states
  const [isDepositLoading, setIsDepositLoading] = useState(false);
  const [isTransferLoading, setIsTransferLoading] = useState(false);
  const [isBillPayLoading, setIsBillPayLoading] = useState(false);
  
  // Validation errors
  const [depositError, setDepositError] = useState("");
  const [transferError, setTransferError] = useState("");
  const [billPayError, setBillPayError] = useState("");

  const validateDeposit = () => {
    setDepositError("");
    const amount = parseFloat(depositAmount);
    
    if (!depositAmount) {
      setDepositError("Amount is required");
      return false;
    }
    if (isNaN(amount) || amount <= 0) {
      setDepositError("Please enter a valid amount greater than 0");
      return false;
    }
    if (amount > 10000) {
      setDepositError("Daily deposit limit is $10,000");
      return false;
    }
    return true;
  };

  const validateTransfer = () => {
    setTransferError("");
    const amount = parseFloat(transferAmount);
    
    if (!transferAmount) {
      setTransferError("Amount is required");
      return false;
    }
    if (transferType === "email" && !recipientInfo) {
      setTransferError("Recipient email is required");
      return false;
    }
    if (isNaN(amount) || amount <= 0) {
      setTransferError("Please enter a valid amount greater than 0");
      return false;
    }
    if (amount > 5000) {
      setTransferError("Daily transfer limit is $5,000");
      return false;
    }
    if (transferType === "email" && !/\S+@\S+\.\S+/.test(recipientInfo)) {
      setTransferError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const validateBillPay = () => {
    setBillPayError("");
    const amount = parseFloat(billAmount);
    
    if (!selectedPayee) {
      setBillPayError("Please select a payee");
      return false;
    }
    if (!billAmount) {
      setBillPayError("Amount is required");
      return false;
    }
    if (isNaN(amount) || amount <= 0) {
      setBillPayError("Please enter a valid amount greater than 0");
      return false;
    }
    if (amount > 2000) {
      setBillPayError("Bill payment limit is $2,000");
      return false;
    }
    return true;
  };

  const handleDeposit = async () => {
    if (!validateDeposit()) return;
    
    setIsDepositLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      onDeposit(depositAmount, depositMethod);
      setDepositOpen(false);
      setDepositAmount("");
      setDepositMethod("bank_transfer");
      setDepositError("");
    } catch (error) {
      setDepositError("Failed to process deposit. Please try again.");
    } finally {
      setIsDepositLoading(false);
    }
  };

  const handleTransfer = async () => {
    if (!validateTransfer()) return;
    
    setIsTransferLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      onTransfer(transferAmount, recipientInfo, transferType);
      setTransferOpen(false);
      setTransferAmount("");
      setRecipientInfo("");
      setTransferType("email");
      setTransferError("");
    } catch (error) {
      setTransferError("Failed to process transfer. Please try again.");
    } finally {
      setIsTransferLoading(false);
    }
  };

  const handleBillPay = async () => {
    if (!validateBillPay()) return;
    
    setIsBillPayLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      onBillPay(selectedPayee, billAmount);
      setBillPayOpen(false);
      setSelectedPayee("");
      setBillAmount("");
      setBillPayError("");
    } catch (error) {
      setBillPayError("Failed to process payment. Please try again.");
    } finally {
      setIsBillPayLoading(false);
    }
  };

  const quickActions = [
    {
      title: "Deposit Money",
      description: "Add funds to your account",
      icon: Plus,
      color: "from-green-500 to-emerald-600",
      onClick: () => setDepositOpen(true),
      disabled: false
    },
    {
      title: "Transfer Money",
      description: "Send money to others",
      icon: Send,
      color: "from-blue-500 to-blue-600",
      onClick: () => setTransferOpen(true),
      disabled: false
    },
    {
      title: "Pay Bills",
      description: "Pay your bills quickly",
      icon: Receipt,
      color: "from-purple-500 to-purple-600",
      onClick: () => setBillPayOpen(true),
      disabled: false
    },
    {
      title: "Mobile Deposit",
      description: "Deposit checks with camera",
      icon: Smartphone,
      color: "from-orange-500 to-orange-600",
      onClick: () => alert("Mobile deposit feature coming soon!"),
      disabled: true
    },
    {
      title: "Find ATM",
      description: "Locate nearby ATMs",
      icon: MapPin,
      color: "from-red-500 to-red-600",
      onClick: () => alert("ATM locator feature coming soon!"),
      disabled: true
    },
    {
      title: "Calculators",
      description: "Financial planning tools",
      icon: Calculator,
      color: "from-indigo-500 to-indigo-600",
      onClick: () => alert("Financial calculators coming soon!"),
      disabled: true
    }
  ];

  return (
    <>
      <Card className="card-gradient border-white/10 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
            <ArrowUpRight className="h-5 w-5 text-prime-accent" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`touch-target p-4 rounded-xl transition-all duration-300 transform hover:scale-105 ${
                    action.disabled 
                      ? 'bg-gray-600/20 cursor-not-allowed opacity-50' 
                      : 'bg-gradient-to-br hover:shadow-lg'
                  } ${!action.disabled ? action.color : ''}`}
                >
                  <div className="flex flex-col items-center gap-2 text-center">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      action.disabled ? 'bg-gray-500/30' : 'bg-white/20'
                    }`}>
                      <IconComponent className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium text-sm">{action.title}</p>
                      <p className="text-white/70 text-xs">{action.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="sm:max-w-md bg-white" aria-describedby="deposit-description">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" aria-hidden="true" />
              Deposit Money
            </DialogTitle>
          </DialogHeader>
          <div id="deposit-description" className="sr-only">
            Add funds to your account using various deposit methods
          </div>
          <div className="space-y-4">
            {depositError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p className="text-sm text-red-600">{depositError}</p>
              </div>
            )}
            <div>
              <Label htmlFor="deposit-amount" className="text-gray-700">Amount *</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => {
                  setDepositAmount(e.target.value);
                  if (depositError) setDepositError("");
                }}
                className={`mt-1 focus-ring ${depositError ? 'border-red-300' : ''}`}
                min="0"
                step="0.01"
                disabled={isDepositLoading}
                aria-describedby={depositError ? "deposit-error" : undefined}
              />
              {depositError && (
                <p id="deposit-error" className="text-sm text-red-600 mt-1" role="alert">
                  {depositError}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="deposit-method" className="text-gray-700">Deposit Method</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod} disabled={isDepositLoading}>
                <SelectTrigger className="mt-1 focus-ring">
                  <SelectValue placeholder="Select deposit method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="wire_transfer">Wire Transfer</SelectItem>
                  <SelectItem value="mobile_deposit">Mobile Check Deposit</SelectItem>
                  <SelectItem value="cash_deposit">Cash Deposit (Branch)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleDeposit} 
                className="btn-prime-success flex-1 focus-ring"
                disabled={isDepositLoading || !depositAmount}
                aria-describedby="deposit-button-description"
              >
                {isDepositLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                    Deposit {formatCurrency(parseFloat(depositAmount) || 0)}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setDepositOpen(false);
                  setDepositError("");
                }}
                disabled={isDepositLoading}
                className="focus-ring"
              >
                Cancel
              </Button>
            </div>
            <div id="deposit-button-description" className="sr-only">
              Click to deposit the specified amount to your account
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md bg-white" aria-describedby="transfer-description">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" aria-hidden="true" />
              Transfer Money
            </DialogTitle>
          </DialogHeader>
          <div id="transfer-description" className="sr-only">
            Transfer money to your accounts or send to others via email
          </div>
          <div className="space-y-4">
            {transferError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                <p className="text-sm text-red-600">{transferError}</p>
              </div>
            )}
            <div>
              <Label htmlFor="transfer-amount" className="text-gray-700">Amount *</Label>
              <Input
                id="transfer-amount"
                type="number"
                placeholder="Enter amount"
                value={transferAmount}
                onChange={(e) => {
                  setTransferAmount(e.target.value);
                  if (transferError) setTransferError("");
                }}
                className={`mt-1 focus-ring ${transferError ? 'border-red-300' : ''}`}
                min="0"
                step="0.01"
                disabled={isTransferLoading}
              />
            </div>
            
            <div>
              <Label htmlFor="transfer-type-qa" className="text-gray-700">Transfer To</Label>
              <Select value={transferType} onValueChange={setTransferType} disabled={isTransferLoading}>
                <SelectTrigger className="mt-1 focus-ring">
                  <SelectValue placeholder="Select transfer destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="email">Send to Others</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="recipient-info-qa" className="text-gray-700">
                {transferType === "email" ? "Recipient Email *" : 
                 transferType === "checking" ? "Checking Account" :
                 "Savings Account"}
              </Label>
              <Input
                id="recipient-info-qa"
                type={transferType === "email" ? "email" : "text"}
                placeholder={
                  transferType === "email" ? "Enter recipient's email" :
                  transferType === "checking" ? "Checking account (••••4721)" :
                  "Savings account (••••8932)"
                }
                value={recipientInfo}
                onChange={(e) => {
                  setRecipientInfo(e.target.value);
                  if (transferError) setTransferError("");
                }}
                className="mt-1 focus-ring"
                disabled={transferType !== "email" || isTransferLoading}
                aria-describedby={transferType !== "email" ? "account-info-qa" : undefined}
              />
              {transferType !== "email" && (
                <p id="account-info-qa" className="text-sm text-gray-500 mt-1">
                  Transfer between your own accounts
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleTransfer} 
                className="btn-prime-primary flex-1 focus-ring"
                disabled={isTransferLoading || !transferAmount || (transferType === "email" && !recipientInfo)}
              >
                {isTransferLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                    Send {formatCurrency(parseFloat(transferAmount) || 0)}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setTransferOpen(false);
                  setTransferError("");
                  setTransferAmount("");
                  setRecipientInfo("");
                  setTransferType("email");
                }}
                disabled={isTransferLoading}
                className="focus-ring"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill Pay Dialog */}
      <Dialog open={billPayOpen} onOpenChange={setBillPayOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Receipt className="h-5 w-5 text-purple-600" />
              Pay Bills
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payee-selection" className="text-gray-700">Select Payee</Label>
              <Select value={selectedPayee} onValueChange={setSelectedPayee}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select a payee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="electric_company">Electric Company</SelectItem>
                  <SelectItem value="gas_company">Gas Company</SelectItem>
                  <SelectItem value="internet_provider">Internet Provider</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="mortgage">Mortgage</SelectItem>
                  <SelectItem value="insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bill-amount" className="text-gray-700">Amount</Label>
              <Input
                id="bill-amount"
                type="number"
                placeholder="Enter amount"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleBillPay} 
                className="btn-prime-primary flex-1"
                disabled={!selectedPayee || !billAmount}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Pay {formatCurrency(parseFloat(billAmount) || 0)}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setBillPayOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}