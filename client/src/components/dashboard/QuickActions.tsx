import { useState } from "react";
import { Button } from "@/components/ui/button";
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
  onTransfer: (amount: string, recipient: string) => void;
  onBillPay: (payee: string, amount: string) => void;
}

export default function QuickActions({ onDeposit, onTransfer, onBillPay }: QuickActionsProps) {
  const [depositOpen, setDepositOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [billPayOpen, setBillPayOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("bank_transfer");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [billAmount, setBillAmount] = useState("");
  const [selectedPayee, setSelectedPayee] = useState("");

  const handleDeposit = () => {
    onDeposit(depositAmount, depositMethod);
    setDepositOpen(false);
    setDepositAmount("");
    setDepositMethod("bank_transfer");
  };

  const handleTransfer = () => {
    onTransfer(transferAmount, recipientEmail);
    setTransferOpen(false);
    setTransferAmount("");
    setRecipientEmail("");
  };

  const handleBillPay = () => {
    onBillPay(selectedPayee, billAmount);
    setBillPayOpen(false);
    setSelectedPayee("");
    setBillAmount("");
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
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Plus className="h-5 w-5 text-green-600" />
              Deposit Money
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="deposit-amount" className="text-gray-700">Amount</Label>
              <Input
                id="deposit-amount"
                type="number"
                placeholder="Enter amount"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="deposit-method" className="text-gray-700">Deposit Method</Label>
              <Select value={depositMethod} onValueChange={setDepositMethod}>
                <SelectTrigger className="mt-1">
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
                className="btn-success flex-1"
                disabled={!depositAmount}
              >
                <Plus className="h-4 w-4 mr-2" />
                Deposit ${depositAmount || '0.00'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setDepositOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Send className="h-5 w-5 text-blue-600" />
              Transfer Money
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="transfer-amount" className="text-gray-700">Amount</Label>
              <Input
                id="transfer-amount"
                type="number"
                placeholder="Enter amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="recipient-email" className="text-gray-700">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                placeholder="Enter recipient's email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleTransfer} 
                className="btn-prime flex-1"
                disabled={!transferAmount || !recipientEmail}
              >
                <Send className="h-4 w-4 mr-2" />
                Send ${transferAmount || '0.00'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setTransferOpen(false)}
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
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 border-0 flex-1"
                disabled={!selectedPayee || !billAmount}
              >
                <Receipt className="h-4 w-4 mr-2" />
                Pay ${billAmount || '0.00'}
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