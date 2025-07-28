import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";
import { 
  Building, 
  Users, 
  Globe,
  Award,
  TrendingUp,
  Shield,
  Heart,
  Target,
  Eye,
  Lightbulb,
  Handshake,
  ArrowRight,
  Phone,
  Mail,
  MapPin,
  Calendar,
  DollarSign,
  Briefcase,
  GraduationCap,
  Leaf,
  Star,
  Clock,
  CheckCircle,
  FileText,
  BarChart3,
  Smartphone
} from "lucide-react";

export default function About() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("story");

  // Using Star as Trophy icon since Trophy doesn't exist in lucide-react
  const Trophy = Star;

  const companyStats = [
    { number: "$15B+", label: "Assets Under Management", icon: DollarSign },
    { number: "500K+", label: "Satisfied Customers", icon: Users },
    { number: "25+", label: "Years of Excellence", icon: Calendar },
    { number: "150+", label: "Branch Locations", icon: Building }
  ];

  const leadership = [
    {
      name: "Sarah Chen",
      position: "Chief Executive Officer",
      bio: "Former VP at Goldman Sachs with over 20 years in financial services. Leading Prime Edge's digital transformation and growth strategy.",
      education: "MBA Harvard Business School, BS Economics MIT",
      image: "https://images.unsplash.com/photo-1494790108755-2616b332e234?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&h=387"
    },
    {
      name: "Michael Rodriguez",
      position: "Chief Technology Officer", 
      bio: "Former Tech Lead at Stripe, pioneering fintech innovation. Architecting Prime Edge's award-winning digital banking platform.",
      education: "MS Computer Science Stanford, BS Engineering UC Berkeley",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&h=387"
    },
    {
      name: "Dr. Emily Watson",
      position: "Chief Risk Officer",
      bio: "PhD in Financial Economics, former Federal Reserve analyst. Ensuring Prime Edge maintains the highest standards of risk management.",
      education: "PhD Financial Economics Yale, MS Statistics Columbia",
      image: "https://images.unsplash.com/photo-1559570114-36bc719a72d8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&h=387"
    },
    {
      name: "James Thompson",
      position: "Chief Financial Officer",
      bio: "CPA with extensive experience at JPMorgan Chase. Leading Prime Edge's financial strategy and investor relations.",
      education: "MBA Wharton, BS Accounting University of Pennsylvania",
      image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=387&h=387"
    }
  ];

  const values = [
    {
      icon: Shield,
      title: "Trust & Security",
      description: "We protect your financial future with unwavering integrity and industry-leading security measures."
    },
    {
      icon: Lightbulb,
      title: "Innovation",
      description: "Continuously evolving our technology and services to meet the changing needs of modern banking."
    },
    {
      icon: Heart,
      title: "Customer First",
      description: "Every decision we make is guided by what's best for our customers and their financial well-being."
    },
    {
      icon: Handshake,
      title: "Partnership",
      description: "Building lasting relationships through transparent communication and exceptional service."
    },
    {
      icon: Target,
      title: "Excellence",
      description: "Striving for the highest standards in everything we do, from technology to customer service."
    },
    {
      icon: Globe,
      title: "Accessibility",
      description: "Making quality banking services accessible to everyone, regardless of their financial background."
    }
  ];

  const timeline = [
    {
      year: "1999",
      title: "Foundation",
      description: "Prime Edge Finance Bank founded with a vision to revolutionize community banking."
    },
    {
      year: "2005",
      title: "Digital Pioneer",
      description: "Launched one of the industry's first comprehensive online banking platforms."
    },
    {
      year: "2010",
      title: "Mobile First",
      description: "Introduced award-winning mobile banking app, setting new industry standards."
    },
    {
      year: "2015",
      title: "Expansion",
      description: "Expanded to 50 locations across 12 states while maintaining personalized service."
    },
    {
      year: "2018",
      title: "AI Integration",
      description: "Implemented AI-powered fraud detection and personalized financial insights."
    },
    {
      year: "2020",
      title: "Digital Transformation",
      description: "Accelerated digital services adoption during pandemic, serving customers safely."
    },
    {
      year: "2022",
      title: "Sustainability",
      description: "Launched green banking initiatives and sustainable investment options."
    },
    {
      year: "2024",
      title: "Innovation Hub",
      description: "Opened fintech innovation center, partnering with startups to shape banking's future."
    }
  ];

  const awards = [
    {
      year: "2024",
      award: "Best Digital Bank",
      organization: "Banking Excellence Awards",
      icon: Trophy
    },
    {
      year: "2023", 
      award: "Top Customer Satisfaction",
      organization: "J.D. Power Banking Study",
      icon: Star
    },
    {
      year: "2023",
      award: "Innovation Leader",
      organization: "Fintech Industry Awards",
      icon: Lightbulb
    },
    {
      year: "2022",
      award: "Best Mobile App",
      organization: "Mobile Banking Awards",
      icon: Smartphone
    }
  ];

  const communityInitiatives = [
    {
      title: "Financial Literacy Program",
      description: "Free workshops and resources helping 10,000+ community members improve their financial knowledge.",
      impact: "10,000+ participants",
      icon: GraduationCap
    },
    {
      title: "Small Business Support", 
      description: "Dedicated lending programs and mentorship for local entrepreneurs and small businesses.",
      impact: "$50M+ in small business loans",
      icon: Briefcase
    },
    {
      title: "Environmental Initiative",
      description: "Carbon neutral operations and green lending programs supporting sustainable projects.",
      impact: "Net-zero carbon footprint",
      icon: Leaf
    },
    {
      title: "Community Investment",
      description: "Annual charitable giving and volunteer programs supporting local nonprofits and schools.",
      impact: "$2M+ donated annually",
      icon: Heart
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
                About Prime Edge
              </Badge>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
                Banking Built on
                <span className="bg-gradient-to-r from-prime-accent to-blue-400 bg-clip-text text-transparent"> Trust</span>
              </h1>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
                For over 25 years, Prime Edge Finance Bank has been at the forefront of banking innovation, 
                combining cutting-edge technology with personalized service to help our customers achieve their financial dreams.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-prime-accent hover:bg-blue-600 text-white px-8 py-4 text-lg"
                  onClick={() => setLocation("/register")}
                >
                  Join Prime Edge
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-gray-400 text-gray-300 hover:bg-white/10 px-8 py-4 text-lg"
                  onClick={() => setLocation("/support/contact-us")}
                >
                  Contact Us
                </Button>
              </div>
            </div>

            {/* Company Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {companyStats.map((stat, index) => {
                const IconComponent = stat.icon;
                return (
                  <div key={index} className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-prime-accent to-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="text-3xl font-bold text-prime-accent mb-2">{stat.number}</div>
                    <div className="text-gray-400 text-sm">{stat.label}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Content Tabs */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-12">
              <div className="flex justify-center">
                <div className="inline-flex bg-black/40 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                  <button
                    onClick={() => setActiveTab("story")}
                    className={`px-8 py-4 text-sm font-medium transition-all duration-500 relative overflow-hidden ${
                      activeTab === "story"
                        ? "bg-gradient-to-r from-prime-accent via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="relative z-10">Our Story</span>
                    {activeTab === "story" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-500/30 to-blue-400/20 animate-pulse" />
                    )}
                  </button>
                  <div className="w-px bg-white/10" />
                  <button
                    onClick={() => setActiveTab("leadership")}
                    className={`px-8 py-4 text-sm font-medium transition-all duration-500 relative overflow-hidden ${
                      activeTab === "leadership"
                        ? "bg-gradient-to-r from-prime-accent via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="relative z-10">Leadership</span>
                    {activeTab === "leadership" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-500/30 to-blue-400/20 animate-pulse" />
                    )}
                  </button>
                  <div className="w-px bg-white/10" />
                  <button
                    onClick={() => setActiveTab("values")}
                    className={`px-8 py-4 text-sm font-medium transition-all duration-500 relative overflow-hidden ${
                      activeTab === "values"
                        ? "bg-gradient-to-r from-prime-accent via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="relative z-10">Values</span>
                    {activeTab === "values" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-500/30 to-blue-400/20 animate-pulse" />
                    )}
                  </button>
                  <div className="w-px bg-white/10" />
                  <button
                    onClick={() => setActiveTab("community")}
                    className={`px-8 py-4 text-sm font-medium transition-all duration-500 relative overflow-hidden ${
                      activeTab === "community"
                        ? "bg-gradient-to-r from-prime-accent via-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="relative z-10">Community</span>
                    {activeTab === "community" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-blue-500/30 to-blue-400/20 animate-pulse" />
                    )}
                  </button>
                </div>
              </div>

              {/* Our Story Tab */}
              {activeTab === "story" && (
                <div className="space-y-12">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Our Journey</h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      From a small community bank to a leading digital financial institution, 
                      our story is one of innovation, growth, and unwavering commitment to our customers.
                    </p>
                  </div>

                  <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                    <div>
                      <h3 className="text-2xl font-bold mb-6">Founded on Innovation</h3>
                      <p className="text-gray-300 mb-6">
                        Prime Edge Finance Bank was founded in 1999 with a simple but powerful vision: 
                        to combine the personal touch of community banking with the innovation and 
                        convenience of modern financial technology.
                      </p>
                      <p className="text-gray-300 mb-6">
                        Our founders recognized that the financial industry was on the cusp of a 
                        digital revolution, and they positioned Prime Edge to be at the forefront 
                        of that transformation while never losing sight of what matters most - 
                        our customers' financial success.
                      </p>
                      <div className="space-y-4">
                        {[
                          "First community bank to offer comprehensive online banking (2005)",
                          "Award-winning mobile app launched ahead of major competitors (2010)", 
                          "AI-powered financial insights and fraud protection (2018)",
                          "Carbon-neutral operations and sustainable banking initiatives (2022)"
                        ].map((achievement, index) => (
                          <div key={index} className="flex items-start gap-3">
                            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
                            <span className="text-gray-300 text-sm">{achievement}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="relative">
                      <img 
                        src="https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1200&h=800" 
                        alt="Prime Edge Bank headquarters" 
                        className="rounded-2xl shadow-2xl w-full" 
                      />
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h3 className="text-2xl font-bold text-center mb-12">Milestones & Achievements</h3>
                    <div className="space-y-8">
                      {timeline.map((item, index) => (
                        <div key={index} className="flex items-start gap-6">
                          <div className="flex-shrink-0">
                            <div className="w-12 h-12 bg-gradient-to-br from-prime-accent to-blue-400 rounded-full flex items-center justify-center text-white font-bold">
                              {item.year.slice(-2)}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <h4 className="text-lg font-semibold text-white">{item.title}</h4>
                              <Badge variant="secondary" className="text-xs">
                                {item.year}
                              </Badge>
                            </div>
                            <p className="text-gray-300 text-sm">{item.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Leadership Tab */}
              {activeTab === "leadership" && (
                <div className="space-y-12">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Executive Leadership</h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      Our experienced leadership team brings together decades of expertise from 
                      top financial institutions and technology companies.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {leadership.map((leader, index) => (
                      <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                        <CardContent className="p-8">
                          <div className="flex items-start gap-6">
                            <img 
                              src={leader.image}
                              alt={leader.name}
                              className="w-20 h-20 rounded-2xl object-cover"
                            />
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-1">{leader.name}</h3>
                              <p className="text-blue-600 font-medium text-sm mb-3">{leader.position}</p>
                              <p className="text-gray-600 text-sm mb-4 line-clamp-3">{leader.bio}</p>
                              <div className="p-3 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-600">
                                  <strong>Education:</strong> {leader.education}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Awards Section */}
                  <div className="mt-16">
                    <h3 className="text-2xl font-bold text-center mb-8">Awards & Recognition</h3>
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {awards.map((award, index) => {
                        const IconComponent = award.icon;
                        return (
                          <div key={index} className="text-center p-6 bg-white/5 rounded-2xl border border-white/10">
                            <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <IconComponent className="h-6 w-6 text-yellow-900" />
                            </div>
                            <div className="text-sm font-bold text-prime-accent mb-1">{award.year}</div>
                            <div className="text-white font-semibold mb-1">{award.award}</div>
                            <div className="text-gray-400 text-xs">{award.organization}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Values Tab */}
              {activeTab === "values" && (
                <div className="space-y-12">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Our Core Values</h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      These principles guide every decision we make and every interaction we have 
                      with our customers, employees, and communities.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {values.map((value, index) => {
                      const IconComponent = value.icon;
                      return (
                        <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl hover:shadow-2xl transition-all duration-300">
                          <CardContent className="p-8 text-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                              <IconComponent className="h-8 w-8 text-white" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">{value.title}</h3>
                            <p className="text-gray-600 text-sm leading-relaxed">{value.description}</p>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Vision & Mission */}
                  <div className="grid md:grid-cols-2 gap-8 mt-16">
                    <Card className="bg-gradient-to-br from-prime-accent to-blue-500 border-0 text-white">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                          <Eye className="h-8 w-8" />
                          <h3 className="text-2xl font-bold">Our Vision</h3>
                        </div>
                        <p className="text-blue-100 leading-relaxed">
                          To be the most trusted and innovative financial partner, empowering individuals 
                          and businesses to achieve their financial goals through exceptional service and 
                          cutting-edge technology.
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-500 to-green-600 border-0 text-white">
                      <CardContent className="p-8">
                        <div className="flex items-center gap-4 mb-6">
                          <Target className="h-8 w-8" />
                          <h3 className="text-2xl font-bold">Our Mission</h3>
                        </div>
                        <p className="text-green-100 leading-relaxed">
                          To provide accessible, secure, and innovative banking solutions that strengthen 
                          our communities and help our customers build lasting financial success.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}

              {/* Community Tab */}
              {activeTab === "community" && (
                <div className="space-y-12">
                  <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold mb-4">Community Impact</h2>
                    <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                      We believe in giving back to the communities that have supported our growth. 
                      Our initiatives focus on financial education, small business support, and environmental sustainability.
                    </p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-8">
                    {communityInitiatives.map((initiative, index) => {
                      const IconComponent = initiative.icon;
                      return (
                        <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
                          <CardContent className="p-8">
                            <div className="flex items-start gap-6">
                              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                                <IconComponent className="h-6 w-6 text-white" />
                              </div>
                              <div className="flex-1">
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{initiative.title}</h3>
                                <p className="text-gray-600 text-sm mb-4">{initiative.description}</p>
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-100 text-green-700 border-green-200">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    {initiative.impact}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>

                  {/* Community Stats */}
                  <div className="bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl p-8 border border-white/10">
                    <h3 className="text-2xl font-bold text-center mb-8">Community Impact by Numbers</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                      {[
                        { number: "10,000+", label: "People Educated" },
                        { number: "$50M+", label: "Small Business Loans" },
                        { number: "Net-Zero", label: "Carbon Footprint" },
                        { number: "$2M+", label: "Annual Donations" }
                      ].map((stat, index) => (
                        <div key={index}>
                          <div className="text-2xl font-bold text-prime-accent mb-2">{stat.number}</div>
                          <div className="text-gray-300 text-sm">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <Card className="bg-gradient-to-r from-prime-accent to-blue-500 border-0 shadow-2xl">
              <CardContent className="p-16">
                <h2 className="text-4xl font-bold text-white mb-6">
                  Ready to Bank with Purpose?
                </h2>
                <p className="text-blue-100 text-xl mb-8 max-w-2xl mx-auto">
                  Join the Prime Edge family and experience banking that puts your financial success 
                  and community impact at the center of everything we do.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="bg-white text-prime-accent hover:bg-gray-100 px-8 py-4 text-lg font-semibold"
                    onClick={() => setLocation("/register")}
                  >
                    Open Your Account
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="border-white text-white hover:bg-white/10 px-8 py-4 text-lg"
                    onClick={() => setLocation("/support/contact-us")}
                  >
                    Visit a Branch
                  </Button>
                </div>
                <div className="flex items-center justify-center gap-8 mt-8 text-blue-100">
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm">FDIC Insured</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4" />
                    <span className="text-sm">Award-winning Service</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    <span className="text-sm">Community Focused</span>
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
                  Banking built on trust, innovation, and community impact.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">About</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Our Story</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Leadership Team</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Press Center</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Community</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Financial Education</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Small Business Support</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Sustainability</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Community Investment</a></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-4">Contact</h3>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    1-800-PRIME-EDGE
                  </li>
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    info@primeedge.com
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    New York, NY
                  </li>
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