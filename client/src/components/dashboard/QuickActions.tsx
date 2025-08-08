import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/formatters";
import { LoadingSpinner } from "@/components/ui/loading";
import { authManager } from "@/lib/auth";
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
  ArrowUpRight,
  CheckCircle,
  XCircle,
  Building2
} from "lucide-react";

interface QuickActionsProps {
  onDeposit: (amount: string, method: string) => void;
  onTransfer: (amount: string, recipientInfo: string, transferType: string, bankName?: string) => void;
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
  const [transferType, setTransferType] = useState("checking");
  const [bankName, setBankName] = useState("");
  const [bankValidation, setBankValidation] = useState({ isValid: false, isChecking: false });
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

  // List of valid banks for validation - Global including comprehensive African banks
  const validBanks = [
    // US Banks
    "Chase Bank", "Bank of America", "Wells Fargo", "Citibank", "U.S. Bank",
    "PNC Bank", "Goldman Sachs Bank", "Capital One", "TD Bank", "Truist Bank",
    "JPMorgan Chase", "Morgan Stanley", "American Express Bank", "HSBC Bank",
    "Charles Schwab Bank", "Ally Bank", "Discover Bank", "Marcus by Goldman Sachs",
    "SunTrust Bank", "Regions Bank", "Fifth Third Bank", "KeyBank", "Huntington Bank",
    "M&T Bank", "First National Bank", "Santander Bank", "Navy Federal Credit Union",
    "USAA Bank", "First Citizens Bank", "Comerica Bank",
    
    // South African Banks
    "Standard Bank", "Standard Bank Group", "Absa Bank", "Nedbank", "FirstRand Bank",
    "FNB", "First National Bank", "Capitec Bank", "Investec", "African Bank",
    "Discovery Bank", "Bidvest Bank", "Mercantile Bank", "Sasfin Bank", "TymeBank",
    "Bank Zero", "Grindrod Bank", "Ithala Development Finance Corporation",
    
    // Nigerian Banks
    "United Bank for Africa", "UBA", "Zenith Bank", "Access Bank", "Guaranty Trust Bank",
    "GTCO", "GTBank", "First Bank of Nigeria", "Stanbic IBTC Bank", "Union Bank",
    "Fidelity Bank", "Sterling Bank", "Ecobank Nigeria", "Wema Bank", "Unity Bank",
    "Polaris Bank", "Keystone Bank", "Heritage Bank", "Providus Bank", "Jaiz Bank",
    "SunTrust Bank Nigeria", "Coronation Merchant Bank", "Rand Merchant Bank Nigeria",
    
    // Egyptian Banks
    "National Bank of Egypt", "Commercial International Bank", "CIB", "Banque Misr",
    "Housing and Development Bank", "Credit Agricole Egypt", "Banque du Caire",
    "Export Development Bank of Egypt", "Arab African International Bank",
    "Egyptian Gulf Bank", "National Societe Generale Bank", "QNB Alahli",
    "Al Baraka Bank Egypt", "Emirates NBD Egypt", "Faisal Islamic Bank",
    
    // Moroccan Banks
    "Attijariwafa Bank", "Banque Centrale Populaire", "Bank of Africa", "BMCE Bank",
    "Societe Generale Maroc", "Credit du Maroc", "Banque Marocaine du Commerce Exterieur",
    "Credit Agricole du Maroc", "Banque Populaire", "BMCI", "Al Barid Bank",
    "Umnia Bank", "Bank Al-Maghrib", "CFG Bank",
    
    // Kenyan Banks
    "Equity Bank", "Kenya Commercial Bank", "KCB", "Safaricom", "M-Pesa",
    "Cooperative Bank of Kenya", "Absa Bank Kenya", "Stanbic Bank Kenya",
    "Standard Chartered Kenya", "NCBA Bank", "Diamond Trust Bank", "DTB",
    "I&M Bank", "Commercial Bank of Africa", "CBA", "Family Bank", "NIC Bank",
    "Prime Bank", "Guardian Bank", "Victoria Commercial Bank", "Consolidated Bank",
    "Development Bank of Kenya", "Sidian Bank", "Credit Bank", "Middle East Bank",
    
    // Ghanaian Banks
    "Ghana Commercial Bank", "GCB Bank", "Ecobank Ghana", "Standard Chartered Ghana",
    "Absa Bank Ghana", "Access Bank Ghana", "Fidelity Bank Ghana", "Stanbic Bank Ghana",
    "Zenith Bank Ghana", "United Bank for Africa Ghana", "CAL Bank", "Republic Bank",
    "First National Bank Ghana", "Agricultural Development Bank", "National Investment Bank",
    "ARB Apex Bank", "Prudential Bank", "Omni Bank", "Premium Bank", "Bank of Ghana",
    
    // Ethiopian Banks
    "Awash Bank", "Commercial Bank of Ethiopia", "Awash International Bank",
    "Dashen Bank", "Bank of Abyssinia", "Wegagen Bank", "United Bank",
    "Nib International Bank", "Cooperative Bank of Oromia", "Lion International Bank",
    "Zemen Bank", "Bunna International Bank", "Berhan International Bank",
    "Abay Bank", "Addis International Bank", "Enat Bank", "Shabelle Bank",
    "Hijra Bank", "Tsehay Bank", "Ahadu Bank", "Rammis Bank", "Goh Betoch Bank",
    
    // Algerian Banks
    "Banque Nationale d'Algerie", "BNA", "BNP Paribas El Djazair", "Banque Exterieure d'Algerie",
    "BEA", "Credit Populaire d'Algerie", "CPA", "Banque de l'Agriculture et du Developpement Rural",
    "BADR", "Societe Generale Algerie", "Gulf Bank Algeria", "Trust Bank Algeria",
    "Al Baraka Bank Algeria", "Bank Al-Salam Algeria", "Natixis Algerie",
    
    // Tunisian Banks
    "Amen Bank", "Attijari Bank", "Banque de Tunisie", "Banque Internationale Arabe de Tunisie",
    "BIAT", "Banque Zitouna", "Societe Tunisienne de Banque", "STB", "Union Bancaire pour le Commerce et l'Industrie",
    "UBCI", "Arab Tunisian Bank", "ATB", "Banque de l'Habitat", "Banque Nationale Agricole",
    "BNA Tunisie", "Citi Bank Tunisia", "Union International des Banques", "UIB",
    
    // Tanzanian Banks
    "CRDB Bank", "NMB Bank", "National Bank of Commerce", "NBC", "Stanbic Bank Tanzania",
    "Standard Chartered Tanzania", "Exim Bank Tanzania", "Diamond Trust Bank Tanzania",
    "I&M Bank Tanzania", "TPB Bank", "Peoples Bank of Zanzibar", "PBZ", "FBME Bank",
    "Access Bank Tanzania", "Azania Bank", "Amana Bank", "Bank of Baroda Tanzania",
    "Citibank Tanzania", "Cooperative Development Bank", "Dar es Salaam Community Bank",
    
    // Ugandan Banks
    "Stanbic Bank Uganda", "Centenary Bank", "Housing Finance Bank", "Bank of Uganda",
    "East African Development Bank", "EADB", "Tropical Bank", "Uganda Development Bank",
    "UDB", "Standard Chartered Uganda", "dfcu Bank", "Equity Bank Uganda", "KCB Bank Uganda",
    "Orient Bank", "PostBank Uganda", "Pride Microfinance", "Finance Trust Bank",
    "Cairo International Bank", "United Bank for Africa Uganda", "Absa Bank Uganda",
    "Bank of Baroda Uganda", "Citibank Uganda", "Opportunity Bank", "NC Bank Uganda",
    
    // Zimbabwean Banks
    "CBZ Bank", "Commercial Bank of Zimbabwe", "Stanbic Bank Zimbabwe", "Standard Chartered Zimbabwe",
    "Nedbank Zimbabwe", "FBC Bank", "First Capital Bank", "CABS", "Central Africa Building Society",
    "BancABC", "NMB Bank Zimbabwe", "Steward Bank", "Agribank", "Infrastructure Development Bank of Zimbabwe",
    "IDBZ", "ZB Bank", "Barclays Bank Zimbabwe", "Ecobank Zimbabwe", "Metbank",
    "People's Own Savings Bank", "POSB", "Progressive Building Society", "ZBS Bank",
    
    // Angolan Banks
    "Banco Angolano de Investimentos", "BAI", "Banco BIC", "Banco de Poupança e Crédito",
    "BPC", "Banco Comercial Angolano", "BCA", "Banco Economico", "Banco Keve",
    "Banco Millennium Atlântico", "BMA", "Banco de Desenvolvimento de Angola", "BDA",
    "Banco Sol", "Banco Prestígio", "Banco Regional do Keve", "Banco VTB África",
    "Banco BAI Micro Finanças", "Finibanco Angola", "Standard Bank Angola",
    
    // Namibian Banks
    "Bank Windhoek", "First National Bank Namibia", "FNB Namibia", "Standard Bank Namibia",
    "Nedbank Namibia", "Banco Nacional de Angola Namibia", "SME Bank", "Development Bank of Namibia",
    "DBN", "Agribank Namibia", "Capricorn Investment Holdings", "Bank of Namibia",
    
    // Ivorian Banks (Côte d'Ivoire)
    "Banque Internationale pour le Commerce et l'Industrie de Côte d'Ivoire", "BICICI",
    "Société Générale Côte d'Ivoire", "SGCI", "Ecobank Côte d'Ivoire", "Banque Atlantique Côte d'Ivoire",
    "Coris Bank International", "Banque Populaire de Côte d'Ivoire", "UBA Côte d'Ivoire",
    "Standard Chartered Côte d'Ivoire", "Access Bank Côte d'Ivoire", "Banque de l'Habitat de Côte d'Ivoire",
    "BHCI", "NSIA Banque Côte d'Ivoire", "Orabank Côte d'Ivoire", "Bridge Bank Group",
    
    // Senegalese Banks
    "Banque Atlantique Senegal", "Société Générale Sénégal", "CBAO", "Compagnie Bancaire de l'Afrique Occidentale",
    "Ecobank Sénégal", "UBA Sénégal", "BICIS", "Banque Internationale pour le Commerce et l'Industrie du Sénégal",
    "Banque de Dakar", "Crédit du Sénégal", "BSIC", "Banque Sahélo-Saharienne pour l'Investissement et le Commerce",
    "Banque Agricole", "Banque Islamique du Sénégal", "BIS", "Orabank Sénégal",
    
    // Malian Banks
    "Banque de Développement du Mali", "BDM", "Ecobank Mali", "UBA Mali", "Banque Atlantique Mali",
    "Banque Internationale pour le Mali", "BIM", "Orabank Mali", "Société Générale Mali",
    "Bank of Africa Mali", "Banque Malienne de Solidarité", "BMS", "Banque Nationale de Développement Agricole",
    "BNDA", "Banque Sahélo-Saharienne pour l'Investissement et le Commerce Mali", "BSIC Mali",
    
    // Cameroonian Banks
    "Afriland First Bank", "Société Générale Cameroun", "Commercial Bank of Cameroon", "CBC",
    "Ecobank Cameroun", "UBA Cameroon", "Standard Chartered Cameroun", "Union Bank of Cameroon",
    "Banque Internationale du Cameroun pour l'Epargne et le Crédit", "BICEC", "Crédit Lyonnais Cameroun",
    "National Financial Credit Bank", "NFC Bank", "Banque Atlantique Cameroun", "Express Union",
    "Micro Finance Bank", "Banque des États de l'Afrique Centrale", "BEAC"
  ];

