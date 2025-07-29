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
  Home, 
  Car, 
  GraduationCap,
  CreditCard,
  Building,
  Calculator,
  ArrowRight,
  Check,
  Star,
  DollarSign,
  Phone,
  Mail,
  Clock,
  Shield,
  Award,
  TrendingUp,
  Users,
  Percent,
  FileText,
  AlertTriangle
} from "lucide-react";

export default function LoansAndCredit() {
  const [, setLocation] = useLocation();
  const [loanAmount, setLoanAmount] = useState(250000);
  const [loanTerm, setLoanTerm] = useState(30);
  const [interestRate, setInterestRate] = useState(6.5);
  const [creditScore, setCreditScore] = useState(750);

  const loanProducts = [
    {
      title: "Home Mortgages",
      subtitle: "Competitive rates for your dream home",
      rates: "Starting at 6.25% APR",
      features: [
        "Fixed and adjustable rate options",
        "First-time buyer programs",
        "Jumbo loan capabilities",
        "Online pre-approval in minutes",
        "No application fees",
        "Local underwriting team"
      ],
      icon: Home,
      color: "blue",
      popular: true,
      minAmount: "$50,000",
      maxAmount: "$2,000,000"
    },
    {
      title: "Auto Loans",
      subtitle: "Finance your next vehicle with ease",
      rates: "Starting at 4.99% APR",
      features: [
        "New and used vehicle financing",
        "Refinancing options available",
        "Extended warranty programs",
        "Direct dealer relationships",
        "Pre-approved shopping",
        "Gap insurance available"
      ],
      icon: Car,
      color: "green",
      popular: false,
      minAmount: "$5,000",
      maxAmount: "$150,000"
    },
    {
      title: "Personal Loans",
      subtitle: "Flexible financing for life's needs",
      rates: "Starting at 8.99% APR",
      features: [
        "No collateral required",
        "Fixed monthly payments",
        "Debt consolidation options",
        "Quick approval process",
        "No prepayment penalties",
        "Direct deposit available"
      ],
      icon: CreditCard,
      color: "purple",
      popular: false,
      minAmount: "$1,000",
      maxAmount: "$50,000"
    },
    {
      title: "Student Loans",
      subtitle: "Invest in your education and future",
      rates: "Starting at 5.50% APR",
      features: [
        "Undergraduate and graduate programs",
        "Flexible repayment options",
        "No origination fees",
        "Parent PLUS alternatives",
        "Grace period after graduation",
        "Interest rate reductions"
      ],
      icon: GraduationCap,
      color: "orange",
      popular: false,
      minAmount: "$1,000",
      maxAmount: "$200,000"
    }
  ];

  const creditProducts = [
    {
      title: "Personal Line of Credit",
      description: "Flexible access to funds when you need them",
      rate: "Prime + 2.00%",
      limit: "Up to $100,000",
      features: ["Only pay interest on what you use", "Revolving credit line", "Online account management", "No annual fee"]
    },
    {
      title: "Home Equity Line of Credit",
      description: "Leverage your home's equity for major expenses",
      rate: "Prime + 0.50%",
      limit: "Up to $500,000",
      features: ["Tax-deductible interest*", "10-year draw period", "Fixed rate options", "No closing costs*"]
    },
    {
      title: "Business Line of Credit",
      description: "Working capital for your business needs",
      rate: "Prime + 1.50%",
      limit: "Up to $250,000",
      features: ["Flexible repayment terms", "Online business banking", "Dedicated relationship manager", "Seasonal payment options"]
    }
  ];

  const loanProcess = [
    {
      step: 1,
      title: "Apply Online",
      description: "Complete our secure application in minutes",
      icon: FileText,
      details: ["Provide basic information", "Upload required documents", "Get instant pre-qualification"]
    },
    {
      step: 2,
      title: "Get Approved",
      description: "Receive approval decision quickly",
      icon: Check,
      details: ["Credit review and verification", "Income and asset verification", "Final approval and terms"]
    },
    {
      step: 3,
      title: "Receive Funds",
      description: "Access your funds fast",
      icon: DollarSign,
      details: ["Electronic fund transfer", "Check disbursement", "Direct payment to vendors"]
    }
  ];

  const calculateMonthlyPayment = () => {
    const monthlyRate = interestRate / 100 / 12;
    const numPayments = loanTerm * 12;
    const payment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);
    return payment;
  };

  const calculateTotalInterest = () => {
    const monthlyPayment = calculateMonthlyPayment();
    const totalPaid = monthlyPayment * loanTerm * 12;
    return totalPaid - loanAmount;
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
                Loans & Credit
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Financing Solutions for
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Every Goal</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Whether you're buying a home, financing a car, or funding your education, our competitive 
                rates and flexible terms help you achieve your dreams with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg"
                  onClick={() => setLocation("/register")}
                >
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-400 text-gray-300 hover:bg-white/10 px-8 py-4 text-lg"
                >
                  <Calculator className="mr-2 h-5 w-5" />
                  Calculate Payments
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "$2.5B+", label: "Loans Funded" },
                { number: "4.2%", label: "Average Rate" },
                { number: "24hr", label: "Approval Time" },
                { number: "98%", label: "Customer Satisfaction" }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-prime-accent mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Loan Products */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Loan Products</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Find the perfect financing solution with competitive rates and flexible terms designed for your needs.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {loanProducts.map((product, index) => {
                const IconComponent = product.icon;
                const colorClasses = {
                  blue: "from-blue-500 to-blue-600",
                  green: "from-green-500 to-green-600",
                  purple: "from-purple-500 to-purple-600",
                  orange: "from-orange-500 to-orange-600"
                };

                return (
                  <Card key={index} className={`bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 ${product.popular ? 'ring-2 ring-prime-accent' : ''}`}>
                    <CardHeader className="text-center pb-4">
                      {product.popular && (
                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                          <Badge className="bg-prime-accent text-white px-4 py-1">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[product.color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {product.title}
                      </CardTitle>
                      <p className="text-gray-600 text-sm mb-4">{product.subtitle}</p>
                      <div className="text-xl font-bold text-green-600 mb-4">
                        {product.rates}
                      </div>
                      <div className="flex justify-center gap-4 text-xs text-gray-500">
                        <span>{product.minAmount} - {product.maxAmount}</span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 mb-6">
                        {product.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-2 text-sm text-gray-700">
                            <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <Button 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => setLocation("/register")}
                      >
                        Apply Now
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Loan Calculator */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calculator className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    Loan Payment Calculator
                  </CardTitle>
                  <p className="text-gray-600">
                    Estimate your monthly payments and see how different terms affect your loan
                  </p>
                </div>
              </CardHeader>
              <CardContent>
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
                      <Label className="text-gray-700 font-semibold">Loan Term (years)</Label>
                      <div className="mt-2">
                        <Input
                          type="range"
                          min="5"
                          max="30"
                          step="5"
                          value={loanTerm}
                          onChange={(e) => setLoanTerm(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>5 years</span>
                          <span className="font-semibold text-gray-900">{loanTerm} years</span>
                          <span>30 years</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold">Interest Rate (%)</Label>
                      <div className="mt-2">
                        <Input
                          type="range"
                          min="3"
                          max="15"
                          step="0.1"
                          value={interestRate}
                          onChange={(e) => setInterestRate(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>3%</span>
                          <span className="font-semibold text-gray-900">{interestRate}%</span>
                          <span>15%</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-semibold">Credit Score</Label>
                      <div className="mt-2">
                        <Input
                          type="range"
                          min="300"
                          max="850"
                          step="10"
                          value={creditScore}
                          onChange={(e) => setCreditScore(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>300</span>
                          <span className="font-semibold text-gray-900">{creditScore}</span>
                          <span>850</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border border-blue-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Summary</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Loan Amount:</span>
                        <span className="font-semibold text-gray-900">${loanAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Interest Rate:</span>
                        <span className="font-semibold text-gray-900">{interestRate}% APR</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Loan Term:</span>
                        <span className="font-semibold text-gray-900">{loanTerm} years</span>
                      </div>
                      <div className="border-t border-blue-200 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-gray-900 font-bold text-lg">Monthly Payment:</span>
                          <span className="text-2xl font-bold text-blue-600">
                            ${calculateMonthlyPayment().toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">Total Interest:</span>
                          <span className="font-medium text-gray-900">
                            ${calculateTotalInterest().toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">
                      Apply for This Loan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Credit Lines */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Lines of Credit</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Flexible credit solutions that give you access to funds when you need them most.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {creditProducts.map((product, index) => (
                <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                      {product.title}
                    </CardTitle>
                    <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Rate</p>
                        <p className="text-lg font-bold text-green-600">{product.rate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Credit Limit</p>
                        <p className="text-lg font-bold text-gray-900">{product.limit}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-6">
                      {product.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2 text-sm text-gray-700">
                          <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button variant="outline" className="w-full">
                      Learn More
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Application Process */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Simple Application Process</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Get approved and funded quickly with our streamlined application process.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {loanProcess.map((step, index) => {
                const IconComponent = step.icon;
                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl text-center">
                    <CardHeader>
                      <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
                        {step.step}
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {step.title}
                      </CardTitle>
                      <p className="text-gray-600">{step.description}</p>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-gray-600">
                        {step.details.map((detail, detailIndex) => (
                          <li key={detailIndex} className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-green-600 rounded-full"></div>
                            {detail}
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
                  Ready to Get Started?
                </h2>
                <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                  Apply for your loan today and get a decision in as little as 24 hours. 
                  Our competitive rates and flexible terms make financing your goals easier than ever.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-prime-accent hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                    onClick={() => setLocation("/register")}
                  >
                    Apply Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Speak with a Specialist
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 mt-8 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">24-hour decisions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Secure application</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">Competitive rates</span>
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
                  Financing solutions that make your goals achievable.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Loan Products</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Home Mortgages</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Auto Loans</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Personal Loans</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Student Loans</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Credit Solutions</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Personal Line of Credit</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Home Equity Line</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Business Line of Credit</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Credit Cards</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    +1 (938) 271-8041
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    loans@primeedge.com
                  </li>
                  <li>Available Monday-Saturday, 7AM-7PM PT</li>
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