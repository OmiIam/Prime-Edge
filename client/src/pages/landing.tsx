import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Logo from "@/components/logo";
import TrustIndicators, { SecurityStatus, RegulatedBadge, CustomerStats } from "@/components/TrustIndicators";
import { Shield, Smartphone, TrendingUp, Clock, Zap, Gem, Check, Users, DollarSign, Activity, BarChart3, Menu, X } from "lucide-react";
import { useState, useEffect, useRef } from "react";

export default function Landing() {
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
        menuButtonRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  // Focus management for mobile menu
  useEffect(() => {
    if (mobileMenuOpen) {
      // Focus first menu item when menu opens
      const firstMenuItem = mobileMenuRef.current?.querySelector('a, button');
      (firstMenuItem as HTMLElement)?.focus();
    }
  }, [mobileMenuOpen]);

  const handleMobileMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

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
      {/* Professional Banking Navigation */}
      <nav className="fixed w-full top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-100/80 shadow-lg shadow-gray-900/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo Section */}
            <div className="flex items-center">
              <div className="cursor-pointer transition-all duration-300 hover:scale-105" onClick={() => setLocation("/")}>
                <div className="flex items-center space-x-3">
                  <div className="relative w-11 h-11 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 rounded-xl flex items-center justify-center shadow-xl group">
                    <div className="w-6 h-6 bg-white rounded-md transform group-hover:rotate-3 transition-transform duration-300"></div>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-gray-900 tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text">Prime Edge</span>
                    <span className="text-xs text-blue-600 font-semibold -mt-1 tracking-wider">BANKING</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-1">
              {[
                { name: 'Features', href: '#features', icon: '⚡' },
                { name: 'Security', action: () => setLocation("/support/security"), icon: '🛡️' },
                { name: 'About', action: () => setLocation("/about"), icon: '🏦' }
              ].map((item, index) => (
                <div key={index} className="relative group">
                  {item.href ? (
                    <a 
                      href={item.href}
                      className="relative flex items-center px-5 py-3 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl group overflow-hidden"
                    >
                      <span className="text-sm mr-2 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">{item.icon}</span>
                      <span className="relative z-10">{item.name}</span>
                      <div className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-6 group-hover:left-1/2 group-hover:-translate-x-1/2 transition-all duration-300 rounded-full"></div>
                    </a>
                  ) : (
                    <button 
                      onClick={item.action}
                      className="relative flex items-center px-5 py-3 text-sm font-semibold text-gray-600 hover:text-blue-700 transition-all duration-300 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 rounded-xl group overflow-hidden"
                    >
                      <span className="text-sm mr-2 opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300">{item.icon}</span>
                      <span className="relative z-10">{item.name}</span>
                      <div className="absolute bottom-1 left-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:w-6 group-hover:left-1/2 group-hover:-translate-x-1/2 transition-all duration-300 rounded-full"></div>
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Button 
                variant="ghost"
                className="text-gray-600 hover:text-blue-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 font-semibold px-6 py-2.5 rounded-xl transition-all duration-300 hover:shadow-sm"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
              <Button 
                className="relative bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 text-white font-bold px-8 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 border-0 overflow-hidden group"
                onClick={() => setLocation("/register")}
              >
                <span className="relative z-10 flex items-center">
                  Get Started
                  <svg className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                ref={menuButtonRef}
                onClick={handleMobileMenuToggle}
                className="relative p-3 text-gray-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all duration-200 group"
                aria-label={mobileMenuOpen ? "Close mobile menu" : "Open mobile menu"}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
              >
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${mobileMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                  <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm my-0.5 ${mobileMenuOpen ? 'opacity-0' : 'opacity-100'}`}></span>
                  <span className={`bg-current block transition-all duration-300 ease-out h-0.5 w-6 rounded-sm ${mobileMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Professional Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div 
            id="mobile-menu"
            ref={mobileMenuRef}
            className="md:hidden absolute top-20 left-0 right-0 bg-white/98 backdrop-blur-xl border-b border-gray-100/80 shadow-2xl animate-in slide-in-from-top-2 duration-300"
            role="menu"
            aria-label="Mobile navigation menu"
          >
            <div className="p-6 space-y-1 max-w-sm mx-auto">
              {[
                { name: 'Features', href: '#features', icon: '⚡' },
                { name: 'Security', action: () => setLocation("/support/security"), icon: '🛡️' },
                { name: 'About', action: () => setLocation("/about"), icon: '🏦' }
              ].map((item, index) => (
                <div key={index}>
                  {item.href ? (
                    <a 
                      href={item.href}
                      className="flex items-center w-full p-4 text-gray-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all duration-200 group"
                      onClick={() => setMobileMenuOpen(false)}
                      role="menuitem"
                    >
                      <span className="text-lg mr-3 opacity-60 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </a>
                  ) : (
                    <button 
                      onClick={() => {
                        item.action();
                        setMobileMenuOpen(false);
                      }}
                      className="flex items-center w-full p-4 text-gray-700 hover:text-blue-700 hover:bg-blue-50/80 rounded-xl transition-all duration-200 group"
                      role="menuitem"
                    >
                      <span className="text-lg mr-3 opacity-60 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                      <span className="font-medium">{item.name}</span>
                    </button>
                  )}
                </div>
              ))}
              
              {/* Mobile Action Buttons */}
              <div className="pt-4 space-y-3 border-t border-gray-100 mt-4">
                <Button 
                  variant="outline"
                  className="w-full py-3 text-gray-700 border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
                  onClick={() => {
                    setLocation("/login");
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign In
                </Button>
                <Button 
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-semibold rounded-xl shadow-lg transition-all duration-300"
                  onClick={() => {
                    setLocation("/register");
                    setMobileMenuOpen(false);
                  }}
                >
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section 
        className="relative pt-20 min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.92) 0%, rgba(30, 41, 59, 0.88) 50%, rgba(51, 65, 85, 0.85) 100%), url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80')`,
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
                The Future of Banking: <span className="text-prime-accent bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">No Queues. No Branches. Just You.</span>
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-prime-accent to-blue-600 mx-auto rounded-full"></div>
              <p className="text-xl sm:text-2xl text-white/80 font-light leading-relaxed max-w-3xl mx-auto">
                Send money instantly, track expenses, and grow your savings—all from your phone.
              </p>
            </div>
            
            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center max-w-lg mx-auto px-4 sm:px-0">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-prime-accent to-blue-600 hover:from-blue-600 hover:to-prime-accent text-white px-8 sm:px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 hover:glow-pulse w-full sm:w-auto border-0 focus-visible:focus-visible touch-target-lg mobile-button btn-micro-primary relative overflow-hidden"
                onClick={() => setLocation("/register")}
              >
                Open a Free Account Today
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-2 border-white/30 text-white hover:bg-white/10 hover:border-white/50 backdrop-blur-sm px-8 sm:px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto focus-visible:focus-visible touch-target-lg mobile-button btn-micro-primary relative overflow-hidden hover:text-prime-accent"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
            </div>
            
            {/* Trust Indicators */}
            <div className="space-y-6 pt-8">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl mx-auto">
                <div className="flex items-center justify-center gap-3 text-white/70 hover:text-white/90 transition-colors">
                  <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                    <Shield className="h-5 w-5 text-green-400" />
                  </div>
                  <span className="text-sm font-medium">FDIC Insured up to $250k</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/70 hover:text-white/90 transition-colors">
                  <div className="w-10 h-10 bg-prime-accent/20 rounded-full flex items-center justify-center">
                    <Zap className="h-5 w-5 text-prime-accent" />
                  </div>
                  <span className="text-sm font-medium">Instant Transfers 24/7</span>
                </div>
                <div className="flex items-center justify-center gap-3 text-white/70 hover:text-white/90 transition-colors">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center">
                    <Smartphone className="h-5 w-5 text-purple-400" />
                  </div>
                  <span className="text-sm font-medium">Mobile First Design</span>
                </div>
              </div>
              
              {/* Payment Partners */}
              <div className="flex items-center justify-center gap-6 pt-4">
                <div className="text-white/60 text-xs font-medium">TRUSTED BY:</div>
                <div className="flex items-center gap-4 text-white/40">
                  <span className="text-sm font-semibold">VISA</span>
                  <span className="text-sm font-semibold">MASTERCARD</span>
                  <span className="text-sm font-semibold">APPLE PAY</span>
                </div>
              </div>
              
              {/* Security Badge */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-sm font-medium text-white">256-bit Encryption</span>
                </div>
              </div>
              
              {/* Customer Count */}
              <div className="text-center text-white/60 text-sm">
                Trusted by <span className="text-prime-accent font-semibold">50,000+</span> users
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
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Three core benefits that make Prime Edge the smartest choice for your financial future.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 px-4 sm:px-0 stagger-animation">
            <Card className="group card-glass glass-enhanced border border-green-400/20 hover:border-green-400/40 p-6 md:p-8 lg:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 text-center hover-lift mobile-card touch-target">
              <div className="w-16 h-16 bg-green-400/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-green-400/20 group-hover:scale-110 transition-all duration-300 mx-auto floating">
                <Shield className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-green-400 transition-colors">Your Money, Always Protected</h3>
              <p className="text-gray-300 leading-relaxed text-base mb-4">Bank-grade security with FDIC insurance protecting your deposits up to $250,000. Sleep soundly knowing your money is safe.</p>
              <div className="text-sm text-green-400 font-semibold">
                ✓ FDIC Insured up to $250k
              </div>
            </Card>
            
            <Card className="group card-glass glass-enhanced border border-prime-accent/20 hover:border-prime-accent/40 p-6 md:p-8 lg:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 text-center hover-lift mobile-card touch-target">
              <div className="w-16 h-16 bg-prime-accent/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-prime-accent/20 group-hover:scale-110 transition-all duration-300 mx-auto floating-delayed">
                <Zap className="h-8 w-8 text-prime-accent" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-prime-accent transition-colors">Move Money in Seconds</h3>
              <p className="text-gray-300 leading-relaxed text-base mb-4">Send money instantly to friends, family, or businesses. No waiting, no delays—just instant transfers 24/7.</p>
              <div className="text-sm text-prime-accent font-semibold">
                ✓ Instant Transfers 24/7
              </div>
            </Card>
            
            <Card className="group card-glass glass-enhanced border border-purple-400/20 hover:border-purple-400/40 p-6 md:p-8 lg:p-10 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 text-center hover-lift mobile-card touch-target">
              <div className="w-16 h-16 bg-purple-400/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-purple-400/20 group-hover:scale-110 transition-all duration-300 mx-auto floating">
                <Smartphone className="h-8 w-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-purple-400 transition-colors">Bank Anytime, Anywhere</h3>
              <p className="text-gray-300 leading-relaxed text-base mb-4">Beautiful, intuitive mobile app designed for modern life. Manage your finances on your terms, whenever you need.</p>
              <div className="text-sm text-purple-400 font-semibold">
                ✓ Mobile First Design
              </div>
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
                  <h3 className="text-white font-semibold mb-3">Recent Activity</h3>
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

      {/* Social Proof Section */}
      <section className="py-16 sm:py-24 bg-prime-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 text-white">
              Trusted by <span className="text-prime-accent">50,000+</span> Users
            </h2>
            <div className="w-12 h-1 bg-prime-accent mx-auto rounded-full mb-6"></div>
            <p className="text-lg sm:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Join thousands of satisfied customers who chose Prime Edge for secure, modern banking.
            </p>
          </div>
          
          {/* Overall Rating */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-8 py-6">
              <div className="flex text-yellow-400 text-2xl">
                {[...Array(5)].map((_, i) => (
                  <span key={i}>★</span>
                ))}
              </div>
              <div>
                <div className="text-3xl font-bold text-white">4.9/5</div>
                <div className="text-gray-300 text-sm">from 12,847 reviews</div>
              </div>
            </div>
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
              <p className="text-gray-300 leading-relaxed mb-4 italic">
                "Prime Edge transformed how I manage my business finances. The instant transfers saved me hours every week, and the clean dashboard makes banking actually enjoyable."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <div className="text-gray-400 text-xs">2 days ago</div>
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
              <p className="text-gray-300 leading-relaxed mb-4 italic">
                "Finally, a bank that gets it. No hidden fees, transparent pricing, and the security features give me complete peace of mind. FDIC insurance up to $250k is exactly what we needed."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <div className="text-gray-400 text-xs">1 week ago</div>
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
              <p className="text-gray-300 leading-relaxed mb-4 italic">
                "The 24/7 support is incredible. Whether it's 2 AM or 2 PM, I always get help when I need it. The mobile app works flawlessly and transfers are truly instant."
              </p>
              <div className="flex items-center justify-between">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                </div>
                <div className="text-gray-400 text-xs">3 days ago</div>
              </div>
            </Card>
          </div>
          
          {/* Success Story */}
          <div className="mt-16 max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-prime-accent/10 to-blue-600/10 backdrop-blur-sm border border-prime-accent/20 p-8 lg:p-12">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-4">Customer Success Story</h3>
                <div className="w-12 h-1 bg-prime-accent mx-auto rounded-full"></div>
              </div>
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <blockquote className="text-lg text-gray-200 leading-relaxed italic mb-6">
                    "We switched our entire company payroll to Prime Edge and saved over $2,400 annually in transfer fees. The business banking features are outstanding."
                  </blockquote>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">LK</span>
                    </div>
                    <div>
                      <div className="text-white font-semibold text-lg">Lisa Kim</div>
                      <div className="text-gray-400">CEO, InnovateTech Solutions</div>
                      <div className="text-prime-accent text-sm font-medium">85 employees • $2.4M in annual transfers</div>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-prime-accent mb-2">$2,400</div>
                  <div className="text-white font-semibold mb-1">Annual Savings</div>
                  <div className="text-gray-400 text-sm">on transfer fees alone</div>
                </div>
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
          {/* Trust Indicators */}
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Bank-Grade Security & Trust</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12">
              Your security and trust are our top priorities. We're regulated, insured, and independently audited.
            </p>
            <TrustIndicators variant="landing" className="mb-12" />
            
            {/* Regulatory Badge */}
            <div className="flex justify-center mb-8">
              <RegulatedBadge />
            </div>
            
            {/* Customer Stats */}
            <CustomerStats />
          </div>

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
          <div className="grid md:grid-cols-5 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Logo size="md" showText={true} />
              <p className="text-gray-300 text-sm leading-relaxed">Your trusted partner for secure, innovative digital banking solutions. FDIC insured up to $250,000.</p>
              
              {/* Trust Badges */}
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span className="text-xs font-medium text-white">FDIC Insured</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <Check className="h-4 w-4 text-blue-400" />
                  <span className="text-xs font-medium text-white">256-bit SSL</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <button 
                    onClick={() => setLocation("/services/personal-banking")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Personal Banking
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/services/business-banking")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Business Banking
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/services/investment-services")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Investment Services
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/services/loans")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Loans & Credit
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/pricing")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Pricing
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Support</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>
                  <button 
                    onClick={() => setLocation("/support/help-center")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Help Center
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/support/contact-us")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Contact Us
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/support/security")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Security Center
                  </button>
                </li>
                <li>
                  <a href="mailto:support@primeedge.bank" className="hover:text-prime-accent transition-colors">Live Chat</a>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/legal/privacy-policy")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => setLocation("/legal/terms-of-service")}
                    className="hover:text-prime-accent transition-colors cursor-pointer text-left"
                  >
                    Terms of Service
                  </button>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-white">Contact Info</h3>
              <ul className="space-y-3 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-prime-accent">📞</span>
                  <a href="tel:+19382718041" className="hover:text-prime-accent transition-colors">+1 (938) 271-8041</a>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-prime-accent">✉️</span>
                  <a href="mailto:support@primeedge.bank" className="hover:text-prime-accent transition-colors">support@primeedge.bank</a>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-prime-accent">📍</span>
                  <span>123 Financial District<br />New York, NY 10004</span>
                </li>
                <li className="pt-2">
                  <div className="text-xs text-gray-400">
                    <strong className="text-prime-accent">Hours:</strong><br />
                    24/7 Digital Banking<br />
                    Support: 8 AM - 8 PM EST
                  </div>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Regulatory Information */}
          <div className="border-t border-prime-slate/20 mt-8 pt-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-xs text-gray-400 leading-relaxed">
                <p className="mb-2">
                  <strong className="text-white">Prime Edge Banking</strong> is a Member FDIC institution. Your deposits are insured up to $250,000 per depositor, per insured bank, for each account ownership category.
                </p>
                <p>
                  Equal Housing Lender. NMLS ID: 123456. Licensed by the New York State Department of Financial Services.
                </p>
              </div>
              <div className="text-right">
                <div className="flex justify-end items-center gap-4 mb-2">
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzFFM0E4QSIvPgo8dGV4dCB4PSI1IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjEwIiBmaWxsPSJ3aGl0ZSI+RkRJQzwvdGV4dD4KPC9zdmc+" alt="FDIC" className="h-6" />
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iIzAwNTFBNSIvPgo8dGV4dCB4PSI4IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjgiIGZpbGw9IndoaXRlIj5WSVNBPC90ZXh0Pgo8L3N2Zz4=" alt="Visa" className="h-6" />
                  <img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCA0MCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjI0IiByeD0iNCIgZmlsbD0iI0VCMDAxQiIvPgo8dGV4dCB4PSI2IiB5PSIxNiIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjciIGZpbGw9IndoaXRlIj5NQVNURVJDQVJEPC90ZXh0Pgo8L3N2Zz4=" alt="Mastercard" className="h-6" />
                </div>
                <div className="text-xs text-gray-400">
                  &copy; 2025 Prime Edge Banking. All rights reserved.
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
