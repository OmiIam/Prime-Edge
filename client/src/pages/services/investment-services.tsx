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
  TrendingUp, 
  PieChart, 
  LineChart,
  BarChart3,
  Target,
  Shield,
  Award,
  Calculator,
  ArrowRight,
  Check,
  Star,
  Zap,
  Globe,
  Phone,
  Mail,
  DollarSign,
  Building,
  Users,
  Briefcase,
  Clock,
  AlertTriangle,
  CheckCircle,
  TrendingDown
} from "lucide-react";

export default function InvestmentServices() {
  const [, setLocation] = useLocation();
  const [initialInvestment, setInitialInvestment] = useState(10000);
  const [monthlyContribution, setMonthlyContribution] = useState(500);
  const [investmentHorizon, setInvestmentHorizon] = useState(10);
  const [riskTolerance, setRiskTolerance] = useState('moderate');

  const investmentProducts = [
    {
      title: "Wealth Management",
      subtitle: "Personalized investment strategies for high-net-worth clients",
      minimumInvestment: "$250,000",
      expectedReturn: "7-12%",
      features: [
        "Dedicated portfolio manager",
        "Custom investment strategy",
        "Tax optimization planning",
        "Estate planning consultation",
        "Quarterly performance reviews",
        "24/7 portfolio monitoring"
      ],
      icon: Star,
      color: "gold",
      popular: true,
      managementFee: "0.75% - 1.25%"
    },
    {
      title: "Robo-Advisory",
      subtitle: "Automated investing with professional oversight",
      minimumInvestment: "$500",
      expectedReturn: "6-9%",
      features: [
        "Algorithm-driven portfolio selection",
        "Automatic rebalancing",
        "Tax-loss harvesting",
        "Low-cost ETF investments",
        "Mobile app access",
        "Goal-based investing"
      ],
      icon: Zap,
      color: "blue",
      popular: false,
      managementFee: "0.25% - 0.50%"
    },
    {
      title: "Self-Directed Trading",
      subtitle: "Complete control over your investment decisions",
      minimumInvestment: "$0",
      expectedReturn: "Variable",
      features: [
        "Commission-free stock trades",
        "Advanced trading platform",
        "Real-time market data",
        "Research and analytics tools",
        "Options and futures trading",
        "International market access"
      ],
      icon: TrendingUp,
      color: "green",
      popular: false,
      managementFee: "$0 monthly fee"
    }
  ];

  const portfolioTypes = [
    {
      title: "Conservative Portfolio",
      allocation: { bonds: 70, stocks: 25, alternatives: 5 },
      risk: "Low",
      expectedReturn: "4-6%",
      description: "Capital preservation with modest growth potential",
      suitableFor: "Risk-averse investors, retirees",
      icon: Shield
    },
    {
      title: "Moderate Portfolio", 
      allocation: { bonds: 50, stocks: 45, alternatives: 5 },
      risk: "Medium",
      expectedReturn: "6-8%",
      description: "Balanced approach between growth and stability",
      suitableFor: "Most investors, 10+ year horizon",
      icon: Target
    },
    {
      title: "Aggressive Portfolio",
      allocation: { bonds: 20, stocks: 70, alternatives: 10 },
      risk: "High", 
      expectedReturn: "8-12%",
      description: "Maximum growth potential with higher volatility",
      suitableFor: "Young investors, long-term goals",
      icon: TrendingUp
    },
    {
      title: "ESG Portfolio",
      allocation: { bonds: 35, stocks: 60, alternatives: 5 },
      risk: "Medium",
      expectedReturn: "6-9%",
      description: "Socially responsible investing without sacrificing returns",
      suitableFor: "Values-driven investors",
      icon: Globe
    }
  ];

  const investmentOptions = [
    {
      category: "Mutual Funds",
      description: "Professionally managed diversified portfolios",
      options: [
        { name: "Prime Growth Fund", type: "Large Cap Growth", expense: "0.65%", return: "11.2%" },
        { name: "Prime Value Fund", type: "Large Cap Value", expense: "0.58%", return: "9.8%" },
        { name: "Prime International Fund", type: "International Equity", expense: "0.72%", return: "8.4%" },
        { name: "Prime Bond Fund", type: "Investment Grade Bonds", expense: "0.45%", return: "4.1%" }
      ],
      icon: PieChart
    },
    {
      category: "Exchange-Traded Funds (ETFs)",
      description: "Low-cost index funds with daily liquidity",
      options: [
        { name: "S&P 500 ETF", type: "Large Cap Index", expense: "0.03%", return: "10.1%" },
        { name: "Total Market ETF", type: "Broad Market Index", expense: "0.04%", return: "9.7%" },
        { name: "REIT ETF", type: "Real Estate", expense: "0.12%", return: "7.9%" },
        { name: "Emerging Markets ETF", type: "International", expense: "0.15%", return: "6.8%" }
      ],
      icon: BarChart3
    },
    {
      category: "Individual Retirement Accounts",
      description: "Tax-advantaged retirement savings accounts",
      options: [
        { name: "Traditional IRA", type: "Tax-deferred", expense: "No fees", return: "Variable" },
        { name: "Roth IRA", type: "Tax-free growth", expense: "No fees", return: "Variable" },
        { name: "SEP-IRA", type: "Small business", expense: "No fees", return: "Variable" },
        { name: "401(k) Rollover", type: "Employer plan", expense: "No fees", return: "Variable" }
      ],
      icon: Briefcase
    }
  ];

  const calculateProjectedValue = () => {
    const annualReturn = riskTolerance === 'conservative' ? 0.05 : 
                        riskTolerance === 'moderate' ? 0.07 : 0.09;
    const monthlyRate = annualReturn / 12;
    const numPayments = investmentHorizon * 12;
    
    // Future value of initial investment
    const futureValueInitial = initialInvestment * Math.pow(1 + annualReturn, investmentHorizon);
    
    // Future value of monthly contributions (annuity)
    const futureValueContributions = monthlyContribution * 
      ((Math.pow(1 + monthlyRate, numPayments) - 1) / monthlyRate);
    
    return futureValueInitial + futureValueContributions;
  };

  const calculateTotalContributions = () => {
    return initialInvestment + (monthlyContribution * investmentHorizon * 12);
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
                Investment Services  
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Grow Your
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Wealth</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                From first-time investors to seasoned professionals, our comprehensive investment solutions 
                help you build and preserve wealth with personalized strategies and expert guidance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg"
                  onClick={() => setLocation("/register")}
                >
                  Start Investing Today
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
                { number: "$12B+", label: "Assets Under Management" },
                { number: "25K+", label: "Investment Clients" },
                { number: "8.7%", label: "Average Annual Return" },
                { number: "24/7", label: "Portfolio Monitoring" }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-prime-accent mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Investment Products */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Investment Solutions</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Choose the investment approach that matches your goals, timeline, and risk tolerance.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {investmentProducts.map((product, index) => {
                const IconComponent = product.icon;
                const colorClasses = {
                  blue: "from-blue-500 to-blue-600",
                  gold: "from-yellow-500 to-yellow-600", 
                  green: "from-green-500 to-green-600"
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
                      <div className={`w-20 h-20 bg-gradient-to-br ${colorClasses[product.color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg`}>
                        <IconComponent className="h-10 w-10 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {product.title}
                      </CardTitle>
                      <p className="text-gray-600 mb-4">{product.subtitle}</p>
                      <div className="flex justify-center gap-8 mb-6">
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Minimum</p>
                          <p className="text-lg font-bold text-gray-900">{product.minimumInvestment}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500">Expected Return</p>
                          <p className="text-lg font-bold text-gray-900">{product.expectedReturn}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-3 mb-6">
                        {product.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start gap-3">
                            <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-700 text-sm">{feature}</span>
                          </li>
                        ))}
                      </ul>
                      <div className="p-3 bg-gray-50 rounded-lg mb-6">
                        <p className="text-xs text-gray-600">
                          <strong>Management Fee:</strong> {product.managementFee}
                        </p>
                      </div>
                      <Button 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => setLocation("/register")}
                      >
                        Get Started
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Portfolio Types */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Portfolio Strategies</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Diversified portfolios designed to match different risk profiles and investment goals.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {portfolioTypes.map((portfolio, index) => {
                const IconComponent = portfolio.icon;
                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <CardTitle className="text-lg font-bold text-gray-900 mb-2">
                        {portfolio.title}
                      </CardTitle>
                      <p className="text-gray-600 text-sm mb-4">{portfolio.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Risk Level:</span>
                          <Badge className={
                            portfolio.risk === 'Low' ? 'bg-green-100 text-green-700' :
                            portfolio.risk === 'Medium' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }>
                            {portfolio.risk}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Expected Return:</span>
                          <span className="font-semibold text-gray-900">{portfolio.expectedReturn}</span>
                        </div>
                      </div>
                      
                      {/* Asset Allocation */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Asset Allocation:</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs">
                            <span>Stocks</span>
                            <span>{portfolio.allocation.stocks}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div className="bg-blue-600 h-1 rounded-full" style={{width: `${portfolio.allocation.stocks}%`}}></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Bonds</span>
                            <span>{portfolio.allocation.bonds}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div className="bg-green-600 h-1 rounded-full" style={{width: `${portfolio.allocation.bonds}%`}}></div>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span>Alternatives</span>
                            <span>{portfolio.allocation.alternatives}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1">
                            <div className="bg-purple-600 h-1 rounded-full" style={{width: `${portfolio.allocation.alternatives}%`}}></div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mb-4">
                        <strong>Suitable for:</strong> {portfolio.suitableFor}
                      </p>
                      <Button variant="outline" size="sm" className="w-full">
                        Learn More
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Investment Calculator */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Calculator className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    Investment Growth Calculator
                  </CardTitle>
                  <p className="text-gray-600">
                    See how your investments could grow over time with compound returns
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <Label className="text-gray-700 font-semibold">Initial Investment</Label>
                      <div className="mt-2">
                        <Input
                          type="range"
                          min="1000"
                          max="100000"
                          step="1000"
                          value={initialInvestment}
                          onChange={(e) => setInitialInvestment(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>$1K</span>
                          <span className="font-semibold text-gray-900">${initialInvestment.toLocaleString()}</span>
                          <span>$100K</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold">Monthly Contribution</Label>
                      <div className="mt-2">
                        <Input
                          type="range"
                          min="0"
                          max="2000"
                          step="50"
                          value={monthlyContribution}
                          onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>$0</span>
                          <span className="font-semibold text-gray-900">${monthlyContribution.toLocaleString()}</span>
                          <span>$2K</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <Label className="text-gray-700 font-semibold">Investment Timeline (years)</Label>
                      <div className="mt-2">
                        <Input
                          type="range"
                          min="1"
                          max="40"
                          step="1"
                          value={investmentHorizon}
                          onChange={(e) => setInvestmentHorizon(Number(e.target.value))}
                          className="w-full"
                        />
                        <div className="flex justify-between text-sm text-gray-500 mt-1">
                          <span>1 year</span>
                          <span className="font-semibold text-gray-900">{investmentHorizon} years</span>
                          <span>40 years</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-gray-700 font-semibold">Risk Tolerance</Label>
                      <Tabs value={riskTolerance} onValueChange={setRiskTolerance} className="mt-2">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="conservative">Conservative</TabsTrigger>
                          <TabsTrigger value="moderate">Moderate</TabsTrigger>
                          <TabsTrigger value="aggressive">Aggressive</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 border border-green-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Projected Growth</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Total Contributions:</span>
                        <span className="font-semibold text-gray-900">${calculateTotalContributions().toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Expected Return:</span>
                        <span className="font-semibold text-gray-900">
                          {riskTolerance === 'conservative' ? '5%' : 
                           riskTolerance === 'moderate' ? '7%' : '9%'} annually
                        </span>
                      </div>
                      <div className="border-t border-green-200 pt-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-900 font-bold text-lg">Projected Value:</span>
                          <span className="text-2xl font-bold text-green-600">
                            ${calculateProjectedValue().toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          Potential earnings: ${(calculateProjectedValue() - calculateTotalContributions()).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </p>
                      </div>
                    </div>
                    <Button className="w-full mt-6 bg-green-600 hover:bg-green-700">
                      Start Investing
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Investment Options */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Investment Options</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Comprehensive selection of investment vehicles to build your diversified portfolio.
              </p>
            </div>

            <div className="space-y-8">
              {investmentOptions.map((category, categoryIndex) => {
                const IconComponent = category.icon;
                return (
                  <Card key={categoryIndex} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                    <CardHeader>
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-xl font-bold text-gray-900">
                            {category.category}
                          </CardTitle>
                          <p className="text-gray-600">{category.description}</p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        {category.options.map((option, optionIndex) => (
                          <div key={optionIndex} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-semibold text-gray-900">{option.name}</h4>
                              <span className="text-sm font-bold text-green-600">{option.return}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{option.type}</p>
                            <p className="text-xs text-gray-500">Expense Ratio: {option.expense}</p>
                          </div>
                        ))}
                      </div>
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
                  Ready to Start Your Investment Journey?
                </h2>
                <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                  Join thousands of investors who trust Prime Edge for their wealth-building needs. 
                  Get started today with as little as $500 and expert guidance every step of the way.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-prime-accent hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                    onClick={() => setLocation("/register")}
                  >
                    Start Investing
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Speak with an Advisor
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 mt-8 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">SIPC Protected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">Award-winning platform</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Expert advisors</span>
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
                  Investment solutions that grow with your ambitions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Investment Products</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Wealth Management</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Robo-Advisory</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Self-Directed Trading</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Retirement Accounts</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Resources</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Market Research</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Investment Calculator</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Portfolio Analysis</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Educational Content</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    1-800-INVEST-NOW
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    investments@primeedge.com
                  </li>
                  <li>Investment hours: 6 AM - 8 PM PT</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-prime-slate/20 mt-12 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2024 Prime Edge Finance Bank. All rights reserved. Member FDIC. Securities offered through Prime Edge Securities, Member FINRA/SIPC.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}