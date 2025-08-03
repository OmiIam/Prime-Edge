import { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import {
  HelpCircle,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowLeft,
  ExternalLink,
  Users,
  Book,
  FileText,
  Headphones,
  Shield,
  Settings as SettingsIcon,
  Star,
  Send
} from "lucide-react";

interface SupportSettings {
  id: string;
  userId: string;
  preferredContactMethod: 'EMAIL' | 'CHAT' | 'PHONE';
  defaultIssueCategory: string;
  allowMarketing: boolean;
  timezone: string;
  language: string;
  availabilityHours: string;
  prioritySupport: boolean;
  createdAt: string;
  updatedAt: string;
}

interface SupportTicket {
  id: string;
  userId: string;
  subject: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  description: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignedTo?: string;
  lastResponse?: string;
  responseCount: number;
}

const issueCategories = [
  { value: 'account', label: 'Account & Login Issues' },
  { value: 'transactions', label: 'Transactions & Payments' },
  { value: 'cards', label: 'Cards & ATM' },
  { value: 'security', label: 'Security & Fraud' },
  { value: 'technical', label: 'Technical Support' },
  { value: 'billing', label: 'Billing & Fees' },
  { value: 'general', label: 'General Inquiry' }
];

const contactMethods = [
  { 
    value: 'EMAIL', 
    label: 'Email Support',
    description: 'Get help via email (24-48 hour response)',
    icon: Mail,
    available: '24/7'
  },
  { 
    value: 'CHAT', 
    label: 'Live Chat',
    description: 'Chat with support agents in real-time',
    icon: MessageCircle,
    available: '8AM-8PM EST'
  },
  { 
    value: 'PHONE', 
    label: 'Phone Support',
    description: 'Speak directly with our support team',
    icon: Phone,
    available: '9AM-6PM EST'
  }
];

export default function HelpSupportSettings() {
  const authState = authManager.getState();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('settings');
  const [ticketFilter, setTicketFilter] = useState('all');

  if (!authState.isAuthenticated || !authState.user) {
    setLocation('/login');
    return null;
  }

  // Fetch support settings
  const { data: settingsData, isLoading: settingsLoading } = useQuery({
    queryKey: ['/api/user/support/settings'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/user/support/settings', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch support settings');
      }
      return response.json();
    }
  });

  // Fetch support tickets
  const { data: ticketsData, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/user/support/tickets'],
    enabled: authState.isAuthenticated,
    queryFn: async () => {
      const response = await fetch('/api/user/support/tickets', {
        headers: authManager.getAuthHeader()
      });
      if (!response.ok) {
        throw new Error('Failed to fetch support tickets');
      }
      return response.json();
    }
  });

  const supportSettings: SupportSettings = settingsData?.settings || {} as SupportSettings;
  const supportTickets: SupportTicket[] = ticketsData?.tickets || [];

  // Update support settings
  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: Partial<SupportSettings>) => {
      const response = await fetch('/api/user/support/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...authManager.getAuthHeader()
        },
        body: JSON.stringify(newSettings),
      });
      if (!response.ok) throw new Error('Failed to update support settings');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/support/settings'] });
    }
  });

  const handleSettingChange = (key: keyof SupportSettings, value: any) => {
    updateSettingsMutation.mutate({ [key]: value });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Open</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">In Progress</Badge>;
      case 'RESOLVED':
        return <Badge className="bg-green-100 text-green-700 border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <Badge className="bg-red-100 text-red-700 border-red-200">Urgent</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-700 border-orange-200">High</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Medium</Badge>;
      case 'LOW':
        return <Badge className="bg-gray-100 text-gray-700 border-gray-200">Low</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const filteredTickets = supportTickets.filter(ticket => {
    if (ticketFilter === 'all') return true;
    return ticket.status === ticketFilter.toUpperCase();
  });

  const isLoading = settingsLoading || ticketsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <Navbar user={authState.user} />
        <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-center h-64">
              <div className="text-white">Loading support settings...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user} />
      
      <div className="pt-20 px-3 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation('/settings')}
                className="text-blue-200 hover:text-white hover:bg-white/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Settings
              </Button>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-2">Help & Support</h1>
            <p className="text-blue-200">Manage your support preferences and view help resources</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-1">
              <TabsTrigger value="settings" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs sm:text-sm">
                <SettingsIcon className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Settings</span>
              </TabsTrigger>
              <TabsTrigger value="tickets" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs sm:text-sm">
                <Headphones className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Tickets</span>
              </TabsTrigger>
              <TabsTrigger value="resources" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs sm:text-sm">
                <Book className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Resources</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-xs sm:text-sm">
                <MessageCircle className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">Contact</span>
              </TabsTrigger>
            </TabsList>

            {/* Settings Tab */}
            <TabsContent value="settings">
              <div className="space-y-6">
                {/* Support Preferences */}
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <SettingsIcon className="h-5 w-5 text-blue-400" />
                      Support Preferences
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-white font-medium">Preferred Contact Method</Label>
                        <Select
                          value={supportSettings.preferredContactMethod || 'EMAIL'}
                          onValueChange={(value) => handleSettingChange('preferredContactMethod', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="EMAIL">Email Support</SelectItem>
                            <SelectItem value="CHAT">Live Chat</SelectItem>
                            <SelectItem value="PHONE">Phone Support</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-medium">Default Issue Category</Label>
                        <Select
                          value={supportSettings.defaultIssueCategory || 'general'}
                          onValueChange={(value) => handleSettingChange('defaultIssueCategory', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {issueCategories.map(category => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-medium">Preferred Language</Label>
                        <Select
                          value={supportSettings.language || 'en'}
                          onValueChange={(value) => handleSettingChange('language', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Spanish</SelectItem>
                            <SelectItem value="fr">French</SelectItem>
                            <SelectItem value="de">German</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white font-medium">Availability Hours</Label>
                        <Select
                          value={supportSettings.availabilityHours || 'business'}
                          onValueChange={(value) => handleSettingChange('availabilityHours', value)}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="business">Business Hours (9AM-6PM EST)</SelectItem>
                            <SelectItem value="extended">Extended Hours (8AM-8PM EST)</SelectItem>
                            <SelectItem value="anytime">Anytime</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Separator className="bg-white/10" />

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label className="text-white font-medium block">Marketing Communications</Label>
                          <p className="text-sm text-gray-400 mt-1">Receive product updates and support tips</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={supportSettings.allowMarketing !== false}
                            onChange={(e) => handleSettingChange('allowMarketing', e.target.checked)}
                            className="rounded border-white/20 bg-white/10"
                          />
                        </div>
                      </div>

                      {authState.user.role === 'ADMIN' && (
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-white font-medium block">Priority Support</Label>
                            <p className="text-sm text-gray-400 mt-1">Get faster response times and dedicated support</p>
                          </div>
                          <Badge className="bg-gold-100 text-gold-700 border-gold-200">
                            <Star className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Account Status */}
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-400" />
                      Support Account Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid sm:grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {supportTickets.filter(t => t.status === 'OPEN').length}
                        </div>
                        <p className="text-sm text-gray-400">Open Tickets</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {supportTickets.filter(t => t.status === 'RESOLVED').length}
                        </div>
                        <p className="text-sm text-gray-400">Resolved Issues</p>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-white mb-1">
                          {supportSettings.prioritySupport ? 'Premium' : 'Standard'}
                        </div>
                        <p className="text-sm text-gray-400">Support Level</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Support Tickets Tab */}
            <TabsContent value="tickets">
              <Card className="card-gradient border-white/10">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Headphones className="h-5 w-5 text-purple-400" />
                      Support Tickets
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select value={ticketFilter} onValueChange={setTicketFilter}>
                        <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        <Send className="h-4 w-4 mr-2" />
                        New Ticket
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {filteredTickets.map((ticket) => (
                      <div key={ticket.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-white mb-1">{ticket.subject}</h3>
                            <p className="text-sm text-gray-400 mb-2">{ticket.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>Created {new Date(ticket.createdAt).toLocaleDateString()}</span>
                              <span>Updated {new Date(ticket.updatedAt).toLocaleDateString()}</span>
                              <span>{ticket.responseCount} responses</span>
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 items-end">
                            {getStatusBadge(ticket.status)}
                            {getPriorityBadge(ticket.priority)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-gray-300">
                            {issueCategories.find(cat => cat.value === ticket.category)?.label || ticket.category}
                          </Badge>
                          <Button size="sm" variant="outline" className="border-white/20 text-gray-300 hover:bg-white/10">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}

                    {filteredTickets.length === 0 && (
                      <div className="text-center py-8">
                        <Headphones className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-400">No support tickets found</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Resources Tab */}
            <TabsContent value="resources">
              <div className="grid sm:grid-cols-2 gap-6">
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Book className="h-5 w-5 text-orange-400" />
                      Help Center
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Getting Started Guide
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Account Management
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Security Best Practices
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Mobile App Guide
                    </Button>
                  </CardContent>
                </Card>

                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-red-400" />
                      Security & Safety
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Fraud Prevention
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Report Suspicious Activity
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Account Security
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Privacy Policy
                    </Button>
                  </CardContent>
                </Card>

                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-400" />
                      Tutorials & FAQs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Video Tutorials
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Frequently Asked Questions
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Troubleshooting Guide
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Feature Updates
                    </Button>
                  </CardContent>
                </Card>

                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="h-5 w-5 text-green-400" />
                      Community
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Community Forum
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      User Feedback
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Feature Requests
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-white/20 text-gray-300 hover:bg-white/10">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Beta Program
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Contact Tab */}
            <TabsContent value="contact">
              <div className="space-y-6">
                <Card className="card-gradient border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MessageCircle className="h-5 w-5 text-blue-400" />
                      Contact Methods
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      {contactMethods.map((method) => {
                        const IconComponent = method.icon;
                        const isPreferred = supportSettings.preferredContactMethod === method.value;
                        
                        return (
                          <div 
                            key={method.value} 
                            className={`p-4 rounded-lg border ${
                              isPreferred 
                                ? 'bg-blue-500/20 border-blue-400/30' 
                                : 'bg-white/5 border-white/10'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                  isPreferred ? 'bg-blue-500/30' : 'bg-white/10'
                                }`}>
                                  <IconComponent className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <h3 className="font-semibold text-white flex items-center gap-2">
                                    {method.label}
                                    {isPreferred && (
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                                        <Star className="h-3 w-3 mr-1" />
                                        Preferred
                                      </Badge>
                                    )}
                                  </h3>
                                  <p className="text-sm text-gray-400">{method.description}</p>
                                  <p className="text-xs text-gray-500 mt-1">Available: {method.available}</p>
                                </div>
                              </div>
                              <Button 
                                className={
                                  isPreferred 
                                    ? 'bg-blue-600 hover:bg-blue-700' 
                                    : 'bg-gray-600 hover:bg-gray-700'
                                }
                              >
                                {isPreferred ? 'Contact Now' : 'Use This Method'}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                <Alert className="bg-blue-950/50 border-blue-500/30">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-200">
                    <strong>Response Times:</strong> Email (24-48 hours), Chat (Real-time during business hours), Phone (Immediate during business hours)
                  </AlertDescription>
                </Alert>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}