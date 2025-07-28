import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/logo";
import { 
  Building, 
  CreditCard, 
  TrendingUp, 
  Shield, 
  Users,
  Calculator,
  ArrowRight,
  Check,
  Star,
  Zap,
  Globe,
  FileText,
  Phone,
  Mail,
  DollarSign,
  BarChart3,
  Briefcase,
  Settings,
  Clock,
  Award,
  Target,
  Banknote,
  PieChart,
  LineChart
} from "lucide-react";

export default function BusinessBanking() {
  const [, setLocation] = useLocation();
  const [loanAmount, setLoanAmount] = useState(100000);
  const [loanTerm, setLoanTerm] = useState(60);
  const [annualRevenue, setAnnualRevenue] = useState(500000);

  const businessAccounts = [
    {
      title: "Business Checking",
      subtitle: "Essential banking for growing businesses",
      monthlyFee: "$15",
      minimumBalance: "$2,500",
      features: [
        "200 free transactions per month",
        "Mobile and online banking",
        "Business debit card",
        "Remote deposit capture",
        "Account analysis reporting",
        "Integration with QuickBooks"
      ],
      icon: Building,
      color: "blue",
      popular: false,
      transactionFee: "$0.50 after 200"
    },
    {
      title: "Business Premium",
      subtitle: "Advanced banking for established businesses",
      monthlyFee: "$35",
      minimumBalance: "$10,000",
      features: [
        "500 free transactions per month",
        "All Business Checking features",
        "Priority customer support",
        "Cash management services",
        "Wire transfer fee waivers",
        "Dedicated relationship manager"
      ],
      icon: Star,
      color: "purple",
      popular: true,
      transactionFee: "$0.40 after 500"
    },
    {
      title: "Enterprise Banking",
      subtitle: "Comprehensive solutions for large enterprises",
      monthlyFee: "Custom",
      minimumBalance: "$50,000",
      features: [
        "Unlimited transactions",
        "Multi-location banking",
        "Treasury management services",
        "Foreign exchange services",
        "Dedicated banking team",
        "Custom API integrations"
      ],
      icon: Globe,
      color: "green",
      popular: false,
      transactionFee: "None"
    }
  ];

  const merchantServices = [
    {
      title: "Point of Sale",
      description: "Accept cards in-person with our modern POS systems",
      rate: "2.6% + $0.10",
      features: ["Chip & PIN", "Contactless", "Mobile payments", "Real-time reporting"],
      icon: CreditCard
    },
    {
      title: "Online Payments",
      description: "Secure e-commerce payment processing",
      rate: "2.9% + $0.30",
      features: ["Payment gateway", "Fraud protection", "Recurring billing", "API integration"],
      icon: Globe
    },
    {
      title: "Mobile Payments",
      description: "Accept payments anywhere with mobile card readers",
      rate: "2.7% + $0.15",
      features: ["Bluetooth reader", "Invoice generation", "Digital receipts", "Inventory tracking"],
      icon: Zap
    }
  ];

  const lendingProducts = [
    {
      title: "Business Line of Credit",
      amount: "$10K - $500K",
      rate: "Prime + 1.5%",
      term: "Revolving",
      description: "Flexible access to working capital when you need it",
      features: ["Only pay interest on what you use", "Instant access to funds", "No collateral required up to $100K"],
      icon: TrendingUp
    },
    {
      title: "Equipment Financing",
      amount: "$5K - $2M",
      rate: "4.5% - 12%",
      term: "1-7 years",
      description: "Finance equipment purchases with competitive rates",
      features: ["Equipment serves as collateral", "100% financing available", "Fast approval process"],
      icon: Settings
    },
    {
      title: "Commercial Real Estate",
      amount: "$250K - $50M",
      rate: "5.25% - 8%",
      term: "5-25 years",
      description: "Purchase or refinance commercial properties",
      features: ["Up to 80% LTV", "Fixed and variable rates", "SBA loans available"],
      icon: Building
    },
    {
      title: "SBA Loans",
      amount: "$50K - $5M",
      rate: "Prime + 2.75%",
      term: "Up to 25 years",
      description: "Government-backed loans for qualified businesses",
      features: ["Lower down payments", "Longer repayment terms", "Competitive rates"],
      icon: Award
    }
  ];

  const treasuryServices = [
    {
      title: "Cash Management",
      description: "Optimize your cash flow with automated solutions",
      features: ["Zero balance accounts", "Sweep services", "Concentration banking", "Liquidity management"],
      icon: DollarSign
    },
    {
      title: "Payroll Services",
      description: "Streamline payroll processing and tax compliance",
      features: ["Direct deposit", "Tax filing", "Employee self-service", "Time tracking integration"],
      icon: Users
    },
    {
      title: "Trade Finance",
      description: "International trade financing and risk mitigation",
      features: ["Letters of credit", "Trade guarantees", "Documentary collections", "Foreign exchange"],
      icon: Globe
    },
    {
      title: "Investment Services",
      description: "Grow your business surplus with investment options",
      features: ["Money market accounts", "CDs", "Investment advisory", "Portfolio management"],
      icon: LineChart
    }
  ];

  const calculateLoanPayment = () => {
    const monthlyRate = 0.06 / 12; // Assuming 6% annual rate
    const numPayments = loanTerm;
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    return payment;
  };

  const calculateCreditLine = () => {
    // Simple calculation based on annual revenue
    return Math.min(annualRevenue * 0.15, 500000);
  };

  return (
    <div className="min-h-screen bg-prime-navy text-white">
      {/* Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-prime-navy/95 backdrop-blur-sm border-b border-prime-slate/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="cursor-pointer" onClick={() => setLocation("/")}>
                <Logo size="md" showText={true} />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                className="text-gray-300 hover:text-white"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
              <Button 
                className="bg-prime-accent hover:bg-blue-600"
                onClick={() => setLocation("/register")}
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <Badge className="mb-4 bg-prime-accent/20 text-prime-accent border-prime-accent/30">
                Business Banking Solutions
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Banking That
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Powers Growth</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                From startups to enterprises, our comprehensive business banking solutions provide the tools, 
                capital, and expertise your business needs to thrive in today's competitive market.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg"
                  onClick={() => setLocation("/register")}
                >
                  Open Business Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-400 text-gray-300 hover:bg-white/10 px-8 py-4 text-lg"
                >
                  Schedule Consultation
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "$2.5B+", label: "Business Loans Funded" },
                { number: "15K+", label: "Business Customers" },
                { number: "99.8%", label: "Uptime Guarantee" },
                { number: "24/7", label: "Support Available" }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-prime-accent mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Business Accounts */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Business Checking Accounts</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Choose the business checking account that matches your company's size and transaction needs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {businessAccounts.map((account, index) => {
                const IconComponent = account.icon;
                const colorClasses = {
                  blue: "from-blue-500 to-blue-600",
                  purple: "from-purple-500 to-purple-600", 
                  green: "from-green-500 to-green-600"
                };

                return (
                  <Card key={index} className={`bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${account.popular ? 'ring-2 ring-prime-accent' : ''}`}>
                    <CardHeader className="text-center pb-4">
                      {account.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-prime-accent text-white px-4 py-1">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <div className={`w-20 h-20 bg-gradient-to-br ${colorClasses[account.color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                        <IconComponent className="h-10 w-10 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {account.title}
                      </CardTitle>
                      <p className="text-gray-600 mb-4">{account.subtitle}</p>
                      <div className="flex justify-center gap-8 mb-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Monthly Fee</p>
                          <p className="text-lg font-bold text-gray-900">{account.monthlyFee}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Minimum Balance</p>
                          <p className="text-lg font-bold text-gray-900">{account.minimumBalance}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {account.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="p-3 bg-gray-50 rounded-lg mb-6">
                        <p className="text-xs text-gray-600">
                          <strong>Transaction Fee:</strong> {account.transactionFee}
                        </p>
                      </div>
                      <Button 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => setLocation("/register")}
                      >
                        Open {account.title}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Lending Solutions */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Business Lending Solutions</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Access the capital you need to grow your business with our flexible lending options.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {lendingProducts.map((product, index) => {
                const IconComponent = product.icon;
                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                        {product.title}
                      </CardTitle>
                      <p className="text-gray-600 text-sm">{product.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Amount:</span>
                          <span className="text-sm font-semibold text-gray-900">{product.amount}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Rate:</span>
                          <span className="text-sm font-semibold text-gray-900">{product.rate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Term:</span>
                          <span className="text-sm font-semibold text-gray-900">{product.term}</span>
                        </div>
                      </div>
                      <ul className="space-y-1 mb-4">
                        {product.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="text-xs text-gray-600 flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button variant="outline" size="sm" className="w-full">
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Loan Calculator */}
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calculator className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    Business Loan Calculator
                  </CardTitle>
                  <p className="text-gray-600">
                    Estimate your monthly payments and see how much you could qualify for
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="loan" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-8">
                    <TabsTrigger value="loan">Loan Payment</TabsTrigger>
                    <TabsTrigger value="credit">Credit Line</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="loan">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <Label className="text-gray-700 font-semibold">Loan Amount</Label>
                          <div className="mt-2">
                            <Input
                              type="range"
                              min="10000"
                              max="1000000"
                              step="10000"
                              value={loanAmount}
                              onChange={(e) => setLoanAmount(Number(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                              <span>$10K</span>
                              <span className="font-semibold text-gray-900">${loanAmount.toLocaleString()}</span>
                              <span>$1M</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-gray-700 font-semibold">Loan Term (months)</Label>
                          <div className="mt-2">
                            <Input
                              type="range"
                              min="12"
                              max="120"
                              step="12"
                              value={loanTerm}
                              onChange={(e) => setLoanTerm(Number(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                              <span>1 year</span>
                              <span className="font-semibold text-gray-900">{loanTerm} months</span>
                              <span>10 years</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Your Estimated Payment</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Loan Amount:</span>
                            <span className="font-semibold text-gray-900">${loanAmount.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Interest Rate:</span>
                            <span className="font-semibold text-gray-900">6.0% APR</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Term:</span>
                            <span className="font-semibold text-gray-900">{loanTerm} months</span>
                          </div>
                          <div className="border-t border-blue-200 pt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-900 font-bold text-lg">Monthly Payment:</span>
                              <span className="text-2xl font-bold text-blue-600">
                                ${calculateLoanPayment().toLocaleString(undefined, { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                          Apply for Loan
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="credit">
                    <div className="grid md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div>
                          <Label className="text-gray-700 font-semibold">Annual Revenue</Label>
                          <div className="mt-2">
                            <Input
                              type="range"
                              min="50000"
                              max="5000000"
                              step="50000"
                              value={annualRevenue}
                              onChange={(e) => setAnnualRevenue(Number(e.target.value))}
                              className="w-full"
                            />
                            <div className="flex justify-between text-sm text-gray-500 mt-1">
                              <span>$50K</span>
                              <span className="font-semibold text-gray-900">${annualRevenue.toLocaleString()}</span>
                              <span>$5M</span>
                            </div>
                          </div>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-semibold text-gray-900 mb-2">What you'll need:</h4>
                          <ul className="text-sm text-gray-600 space-y-1">
                            <li>• 2+ years in business</li>
                            <li>• Business tax returns</li>
                            <li>• Bank statements</li>
                            <li>• Business license</li>
                          </ul>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-6">Your Estimated Credit Line</h3>
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Annual Revenue:</span>
                            <span className="font-semibold text-gray-900">${annualRevenue.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600">Interest Rate:</span>
                            <span className="font-semibold text-gray-900">Prime + 1.5%</span>
                          </div>
                          <div className="border-t border-green-200 pt-4">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-900 font-bold text-lg">Credit Line:</span>
                              <span className="text-2xl font-bold text-green-600">
                                ${calculateCreditLine().toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button className="w-full mt-6 bg-green-600 hover:bg-green-700">
                          Apply for Credit Line
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Merchant Services */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Merchant Services</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Accept payments seamlessly with our comprehensive merchant services and payment processing solutions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {merchantServices.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="text-center pb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {service.title}
                      </CardTitle>
                      <p className="text-gray-600 mb-4">{service.description}</p>
                      <div className="text-2xl font-bold text-orange-600 mb-4">
                        {service.rate}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button className="w-full bg-orange-600 hover:bg-orange-700">
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Treasury Services */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Treasury & Cash Management</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Optimize your cash flow and streamline financial operations with our advanced treasury services.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {treasuryServices.map((service, index) => {
                const IconComponent = service.icon;
                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader className="pb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                        {service.title}
                      </CardTitle>
                      <p className="text-gray-600 text-sm">{service.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="space-y-1">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="text-xs text-gray-600 flex items-center gap-2">
                            <Check className="h-3 w-3 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gradient-to-r from-prime-accent to-blue-500 border-0 shadow-2xl">
              <CardContent className="p-16">
                <h2 className="text-4xl font-bold text-white mb-6">
                  Ready to Grow Your Business?
                </h2>
                <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                  Join thousands of businesses that trust Prime Edge for their banking needs. 
                  Get started today with a free consultation and see how we can help your business thrive.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-prime-accent hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                    onClick={() => setLocation("/register")}
                  >
                    Open Business Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call 1-800-BUSINESS
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 mt-8 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Setup in 10 minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">FDIC Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">Award-winning service</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-prime-slate/20">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <Logo size="sm" showText={true} />
                <p className="text-gray-400 text-sm mt-4">
                  Banking solutions that scale with your business ambitions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Business Services</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Business Checking</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Business Loans</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Merchant Services</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Treasury Management</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Business Support</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">1-800-BUSINESS</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Resource Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">API Documentation</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    1-800-BUSINESS
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    business@primeedge.com
                  </li>
                  <li>Business hours: 6 AM - 8 PM PT</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-prime-slate/20 mt-12 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2024 Prime Edge Finance Bank. All rights reserved. Member FDIC. Equal Housing Lender.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}