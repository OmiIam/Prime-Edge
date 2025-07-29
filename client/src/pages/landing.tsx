import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Logo from "@/components/logo";
import { Shield, Smartphone, TrendingUp, Clock, Zap, Gem, Check, Users, DollarSign, Activity, BarChart3 } from "lucide-react";

export default function Landing() {
  const [, setLocation] = useLocation();

  const features = [
    {
      icon: Shield,
      title: "Bank-Grade Security",
      description: "Multi-layered encryption, biometric authentication, and real-time fraud monitoring keep your funds secure 24/7."
    },
    {
      icon: Smartphone,
      title: "Mobile-First Experience",
      description: "Seamless banking across all devices with our award-winning mobile app and responsive web platform."
    },
    {
      icon: TrendingUp,
      title: "Smart Analytics",
      description: "AI-powered insights help you understand spending patterns and achieve your financial goals faster."
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Round-the-clock customer support with human agents and AI-powered instant assistance."
    },
    {
      icon: Zap,
      title: "Instant Transfers",
      description: "Send money instantly to anyone, anywhere with zero fees on domestic transfers."
    },
    {
      icon: Gem,
      title: "Premium Benefits",
      description: "Exclusive rewards, priority service, and access to premium financial products and services."
    }
  ];

  const securityFeatures = [
    "256-bit SSL Encryption - Military-grade encryption protects all data in transit",
    "Multi-Factor Authentication - Biometric and SMS verification for enhanced security",
    "Real-time Fraud Detection - AI-powered monitoring identifies suspicious activity instantly",
    "FDIC Insured - Your deposits are protected up to $250,000"
  ];

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
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <button 
                onClick={() => setLocation("/support/security")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                Security
              </button>
              <button 
                onClick={() => setLocation("/about")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                About
              </button>
              <Button variant="ghost" onClick={() => setLocation("/login")}>
                Login
              </Button>
              <Button className="bg-prime-accent hover:bg-blue-600" onClick={() => setLocation("/register")}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        className="relative pt-16 min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 50%, rgba(51, 65, 85, 0.75) 100%), url('https://images.unsplash.com/photo-1497493292307-31c376b6e479?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2048&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        {/* Content Container */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-12">
            {/* Main Heading */}
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold leading-[1.1] text-white tracking-tight">
                Banking That <span className="text-prime-accent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">Moves With You</span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-prime-accent to-blue-600 mx-auto rounded-full"></div>
              <p className="text-xl sm:text-2xl text-white/80 font-light leading-relaxed max-w-2xl mx-auto">
                No branches. No queues. Just freedom.
              </p>
            </div>
            
            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
              <Button 
                size="lg" 
                className="bg-prime-accent hover:bg-blue-600 text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto border-0"
                onClick={() => setLocation("/register")}
              >
                Start Banking Today
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-8 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-3 text-white/70 hover:text-white/90 transition-colors">
                <div className="w-10 h-10 bg-prime-accent/20 rounded-full flex items-center justify-center">
                  <Shield className="h-5 w-5 text-prime-accent" />
                </div>
                <span className="text-sm font-medium">FDIC Insured</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-white/70 hover:text-white/90 transition-colors">
                <div className="w-10 h-10 bg-prime-accent/20 rounded-full flex items-center justify-center">
                  <Zap className="h-5 w-5 text-prime-accent" />
                </div>
                <span className="text-sm font-medium">Instant Transfers</span>
              </div>
              <div className="flex items-center justify-center gap-3 text-white/70 hover:text-white/90 transition-colors">
                <div className="w-10 h-10 bg-prime-accent/20 rounded-full flex items-center justify-center">
                  <Smartphone className="h-5 w-5 text-prime-accent" />
                </div>
                <span className="text-sm font-medium">Mobile First</span>
              </div>
            </div>
          </div>
        </div>
        
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 sm:py-24 bg-prime-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Banking Made <span className="text-prime-accent">Simple</span>
            </h2>
            <div className="w-12 h-1 bg-prime-accent mx-auto rounded-full mb-6"></div>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Four core features that make Prime Edge the smartest choice for your financial future.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            <Card className="group bg-gradient-to-br from-prime-accent/5 to-blue-600/10 backdrop-blur-sm border border-prime-accent/10 hover:border-prime-accent/30 p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-14 h-14 bg-prime-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-prime-accent/20 group-hover:scale-110 transition-all duration-300">
                <Zap className="h-7 w-7 text-prime-accent" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-prime-accent transition-colors">Instant Transfers</h3>
              <p className="text-gray-300 leading-relaxed text-sm">Send money instantly to anyone, anywhere. Zero fees on domestic transfers.</p>
            </Card>
            
            <Card className="group bg-gradient-to-br from-green-500/5 to-emerald-600/10 backdrop-blur-sm border border-green-400/10 hover:border-green-400/30 p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-14 h-14 bg-green-400/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-400/20 group-hover:scale-110 transition-all duration-300">
                <Shield className="h-7 w-7 text-green-400" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-green-400 transition-colors">Secure Vault</h3>
              <p className="text-gray-300 leading-relaxed text-sm">Bank-grade security with FDIC insurance protecting your savings up to $250,000.</p>
            </Card>
            
            <Card className="group bg-gradient-to-br from-purple-500/5 to-pink-600/10 backdrop-blur-sm border border-purple-400/10 hover:border-purple-400/30 p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-14 h-14 bg-purple-400/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-400/20 group-hover:scale-110 transition-all duration-300">
                <Clock className="h-7 w-7 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors">24/7 Support</h3>
              <p className="text-gray-300 leading-relaxed text-sm">Round-the-clock support with real humans and AI-powered assistance.</p>
            </Card>
            
            <Card className="group bg-gradient-to-br from-orange-500/5 to-red-600/10 backdrop-blur-sm border border-orange-400/10 hover:border-orange-400/30 p-6 lg:p-8 shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105">
              <div className="w-14 h-14 bg-orange-400/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-orange-400/20 group-hover:scale-110 transition-all duration-300">
                <DollarSign className="h-7 w-7 text-orange-400" />
              </div>
              <h3 className="text-xl font-bold mb-4 text-white group-hover:text-orange-400 transition-colors">No Hidden Fees</h3>
              <p className="text-gray-300 leading-relaxed text-sm">Transparent pricing with no monthly fees, overdraft fees, or surprise charges.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* Product Preview Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-prime-navy to-prime-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
              All Your Money in One <span className="text-prime-accent">Smart Dashboard</span>
            </h2>
            <div className="w-12 h-1 bg-prime-accent mx-auto rounded-full mb-6"></div>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Experience seamless banking with our intuitive dashboard designed for simplicity and power.
            </p>
          </div>
          
          {/* Dashboard Mockup */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-3xl p-8 shadow-2xl border border-white/10">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 mb-6">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <div className="flex-1 bg-white/10 rounded-lg h-6 flex items-center px-4">
                  <span className="text-xs text-white/60">primeedge.bank/dashboard</span>
                </div>
              </div>
              
              {/* Dashboard Content */}
              <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">SW</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Welcome back, Sarah!</h3>
                      <p className="text-blue-200 text-sm">Here's your financial overview</p>
                    </div>
                  </div>
                  <div className="bg-prime-accent text-white px-4 py-2 rounded-lg text-sm font-medium">
                    Dashboard
                  </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm border border-green-400/20 rounded-xl p-4">
                    <div className="text-xs text-green-300 mb-1">BALANCE</div>
                    <div className="text-2xl font-bold text-white">$2,250.00</div>
                    <div className="text-xs text-green-300">Available Now</div>
                  </div>
                  <div className="bg-gradient-to-br from-blue-500/20 to-indigo-600/20 backdrop-blur-sm border border-blue-400/20 rounded-xl p-4">
                    <div className="text-xs text-blue-300 mb-1">SPENDING</div>
                    <div className="text-2xl font-bold text-white">$250.00</div>
                    <div className="text-xs text-blue-300">This Month</div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-sm border border-purple-400/20 rounded-xl p-4">
                    <div className="text-xs text-purple-300 mb-1">ACTIVITY</div>
                    <div className="text-2xl font-bold text-white">12</div>
                    <div className="text-xs text-purple-300">Transactions</div>
                  </div>
                </div>
                
                {/* Recent Activity */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
                  <h4 className="text-white font-semibold mb-3">Recent Activity</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-500/20 border border-green-400/30 rounded-full flex items-center justify-center">
                          <span className="text-green-400 text-xs">↓</span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">Salary Deposit</div>
                          <div className="text-gray-400 text-xs">Jan 15, 2025</div>
                        </div>
                      </div>
                      <div className="text-green-400 font-bold">+$3,200.00</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-red-500/20 border border-red-400/30 rounded-full flex items-center justify-center">
                          <span className="text-red-400 text-xs">↑</span>
                        </div>
                        <div>
                          <div className="text-white text-sm font-medium">Grocery Store</div>
                          <div className="text-gray-400 text-xs">Jan 14, 2025</div>
                        </div>
                      </div>
                      <div className="text-red-400 font-bold">-$85.50</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 sm:py-24 bg-prime-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Trusted by <span className="text-prime-accent">Thousands</span>
            </h2>
            <div className="w-12 h-1 bg-prime-accent mx-auto rounded-full mb-6"></div>
            <p className="text-lg sm:text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
              See what our customers are saying about their Prime Edge Banking experience.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">MJ</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Michael Johnson</div>
                  <div className="text-gray-400 text-sm">Small Business Owner</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                "Prime Edge transformed how I manage my business finances. The instant transfers and clean dashboard make banking effortless."
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">SC</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Sarah Chen</div>
                  <div className="text-gray-400 text-sm">CFO at TechStart</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                "Finally, a bank that gets it. No hidden fees, transparent pricing, and the security features give me complete peace of mind."
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm border border-white/10 p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">AR</span>
                </div>
                <div>
                  <div className="text-white font-semibold">Alex Rodriguez</div>
                  <div className="text-gray-400 text-sm">Freelance Designer</div>
                </div>
              </div>
              <p className="text-gray-300 leading-relaxed mb-4">
                "The 24/7 support is incredible. Whether it's 2 AM or 2 PM, I always get help when I need it. Best banking experience ever."
              </p>
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Dashboard Preview */}
      <section className="py-20 bg-prime-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Intuitive Dashboard Experience</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Manage your finances with our clean, powerful dashboard designed for both personal and business banking.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="gradient-card p-6 border-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Users</span>
                <Users className="h-5 w-5 text-prime-accent" />
              </div>
              <div className="text-3xl font-bold text-white">2,847</div>
              <div className="text-sm text-prime-success mt-1">+12 today</div>
            </Card>
            
            <Card className="gradient-card p-6 border-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Total Assets</span>
                <DollarSign className="h-5 w-5 text-prime-accent" />
              </div>
              <div className="text-3xl font-bold text-white">$2.5B</div>
              <div className="text-sm text-prime-success mt-1">+1.2% growth</div>
            </Card>
            
            <Card className="gradient-card p-6 border-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-400">Active Sessions</span>
                <Activity className="h-5 w-5 text-prime-accent" />
              </div>
              <div className="text-3xl font-bold text-white">1,247</div>
              <div className="text-sm text-gray-400 mt-1">Live users</div>
            </Card>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-20 bg-prime-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1521791136064-7986c2920216?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800" 
                alt="Business handshake meeting" 
                className="rounded-2xl shadow-2xl w-full h-auto" 
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold">Trusted by Industry Leaders</h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                Join thousands of satisfied customers who have made Prime Edge Banking their financial partner of choice.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <div className="text-3xl font-bold text-prime-accent mb-2">4.9/5</div>
                  <div className="text-gray-300">Customer Rating</div>
                  <div className="flex text-yellow-400 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold text-prime-accent mb-2">A+</div>
                  <div className="text-gray-300">BBB Rating</div>
                  <div className="text-sm text-gray-400 mt-1">Accredited Business</div>
                </div>
              </div>
              <blockquote className="text-lg italic text-gray-300 border-l-4 border-prime-accent pl-4">
                "Prime Edge Banking transformed how we manage our business finances. The admin controls and user management features are exactly what we needed."
              </blockquote>
              <div className="text-sm text-gray-400">
                — Sarah Chen, CFO at TechStart Solutions
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-prime-accent via-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight">
                Ready to Experience the Future of Banking?
              </h2>
              <div className="w-16 h-1 bg-white/50 mx-auto rounded-full"></div>
              <p className="text-lg sm:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto">
                Join Prime Edge Banking today and discover why thousands of customers trust us with their financial future.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-lg mx-auto">
              <Button 
                size="lg" 
                className="bg-white hover:bg-gray-100 text-prime-navy px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto border-0"
                onClick={() => setLocation("/register")}
              >
                Open Your Account
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/50 text-white hover:bg-white/10 hover:border-white backdrop-blur-sm px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                onClick={() => setLocation("/login")}
              >
                Sign In Now
              </Button>
            </div>
            
            {/* Trust Signals */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8 text-white/80">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <span className="text-sm font-medium">FDIC Insured</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-5 w-5" />
                <span className="text-sm font-medium">Bank-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <span className="text-sm font-medium">2,847+ Happy Customers</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-prime-charcoal py-12 border-t border-prime-slate/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Logo size="md" showText={true} />
              <p className="text-gray-300 text-sm">Your trusted partner for secure, innovative digital banking solutions.</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <button 
                    onClick={() => setLocation("/services/personal-banking")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Personal Banking
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/services/business-banking")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Business Banking
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/services/investment-services")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Investment Services
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/services/loans")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Loans & Credit
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <button 
                    onClick={() => setLocation("/support/help-center")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/support/contact-us")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/support/security")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Security Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/legal/privacy-policy")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/legal/terms-of-service")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/about")}
                    className="hover:text-white transition-colors cursor-pointer text-left"
                  >
                    About Us
                  </button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>+1 (938) 271-8041</li>
                <li>support@primeedge.bank</li>
                <li>New York, NY</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-prime-slate/20 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2023 Prime Edge Banking. All rights reserved. Member FDIC. Equal Housing Lender.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
