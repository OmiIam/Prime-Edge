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
              <Logo size="md" showText={true} className="cursor-pointer" />
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
              <a href="#security" className="text-gray-300 hover:text-white transition-colors">Security</a>
              <a href="#about" className="text-gray-300 hover:text-white transition-colors">About</a>
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
        className="relative pt-16 min-h-screen flex items-center justify-center"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1497493292307-31c376b6e479?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2048&q=80')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/50 to-transparent"></div>
        
        {/* Glassmorphism Panel */}
        <div className="relative z-10 max-w-4xl mx-auto px-6 sm:px-8 lg:px-12 text-center">
          <div className="backdrop-blur-md bg-white/10 rounded-3xl border border-white/20 p-12 sm:p-16 shadow-2xl">
            <div className="space-y-8">
              <div className="space-y-6">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight text-white">
                  Banking That <span className="text-prime-accent">Moves With You</span>
                </h1>
                <p className="text-2xl sm:text-3xl text-white/90 font-light leading-relaxed max-w-2xl mx-auto">
                  No branches. No queues. Just freedom.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-12 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  onClick={() => setLocation("/register")}
                >
                  Start Banking Today
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-2 border-white/50 text-white hover:bg-white/20 backdrop-blur-sm px-12 py-6 text-xl font-semibold rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                  onClick={() => setLocation("/login")}
                >
                  Sign In
                </Button>
              </div>
              
              {/* Trust Indicators */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-12 text-white/80">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-prime-accent" />
                  <span className="text-lg font-medium">FDIC Insured</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-6 w-6 text-prime-accent" />
                  <span className="text-lg font-medium">Instant Transfers</span>
                </div>
                <div className="flex items-center gap-2">
                  <Smartphone className="h-6 w-6 text-prime-accent" />
                  <span className="text-lg font-medium">Mobile First</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-prime-charcoal">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Prime Edge Banking?</h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Experience banking that adapts to your lifestyle with cutting-edge technology and unparalleled security.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="gradient-card p-8 border-none shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                <div className="w-16 h-16 bg-prime-accent/20 rounded-lg flex items-center justify-center mb-6">
                  <feature.icon className="h-8 w-8 text-prime-accent" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-white">{feature.title}</h3>
                <p className="text-gray-300 leading-relaxed">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 bg-prime-navy">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold">Your Security is Our Priority</h2>
              <p className="text-xl text-gray-300 leading-relaxed">
                We employ the highest standards of digital security to protect your financial information and transactions.
              </p>
              <div className="space-y-4">
                {securityFeatures.map((feature, index) => (
                  <div key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-prime-success/20 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="h-4 w-4 text-prime-success" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.split(' - ')[0]}</h4>
                      <p className="text-gray-300 text-sm">{feature.split(' - ')[1]}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <img 
                src="https://images.unsplash.com/photo-1563013544-824ae1b704d3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800" 
                alt="Secure digital banking interface" 
                className="rounded-2xl shadow-2xl w-full h-auto" 
              />
            </div>
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
      <section className="py-20 gradient-prime">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">Ready to Experience the Future of Banking?</h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join Prime Edge Banking today and discover why thousands of customers trust us with their financial future.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg font-semibold"
              onClick={() => setLocation("/register")}
            >
              Open Your Account
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="border-2 border-white text-white hover:bg-white hover:text-prime-navy px-8 py-4 text-lg font-semibold"
              onClick={() => setLocation("/login")}
            >
              Sign In Now
            </Button>
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
                <li>Personal Banking</li>
                <li>Business Banking</li>
                <li>Investment Services</li>
                <li>Loans & Credit</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>Security Center</li>
                <li>Privacy Policy</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>1-800-PRIME-EDGE</li>
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
