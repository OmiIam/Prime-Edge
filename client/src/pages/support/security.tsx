import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/logo";
import { 
  Shield, 
  Lock, 
  Eye,
  AlertTriangle,
  CheckCircle,
  Phone,
  Mail,
  Smartphone,
  Globe,
  Server,
  Key,
  UserCheck,
  FileText,
  Clock,
  Zap,
  Target,
  Users,
  Building,
  CreditCard,
  Fingerprint,
  Wifi,
  Download,
  ExternalLink,
  Info,
  Bug,
  HelpCircle
} from "lucide-react";

export default function SecurityCenter() {
  const [, setLocation] = useLocation();
  const [reportingType, setReportingType] = useState("fraud");

  const securityFeatures = [
    {
      icon: Lock,
      title: "256-Bit SSL Encryption",
      description: "All data transmission is protected with bank-grade encryption technology.",
      status: "Active",
      color: "green"
    },
    {
      icon: Fingerprint,
      title: "Biometric Authentication",
      description: "Use fingerprint or face recognition for secure mobile app access.",
      status: "Available",
      color: "blue"
    },
    {
      icon: UserCheck,
      title: "Multi-Factor Authentication",
      description: "Additional security layers including SMS, email, and authenticator apps.",
      status: "Recommended",
      color: "orange"
    },
    {
      icon: Eye,
      title: "Real-Time Monitoring",
      description: "24/7 fraud detection and suspicious activity monitoring.",
      status: "Active",
      color: "green"
    },
    {
      icon: Shield,
      title: "FDIC Insurance",
      description: "Your deposits are protected up to $250,000 per depositor.",
      status: "Protected",
      color: "green"
    },
    {
      icon: Server,
      title: "Secure Data Centers",
      description: "SOC 2 certified facilities with physical security and redundancy.",
      status: "Certified",
      color: "green"
    }
  ];

  const securityTips = [
    {
      category: "Password Security",
      icon: Key,
      tips: [
        "Use strong, unique passwords for your banking accounts",
        "Enable two-factor authentication when available",
        "Never share your login credentials with anyone",
        "Change passwords regularly, especially if compromised",
        "Use a reputable password manager"
      ]
    },
    {
      category: "Mobile Banking",
      icon: Smartphone,
      tips: [
        "Always download our official app from app stores",
        "Keep your mobile app updated to the latest version",
        "Use biometric authentication when available",
        "Log out completely when finished banking",
        "Never bank on public or unsecured Wi-Fi networks"
      ]
    },
    {
      category: "Online Safety",
      icon: Globe,
      tips: [
        "Always type our URL directly or use bookmarks",
        "Look for the padlock icon in your browser",
        "Never click links in suspicious emails",
        "Log out properly when finished banking",
        "Keep your browser and devices updated"
      ]
    },
    {
      category: "Fraud Prevention",
      icon: AlertTriangle,
      tips: [
        "Monitor your accounts regularly for suspicious activity",
        "Set up account alerts for transactions and logins",
        "Never give personal information over unsolicited calls",
        "Report suspicious activity immediately",
        "Review statements and notifications promptly"
      ]
    }
  ];

  const fraudTypes = [
    {
      type: "Phishing Emails",
      description: "Fake emails designed to steal your login credentials",
      warning: "We will never ask for passwords or account details via email",
      examples: ["Urgent account verification requests", "Suspicious activity notifications", "Prize or reward claims"],
      icon: Mail
    },
    {
      type: "Phone Scams",
      description: "Fraudulent calls requesting personal or financial information",
      warning: "We will never ask for your full password or PIN over the phone",
      examples: ["IRS or government agency impersonation", "Tech support scams", "Charity or prize scams"],
      icon: Phone
    },
    {
      type: "Card Skimming",
      description: "Devices that steal card information at ATMs or payment terminals",
      warning: "Always inspect ATMs and card readers before use",
      examples: ["Unusual devices attached to ATMs", "Loose or damaged card slots", "Suspicious overlays on keypads"],
      icon: CreditCard
    },
    {
      type: "Identity Theft",
      description: "Unauthorized use of your personal information to open accounts",
      warning: "Monitor your credit reports and account statements regularly",
      examples: ["Unknown accounts on credit reports", "Unexpected credit inquiries", "Mail not arriving"],
      icon: UserCheck
    }
  ];

  const incidentTypes = [
    { value: "fraud", label: "Fraudulent Activity", icon: AlertTriangle },
    { value: "identity", label: "Identity Theft", icon: UserCheck },
    { value: "phishing", label: "Phishing/Scam", icon: Mail },
    { value: "card", label: "Card Compromise", icon: CreditCard },
    { value: "account", label: "Account Access Issues", icon: Lock },
    { value: "other", label: "Other Security Concern", icon: Shield }
  ];

  const securityResources = [
    {
      title: "Security Best Practices Guide",
      description: "Comprehensive guide to staying safe while banking online",
      type: "PDF Guide",
      icon: FileText
    },
    {
      title: "Two-Factor Authentication Setup",
      description: "Step-by-step instructions for enabling 2FA on your account",
      type: "Video Tutorial",
      icon: Smartphone
    },
    {
      title: "Fraud Alert Notifications",
      description: "Configure real-time alerts for suspicious account activity",
      type: "Account Settings",
      icon: AlertTriangle
    },
    {
      title: "Password Security Checklist",
      description: "Tools and tips for creating and managing secure passwords",
      type: "Interactive Tool",
      icon: Key
    }
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
                Security Center
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Your Security is Our
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Priority</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Learn about our comprehensive security measures, best practices for safe banking, 
                and how to protect yourself from fraud and identity theft.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg"
                >
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Report Security Issue
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-400 text-gray-300 hover:bg-white/10 px-8 py-4 text-lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Security Resources
                </Button>
              </div>
            </div>

            {/* Security Status */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "99.9%", label: "Uptime Reliability" },
                { number: "24/7", label: "Security Monitoring" },
                { number: "256-bit", label: "SSL Encryption" },
                { number: "$250K", label: "FDIC Protection" }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-prime-accent mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security Features */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Advanced Security Features</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Multiple layers of protection keep your accounts and personal information secure.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((feature, index) => {
                const IconComponent = feature.icon;
                const statusColors = {
                  green: "bg-green-100 text-green-700 border-green-200",
                  blue: "bg-blue-100 text-blue-700 border-blue-200",
                  orange: "bg-orange-100 text-orange-700 border-orange-200"
                };

                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardHeader className="pb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-4">
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <CardTitle className="text-lg font-bold text-gray-900">
                          {feature.title}
                        </CardTitle>
                        <Badge className={statusColors[feature.color as keyof typeof statusColors]}>
                          {feature.status}
                        </Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{feature.description}</p>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security Tips & Fraud Prevention */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <Tabs defaultValue="tips" className="space-y-8">
              <div className="flex justify-center">
                <TabsList className="grid w-full max-w-md grid-cols-2 bg-white/95 backdrop-blur-sm border border-white/20 rounded-xl p-1.5 shadow-lg">
                  <TabsTrigger value="tips" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Security Tips
                  </TabsTrigger>
                  <TabsTrigger value="fraud" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Fraud Prevention
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="tips">
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Security Best Practices</h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      Follow these guidelines to keep your accounts and personal information secure.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {securityTips.map((category, index) => {
                      const IconComponent = category.icon;
                      return (
                        <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                          <CardHeader>
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                <IconComponent className="h-5 w-5 text-white" />
                              </div>
                              <CardTitle className="text-xl font-bold text-gray-900">
                                {category.category}
                              </CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-3">
                              {category.tips.map((tip, tipIndex) => (
                                <li key={tipIndex} className="flex items-start gap-3 text-sm text-gray-700">
                                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
                                  {tip}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fraud">
                <div>
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Common Fraud Types</h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      Learn to recognize and avoid these common fraud schemes targeting bank customers.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {fraudTypes.map((fraud, index) => {
                      const IconComponent = fraud.icon;
                      return (
                        <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                          <CardHeader>
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                                  {fraud.type}
                                </CardTitle>
                                <p className="text-gray-600 mb-4">{fraud.description}</p>
                                <Alert className="bg-red-50 border-red-200 mb-4">
                                  <AlertTriangle className="h-4 w-4 text-red-600" />
                                  <AlertDescription className="text-red-800 font-medium">
                                    {fraud.warning}
                                  </AlertDescription>
                                </Alert>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div>
                              <h4 className="font-semibold text-gray-900 mb-3">Common Examples:</h4>
                              <ul className="space-y-2">
                                {fraud.examples.map((example, exampleIndex) => (
                                  <li key={exampleIndex} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                                    {example}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Report Security Issues */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-transparent">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardHeader>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl font-bold text-gray-900 mb-2">
                    Report a Security Issue
                  </CardTitle>
                  <p className="text-gray-600">
                    If you suspect fraudulent activity or have a security concern, report it immediately.
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Issue Type</h3>
                    <div className="space-y-3">
                      {incidentTypes.map((type, index) => {
                        const IconComponent = type.icon;
                        return (
                          <button
                            key={index}
                            onClick={() => setReportingType(type.value)}
                            className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-colors ${
                              reportingType === type.value
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              reportingType === type.value ? 'bg-blue-100' : 'bg-gray-100'
                            }`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <span className="font-medium">{type.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Immediate Actions</h3>
                    <div className="space-y-4">
                      <Alert className="bg-red-50 border-red-200">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          <strong>Emergency:</strong> If you believe your account has been compromised, 
                          call us immediately at <strong>+1 (938) 271-8041</strong>
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-3">
                        <Button 
                          className="w-full bg-red-600 hover:bg-red-700 text-white"
                          size="lg"
                        >
                          <Phone className="mr-2 h-5 w-5" />
                          Call Emergency Line
                        </Button>
                        
                        <Button 
                          variant="outline"
                          className="w-full"
                          size="lg"
                        >
                          <Mail className="mr-2 h-5 w-5" />
                          Email Security Team
                        </Button>

                        <Button 
                          variant="outline"
                          className="w-full"
                          size="lg"
                          onClick={() => setLocation("/login")}
                        >
                          <Lock className="mr-2 h-5 w-5" />
                          Secure Account Access
                        </Button>
                      </div>

                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2">What to Include:</h4>
                        <ul className="text-sm text-blue-800 space-y-1">
                          <li>• Date and time of incident</li>
                          <li>• Account numbers affected</li>
                          <li>• Description of suspicious activity</li>
                          <li>• Any relevant screenshots or documentation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Security Resources */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Security Resources</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Tools and guides to help you stay secure while banking online.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {securityResources.map((resource, index) => {
                const IconComponent = resource.icon;
                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <IconComponent className="h-6 w-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{resource.title}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {resource.type}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-4">{resource.description}</p>
                          <Button size="sm" variant="outline" className="w-full">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Access Resource
                          </Button>
                        </div>
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
                  Stay Protected with Prime Edge
                </h2>
                <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                  Our security team works around the clock to protect your accounts and personal information. 
                  Together, we can keep your financial future secure.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-prime-accent hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                  >
                    <Shield className="mr-2 h-5 w-5" />
                    Enable 2FA Now
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                  >
                    <HelpCircle className="mr-2 h-5 w-5" />
                    Security FAQ
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 mt-8 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">24/7 Monitoring</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">FDIC Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Expert Support</span>
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
                  Your security is our commitment, every day.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Security</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Security Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Fraud Protection</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security Tips</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Report Issues</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Report Fraud</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Identity Theft</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Phishing Attempts</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security Concerns</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Emergency Contact</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    +1 (938) 271-8041
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    security@primeedge.com
                  </li>
                  <li>Available 24/7 for emergencies</li>
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