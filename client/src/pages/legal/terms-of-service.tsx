import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Logo from "@/components/logo";
import { 
  FileText, 
  Scale, 
  Shield,
  User,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Info,
  Mail,
  Phone,
  Calendar,
  Download,
  Building,
  Gavel,
  UserCheck,
  Lock,
  Globe,
  Clock,
  DollarSign,
  Smartphone
} from "lucide-react";

export default function TermsOfService() {
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState("overview");

  const sections = [
    { id: "overview", title: "Overview", icon: Info },
    { id: "acceptance", title: "Acceptance of Terms", icon: CheckCircle },
    { id: "account-agreement", title: "Account Agreement", icon: CreditCard },
    { id: "electronic-banking", title: "Electronic Banking", icon: Smartphone },
    { id: "fees-charges", title: "Fees & Charges", icon: DollarSign },
    { id: "privacy-security", title: "Privacy & Security", icon: Shield },
    { id: "prohibited-uses", title: "Prohibited Uses", icon: AlertTriangle },
    { id: "liability", title: "Limitation of Liability", icon: Scale },
    { id: "dispute-resolution", title: "Dispute Resolution", icon: Gavel },
    { id: "modifications", title: "Modifications", icon: FileText },
    { id: "termination", title: "Account Termination", icon: User },
    { id: "contact", title: "Contact Information", icon: Mail }
  ];

  const keyTerms = [
    {
      icon: FileText,
      title: "Binding Agreement",
      description: "These terms constitute a legally binding contract between you and Prime Edge Finance Bank."
    },
    {
      icon: Shield,
      title: "FDIC Protection",
      description: "Your deposits are protected up to $250,000 per depositor by federal deposit insurance."
    },
    {
      icon: Scale,
      title: "Regulatory Compliance",
      description: "All services are provided in compliance with federal and state banking regulations."
    },
    {
      icon: UserCheck,
      title: "Account Verification",
      description: "Identity verification and KYC compliance are required for all account holders."
    }
  ];

  const accountTypes = [
    {
      type: "Personal Checking",
      description: "Individual deposit accounts for personal use",
      requirements: ["18+ years old", "Valid government ID", "Social Security number", "Initial deposit of $25"],
      features: ["Online banking", "Mobile app", "Debit card", "Check writing"]
    },
    {
      type: "Business Checking",
      description: "Commercial accounts for business operations",
      requirements: ["Business registration", "EIN or Tax ID", "Business license", "Initial deposit of $100"],
      features: ["Cash management", "Wire transfers", "Multiple users", "Merchant services"]
    },
    {
      type: "Savings Accounts",
      description: "Interest-bearing deposit accounts",
      requirements: ["Valid ID", "Social Security number", "Initial deposit of $10"],
      features: ["Competitive interest rates", "No monthly fees", "Online transfers", "Mobile deposits"]
    }
  ];

  const prohibitedActivities = [
    {
      category: "Illegal Activities",
      items: [
        "Money laundering or terrorist financing",
        "Drug trafficking or illegal drug sales",
        "Tax evasion or fraud",
        "Identity theft or impersonation"
      ]
    },
    {
      category: "Unauthorized Transactions", 
      items: [
        "Using accounts for third-party transactions without authorization",
        "Processing payments for prohibited businesses",
        "Creating multiple accounts to circumvent limits",
        "Manipulating account information or balances"
      ]
    },
    {
      category: "System Abuse",
      items: [
        "Attempting to hack or breach security systems",
        "Using automated tools to access accounts",
        "Transmitting viruses or malicious code",
        "Interfering with other customers' accounts"
      ]
    }
  ];

  const feeCategories = [
    {
      category: "Account Maintenance",
      fees: [
        { service: "Monthly maintenance fee", amount: "$12.00", waiver: "Waived with $1,500 minimum balance" },
        { service: "Paper statement fee", amount: "$3.00", waiver: "Waived with electronic statements" },
        { service: "Account closure (within 90 days)", amount: "$25.00", waiver: "None" }
      ]
    },
    {
      category: "Transaction Fees",
      fees: [
        { service: "Overdraft fee", amount: "$35.00", waiver: "Overdraft protection available" },
        { service: "Wire transfer (domestic)", amount: "$25.00", waiver: "Premium accounts" },
        { service: "Wire transfer (international)", amount: "$45.00", waiver: "Wealth management clients" },
        { service: "Stop payment fee", amount: "$30.00", waiver: "None" }
      ]
    },
    {
      category: "ATM & Card Services",
      fees: [
        { service: "Non-network ATM fee", amount: "$3.00", waiver: "First 4 free per month" },
        { service: "Replacement debit card", amount: "$10.00", waiver: "First replacement free" },
        { service: "Expedited card delivery", amount: "$25.00", waiver: "Premium accounts" }
      ]
    }
  ];

  const renderSection = () => {
    switch (activeSection) {
      case "overview":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Terms of Service Overview</h2>
              <p className="text-gray-600 mb-6">
                These Terms of Service ("Terms") govern your use of Prime Edge Finance Bank's banking services, 
                including deposit accounts, loans, electronic banking services, and related products. By opening 
                an account or using our services, you agree to be bound by these Terms.
              </p>
              
              <Alert className="bg-blue-50 border-blue-200 mb-6">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Effective Date:</strong> January 1, 2024 | <strong>Last Revised:</strong> January 1, 2024
                </AlertDescription>
              </Alert>

              <div className="grid md:grid-cols-2 gap-6">
                {keyTerms.map((term, index) => {
                  const IconComponent = term.icon;
                  return (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <IconComponent className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{term.title}</h3>
                        <p className="text-sm text-gray-600">{term.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Important:</strong> Please read these Terms carefully. They contain important information 
                  about your rights and obligations, including mandatory arbitration provisions and limitations on liability.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        );

      case "account-agreement":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Account Agreement</h2>
              <p className="text-gray-600 mb-6">
                This section outlines the terms and conditions for opening and maintaining accounts with 
                Prime Edge Finance Bank, including eligibility requirements and account features.
              </p>

              <div className="space-y-6">
                {accountTypes.map((account, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">{account.type}</CardTitle>
                      <p className="text-gray-600">{account.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Requirements</h4>
                          <ul className="space-y-2">
                            {account.requirements.map((req, reqIndex) => (
                              <li key={reqIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-3">Features</h4>
                          <ul className="space-y-2">
                            {account.features.map((feature, featureIndex) => (
                              <li key={featureIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 flex-shrink-0"></span>
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Alert className="bg-green-50 border-green-200">
                  <Shield className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>FDIC Insured:</strong> All deposit accounts are insured up to $250,000 per depositor, 
                    per insured bank, for each account ownership category.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        );

      case "fees-charges":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Fees & Charges</h2>
              <p className="text-gray-600 mb-6">
                This section details all fees that may apply to your accounts and services. We believe in 
                transparent pricing and will always notify you of any fee changes in advance.
              </p>

              <div className="space-y-6">
                {feeCategories.map((category, index) => (
                  <Card key={index} className="border border-gray-200">
                    <CardHeader>
                      <CardTitle className="text-lg text-gray-900">{category.category}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 text-gray-900 font-medium">Service</th>
                              <th className="text-left py-2 text-gray-900 font-medium">Fee</th>
                              <th className="text-left py-2 text-gray-900 font-medium">Fee Waiver</th>
                            </tr>
                          </thead>
                          <tbody>
                            {category.fees.map((fee, feeIndex) => (
                              <tr key={feeIndex} className="border-b border-gray-100">
                                <td className="py-3 text-gray-700">{fee.service}</td>
                                <td className="py-3 text-gray-900 font-medium">{fee.amount}</td>
                                <td className="py-3 text-gray-600">{fee.waiver}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <strong>Fee Changes:</strong> We will provide at least 30 days' notice before implementing 
                    any fee increases or new fees on your existing accounts.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        );

      case "prohibited-uses":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Uses</h2>
              <p className="text-gray-600 mb-6">
                To maintain the security and integrity of our banking system, certain activities are strictly 
                prohibited. Violation of these terms may result in account closure and legal action.
              </p>

              <div className="space-y-6">
                {prohibitedActivities.map((category, index) => (
                  <Card key={index} className="border border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-lg text-red-900 flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {category.category}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {category.items.map((item, itemIndex) => (
                          <li key={itemIndex} className="text-sm text-red-800 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-red-600 rounded-full mt-2 flex-shrink-0"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}

                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800">
                    <strong>Consequences:</strong> Engaging in prohibited activities may result in immediate 
                    account closure, forfeiture of funds, reporting to authorities, and legal action for damages.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
          </div>
        );

      case "liability":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Limitation of Liability</h2>
              <p className="text-gray-600 mb-6">
                This section explains the limits of Prime Edge Finance Bank's liability and your responsibilities 
                as an account holder.
              </p>

              <div className="space-y-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Bank's Liability Limitations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Unauthorized Transactions</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          Your liability for unauthorized electronic fund transfers is limited as follows:
                        </p>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>• $50 if you notify us within 2 business days</li>
                          <li>• $500 if you notify us within 60 days</li>
                          <li>• Unlimited if you fail to notify us within 60 days</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">System Availability</h4>
                        <p className="text-sm text-gray-600">
                          We strive for 99.9% uptime but are not liable for losses due to system maintenance, 
                          internet outages, or circumstances beyond our control.
                        </p>
                      </div>

                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Third-Party Services</h4>
                        <p className="text-sm text-gray-600">
                          We are not responsible for services provided by third parties, including ATM networks, 
                          payment processors, or other financial institutions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Your Responsibilities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {[
                        "Maintain the confidentiality of your account information and passwords",
                        "Monitor your accounts regularly and report discrepancies immediately",
                        "Notify us promptly of address changes or lost/stolen cards",
                        "Use our services in accordance with these Terms and applicable laws",
                        "Maintain sufficient funds to cover transactions and fees"
                      ].map((responsibility, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                          {responsibility}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case "dispute-resolution":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Dispute Resolution</h2>
              <p className="text-gray-600 mb-6">
                We are committed to resolving disputes fairly and efficiently. This section outlines the 
                process for addressing concerns and resolving conflicts.
              </p>

              <div className="space-y-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Step 1: Direct Resolution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Most issues can be resolved quickly through direct communication with our customer service team.
                    </p>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-900">Phone</p>
                        <p className="text-sm text-gray-600">1-800-PRIME-EDGE</p>
                        <p className="text-xs text-gray-500">Available 24/7</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Mail className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-900">Email</p>
                        <p className="text-sm text-gray-600">disputes@primeedge.com</p>
                        <p className="text-xs text-gray-500">Response within 24 hours</p>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <Building className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                        <p className="font-medium text-gray-900">In Person</p>
                        <p className="text-sm text-gray-600">Visit any branch</p>
                        <p className="text-xs text-gray-500">Find locations online</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Step 2: Formal Complaint Process</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        If your concern is not resolved through direct communication, you may file a formal complaint:
                      </p>
                      <ol className="space-y-2">
                        {[
                          "Submit written complaint within 60 days of the incident",
                          "We will acknowledge receipt within 2 business days",
                          "Investigation will be completed within 10 business days",
                          "You will receive written resolution with explanation"
                        ].map((step, index) => (
                          <li key={index} className="text-sm text-gray-600 flex gap-3">
                            <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0">
                              {index + 1}
                            </span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900">Step 3: Arbitration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Alert className="bg-yellow-50 border-yellow-200 mb-4">
                      <Scale className="h-4 w-4 text-yellow-600" />
                      <AlertDescription className="text-yellow-800">
                        <strong>Mandatory Arbitration:</strong> By using our services, you agree that any disputes 
                        will be resolved through binding arbitration rather than court proceedings.
                      </AlertDescription>
                    </Alert>
                    <div className="space-y-3 text-sm text-gray-600">
                      <p>• Arbitration is conducted by the American Arbitration Association</p>
                      <p>• Each party pays their own attorney fees unless otherwise awarded</p>
                      <p>• Arbitration decisions are final and binding</p>
                      <p>• Class action lawsuits are not permitted</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        );

      case "contact":
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <p className="text-gray-600 mb-6">
                If you have questions about these Terms of Service or need assistance with your account, 
                please contact us using any of the methods below.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                      <Phone className="h-5 w-5" />
                      Customer Service
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900">General Support</p>
                        <p className="text-sm text-gray-600">1-800-PRIME-EDGE (1-800-774-6333)</p>
                        <p className="text-xs text-gray-500">Available 24/7</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Dispute Resolution</p>
                        <p className="text-sm text-gray-600">1-800-DISPUTES (1-800-347-7883)</p>
                        <p className="text-xs text-gray-500">Monday-Friday, 8AM-8PM ET</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 flex items-center gap-2">
                      <Mail className="h-5 w-5" />
                      Written Communication
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="font-medium text-gray-900">Legal Department</p>
                        <p className="text-sm text-gray-600">legal@primeedge.com</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Complaints</p>
                        <p className="text-sm text-gray-600">disputes@primeedge.com</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">General Inquiries</p>
                        <p className="text-sm text-gray-600">info@primeedge.com</p>
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
                      <p className="text-sm text-gray-600">Attention: Legal Department</p>
                      <p className="text-sm text-gray-600">1250 Broadway, Suite 3600</p>
                      <p className="text-sm text-gray-600">New York, NY 10001</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Regulatory Complaints:</strong> You may also file complaints with the Consumer Financial 
                  Protection Bureau (CFPB) at consumerfinance.gov or the Federal Deposit Insurance Corporation (FDIC).
                </AlertDescription>
              </Alert>
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
                Legal Agreement
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold mb-6">
                Terms of
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Service</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                These terms govern your relationship with Prime Edge Finance Bank and outline the rights 
                and responsibilities of both parties in our banking partnership.
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
                  Legal Questions
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
                  Clear terms and transparent banking relationships.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Legal</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Account Agreements</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Disclosures</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Compliance</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">FDIC Insurance</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Equal Housing Lender</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Member FDIC</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Regulatory Information</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Legal Contact</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    1-800-DISPUTES
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    legal@primeedge.com
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