import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Navbar from "@/components/navbar";
import { authManager } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { 
  Search,
  Filter,
  Download,
  Calendar as CalendarIcon,
  ArrowUpDown,
  Eye,
  Receipt,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  RefreshCw,
  FileText,
  CreditCard,
  Smartphone,
  Building,
  Coffee,
  Car,
  Home,
  ShoppingBag,
  Zap,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";

interface Transaction {
  id: string;
  type: 'CREDIT' | 'DEBIT';
  amount: number;
  description: string;
  category: string;
  merchant?: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  createdAt: Date;
  processedAt?: Date;
  accountNumber: string;
  referenceNumber: string;
  location?: string;
  tags: string[];
  recurring: boolean;
  disputeStatus?: 'none' | 'disputed' | 'resolved';
}

interface FilterState {
  search: string;
  dateFrom?: Date;
  dateTo?: Date;
  category: string;
  type: string;
  status: string;
  amountMin: string;
  amountMax: string;
}

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'Food & Dining': Coffee,
  'Transportation': Car,
  'Shopping': ShoppingBag,
  'Bills & Utilities': Zap,
  'Housing': Home,
  'Income': TrendingUp,
  'Transfer': CreditCard,
  'ATM': Building,
  'Mobile': Smartphone,
  'Other': FileText
};

