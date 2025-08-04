import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { authManager } from "@/lib/auth";
import Navbar from "@/components/navbar";
import TrustIndicators, { SecurityStatus } from "@/components/TrustIndicators";
import BalanceCard from "@/components/dashboard/BalanceCard";
import TransactionList from "@/components/dashboard/TransactionList";
import { lazy, Suspense } from "react";
import { LoadingSpinner } from "@/components/ui/loading";

// Lazy load heavy dashboard components
const QuickActions = lazy(() => import("@/components/dashboard/QuickActions"));
const FinancialInsights = lazy(() => import("@/components/dashboard/FinancialInsights"));
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, ShoppingCart, CreditCard, Home, Briefcase, Send, Plus, Receipt, Smartphone, MapPin, Calculator, PiggyBank, Target, BarChart3, DollarSign, CheckCircle, XCircle, Building2, ArrowDownLeft } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { formatCurrency, formatAccountNumber, formatFinancialDate, formatTransactionAmount } from "@/lib/formatters";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
}

interface DashboardData {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    balance: number;
    accountNumber: string;
    accountType: string;
    lastLogin: string | null;
  };
  recentTransactions: Transaction[];
  monthlyStats: {
    spent: number;
    received: number;
    transactionCount: number;
  };
}

const getTransactionIcon = (description: string) => {
  const desc = description.toLowerCase();
  if (desc.includes('amazon') || desc.includes('purchase') || desc.includes('shopping')) {
    return ShoppingCart;
  }
  if (desc.includes('salary') || desc.includes('deposit') || desc.includes('credit')) {
    return ArrowDownRight;
  }
  if (desc.includes('rent') || desc.includes('mortgage')) {
    return Home;
  }
  if (desc.includes('card') || desc.includes('payment')) {
    return CreditCard;
  }
  return Briefcase;
};

const getTransactionColor = (type: string) => {
  return type === 'CREDIT' ? 'text-prime-success' : 'text-prime-error';
};

