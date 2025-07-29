import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  Bell, 
  BellRing, 
  User, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  X,
  Clock,
  DollarSign,
  UserCheck,
  UserX,
  Shield,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authManager } from "@/lib/auth";

interface AdminLog {
  id: string;
  action: string;
  targetUserId: string | null;
  amount: number | null;
  description: string | null;
  createdAt: string;
  admin: {
    name: string;
    email: string;
  };
  targetUser: {
    name: string;
    email: string;
  } | null;
}

interface Notification {
  id: string;
  type: 'user' | 'transaction' | 'alert' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
}

// Convert admin logs to notifications
const convertLogToNotification = (log: AdminLog): Notification => {
  const timestamp = new Date(log.createdAt);
  const targetUserName = log.targetUser?.name || 'Unknown User';
  const adminName = log.admin.name;
  
  // Determine notification type and priority based on action
  let type: Notification['type'] = 'system';
  let priority: Notification['priority'] = 'low';
  let title = '';
  let message = '';

  switch (log.action) {
    case 'USER_CREATED':
      type = 'user';
      priority = 'medium';
      title = 'New User Registration';
      message = `${targetUserName} has registered a new account`;
      break;
    
    case 'BALANCE_UPDATED':
      type = 'transaction';
      priority = log.amount && Math.abs(log.amount) > 10000 ? 'high' : 'medium';
      title = 'Balance Updated';
      message = `${adminName} updated ${targetUserName}'s balance by $${log.amount?.toLocaleString() || '0'}`;
      break;
    
    case 'USER_DEACTIVATED':
      type = 'alert';
      priority = 'high';
      title = 'User Account Deactivated';
      message = `${adminName} deactivated ${targetUserName}'s account`;
      break;
    
    case 'USER_ACTIVATED':
      type = 'user';
      priority = 'medium';
      title = 'User Account Activated';
      message = `${adminName} activated ${targetUserName}'s account`;
      break;
    
    case 'USER_DELETED':
      type = 'alert';
      priority = 'high';
      title = 'User Account Deleted';
      message = `${adminName} deleted ${targetUserName}'s account`;
      break;
    
    case 'USER_UPDATED':
      type = 'user';
      priority = 'low';
      title = 'User Profile Updated';
      message = `${adminName} updated ${targetUserName}'s profile information`;
      break;
    
    default:
      type = 'system';
      priority = 'low';
      title = log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      message = log.description || `${adminName} performed ${title.toLowerCase()}`;
  }

  return {
    id: log.id,
    type,
    title,
    message,
    timestamp,
    read: false, // All notifications start as unread
    priority
  };
};

export default function NotificationCenter() {
  const authState = authManager.getState();
  const [open, setOpen] = useState(false);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());

  // Fetch admin logs
  const { data: logsData } = useQuery({
    queryKey: ['/api/admin/logs'],
    enabled: authState.isAuthenticated && authState.user?.role === 'ADMIN',
    refetchInterval: 30000, // Refetch every 30 seconds for real-time updates
  });

  const logs = (logsData as any)?.logs || [];
  
  // Convert recent logs (last 24 hours) to notifications
  const notifications = logs
    .filter((log: AdminLog) => {
      const logTime = new Date(log.createdAt);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return logTime > oneDayAgo;
    })
    .slice(0, 20) // Limit to 20 most recent
    .map((log: AdminLog) => ({
      ...convertLogToNotification(log),
      read: readNotifications.has(log.id)
    }));

  const unreadCount = notifications.filter((n: Notification) => !n.read).length;


  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'high') {
      return 'text-red-600 bg-red-50 border-red-200';
    }
    
    switch (type) {
      case 'user': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'transaction': return 'text-green-600 bg-green-50 border-green-200';
      case 'alert': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'system': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const markAsRead = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n: Notification) => n.id);
    setReadNotifications(new Set(allIds));
  };

  const dismissNotification = (id: string) => {
    setReadNotifications(prev => new Set([...prev, id]));
  };

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - timestamp.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  // Enhanced icon mapping based on specific actions
  const getNotificationIcon = (type: Notification['type'], title: string) => {
    // Map specific titles to more appropriate icons
    if (title.includes('Balance')) return DollarSign;
    if (title.includes('Deactivated')) return UserX;
    if (title.includes('Activated')) return UserCheck;
    if (title.includes('Deleted')) return AlertTriangle;
    if (title.includes('Registration')) return User;
    
    // Fallback to type-based icons
    switch (type) {
      case 'user': return User;
      case 'transaction': return DollarSign;
      case 'alert': return AlertTriangle;
      case 'system': return Shield;
      default: return History;
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="relative h-9 w-9 rounded-full hover:bg-gray-100"
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 text-gray-600" />
          ) : (
            <Bell className="h-5 w-5 text-gray-600" />
          )}
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500 text-white text-xs border-2 border-white"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 p-0 bg-white border border-gray-200 shadow-lg"
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold">
                Notifications
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-100 text-red-700 text-xs">
                    {unreadCount} new
                  </Badge>
                )}
              </CardTitle>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  Mark all read
                </Button>
              )}
            </div>
          </CardHeader>
          
          <Separator />
          
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No notifications</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => {
                    const IconComponent = getNotificationIcon(notification.type, notification.title);
                    const colorClass = getNotificationColor(notification.type, notification.priority);
                    
                    return (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 hover:bg-gray-50 transition-colors cursor-pointer relative",
                          !notification.read && "bg-blue-50/30"
                        )}
                        onClick={() => !notification.read && markAsRead(notification.id)}
                      >
                        <div className="flex gap-3">
                          <div className={cn("rounded-full p-2 border", colorClass)}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-1">
                              <p className={cn(
                                "text-sm font-medium text-gray-900 truncate",
                                !notification.read && "font-semibold"
                              )}>
                                {notification.title}
                              </p>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  dismissNotification(notification.id);
                                }}
                                className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600 hover:bg-gray-100 ml-2 flex-shrink-0"
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3 w-3 mr-1" />
                                {formatTimeAgo(notification.timestamp)}
                              </div>
                              
                              <Badge 
                                variant="secondary" 
                                className={cn(
                                  "text-xs",
                                  notification.priority === 'high' && "bg-red-100 text-red-700 border-red-200",
                                  notification.priority === 'medium' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                                  notification.priority === 'low' && "bg-gray-100 text-gray-700 border-gray-200"
                                )}
                              >
                                {notification.priority}
                              </Badge>
                            </div>
                            
                            {!notification.read && (
                              <div className="absolute top-4 right-4 w-2 h-2 bg-blue-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}