import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { formatCurrency, formatFinancialDate, formatTransactionAmount } from "@/lib/formatters";
import { format } from "date-fns";
import {
  ArrowUpRight,
  ArrowDownLeft,
  ShoppingCart,
  CreditCard,
  Home,
  Briefcase,
  Coffee,
  Car,
  Smartphone,
  Zap,
  Search,
  Filter,
  Calendar,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  MoreHorizontal
} from "lucide-react";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  description: string;
  createdAt: string;
  status?: string; // Added for TransactionStatus enum
  metadata?: {
    status?: string;
    transferType?: string;
    bankName?: string;
    recipientInfo?: string;
    approvedAt?: string;
    rejectedAt?: string;
    approvedBy?: string;
    rejectedBy?: string;
    reason?: string;
    adminNotes?: string;
    requiresApproval?: boolean;
    category?: string;
    merchant?: string;
    location?: string;
  };
}

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  showSearch?: boolean;
  maxHeight?: string;
}

export default function TransactionList({ 
  transactions, 
  title = "Recent Activity",
  showSearch = false,
  maxHeight = "auto"
}: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const getTransactionIcon = (description: string, category?: string) => {
    const desc = description.toLowerCase();
    const cat = category?.toLowerCase();
    
    if (cat === 'groceries' || desc.includes('grocery') || desc.includes('food')) {
      return { icon: ShoppingCart, color: 'from-green-500 to-green-600' };
    }
    if (cat === 'utilities' || desc.includes('electric') || desc.includes('water') || desc.includes('gas')) {
      return { icon: Zap, color: 'from-yellow-500 to-orange-500' };
    }
    if (cat === 'transport' || desc.includes('uber') || desc.includes('gas') || desc.includes('parking')) {
      return { icon: Car, color: 'from-blue-500 to-blue-600' };
    }
    if (cat === 'dining' || desc.includes('restaurant') || desc.includes('coffee') || desc.includes('starbucks')) {
      return { icon: Coffee, color: 'from-amber-500 to-orange-600' };
    }
    if (cat === 'technology' || desc.includes('apple') || desc.includes('netflix') || desc.includes('spotify')) {
      return { icon: Smartphone, color: 'from-purple-500 to-purple-600' };
    }
    if (desc.includes('salary') || desc.includes('deposit') || desc.includes('credit') || desc.includes('transfer in')) {
      return { icon: ArrowDownLeft, color: 'from-emerald-500 to-green-600' };
    }
    if (desc.includes('rent') || desc.includes('mortgage') || desc.includes('property')) {
      return { icon: Home, color: 'from-indigo-500 to-indigo-600' };
    }
    if (desc.includes('card') || desc.includes('payment') || desc.includes('withdraw')) {
      return { icon: CreditCard, color: 'from-red-500 to-red-600' };
    }
    
    return { icon: Briefcase, color: 'from-gray-500 to-gray-600' };
  };

  const getStatusIcon = (transaction: Transaction) => {
    // Check both transaction.status and metadata.status for comprehensive status handling
    const status = transaction.status || transaction.metadata?.status;
    
    switch (status) {
      case 'COMPLETED':
      case 'completed':
      case 'approved':
        return <CheckCircle2 className="h-3 w-3 text-green-400" />;
      case 'PENDING':
      case 'pending':
        return <Clock className="h-3 w-3 text-yellow-400" />;
      case 'FAILED':
      case 'failed':
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-400" />;
      case 'processing':
        return <AlertCircle className="h-3 w-3 text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'PENDING':
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-400/30';
      case 'COMPLETED':
      case 'approved':
        return 'bg-green-500/20 text-green-300 border-green-400/30';
      case 'FAILED':
      case 'rejected':
        return 'bg-red-500/20 text-red-300 border-red-400/30';
      case 'processing':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30';
      default:
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30';
    }
  };

  const getStatusDisplayText = (transaction: Transaction) => {
    const status = transaction.status || transaction.metadata?.status;
    const requiresApproval = transaction.metadata?.requiresApproval;
    
    if (status === 'PENDING' || status === 'pending') {
      return requiresApproval ? 'Awaiting Approval' : 'Pending';
    }
    if (status === 'COMPLETED' || status === 'approved') {
      return 'Completed';
    }
    if (status === 'FAILED' || status === 'rejected') {
      return 'Rejected';
    }
    return status || 'Completed';
  };

  const getTransferTypeDisplay = (transaction: Transaction) => {
    if (transaction.metadata?.transferType === 'external_bank') {
      return `External Transfer to ${transaction.metadata?.bankName || 'Bank'}`;
    }
    return transaction.description;
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.metadata?.merchant?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                           transaction.metadata?.category === selectedCategory ||
                           transaction.type.toLowerCase() === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <Card className="card-elevated slide-in">
      <CardHeader className="border-b border-white/10 pb-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-white">{title}</CardTitle>
              <p className="text-sm text-white/60">
                {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          
          {showSearch && (
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/40" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/40 w-64"
                />
              </div>
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/10">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-0" style={{ maxHeight, overflowY: 'auto' }}>
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-white font-medium mb-2">No transactions found</p>
            <p className="text-sm text-blue-300">
              {searchTerm ? 'Try adjusting your search criteria' : 'Your transaction history will appear here'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredTransactions.map((transaction, index) => {
              const { icon: IconComponent, color } = getTransactionIcon(
                transaction.description, 
                transaction.metadata?.category
              );
              const formattedAmount = formatTransactionAmount(transaction.amount, transaction.type as 'CREDIT' | 'DEBIT');
              const statusIcon = getStatusIcon(transaction);
              const displayDescription = getTransferTypeDisplay(transaction);
              const statusText = getStatusDisplayText(transaction);
              const currentStatus = transaction.status || transaction.metadata?.status;
              
              return (
                <div 
                  key={transaction.id} 
                  className="card-transaction p-6 group hover-lift"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Transaction Icon */}
                      <div className={`
                        w-12 h-12 rounded-xl flex items-center justify-center shadow-md
                        bg-gradient-to-r ${color} relative
                        ${formattedAmount.isPositive ? 'ring-2 ring-green-400/20' : 'ring-2 ring-red-400/20'}
                      `}>
                        <IconComponent className="h-5 w-5 text-white" />
                        {statusIcon && (
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center">
                            {statusIcon}
                          </div>
                        )}
                      </div>
                      
                      {/* Transaction Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-1">
                          <h3 className="font-semibold text-white truncate pr-2 group-hover:text-blue-200 transition-colors">
                            {displayDescription}
                          </h3>
                          <div className="text-right flex-shrink-0">
                            <div className={`text-lg font-bold text-currency ${formattedAmount.colorClass}`}>
                              {formattedAmount.display}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Calendar className="h-3 w-3" />
                            <span>{formatFinancialDate(transaction.createdAt)}</span>
                            <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                            <span>{format(new Date(transaction.createdAt), 'h:mm a')}</span>
                            
                            {transaction.metadata?.location && (
                              <>
                                <span className="w-1 h-1 bg-white/30 rounded-full"></span>
                                <span className="truncate max-w-32">{transaction.metadata.location}</span>
                              </>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {currentStatus && currentStatus !== 'COMPLETED' && currentStatus !== 'completed' && (
                              <Badge className={`text-xs px-2 py-1 ${getStatusBadge(currentStatus)}`}>
                                {statusText}
                              </Badge>
                            )}
                            
                            <Badge className={`text-xs px-2 py-1 ${
                              formattedAmount.isPositive 
                                ? 'bg-green-500/20 text-green-300' 
                                : 'bg-red-500/20 text-red-300'
                            }`}>
                              {transaction.type}
                            </Badge>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-white/40 hover:text-white"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {transaction.metadata?.merchant && (
                          <div className="text-xs text-white/50 mt-1">
                            <span>Merchant: {transaction.metadata.merchant}</span>
                          </div>
                        )}
                        
                        {/* External Transfer Additional Info */}
                        {transaction.metadata?.transferType === 'external_bank' && (
                          <div className="text-xs text-white/50 mt-1 space-y-1">
                            {transaction.metadata.recipientInfo && (
                              <div>Account: {transaction.metadata.recipientInfo}</div>
                            )}
                            {(transaction.metadata.approvedAt || transaction.metadata.rejectedAt) && (
                              <div className="flex items-center gap-2">
                                {transaction.metadata.approvedAt && (
                                  <span className="text-green-400">
                                    ✓ Approved {new Date(transaction.metadata.approvedAt).toLocaleDateString()}
                                  </span>
                                )}
                                {transaction.metadata.rejectedAt && (
                                  <span className="text-red-400">
                                    ✗ Rejected {new Date(transaction.metadata.rejectedAt).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            )}
                            {transaction.metadata.reason && currentStatus === 'rejected' && (
                              <div className="text-red-300">Reason: {transaction.metadata.reason}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}