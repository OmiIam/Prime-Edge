import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";
import { 
  DollarSign, 
  PiggyBank, 
  TrendingUp, 
  Shield, 
  Clock, 
  Smartphone,
  Check,
  Calculator,
  ArrowRight,
  Star,
  Users,
  CreditCard
} from "lucide-react";
import { useState } from "react";

export default function PersonalBanking() {
  const [, setLocation] = useLocation();
  const [calculatorAmount, setCalculatorAmount] = useState(10000);
  const [calculatorTerm, setCalculatorTerm] = useState(12);

  const accountTypes = [
    {
      title: "Prime Checking",
      subtitle: "Everyday banking made simple",
      monthlyFee: "Free",
      minimumBalance: "$0",
      features: [
        "No monthly maintenance fees",
        "Free online and mobile banking",
        "Free debit card with contactless payments",
        "Free ATM access at 60,000+ locations",
        "Mobile check deposit",
        "Real-time account alerts"
      ],
      icon: CreditCard,
      color: "blue",
      popular: false
    },
    {
      title: "Prime Plus Checking",
      subtitle: "Premium banking with exclusive benefits",
      monthlyFee: "$15",
      minimumBalance: "$2,500",
      features: [
        "All Prime Checking features",
        "No foreign transaction fees",
        "Premium customer support",
        "Free cashier's checks and money orders",
        "Interest earning on balances over $2,500",
        "Priority phone support"
      ],
      icon: Star,
      color: "purple",
      popular: true
    },
    {
      title: "High-Yield Savings",
      subtitle: "Grow your money with competitive rates",
      monthlyFee: "Free",
      minimumBalance: "$100",
      features: [
        "2.50% APY on all balances",
        "No monthly maintenance fees",
        "Automatic savings programs",
        "Goal-based savings tracking",
        "Mobile app integration",
        "FDIC insured up to $250,000"
      ],
      icon: PiggyBank,
      color: "green",
      popular: false
    }
  ];

  const calculateInterest = () => {
    const rate = 0.025; // 2.5% APY
    const monthlyRate = rate / 12;
    const compoundInterest = calculatorAmount * Math.pow(1 + monthlyRate, calculatorTerm);
    return compoundInterest - calculatorAmount;
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
                Open Account
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20">
        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <div className="mb-8">
              <Badge className="mb-4 bg-prime-accent/20 text-prime-accent border-prime-accent/30">
                Personal Banking Services
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Banking Built for
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Your Life</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Experience modern banking with no hidden fees, competitive rates, and award-winning customer service. 
                Your money, your way, backed by FDIC insurance.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg"
                  onClick={() => setLocation("/register")}
                >
                  Open Account Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-400 text-gray-300 hover:bg-white/10 px-8 py-4 text-lg"
                >
                  Compare Accounts
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Account Types Grid */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Choose Your Perfect Account</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                From basic checking to premium banking, we have an account designed for your financial needs.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {accountTypes.map((account, index) => {
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
                      <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[account.color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                        {account.title}
                      </CardTitle>
                      <p className="text-gray-600 mb-4">{account.subtitle}</p>
                      <div className="flex justify-center gap-6 mb-6">
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

        {/* Interest Calculator */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader className="text-center">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                  Savings Calculator
                </CardTitle>
                <p className="text-gray-600">
                  See how much you could earn with our High-Yield Savings account at 2.50% APY
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Initial Deposit
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                          type="number"
                          value={calculatorAmount}
                          onChange={(e) => setCalculatorAmount(Number(e.target.value))}
                          className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          min="100"
                          step="100"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Time Period (months)
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="60"
                        value={calculatorTerm}
                        onChange={(e) => setCalculatorTerm(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>1 month</span>
                        <span>{calculatorTerm} months</span>
                        <span>5 years</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Earnings</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Initial Deposit:</span>
                        <span className="font-semibold">${calculatorAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Interest Earned:</span>
                        <span className="font-semibold text-green-600">
                          ${calculateInterest().toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="border-t border-green-200 pt-3">
                        <div className="flex justify-between">
                          <span className="text-gray-900 font-semibold">Total Balance:</span>
                          <span className="text-xl font-bold text-gray-900">
                            ${(calculatorAmount + calculateInterest()).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                      *Based on 2.50% APY, compounded monthly. Rates subject to change.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-transparent">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Why Choose Prime Edge Banking</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Experience the difference with our award-winning banking services and customer-first approach.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  icon: Shield,
                  title: "FDIC Insured",
                  description: "Your deposits protected up to $250,000"
                },
                {
                  icon: Smartphone,
                  title: "Mobile First",
                  description: "Award-winning mobile app rated 4.8/5 stars"
                },
                {
                  icon: Users,
                  title: "24/7 Support",
                  description: "Real human support whenever you need it"
                },
                {
                  icon: Clock,
                  title: "Instant Access",
                  description: "Real-time transactions and instant notifications"
                }
              ].map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <Card key={index} className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-prime-accent to-blue-400 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                      <p className="text-gray-400 text-sm">{benefit.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gradient-to-r from-prime-accent to-blue-500 border-0 shadow-2xl">
              <CardContent className="p-12">
                <h2 className="text-3xl font-bold text-white mb-4">
                  Ready to Get Started?
                </h2>
                <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
                  Open your Prime Edge account in minutes. No hidden fees, no minimum balance requirements, 
                  and access to all our premium banking features.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-prime-accent hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                    onClick={() => setLocation("/register")}
                  >
                    Open Account Now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                    onClick={() => setLocation("/support/contact-us")}
                  >
                    Speak to an Expert
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-prime-slate/20">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <Logo size="sm" showText={true} />
                <p className="text-gray-400 text-sm mt-4">
                  Your trusted partner for secure, innovative digital banking solutions.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Services</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Personal Banking</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Business Banking</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Investment Services</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Loans & Credit</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Support</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li>1-800-PRIME-EDGE</li>
                  <li>support@primeedge.com</li>
                  <li>Available 24/7</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-prime-slate/20 mt-8 pt-8 text-center text-sm text-gray-400">
              <p>&copy; 2024 Prime Edge Finance Bank. All rights reserved. Member FDIC.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}