export default function Dashboard() {
  const authState = authManager.getState();
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientInfo, setRecipientInfo] = useState("");
  const [transferType, setTransferType] = useState("email");
  const [bankName, setBankName] = useState("");
  const [bankValidation, setBankValidation] = useState({ isValid: false, isChecking: false });
  const [transferOpen, setTransferOpen] = useState(false);
  const [depositOpen, setDepositOpen] = useState(false);
  const [billPayOpen, setBillPayOpen] = useState(false);
  const [depositAmount, setDepositAmount] = useState("");
  const [depositMethod, setDepositMethod] = useState("bank_transfer");
  const [payeeSelection, setPayeeSelection] = useState("");

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

  const { data, isLoading, error } = useQuery<DashboardData>({
    queryKey: ['/api/user/dashboard'],
    enabled: authState.isAuthenticated,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-prime-navy text-white">
        <Navbar user={authState.user!} />
        <div className="pt-16 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <Skeleton className="h-8 w-64 mb-2 bg-prime-slate" />
              <Skeleton className="h-4 w-96 bg-prime-slate" />
            </div>
            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="gradient-card border-prime-slate/30">
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-24 mb-2 bg-prime-slate" />
                    <Skeleton className="h-8 w-32 mb-1 bg-prime-slate" />
                    <Skeleton className="h-3 w-20 bg-prime-slate" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-prime-navy text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to load dashboard</h2>
          <p className="text-gray-300 mb-4">
            {error instanceof Error ? error.message : "An unexpected error occurred."}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-prime-primary"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-prime-navy text-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Unable to load dashboard</h2>
          <p className="text-gray-300">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const monthlySpending = data.monthlyStats.spent;
  const monthlyTransactions = data.monthlyStats.transactionCount;

  const handleTransfer = async (amount?: string, recipient?: string, type?: string) => {
    try {
      const transferData = {
        amount: amount || transferAmount,
        recipientInfo: recipient || recipientInfo,
        transferType: type || transferType,
        bankName: (type || transferType) === 'external_bank' ? bankName : undefined
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
        alert(errorMessage);
        return;
      }

      const result = await response.json();
      
      // Show success message
      alert(result.message || 'Transfer initiated successfully');
      
      // Close modal and reset form
      setTransferOpen(false);
      setTransferAmount("");
      setRecipientInfo("");
      setBankName("");
      setBankValidation({ isValid: false, isChecking: false });
      setTransferType("email");
      
      // Refresh dashboard data to show updated balance/transactions
      window.location.reload();
    } catch (error) {
      console.error('Transfer error:', error);
      alert(`Network error: ${error.message}. Please check your connection and try again.`);
    }
  };

  const handleDeposit = () => {
    // In a real app, this would make an API call
    console.log('Deposit:', { amount: depositAmount, method: depositMethod });
    setDepositOpen(false);
    setDepositAmount("");
    setDepositMethod("bank_transfer");
  };

  const handleBillPay = () => {
    // In a real app, this would make an API call
    console.log('Bill Pay:', { payee: payeeSelection });
    setBillPayOpen(false);
    setPayeeSelection("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
        <div className="container-prime">
          {/* Header */}
          <header className="mb-6 sm:mb-8" role="banner">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div 
                  className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
                  role="img"
                  aria-label={`Profile avatar for ${data.user.name}`}
                >
                  <span className="text-white font-bold text-sm sm:text-lg">
                    {data.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1">
                    <span className="sr-only">Dashboard for </span>
                    Welcome back, {data.user.name.split(' ')[0]}! 
                    <span role="img" aria-label="waving hand">👋</span>
                  </h1>
                  <p className="text-blue-200 text-xs sm:text-sm lg:text-base">Here's your financial overview for today.</p>
                </div>
              </div>
              
              <Button 
                className="btn-prime-primary touch-target focus-ring"
                aria-label="Open quick transfer dialog"
                onClick={() => setTransferOpen(true)}
              >
                <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Quick Transfer</span>
                <span className="sm:hidden">Transfer</span>
              </Button>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-blue-300">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span>Last updated: {new Date().toLocaleString()}</span>
              </div>
              <SecurityStatus className="text-xs" />
            </div>
          </header>

          {/* Enhanced Account Information */}
          <section aria-labelledby="account-info-heading" className="mb-8">
            <h2 id="account-info-heading" className="sr-only">Account Information</h2>
            <Card className="card-elevated hover-lift slide-in" role="region" aria-label="Account details">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl relative">
                      <span className="text-white font-bold text-xl">
                        {data.user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-400 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{data.user.name}</h3>
                      <p className="text-blue-200 text-sm">{data.user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="status-success">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verified Member
                        </div>
                        <div className="status-info text-xs">
                          {data.user.role}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60 uppercase tracking-wide font-medium mb-1">Account Since</div>
                    <div className="text-white font-semibold">
                      {new Date(data.user.createdAt || new Date()).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="text-center sm:text-left p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-xs text-white/60 uppercase tracking-wide font-medium mb-2">Account Number</div>
                    <div className="text-account text-white font-bold mb-1">
                      {formatAccountNumber(data.user.accountNumber || '')}
                    </div>
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <div className="text-xs text-blue-300 uppercase font-medium">{data.user.accountType || 'BUSINESS'}</div>
                      <span className="w-1 h-1 bg-blue-300 rounded-full"></span>
                      <div className="text-xs text-blue-300">Account</div>
                    </div>
                  </div>

                  <div className="text-center sm:text-left p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-xs text-white/60 uppercase tracking-wide font-medium mb-2">Status</div>
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full status-pulse"></div>
                      <div className="text-lg font-bold text-green-400">Active</div>
                    </div>
                    <div className="text-xs text-green-300">All systems operational</div>
                  </div>

                  <div className="text-center sm:text-left p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="text-xs text-white/60 uppercase tracking-wide font-medium mb-2">Last Activity</div>
                    <div className="text-white font-semibold mb-1">
                      <time dateTime={new Date().toISOString()}>
                        {format(new Date(), 'MMM d, yyyy')}
                      </time>
                    </div>
                    <div className="text-xs text-blue-300">
                      <time dateTime={new Date().toISOString()}>
                        {format(new Date(), 'h:mm a')}
                      </time>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Professional Balance Card - Hero Element */}
          <section aria-labelledby="balance-heading" className="mb-8">
            <BalanceCard
              balance={data.user.balance}
              accountType={data.user.accountType || 'BUSINESS'}
              accountNumber={data.user.accountNumber || ''}
              monthlyChange={{
                amount: data.monthlyStats.received - data.monthlyStats.spent,
                percentage: ((data.monthlyStats.received - data.monthlyStats.spent) / Math.max(data.user.balance, 1000)) * 100,
                trend: data.monthlyStats.received > data.monthlyStats.spent ? 'up' : 'down'
              }}
              quickStats={{
                available: data.user.balance,
                pending: 0, // This would come from API
                reserved: 0 // This would come from API
              }}
            />
          </section>

          {/* Enhanced Secondary Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
            <Card className="card-stats hover-lift slide-in">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60 uppercase tracking-wide font-medium">Monthly</div>
                    <div className="text-xs text-red-300">Spending</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2 text-currency">
                  {formatCurrency(monthlySpending)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full status-pulse"></div>
                  <div className="text-xs text-white/60">This Month</div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="card-stats hover-lift slide-in" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ArrowDownRight className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60 uppercase tracking-wide font-medium">Monthly</div>
                    <div className="text-xs text-green-300">Income</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2 text-currency">
                  {formatCurrency(data.monthlyStats.received)}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full status-pulse"></div>
                  <div className="text-xs text-white/60">This Month</div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-stats hover-lift slide-in" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <ArrowUpRight className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60 uppercase tracking-wide font-medium">Total</div>
                    <div className="text-xs text-purple-300">Transactions</div>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-2">
                  {monthlyTransactions}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full status-pulse"></div>
                  <div className="text-xs text-white/60">This Month</div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-stats hover-lift slide-in" style={{ animationDelay: '300ms' }}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-white/60 uppercase tracking-wide font-medium">Net</div>
                    <div className="text-xs text-blue-300">Change</div>
                  </div>
                </div>
                <div className={`text-2xl font-bold mb-2 text-currency ${
                  (data.monthlyStats.received - monthlySpending) >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  {formatCurrency(data.monthlyStats.received - monthlySpending)}
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full status-pulse ${
                    (data.monthlyStats.received - monthlySpending) >= 0 ? 'bg-green-400' : 'bg-red-400'
                  }`}></div>
                  <div className="text-xs text-white/60">This Month</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Professional Transaction List */}
          <div className="mb-8">
            <TransactionList 
              transactions={data.recentTransactions}
              title="Recent Activity"
              showSearch={true}
              maxHeight="600px"
            />
          </div>

          {/* Enhanced Dashboard Components */}
          <div className="grid lg:grid-cols-3 gap-6 mt-8">
            {/* Quick Actions */}
            <div className="lg:col-span-1">
              <Suspense fallback={
                <Card className="card-gradient border-white/10 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center h-48">
                      <LoadingSpinner size="md" label="Loading quick actions" />
                    </div>
                  </CardContent>
                </Card>
              }>
                <QuickActions 
                  onDeposit={handleDeposit}
                  onTransfer={handleTransfer}
                  onBillPay={handleBillPay}
                />
              </Suspense>
            </div>
            
            {/* Financial Insights */}
            <div className="lg:col-span-2">
              <Suspense fallback={
                <Card className="card-gradient border-white/10 shadow-xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center h-64">
                      <LoadingSpinner size="md" label="Loading financial insights" />
                    </div>
                  </CardContent>
                </Card>
              }>
                <FinancialInsights 
                  transactions={data.recentTransactions}
                  monthlySpending={monthlySpending}
                  balance={data.user.balance}
                />
              </Suspense>
            </div>
          </div>

          {/* Trust Indicators */}
          <section className="mt-12" aria-label="Security and compliance information">
            <h3 className="text-lg font-semibold text-white mb-4 text-center">Your Security & Trust</h3>
            <TrustIndicators variant="dashboard" />
          </section>
        </div>
      </div>

      {/* Quick Transfer Dialog */}
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
            <div>
              <Label htmlFor="transfer-amount" className="text-gray-700">Amount *</Label>
              <Input
                id="transfer-amount"
                type="number"
                placeholder="Enter amount"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
                className="mt-1 focus-ring"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <Label htmlFor="transfer-type" className="text-gray-700">Transfer To</Label>
              <Select value={transferType} onValueChange={setTransferType}>
                <SelectTrigger className="mt-1 focus-ring">
                  <SelectValue placeholder="Select transfer destination" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checking">Checking Account</SelectItem>
                  <SelectItem value="savings">Savings Account</SelectItem>
                  <SelectItem value="email">Send to Others</SelectItem>
                  <SelectItem value="external_bank">External Bank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {transferType === "external_bank" && (
              <div>
                <Label htmlFor="bank-name" className="text-gray-700">Bank Name *</Label>
                <div className="relative mt-1">
                  <Input
                    id="bank-name"
                    type="text"
                    placeholder="Enter bank name (e.g., Chase Bank, Bank of America)"
                    value={bankName}
                    onChange={(e) => {
                      setBankName(e.target.value);
                      validateBankName(e.target.value);
                    }}
                    className="focus-ring pr-10"
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
              <Label htmlFor="recipient-info" className="text-gray-700">
                {transferType === "email" ? "Recipient Email *" : 
                 transferType === "external_bank" ? "Account Number/Routing Number *" :
                 transferType === "checking" ? "Checking Account" :
                 "Savings Account"}
              </Label>
              <Input
                id="recipient-info"
                type={transferType === "email" ? "email" : "text"}
                placeholder={
                  transferType === "email" ? "Enter recipient's email" :
                  transferType === "external_bank" ? "Account: 1234567890, Routing: 021000021" :
                  transferType === "checking" ? "Checking account (••••4721)" :
                  "Savings account (••••8932)"
                }
                value={recipientInfo}
                onChange={(e) => setRecipientInfo(e.target.value)}
                className="mt-1 focus-ring"
                disabled={transferType !== "email" && transferType !== "external_bank"}
                aria-describedby={(transferType !== "email" && transferType !== "external_bank") ? "account-info" : undefined}
              />
              {(transferType !== "email" && transferType !== "external_bank") && (
                <p id="account-info" className="text-sm text-gray-500 mt-1">
                  Transfer between your own accounts
                </p>
              )}
              {transferType === "external_bank" && (
                <p className="text-sm text-gray-500 mt-1">
                  External bank transfers may take 1-3 business days
                </p>
              )}
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleTransfer} 
                className="btn-prime-primary flex-1 focus-ring"
                disabled={!transferAmount || 
                  (transferType === "email" && !recipientInfo) ||
                  (transferType === "external_bank" && (!recipientInfo || !bankName || !bankValidation.isValid))}
              >
                <Send className="h-4 w-4 mr-2" aria-hidden="true" />
                Send {formatCurrency(parseFloat(transferAmount) || 0)}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setTransferOpen(false);
                  setTransferAmount("");
                  setRecipientInfo("");
                  setBankName("");
                  setBankValidation({ isValid: false, isChecking: false });
                  setTransferType("email");
                }}
                className="focus-ring"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
