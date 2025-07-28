import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Logo from "@/components/logo";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  Mail, 
  MapPin, 
  Clock,
  MessageCircle,
  Send,
  CheckCircle,
  AlertTriangle,
  User,
  CreditCard,
  Building,
  HeadphonesIcon,
  Users,
  Shield,
  Globe,
  Calendar,
  FileText,
  ArrowRight,
  ExternalLink
} from "lucide-react";

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  subject: string;
  category: string;
  message: string;
  accountNumber?: string;
}

export default function ContactUs() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formSubmitted, setFormSubmitted] = useState(false);
  
  const [form, setForm] = useState<ContactForm>({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "",
    message: "",
    accountNumber: ""
  });

  const contactMethods = [
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak with our customer service team",
      details: [
        { label: "General Support", value: "1-800-PRIME-EDGE" },
        { label: "Business Banking", value: "1-800-BUSINESS" },
        { label: "Investment Services", value: "1-800-INVEST-NOW" },
        { label: "Technical Support", value: "1-800-TECH-HELP" }
      ],
      availability: "Available 24/7",
      responseTime: "Immediate",
      color: "blue"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Get instant help from our chat specialists",
      details: [
        { label: "Average wait time", value: "< 2 minutes" },
        { label: "Resolution rate", value: "94%" },
        { label: "Languages", value: "English, Spanish" },
        { label: "Availability", value: "24/7" }
      ],
      availability: "Available 24/7",
      responseTime: "< 2 minutes",
      color: "green"
    },
    {
      icon: Mail,
      title: "Email Support",
      description: "Send us a detailed message about your inquiry",
      details: [
        { label: "General inquiries", value: "support@primeedge.com" },
        { label: "Business support", value: "business@primeedge.com" },
        { label: "Technical issues", value: "tech@primeedge.com" },
        { label: "Complaints", value: "complaints@primeedge.com" }
      ],
      availability: "Monitored 24/7",
      responseTime: "Within 24 hours",
      color: "purple"
    },
    {
      icon: MapPin,
      title: "Branch Locations",
      description: "Visit us in person at one of our locations",
      details: [
        { label: "Total branches", value: "150+ locations" },
        { label: "ATM network", value: "2,500+ ATMs" },
        { label: "International", value: "25 countries" },
        { label: "Services", value: "Full banking services" }
      ],
      availability: "Mon-Fri 9AM-6PM, Sat 9AM-2PM",
      responseTime: "Walk-in or appointment",
      color: "orange"
    }
  ];

  const categories = [
    { value: "general", label: "General Inquiry" },
    { value: "account", label: "Account Issues" },
    { value: "technical", label: "Technical Support" },
    { value: "business", label: "Business Banking" },
    { value: "investments", label: "Investment Services" },
    { value: "complaint", label: "File a Complaint" },
    { value: "feedback", label: "Feedback & Suggestions" }
  ];

  const officeLocations = [
    {
      city: "New York",
      address: "1250 Broadway, Suite 3600",
      zipCode: "New York, NY 10001",
      phone: "(212) 555-0123",
      services: ["Corporate Banking", "Wealth Management", "Investment Services"],
      hours: "Mon-Fri 8AM-7PM, Sat 9AM-3PM"
    },
    {
      city: "San Francisco", 
      address: "555 California Street, 50th Floor",
      zipCode: "San Francisco, CA 94104",
      phone: "(415) 555-0456",
      services: ["Business Banking", "Personal Banking", "Loans"],
      hours: "Mon-Fri 9AM-6PM, Sat 9AM-2PM"
    },
    {
      city: "Chicago",
      address: "233 South Wacker Drive, Suite 7800",
      zipCode: "Chicago, IL 60606", 
      phone: "(312) 555-0789",
      services: ["Corporate Banking", "Treasury Services", "Trade Finance"],
      hours: "Mon-Fri 8AM-6PM, Sat 10AM-2PM"
    },
    {
      city: "Los Angeles",
      address: "633 West 5th Street, 28th Floor",
      zipCode: "Los Angeles, CA 90071",
      phone: "(213) 555-0234",
      services: ["Personal Banking", "Business Banking", "Mortgage Services"],
      hours: "Mon-Fri 9AM-6PM, Sat 9AM-1PM"
    }
  ];

  const faqCategories = [
    {
      title: "Account Management",
      questions: [
        "How do I reset my online banking password?",
        "What are your account fees?",
        "How do I update my contact information?",
        "Can I open an account online?"
      ]
    },
    {
      title: "Digital Banking",
      questions: [
        "How do I set up mobile banking?",
        "Is mobile deposit available?",
        "What security features do you offer?",
        "How do I enable notifications?"
      ]
    },
    {
      title: "Loans & Credit",
      questions: [
        "What are current mortgage rates?",
        "How do I apply for a personal loan?", 
        "What credit score do I need?",
        "Can I pay my loan online?"
      ]
    }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.email || !form.subject || !form.category || !form.message) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      console.log('Contact form submitted:', form);
      
      setFormSubmitted(true);
      toast({
        title: "Message sent successfully",
        description: "We'll get back to you within 24 hours.",
      });
    } catch (error) {
      toast({
        title: "Failed to send message",
        description: "Please try again or contact us by phone.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
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
                Customer Support
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                We're Here to
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Help</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                Get the support you need, when you need it. Our dedicated customer service team 
                is available 24/7 to assist with all your banking needs.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg"
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Start Live Chat
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-400 text-gray-300 hover:bg-white/10 px-8 py-4 text-lg"
                >
                  <Phone className="mr-2 h-5 w-5" />
                  Call 1-800-PRIME-EDGE
                </Button>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              {[
                { number: "24/7", label: "Customer Support" },
                { number: "< 2min", label: "Average Response Time" },
                { number: "98%", label: "Customer Satisfaction" },
                { number: "150+", label: "Branch Locations" }
              ].map((stat, index) => (
                <div key={index}>
                  <div className="text-3xl font-bold text-prime-accent mb-2">{stat.number}</div>
                  <div className="text-gray-400 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-slate-900/50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Choose Your Preferred Contact Method</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Multiple ways to reach us, all designed to provide you with fast, effective support.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, index) => {
                const IconComponent = method.icon;
                const colorClasses = {
                  blue: "from-blue-500 to-blue-600",
                  green: "from-green-500 to-green-600",
                  purple: "from-purple-500 to-purple-600",
                  orange: "from-orange-500 to-orange-600"
                };

                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[method.color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <CardTitle className="text-xl font-bold text-gray-900 mb-2">
                        {method.title}
                      </CardTitle>
                      <p className="text-gray-600 text-sm mb-4">{method.description}</p>
                      <div className="space-y-1">
                        <Badge className="bg-green-100 text-green-700 text-xs">
                          {method.availability}
                        </Badge>
                        <p className="text-xs text-gray-500">{method.responseTime}</p>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {method.details.map((detail, detailIndex) => (
                          <div key={detailIndex} className="flex justify-between text-sm">
                            <span className="text-gray-600">{detail.label}:</span>
                            <span className="font-medium text-gray-900 text-right">{detail.value}</span>
                          </div>
                        ))}
                      </div>
                      <Button 
                        className="w-full mt-4 bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => {
                          if (method.title === "Live Chat") {
                            toast({
                              title: "Live Chat",
                              description: "Chat feature would open here in a real application.",
                            });
                          }
                        }}
                      >
                        {method.title === "Phone Support" && "Call Now"}
                        {method.title === "Live Chat" && "Start Chat"}
                        {method.title === "Email Support" && "Send Email"}
                        {method.title === "Branch Locations" && "Find Branch"}
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Contact Form & Office Locations */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12">
              {/* Contact Form */}
              <div>
                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Send className="h-6 w-6" />
                      Send Us a Message
                    </CardTitle>
                    <p className="text-gray-600">
                      Fill out the form below and we'll get back to you within 24 hours.
                    </p>
                  </CardHeader>
                  <CardContent>
                    {formSubmitted ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <CheckCircle className="h-8 w-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent Successfully!</h3>
                        <p className="text-gray-600 mb-6">
                          Thank you for contacting us. We've received your message and will respond within 24 hours.
                        </p>
                        <Button 
                          onClick={() => {
                            setFormSubmitted(false);
                            setForm({
                              name: "",
                              email: "",
                              phone: "",
                              subject: "",
                              category: "",
                              message: "",
                              accountNumber: ""
                            });
                          }}
                          variant="outline"
                        >
                          Send Another Message
                        </Button>
                      </div>
                    ) : (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="name" className="text-gray-700 font-medium">Full Name *</Label>
                            <Input
                              id="name"
                              value={form.name}
                              onChange={(e) => handleInputChange("name", e.target.value)}
                              placeholder="Enter your full name"
                              className="mt-1"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="email" className="text-gray-700 font-medium">Email Address *</Label>
                            <Input
                              id="email"
                              type="email"
                              value={form.email}
                              onChange={(e) => handleInputChange("email", e.target.value)}
                              placeholder="Enter your email"
                              className="mt-1"
                              required
                            />
                          </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="phone" className="text-gray-700 font-medium">Phone Number</Label>
                            <Input
                              id="phone"
                              type="tel"
                              value={form.phone}
                              onChange={(e) => handleInputChange("phone", e.target.value)}
                              placeholder="(555) 123-4567"
                              className="mt-1"
                            />
                          </div>
                          <div>
                            <Label htmlFor="category" className="text-gray-700 font-medium">Category *</Label>
                            <Select value={form.category} onValueChange={(value) => handleInputChange("category", value)}>
                              <SelectTrigger className="mt-1">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.value} value={category.value}>
                                    {category.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="subject" className="text-gray-700 font-medium">Subject *</Label>
                          <Input
                            id="subject"
                            value={form.subject}
                            onChange={(e) => handleInputChange("subject", e.target.value)}
                            placeholder="Brief description of your inquiry"
                            className="mt-1"
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="accountNumber" className="text-gray-700 font-medium">Account Number (Optional)</Label>
                          <Input
                            id="accountNumber"
                            value={form.accountNumber}
                            onChange={(e) => handleInputChange("accountNumber", e.target.value)}
                            placeholder="Your account number for faster service"
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label htmlFor="message" className="text-gray-700 font-medium">Message *</Label>
                          <Textarea
                            id="message"
                            value={form.message}
                            onChange={(e) => handleInputChange("message", e.target.value)}
                            placeholder="Please provide detailed information about your inquiry..."
                            className="mt-1 min-h-[120px]"
                            required
                          />
                        </div>

                        <Alert className="bg-blue-50 border-blue-200">
                          <AlertTriangle className="h-4 w-4 text-blue-600" />
                          <AlertDescription className="text-blue-800 text-sm">
                            For urgent matters or account security issues, please call us immediately at 1-800-PRIME-EDGE.
                          </AlertDescription>
                        </Alert>

                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                              Sending Message...
                            </>
                          ) : (
                            <>
                              <Send className="mr-2 h-4 w-4" />
                              Send Message
                            </>
                          )}
                        </Button>
                      </form>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Office Locations */}
              <div>
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">Visit Our Offices</h2>
                  <p className="text-gray-300">
                    Find a Prime Edge branch near you for in-person banking services.
                  </p>
                </div>

                <div className="space-y-6">
                  {officeLocations.map((location, index) => (
                    <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2">{location.city}</h3>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                {location.address}
                              </p>
                              <p className="ml-6">{location.zipCode}</p>
                              <p className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                {location.phone}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Directions
                          </Button>
                        </div>
                        
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2">Services Available:</p>
                          <div className="flex flex-wrap gap-2">
                            {location.services.map((service, serviceIndex) => (
                              <Badge key={serviceIndex} variant="secondary" className="text-xs">
                                {service}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="h-4 w-4" />
                          {location.hours}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl mt-6">
                  <CardContent className="p-6 text-center">
                    <Building className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-900 mb-2">Can't find a location near you?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Use our branch locator to find all 150+ locations nationwide.
                    </p>
                    <Button variant="outline" className="w-full">
                      <MapPin className="mr-2 h-4 w-4" />
                      Find All Branches
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900/50 to-transparent">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Quick answers to common questions. Can't find what you're looking for? Contact us directly.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {faqCategories.map((category, index) => (
                <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-bold text-gray-900">
                      {category.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {category.questions.map((question, qIndex) => (
                        <button
                          key={qIndex}
                          className="text-left p-3 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors w-full"
                          onClick={() => {
                            toast({
                              title: "FAQ",
                              description: "Detailed answer would be shown here in a real application.",
                            });
                          }}
                        >
                          <p className="text-sm text-gray-900 hover:text-blue-600 transition-colors">
                            {question}
                          </p>
                        </button>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4">
                      <FileText className="mr-2 h-4 w-4" />
                      View All FAQs
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gradient-to-r from-prime-accent to-blue-500 border-0 shadow-2xl">
              <CardContent className="p-16">
                <h2 className="text-4xl font-bold text-white mb-6">
                  Still Need Help?
                </h2>
                <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                  Our customer service team is standing by to assist you with any questions or concerns. 
                  We're committed to providing exceptional support every step of the way.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-prime-accent hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                  >
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Start Live Chat
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                  >
                    <Phone className="mr-2 h-5 w-5" />
                    Call 1-800-PRIME-EDGE
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 mt-8 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">Secure & Confidential</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">Expert Support Team</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">24/7 Availability</span>
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
                  Customer support that puts you first, available 24/7.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Contact Methods</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Phone Support</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Live Chat</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Email Support</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Branch Locations</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Resources</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Video Tutorials</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Security Center</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Download Forms</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Contact Info</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    1-800-PRIME-EDGE
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    support@primeedge.com
                  </li>
                  <li>Available 24/7 for your convenience</li>
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