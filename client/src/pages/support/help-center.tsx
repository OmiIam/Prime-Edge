import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import Logo from "@/components/logo";
import { 
  Search, 
  HelpCircle, 
  CreditCard, 
  Shield, 
  Smartphone, 
  DollarSign,
  FileText,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Star,
  Play,
  BookOpen,
  TrendingUp,
  Users
} from "lucide-react";

export default function HelpCenter() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = [
    { id: "all", name: "All Topics", icon: HelpCircle, count: 156 },
    { id: "accounts", name: "Accounts", icon: Users, count: 45 },
    { id: "cards", name: "Cards & Payments", icon: CreditCard, count: 38 },
    { id: "security", name: "Security", icon: Shield, count: 24 },
    { id: "mobile", name: "Mobile App", icon: Smartphone, count: 32 },
    { id: "transfers", name: "Transfers", icon: DollarSign, count: 17 }
  ];

  const popularArticles = [
    {
      id: 1,
      title: "How to reset your online banking password",
      category: "Security",
      views: "12.5K views",
      rating: 4.8,
      readTime: "2 min read",
      updated: "2 days ago"
    },
    {
      id: 2,
      title: "Setting up mobile check deposit",
      category: "Mobile App", 
      views: "8.9K views",
      rating: 4.9,
      readTime: "3 min read",
      updated: "1 week ago"
    },
    {
      id: 3,
      title: "Understanding wire transfer fees",
      category: "Transfers",
      views: "6.2K views", 
      rating: 4.6,
      readTime: "4 min read",
      updated: "3 days ago"
    },
    {
      id: 4,
      title: "How to dispute a credit card charge",
      category: "Cards & Payments",
      views: "5.8K views",
      rating: 4.7,
      readTime: "5 min read", 
      updated: "1 week ago"
    },
    {
      id: 5,
      title: "Opening a savings account online",
      category: "Accounts",
      views: "4.3K views",
      rating: 4.9,
      readTime: "3 min read",
      updated: "5 days ago"
    },
    {
      id: 6,
      title: "Enable two-factor authentication",
      category: "Security",
      views: "3.7K views",
      rating: 4.8,
      readTime: "3 min read",
      updated: "1 week ago"
    }
  ];

  const videoTutorials = [
    {
      id: 1,
      title: "Getting Started with Prime Edge Banking",
      duration: "3:24",
      thumbnail: "tutorial-1",
      views: "15.2K"
    },
    {
      id: 2,
      title: "Mobile App Complete Walkthrough",
      duration: "5:18",
      thumbnail: "tutorial-2", 
      views: "12.8K"
    },
    {
      id: 3,
      title: "Setting Up Automatic Savings",
      duration: "2:47",
      thumbnail: "tutorial-3",
      views: "9.5K"
    }
  ];

  const contactMethods = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      availability: "Available 24/7",
      icon: MessageCircle,
      action: "Start Chat",
      color: "blue"
    },
    {
      title: "Phone Support",
      description: "Speak directly with a banking specialist",
      availability: "+1 (938) 271-8041",
      icon: Phone,
      action: "Call Now",
      color: "green"
    },
    {
      title: "Email Support",
      description: "Send us your questions via email",
      availability: "Response within 2 hours",
      icon: Mail,
      action: "Send Email",
      color: "purple"
    }
  ];

  const filteredArticles = selectedCategory === "all" 
    ? popularArticles 
    : popularArticles.filter(article => 
        article.category.toLowerCase().includes(selectedCategory)
      );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
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
                Get Help
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-12">
        {/* Hero Section */}
        <section className="py-16">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8">
              <Badge className="mb-4 bg-blue-500/20 text-blue-300 border-blue-400/30">
                Help Center
              </Badge>
              <h1 className="text-4xl sm:text-5xl font-bold text-white mb-6">
                How can we help you today?
              </h1>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
                Find answers to your questions, step-by-step guides, and get support from our expert team.
              </p>
              
              {/* Search Bar */}
              <div className="relative max-w-2xl mx-auto">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <Input
                  type="text"
                  placeholder="Search for help articles, tutorials, or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 pr-4 py-4 text-lg bg-white/95 backdrop-blur-sm border-white/20 focus:border-blue-400 rounded-xl"
                />
                <Button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 hover:bg-blue-700"
                  size="sm"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Categories */}
        <section className="mb-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-white mb-8 text-center">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => {
                const IconComponent = category.icon;
                const isSelected = selectedCategory === category.id;
                
                return (
                  <Card 
                    key={category.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-400 shadow-lg' 
                        : 'bg-white/95 backdrop-blur-sm border-white/20 hover:bg-white'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                        isSelected 
                          ? 'bg-white/20' 
                          : 'bg-gradient-to-br from-blue-500 to-blue-600'
                      }`}>
                        <IconComponent className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-white'}`} />
                      </div>
                      <h3 className={`font-semibold mb-1 ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                        {category.name}
                      </h3>
                      <p className={`text-sm ${isSelected ? 'text-blue-100' : 'text-gray-600'}`}>
                        {category.count} articles
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Popular Articles */}
        <section className="mb-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">
                {selectedCategory === "all" ? "Popular Articles" : `${categories.find(c => c.id === selectedCategory)?.name} Articles`}
              </h2>
              <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                View All Articles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article) => (
                <Card key={article.id} className="bg-white/95 backdrop-blur-sm border-white/20 hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                        {article.category}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                        <span className="text-sm text-gray-600">{article.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
                      {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {article.readTime}
                      </span>
                      <span>{article.views}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Updated {article.updated}</span>
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                        Read Article
                        <ArrowRight className="ml-1 h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Video Tutorials */}
        <section className="mb-12">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-white">Video Tutorials</h2>
              <Button variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                <Play className="mr-2 h-4 w-4" />
                View All Videos
              </Button>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {videoTutorials.map((video) => (
                <Card key={video.id} className="bg-white/95 backdrop-blur-sm border-white/20 hover:bg-white hover:shadow-lg transition-all duration-300 cursor-pointer group">
                  <div className="relative">
                    <div className="aspect-video bg-gradient-to-br from-blue-400 to-blue-600 rounded-t-lg flex items-center justify-center">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <Play className="h-8 w-8 text-white ml-1" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 right-2 bg-black/70 text-white text-sm px-2 py-1 rounded">
                      {video.duration}
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {video.title}
                    </h3>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{video.views} views</span>
                      <Button size="sm" variant="ghost" className="text-blue-600 hover:text-blue-700 p-0">
                        Watch Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Support */}
        <section className="mb-12">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-4">Still Need Help?</h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Our friendly support team is here to help you 24/7. Choose the contact method that works best for you.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {contactMethods.map((method, index) => {
                const IconComponent = method.icon;
                const colorClasses = {
                  blue: "from-blue-500 to-blue-600",
                  green: "from-green-500 to-green-600",
                  purple: "from-purple-500 to-purple-600"
                };

                return (
                  <Card key={index} className="bg-white/95 backdrop-blur-sm border-white/20 hover:bg-white hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 bg-gradient-to-br ${colorClasses[method.color as keyof typeof colorClasses]} rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <IconComponent className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {method.title}
                      </h3>
                      <p className="text-gray-600 mb-3">
                        {method.description}
                      </p>
                      <p className="text-sm font-medium text-gray-700 mb-4">
                        {method.availability}
                      </p>
                      <Button 
                        className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        onClick={() => setLocation("/support/contact-us")}
                      >
                        {method.action}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section>
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-r from-blue-600 to-blue-500 border-0 shadow-2xl">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Our Support Stats
                  </h2>
                  <p className="text-blue-100">
                    We're proud of our customer support performance
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { number: "< 30s", label: "Average Response Time" },
                    { number: "98.5%", label: "Customer Satisfaction" },
                    { number: "24/7", label: "Support Availability" },
                    { number: "156", label: "Help Articles" }
                  ].map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="text-2xl font-bold text-white mb-1">{stat.number}</div>
                      <div className="text-sm text-blue-100">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}