  // Bank validation function
  const validateBankName = async (name: string) => {
    if (!name || name.length < 3) {
      setBankValidation({ isValid: false, isChecking: false });
      return;
    }

    setBankValidation({ isValid: false, isChecking: true });
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const isValid = validBanks.some(bank => 
      bank.toLowerCase().includes(name.toLowerCase()) || 
      name.toLowerCase().includes(bank.toLowerCase())
    );
    
    setBankValidation({ isValid, isChecking: false });
  };

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
    if (transferType === "external_bank" && !recipientInfo) {
      setTransferError("Recipient account details are required");
      return false;
    }
    if (transferType === "external_bank" && !bankName) {
      setTransferError("Bank name is required");
      return false;
    }
    if (transferType === "external_bank" && !bankValidation.isValid) {
      setTransferError("Please enter a valid bank name");
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
      const transferData = {
        amount: transferAmount,
        recipientInfo,
        transferType,
        bankName: transferType === 'external_bank' ? bankName : undefined
      };

      const response = await fetch('/api/user/transfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(transferData)
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Transfer failed. Please try again.';
        try {
          const errorResult = await response.json();
          errorMessage = errorResult.message || `HTTP ${response.status}: ${response.statusText}`;
        } catch {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        setTransferError(errorMessage);
        return;
      }

      const result = await response.json();

      // Call parent callback for any additional handling
      onTransfer(transferAmount, recipientInfo, transferType, bankName);
      
      // Show success message
      alert(result.message || 'Transfer initiated successfully');
      
      // Reset form
      setTransferOpen(false);
      setTransferAmount("");
      setRecipientInfo("");
      setBankName("");
      setBankValidation({ isValid: false, isChecking: false });
      setTransferType("checking");
      setTransferError("");
      
      // Refresh page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Transfer error:', error);
      setTransferError(`Network error: ${error.message}. Please check your connection and try again.`);
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
      <Card className="card-elevated slide-in">
        <CardHeader className="border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <ArrowUpRight className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">Quick Actions</CardTitle>
              <p className="text-sm text-white/60">Fast access to essential banking features</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={`
                    group relative touch-target p-5 rounded-2xl transition-all duration-300 
                    transform hover:scale-[1.02] hover-lift
                    ${action.disabled 
                      ? 'bg-gray-600/10 cursor-not-allowed opacity-40 border border-gray-500/20' 
                      : 'bg-gradient-to-br border border-white/10 hover:border-white/20'
                    } 
                    ${!action.disabled ? action.color : ''}
                  `}
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  {/* Background gradient overlay for enabled actions */}
                  {!action.disabled && (
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                  
                  <div className="relative flex flex-col items-center gap-3 text-center">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center shadow-md transition-all duration-300
                      ${action.disabled 
                        ? 'bg-gray-500/20' 
                        : 'bg-white/20 group-hover:bg-white/30 group-hover:scale-110'
                      }
                    `}>
                      <IconComponent className={`h-6 w-6 transition-colors duration-300 ${
                        action.disabled ? 'text-gray-400' : 'text-white group-hover:text-white'
                      }`} />
                    </div>
                    
                    <div className="space-y-1">
                      <p className={`font-semibold text-sm transition-colors duration-300 ${
                        action.disabled 
                          ? 'text-gray-400' 
                          : 'text-white group-hover:text-blue-100'
                      }`}>
                        {action.title}
                      </p>
                      <p className={`text-xs leading-tight transition-colors duration-300 ${
                        action.disabled 
                          ? 'text-gray-500' 
                          : 'text-white/70 group-hover:text-white/80'
                      }`}>
                        {action.description}
                      </p>
                    </div>
                    
                    {/* Status indicator for disabled items */}
                    {action.disabled && (
                      <div className="absolute top-2 right-2">
                        <div className="w-2 h-2 bg-yellow-400/60 rounded-full status-pulse" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          
          {/* Bottom info section */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/60">
                {quickActions.filter(a => !a.disabled).length} of {quickActions.length} features available
              </span>
              <div className="flex items-center gap-2 text-white/50">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full status-pulse" />
                <span className="text-xs">All systems operational</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Deposit Dialog */}
      <Dialog open={depositOpen} onOpenChange={setDepositOpen}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-gray-50 to-white border border-gray-200 shadow-2xl backdrop-blur-sm" aria-describedby="deposit-description">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                <Plus className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Deposit Money</DialogTitle>
                <p className="text-sm text-gray-600">Add funds to your account securely</p>
              </div>
            </div>
          </DialogHeader>
          <div id="deposit-description" className="sr-only">
            Add funds to your account using various deposit methods
          </div>
          <div className="space-y-4">
            {depositError && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-xl shadow-sm" role="alert">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{depositError}</p>
                </div>
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
                className="btn-prime-success flex-1 focus-ring shadow-lg hover:shadow-xl transition-all duration-200"
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
        <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white via-blue-50/30 to-white border border-gray-200 shadow-2xl backdrop-blur-sm" aria-describedby="transfer-description">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                <Send className="h-5 w-5 text-white" aria-hidden="true" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Transfer Money</DialogTitle>
                <p className="text-sm text-gray-600">Send money securely to accounts or recipients</p>
              </div>
            </div>
          </DialogHeader>
          <div id="transfer-description" className="sr-only">
            Transfer money to your accounts or send to others via email
          </div>
          <div className="space-y-4">
            {transferError && (
              <div className="p-4 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200 rounded-xl shadow-sm" role="alert">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700 font-medium">{transferError}</p>
                </div>
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
                  <SelectItem value="external_bank">External Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transferType === "external_bank" && (
              <div>
                <Label htmlFor="bank-name-qa" className="text-gray-700">Bank Name *</Label>
                <div className="relative mt-1">
                  <Input
                    id="bank-name-qa"
                    type="text"
                    placeholder="Enter bank name (e.g., Chase Bank, Bank of America)"
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      validateBankName(e.target.value);
                      if (transferError) setTransferError("");
                    }}
                    className="focus-ring pr-10"
                    disabled={isTransferLoading}
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    {bankValidation.isChecking ? (
                      <LoadingSpinner size="sm" />
                    ) : bankName.length >= 3 ? (
                      bankValidation.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )
                    ) : null}
                  </div>
                </div>
                {bankName.length >= 3 && !bankValidation.isChecking && (
                  <p className={`text-sm mt-1 ${bankValidation.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {bankValidation.isValid ? '✓ Valid bank name' : '✗ Bank not recognized'}
                  </p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="recipient-info-qa" className="text-gray-700">
                {transferType === "external_bank" ? "Account Number/Routing Number *" :
                 transferType === "checking" ? "Checking Account" :
                 "Savings Account"}
              </Label>
              <Input
                id="recipient-info-qa"
                type="text"
                placeholder={
                  transferType === "external_bank" ? "Account: 1234567890, Routing: 021000021" :
                  transferType === "checking" ? "Checking account (••••4721)" :
                  "Savings account (••••8932)"
                }
                value={recipientInfo}
                onChange={(e) => {
                  setRecipientInfo(e.target.value);
                  if (transferError) setTransferError("");
                }}
                className="mt-1 focus-ring"
                disabled={transferType !== "external_bank" || isTransferLoading}
                aria-describedby={transferType !== "external_bank" ? "account-info-qa" : undefined}
              />
              {transferType !== "external_bank" && (
                <p id="account-info-qa" className="text-sm text-gray-500 mt-1">
                  Transfer between your own accounts
                </p>
              )}
              {transferType === "external_bank" && (
                <p className="text-sm text-gray-500 mt-1">
                  <Building2 className="h-4 w-4 inline mr-1" />
                  External bank transfers may take 1-3 business days
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleTransfer} 
                className="btn-prime-primary flex-1 focus-ring shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isTransferLoading || !transferAmount || 
                  (transferType === "external_bank" && (!recipientInfo || !bankName || !bankValidation.isValid))}
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
                  setBankName("");
                  setBankValidation({ isValid: false, isChecking: false });
                  setTransferType("checking");
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
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-white via-purple-50/30 to-white border border-gray-200 shadow-2xl backdrop-blur-sm">
          <DialogHeader className="border-b border-gray-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Receipt className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-gray-900">Pay Bills</DialogTitle>
                <p className="text-sm text-gray-600">Quick and secure bill payments</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="payee-selection" className="text-gray-700 font-medium">Select Payee *</Label>
              <Select value={selectedPayee} onValueChange={setSelectedPayee} disabled={isBillPayLoading}>
                <SelectTrigger className="mt-1 focus-ring">
                  <SelectValue placeholder="Choose a payee to pay" />
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
              <Label htmlFor="bill-amount" className="text-gray-700 font-medium">Amount *</Label>
              <Input
                id="bill-amount"
                type="number"
                placeholder="Enter amount"
                value={billAmount}
                onChange={(e) => {
                  setBillAmount(e.target.value);
                  if (billPayError) setBillPayError("");
                }}
                className={`mt-1 focus-ring ${billPayError ? 'border-red-300' : ''}`}
                min="0"
                step="0.01"
                disabled={isBillPayLoading}
              />
              {billPayError && (
                <p className="text-sm text-red-600 mt-1" role="alert">
                  {billPayError}
                </p>
              )}
            </div>
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleBillPay} 
                className="btn-prime-primary flex-1 focus-ring shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={isBillPayLoading || !selectedPayee || !billAmount}
              >
                {isBillPayLoading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Receipt className="h-4 w-4 mr-2" />
                    Pay {formatCurrency(parseFloat(billAmount) || 0)}
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setBillPayOpen(false);
                  setBillPayError("");
                  setSelectedPayee("");
                  setBillAmount("");
                }}
                disabled={isBillPayLoading}
                className="focus-ring"
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