export default function TransactionHistory() {
  const [, setLocation] = useLocation();
  const authState = authManager.getState();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'description'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    type: 'all',
    status: 'all',
    amountMin: '',
    amountMax: ''
  });

  // Mock transaction data - in real app would fetch from API
  useEffect(() => {
    const fetchTransactions = async () => {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTransactions: Transaction[] = [
        {
          id: 'tx_001',
          type: 'CREDIT',
          amount: 3200.00,
          description: 'Direct Deposit - Salary',
          category: 'Income',
          merchant: 'TechCorp Inc.',
          status: 'completed',
          createdAt: new Date('2024-07-26T09:00:00'),
          processedAt: new Date('2024-07-26T09:01:00'),
          accountNumber: '****1234',
          referenceNumber: 'DD240726001',
          tags: ['salary', 'monthly'],
          recurring: true,
          disputeStatus: 'none'
        },
        {
          id: 'tx_002',
          type: 'DEBIT',
          amount: 1850.00,
          description: 'Rent Payment',
          category: 'Housing',
          merchant: 'Sunset Apartments',
          status: 'completed',
          createdAt: new Date('2024-07-25T14:30:00'),
          processedAt: new Date('2024-07-25T14:31:00'),
          accountNumber: '****1234',
          referenceNumber: 'ACH240725003',
          location: 'San Francisco, CA',
          tags: ['rent', 'monthly'],
          recurring: true,
          disputeStatus: 'none'
        },
        {
          id: 'tx_003',
          type: 'DEBIT',
          amount: 125.67,
          description: 'Whole Foods Market',
          category: 'Food & Dining',
          merchant: 'Whole Foods Market',
          status: 'completed',
          createdAt: new Date('2024-07-24T18:45:00'),
          processedAt: new Date('2024-07-24T18:45:00'),
          accountNumber: '****1234',
          referenceNumber: 'POS240724892',
          location: 'San Francisco, CA',
          tags: ['groceries'],
          recurring: false,
          disputeStatus: 'none'
        },
        {
          id: 'tx_004',
          type: 'DEBIT',
          amount: 45.20,
          description: 'Shell Gas Station',
          category: 'Transportation',
          merchant: 'Shell',
          status: 'completed',
          createdAt: new Date('2024-07-23T16:15:00'),
          processedAt: new Date('2024-07-23T16:15:00'),
          accountNumber: '****1234',
          referenceNumber: 'POS240723445',
          location: 'San Francisco, CA',
          tags: ['gas', 'fuel'],
          recurring: false,
          disputeStatus: 'none'
        },
        {
          id: 'tx_005',
          type: 'DEBIT',
          amount: 2500.00,
          description: 'Transfer to Savings',
          category: 'Transfer',
          status: 'completed',
          createdAt: new Date('2024-07-22T10:00:00'),
          processedAt: new Date('2024-07-22T10:01:00'),
          accountNumber: '****5678',
          referenceNumber: 'TRF240722001',
          tags: ['savings', 'transfer'],
          recurring: false,
          disputeStatus: 'none'
        },
        {
          id: 'tx_006',
          type: 'DEBIT',
          amount: 89.99,
          description: 'Amazon Purchase',
          category: 'Shopping',
          merchant: 'Amazon.com',
          status: 'completed',
          createdAt: new Date('2024-07-21T20:33:00'),
          processedAt: new Date('2024-07-21T20:33:00'),
          accountNumber: '****1234',
          referenceNumber: 'AMZ240721556',
          tags: ['online', 'shopping'],
          recurring: false,
          disputeStatus: 'none'
        },
        {
          id: 'tx_007',
          type: 'DEBIT',
          amount: 250.00,
          description: 'PG&E Electric Bill',
          category: 'Bills & Utilities',
          merchant: 'PG&E',
          status: 'pending',
          createdAt: new Date('2024-07-21T08:00:00'),
          accountNumber: '****1234',
          referenceNumber: 'ACH240721002',
          tags: ['utilities', 'monthly'],
          recurring: true,
          disputeStatus: 'none'
        },
        {
          id: 'tx_008',
          type: 'DEBIT',
          amount: 12.50,
          description: 'Coffee Bean & Tea Leaf',
          category: 'Food & Dining',
          merchant: 'Coffee Bean & Tea Leaf',
          status: 'completed',
          createdAt: new Date('2024-07-20T08:30:00'),
          processedAt: new Date('2024-07-20T08:30:00'),
          accountNumber: '****1234',
          referenceNumber: 'POS240720123',
          location: 'San Francisco, CA',
          tags: ['coffee'],
          recurring: false,
          disputeStatus: 'none'
        }
      ];

      setTransactions(mockTransactions);
      setFilteredTransactions(mockTransactions);
      setIsLoading(false);
    };

    fetchTransactions();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...transactions];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.description.toLowerCase().includes(searchLower) ||
        tx.merchant?.toLowerCase().includes(searchLower) ||
        tx.category.toLowerCase().includes(searchLower) ||
        tx.referenceNumber.toLowerCase().includes(searchLower)
      );
    }

    // Date range filter
    if (filters.dateFrom && filters.dateTo) {
      filtered = filtered.filter(tx => 
        isWithinInterval(tx.createdAt, { start: filters.dateFrom!, end: filters.dateTo! })
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(tx => tx.category === filters.category);
    }

    // Type filter
    if (filters.type !== 'all') {
      filtered = filtered.filter(tx => tx.type === filters.type);
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(tx => tx.status === filters.status);
    }

    // Amount range filter
    if (filters.amountMin) {
      filtered = filtered.filter(tx => tx.amount >= parseFloat(filters.amountMin));
    }
    if (filters.amountMax) {
      filtered = filtered.filter(tx => tx.amount <= parseFloat(filters.amountMax));
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal: any, bVal: any;
      
      switch (sortBy) {
        case 'date':
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
          break;
        case 'amount':
          aVal = a.amount;
          bVal = b.amount;
          break;
        case 'description':
          aVal = a.description.toLowerCase();
          bVal = b.description.toLowerCase();
          break;
        default:
          aVal = a.createdAt.getTime();
          bVal = b.createdAt.getTime();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
    setCurrentPage(1);
  }, [transactions, filters, sortBy, sortOrder]);

  if (!authState.isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="container mx-auto px-4 py-16 text-center">
          <Card className="max-w-md mx-auto bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-8">
              <Receipt className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Authentication Required</h2>
              <p className="text-gray-600 mb-6">Please sign in to view your transaction history.</p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => setLocation("/login")}
              >
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const clearFilters = () => {
    setFilters({
      search: '',
      category: 'all',
      type: 'all',
      status: 'all',
      amountMin: '',
      amountMax: ''
    });
  };

  const handleExport = (format: 'csv' | 'pdf' | 'excel') => {
    // In real app, would trigger download
    console.log(`Exporting ${filteredTransactions.length} transactions as ${format}`);
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getTotalPages = () => Math.ceil(filteredTransactions.length / itemsPerPage);
  const getPaginatedTransactions = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  };

  const uniqueCategories = [...new Set(transactions.map(tx => tx.category))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      <Navbar user={authState.user!} />
      
      <div className="pt-20 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <Receipt className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Transaction History</h1>
                <p className="text-gray-300">View and manage all your account transactions</p>
              </div>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{filteredTransactions.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Receipt className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Spent</p>
                    <p className="text-2xl font-bold text-red-600">
                      ${filteredTransactions
                        .filter(tx => tx.type === 'DEBIT')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <TrendingDown className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Received</p>
                    <p className="text-2xl font-bold text-green-600">
                      ${filteredTransactions
                        .filter(tx => tx.type === 'CREDIT')
                        .reduce((sum, tx) => sum + tx.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {filteredTransactions.filter(tx => tx.status === 'pending').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <RefreshCw className="h-6 w-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl mb-6">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Filters & Search
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={clearFilters}>
                    Clear All
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48">
                      <div className="space-y-2">
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('csv')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as CSV
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('pdf')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as PDF
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full justify-start" onClick={() => handleExport('excel')}>
                          <FileText className="h-4 w-4 mr-2" />
                          Export as Excel
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Date Range */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "MMM dd") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
                        disabled={(date) => date > new Date() || (filters.dateTo && date > filters.dateTo)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="flex-1 justify-start">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "MMM dd") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
                        disabled={(date) => date > new Date() || (filters.dateFrom && date < filters.dateFrom)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setFilters(prev => ({
                        ...prev,
                        dateFrom: subDays(today, 30),
                        dateTo: today
                      }));
                    }}
                  >
                    Last 30 Days
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      setFilters(prev => ({
                        ...prev,
                        dateFrom: startOfMonth(today),
                        dateTo: endOfMonth(today)
                      }));
                    }}
                  >
                    This Month
                  </Button>
                </div>
              </div>

              {/* Category and Type Filters */}
              <div className="grid md:grid-cols-5 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Category</Label>
                  <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {uniqueCategories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Type</Label>
                  <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="CREDIT">Income</SelectItem>
                      <SelectItem value="DEBIT">Expense</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Status</Label>
                  <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Min Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.amountMin}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMin: e.target.value }))}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-700">Max Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={filters.amountMax}
                    onChange={(e) => setFilters(prev => ({ ...prev, amountMax: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction List */}
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-gray-900">
                  Transactions ({filteredTransactions.length})
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-sm text-gray-600">Sort by:</Label>
                  <Select value={`${sortBy}_${sortOrder}`} onValueChange={(value) => {
                    const [field, order] = value.split('_');
                    setSortBy(field as 'date' | 'amount' | 'description');
                    setSortOrder(order as 'asc' | 'desc');
                  }}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date_desc">Date (Newest)</SelectItem>
                      <SelectItem value="date_asc">Date (Oldest)</SelectItem>
                      <SelectItem value="amount_desc">Amount (High to Low)</SelectItem>
                      <SelectItem value="amount_asc">Amount (Low to High)</SelectItem>
                      <SelectItem value="description_asc">Description (A-Z)</SelectItem>
                      <SelectItem value="description_desc">Description (Z-A)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-12 text-center">
                  <Receipt className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-500">Try adjusting your filters to see more results</p>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-gray-100">
                    {getPaginatedTransactions().map((transaction) => {
                      const CategoryIcon = categoryIcons[transaction.category] || FileText;
                      return (
                        <div 
                          key={transaction.id} 
                          className="p-6 hover:bg-gray-50 transition-colors cursor-pointer group"
                          onClick={() => setSelectedTransaction(transaction)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4 flex-1">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${
                                transaction.type === 'CREDIT' 
                                  ? 'bg-green-100 text-green-600' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {transaction.type === 'CREDIT' ? (
                                  <Plus className="h-6 w-6" />
                                ) : (
                                  <CategoryIcon className="h-6 w-6" />
                                )}
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h3 className="font-semibold text-gray-900 truncate">
                                    {transaction.description}
                                  </h3>
                                  <Badge className={getStatusColor(transaction.status)}>
                                    {transaction.status}
                                  </Badge>
                                  {transaction.recurring && (
                                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">
                                      Recurring
                                    </Badge>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                  <span>{transaction.category}</span>
                                  {transaction.merchant && (
                                    <>
                                      <span>•</span>
                                      <span>{transaction.merchant}</span>
                                    </>
                                  )}
                                  <span>•</span>
                                  <span>{format(transaction.createdAt, 'MMM dd, yyyy HH:mm')}</span>
                                  {transaction.location && (
                                    <>
                                      <span>•</span>
                                      <span>{transaction.location}</span>
                                    </>
                                  )}
                                </div>
                                
                                <div className="flex items-center gap-2 mt-2">
                                  {transaction.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            
                            <div className="text-right flex items-center gap-4">
                              <div>
                                <p className={`text-xl font-bold ${
                                  transaction.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  {transaction.type === 'CREDIT' ? '+' : '-'}${transaction.amount.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {transaction.accountNumber}
                                </p>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Eye className="h-5 w-5 text-gray-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {getTotalPages() > 1 && (
                    <div className="p-6 border-t border-gray-100">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600">
                          Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} results
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4 mr-1" />
                            Previous
                          </Button>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: Math.min(5, getTotalPages()) }, (_, i) => {
                              const page = i + 1;
                              return (
                                <Button
                                  key={page}
                                  variant={currentPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentPage(page)}
                                  className="w-8 h-8 p-0"
                                >
                                  {page}
                                </Button>
                              );
                            })}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, getTotalPages()))}
                            disabled={currentPage === getTotalPages()}
                          >
                            Next
                            <ChevronRight className="h-4 w-4 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Transaction Detail Modal */}
          {selectedTransaction && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
              <Card className="max-w-2xl w-full max-h-[90vh] overflow-auto bg-white">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900">
                      Transaction Details
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTransaction(null)}
                    >
                      ✕
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Description</Label>
                        <p className="mt-1 text-gray-900 font-semibold">{selectedTransaction.description}</p>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Amount</Label>
                        <p className={`mt-1 text-2xl font-bold ${
                          selectedTransaction.type === 'CREDIT' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {selectedTransaction.type === 'CREDIT' ? '+' : '-'}${selectedTransaction.amount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Category</Label>
                        <p className="mt-1 text-gray-900">{selectedTransaction.category}</p>
                      </div>
                      {selectedTransaction.merchant && (
                        <div>
                          <Label className="text-gray-700 font-medium">Merchant</Label>
                          <p className="mt-1 text-gray-900">{selectedTransaction.merchant}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-700 font-medium">Status</Label>
                        <div className="mt-1">
                          <Badge className={getStatusColor(selectedTransaction.status)}>
                            {selectedTransaction.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Date</Label>
                        <p className="mt-1 text-gray-900">{format(selectedTransaction.createdAt, 'MMMM dd, yyyy HH:mm')}</p>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Reference Number</Label>
                        <p className="mt-1 text-gray-900 font-mono">{selectedTransaction.referenceNumber}</p>
                      </div>
                      <div>
                        <Label className="text-gray-700 font-medium">Account</Label>
                        <p className="mt-1 text-gray-900">{selectedTransaction.accountNumber}</p>
                      </div>
                      {selectedTransaction.location && (
                        <div>
                          <Label className="text-gray-700 font-medium">Location</Label>
                          <p className="mt-1 text-gray-900">{selectedTransaction.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedTransaction.tags.length > 0 && (
                    <div>
                      <Label className="text-gray-700 font-medium">Tags</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selectedTransaction.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-600">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-4 pt-4 border-t border-gray-200">
                    <Button variant="outline" className="flex-1">
                      <Download className="h-4 w-4 mr-2" />
                      Download Receipt
                    </Button>
                    <Button variant="outline" className="flex-1">
                      <FileText className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                    {selectedTransaction.status === 'completed' && (
                      <Button variant="outline" className="flex-1 text-red-600 hover:text-red-700">
                        Dispute Transaction
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}