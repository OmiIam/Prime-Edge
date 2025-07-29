import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Logo from "@/components/logo";
import { 
  Shield, 
  Lock, 
  Eye,
  User,
  Globe,
  Server,
  AlertTriangle,
  CheckCircle,
  FileText,
  Mail,
  Phone,
  Calendar,
  Download,
  ExternalLink,
  Info,
  Settings,
  Database,
  UserCheck,
  CreditCard,
  Building
} from "lucide-react";

export default function PrivacyPolicy() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: Info },
    { id: "information-collection", title: "Information We Collect", icon: Database },
    { id: "use-of-information", title: "How We Use Information", icon: Settings },
    { id: "information-sharing", title: "Information Sharing", icon: User },
    { id: "data-security", title: "Data Security", icon: Shield },
    { id: "cookies", title: "Cookies & Tracking", icon: Globe },
    { id: "your-rights", title: "Your Rights", icon: UserCheck },
    { id: "retention", title: "Data Retention", icon: Calendar },
    { id: "children", title: "Children's Privacy", icon: User },
    { id: "updates", title: "Policy Updates", icon: FileText },
    { id: "contact", title: "Contact Us", icon: Mail }
  ];

  const keyHighlights = [
    {
      icon: Shield,
      title: "Bank-Level Security",
      description: "Your data is protected with 256-bit SSL encryption and multi-factor authentication."
    },
    {
      icon: Lock,
      title: "Never Sold",
      description: "We never sell your personal information to third parties or advertisers."
    },
    {
      icon: Eye,
      title: "Transparent Practices",
      description: "Clear disclosure of what data we collect and how it's used for your banking needs."
    },
    {
      icon: UserCheck,
      title: "Your Control",
      description: "Manage your privacy preferences and data sharing settings anytime."
    }
  ];

  const dataTypes = [
    {
      category: "Personal Information",
      icon: User,
      items: [
        "Full name, address, and contact information",
        "Date of birth and Social Security number",
        "Employment and income information",
        "Government-issued identification documents"
      ]
    },
    {
      category: "Financial Information",
      icon: CreditCard,
      items: [
        "Account numbers and transaction history",
        "Credit scores and financial statements",
        "Investment portfolios and trading activity",
        "Loan applications and payment history"
      ]
    },
    {
      category: "Technical Information",
      icon: Server,
      items: [
        "IP addresses and device identifiers",
        "Browser type and operating system",
        "Login times and session duration",
        "Mobile app usage and preferences"
      ]
    },
    {
      category: "Communication Data",
      icon: Mail,
      items: [
        "Customer service interactions",
        "Email and phone communications",
        "Chat logs and support tickets",
        "Survey responses and feedback"
      ]
    }
  ];

  const securityMeasures = [
    {
      title: "Encryption",
      description: "All data transmitted between your device and our servers is protected with industry-standard 256-bit SSL encryption.",
      icon: Lock
    },
    {
      title: "Multi-Factor Authentication",
      description: "Additional security layers including SMS codes, authenticator apps, and biometric verification.",
      icon: Shield
    },
    {
      title: "Regular Audits",
      description: "Independent security assessments and penetration testing to identify and address vulnerabilities.",
      icon: CheckCircle
    },
    {
      title: "Access Controls",
      description: "Strict employee access controls with role-based permissions and regular access reviews.",
      icon: UserCheck
    },
    {
      title: "Data Centers",
      description: "Secure, SOC 2 certified data centers with 24/7 monitoring and physical security.",
      icon: Building
    },
    {
      title: "Incident Response",
      description: "Comprehensive incident response plan with immediate notification and remediation procedures.",
      icon: AlertTriangle
    }
  ];

  const yourRights = [
    {
      right: "Access Your Data",
      description: "Request a copy of all personal information we have about you."
    },
    {
      right: "Correct Information",
      description: "Update or correct any inaccurate personal information in your account."
    },
    {
      right: "Delete Data",
      description: "Request deletion of your personal information, subject to legal and regulatory requirements."
    },
    {
      right: "Data Portability",
      description: "Receive your data in a structured, commonly used format for transfer to another service."
    },
    {
      right: "Opt-Out",
      description: "Opt out of marketing communications and certain data sharing arrangements."
    },
    {
      right: "Lodge Complaints",
      description: "File complaints with regulatory authorities if you believe your privacy rights have been violated."
    }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Privacy Policy Overview</h2>
              <p className="text-gray-600 mb-6">
                At Prime Edge Finance Bank, we are committed to protecting your privacy and maintaining the confidentiality 
                of your personal and financial information. This Privacy Policy explains how we collect, use, share, and 
                protect your information when you use our banking services, website, and mobile applications.
              </p>
              
              <Alert className="bg-blue-50 border-blue-200 mb-6">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Last Updated:</strong> January 1, 2024 | <strong>Effective Date:</strong> January 1, 2024
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                {keyHighlights.map((highlight, index) => {
                  const IconComponent = highlight.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{highlight.title}</h3>
                        <p className="text-sm text-gray-600">{highlight.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );

      case "information-collection":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information We Collect</h2>
              <p className="text-gray-600 mb-6">
                We collect information necessary to provide you with secure, personalized banking services. 
                This includes information you provide directly, information collected automatically, and 
                information from third-party sources.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {dataTypes.map((type, index) => {
                  const IconComponent = type.icon;
                  return (
                    <Card key={index} className="border border-gray-200">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-blue-600" />
                          </div>
                          <CardTitle className="text-lg text-gray-900">{type.category}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {type.items.map((item, itemIndex) => (
                            <li key={itemIndex} className="text-sm text-gray-600 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Legal Requirement:</strong> As a financial institution, we are required by federal law 
                  to collect certain information to verify your identity and comply with anti-money laundering regulations.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      case "use-of-information":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">How We Use Your Information</h2>
              <p className="text-gray-600 mb-6">
                We use your information to provide and improve our banking services, ensure security, 
                comply with legal requirements, and communicate with you about your accounts.
              </p>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Primary Uses</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {[
                      "Process transactions and maintain your accounts",
                      "Verify your identity and prevent fraud",
                      "Provide customer service and support",
                      "Comply with legal and regulatory requirements",
                      "Develop and improve our products and services",
                      "Send important account notifications and updates"
                    ].map((use, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{use}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Marketing and Communications</h3>
                  <p className="text-gray-600 mb-4">
                    We may use your information to send you marketing communications about products and services 
                    that may interest you. You can opt out of these communications at any time.
                  </p>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Your Choice:</strong> You control your marketing preferences through your account settings 
                      or by clicking "unsubscribe" in any marketing email.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "information-sharing":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Information Sharing</h2>
              <p className="text-gray-600 mb-6">
                We do not sell your personal information. We may share your information only in specific 
                circumstances as described below, and always in accordance with applicable laws and regulations.
              </p>

              <div className="space-y-6">
                <Alert className="bg-red-50 border-red-200">
                  <Shield className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>We Never Sell Your Data:</strong> Prime Edge Finance Bank does not sell, rent, 
                    or lease your personal information to third parties for marketing purposes.
                  </AlertDescription>
                </Alert>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">When We Share Information</h3>
                  <div className="space-y-4">
                    {[
                      {
                        title: "Service Providers",
                        description: "Third-party companies that help us provide banking services (payment processors, technology providers, etc.)"
                      },
                      {
                        title: "Legal Requirements",
                        description: "When required by law, court orders, or regulatory authorities"
                      },
                      {
                        title: "Fraud Prevention",
                        description: "With fraud prevention services to protect you and other customers"
                      },
                      {
                        title: "Business Transfers",
                        description: "In connection with mergers, acquisitions, or asset sales (with appropriate protections)"
                      },
                      {
                        title: "Your Consent",
                        description: "When you explicitly authorize us to share information with third parties"
                      }
                    ].map((scenario, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">{scenario.title}</h4>
                        <p className="text-sm text-gray-600">{scenario.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "data-security":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Data Security</h2>
              <p className="text-gray-600 mb-6">
                We employ industry-leading security measures to protect your personal and financial information 
                from unauthorized access, use, or disclosure.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                {securityMeasures.map((measure, index) => {
                  const IconComponent = measure.icon;
                  return (
                    <Card key={index} className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-green-200 rounded-lg flex items-center justify-center">
                            <IconComponent className="h-6 w-6 text-green-600" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 mb-2">{measure.title}</h3>
                            <p className="text-sm text-gray-600">{measure.description}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <Alert className="bg-green-50 border-green-200">
                <Shield className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>FDIC Insured:</strong> Your deposits are insured up to $250,000 per depositor, per insured bank, 
                  for each account ownership category by the Federal Deposit Insurance Corporation.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      case "your-rights":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Your Privacy Rights</h2>
              <p className="text-gray-600 mb-6">
                You have important rights regarding your personal information. We respect these rights and 
                provide easy ways for you to exercise them.
              </p>

              <div className="space-y-4">
                {yourRights.map((right, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-900 mb-2">{right.right}</h3>
                          <p className="text-sm text-gray-600">{right.description}</p>
                        </div>
                        <Button size="sm" variant="outline">
                          Exercise Right
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="p-6 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">How to Exercise Your Rights</h3>
                <p className="text-blue-800 text-sm mb-4">
                  To exercise any of these rights, contact us using the information below. We will respond 
                  to your request within 30 days.
                </p>
                <div className="flex gap-4">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    <Mail className="mr-2 h-4 w-4" />
                    Email Privacy Team
                  </Button>
                  <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                    <Phone className="mr-2 h-4 w-4" />
                    Call +1 (938) 271-8041
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
              <p className="text-gray-600 mb-6">
                If you have questions about this Privacy Policy or our privacy practices, please contact us 
                using any of the methods below.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Email Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900">Privacy Team</p>
                        <p className="text-sm text-gray-600">privacy@primeedge.com</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Data Protection Officer</p>
                        <p className="text-sm text-gray-600">dpo@primeedge.com</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Response Time</p>
                        <p className="text-sm text-gray-600">Within 24-48 hours</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Phone Contact
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900">Privacy Hotline</p>
                        <p className="text-sm text-gray-600">+1 (938) 271-8041</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Hours</p>
                        <p className="text-sm text-gray-600">Monday-Friday, 8AM-8PM ET</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Languages</p>
                        <p className="text-sm text-gray-600">English, Spanish</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200 md:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                      <Building className="h-5 w-5" />
                      Mailing Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="font-medium text-gray-900 mb-2">Prime Edge Finance Bank</p>
                      <p className="text-sm text-gray-600">Attention: Privacy Team</p>
                      <p className="text-sm text-gray-600">1250 Broadway, Suite 3600</p>
                      <p className="text-sm text-gray-600">New York, NY 10001</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="p-8 text-center">
            <p className="text-gray-600">Content for this section is being prepared.</p>
          </div>
        );
    }
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
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-prime-accent/20 text-prime-accent border-prime-accent/30">
                Legal Information
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                Privacy
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Policy</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Your privacy is our priority. Learn how we collect, use, and protect your personal 
                and financial information in accordance with federal banking regulations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg"
                >
                  <Download className="mr-2 h-5 w-5" />
                  Download PDF
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-400 text-gray-300 hover:bg-white/10 px-8 py-4 text-lg"
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Contact Privacy Team
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar Navigation */}
              <div className="lg:col-span-1">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl sticky top-24">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      Table of Contents
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <nav className="space-y-1">
                      {sections.map((section) => {
                        const IconComponent = section.icon;
                        return (
                          <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`w-full text-left px-3 py-2 rounded-lg transition-colors flex items-center gap-3 ${
                              activeSection === section.id
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`}
                          >
                            <IconComponent className="h-4 w-4" />
                            <span className="text-sm">{section.title}</span>
                          </button>
                        );
                      })}
                    </nav>
                  </CardContent>
                </Card>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardContent className="p-8">
                    {renderSection()}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-16 px-4 sm:px-6 lg:px-8 border-t border-prime-slate/20">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-4 gap-8">
              <div>
                <Logo size="sm" showText={true} />
                <p className="text-gray-400 text-sm mt-4">
                  Protecting your privacy with transparency and security.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Accessibility</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Privacy Resources</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Controls</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Data Requests</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy FAQs</a></li>
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
                    privacy@primeedge.com
                  </li>
                  <li>Available Monday-Friday, 8AM-8PM ET</li>
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