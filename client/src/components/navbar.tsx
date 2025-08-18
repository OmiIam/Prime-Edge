import { Button } from "@/components/ui/button";
import { authManager } from "@/lib/auth";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { 
  LogOut, 
  User, 
  Settings, 
  Shield, 
  Menu, 
  X, 
  FileText, 
  Upload, 
  UserCheck,
  ArrowLeftRight,
  CreditCard,
  Wallet,
  Bell,
  Search,
  Home,
  ChevronDown
} from "lucide-react";
import { useState, useEffect } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  user: {
    name: string;
    email: string;
    role: 'USER' | 'ADMIN';
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  // Accessibility: Close mobile menu on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (searchOpen) {
          setSearchOpen(false);
        }
        if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen, searchOpen]);

  const handleLogout = () => {
    authManager.logout();
    // Note: authManager.logout() now handles the redirect automatically
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: Home },
    { path: '/transfers', label: 'Transfers', icon: ArrowLeftRight },
    { path: '/payments', label: 'Payments', icon: CreditCard },
    { path: '/accounts', label: 'Accounts', icon: Wallet },
  ];

  const isActivePath = (path: string) => {
    return location === path || location.startsWith(path + '/');
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-prime-navy/95 backdrop-blur-md border-b border-prime-slate/10 shadow-lg" role="navigation" aria-label="Main navigation">
      {/* Skip to content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-prime-accent text-white px-4 py-2 rounded-lg z-50 transition-all duration-200"
      >
        Skip to main content
      </a>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="cursor-pointer transition-transform hover:scale-105" onClick={() => setLocation("/dashboard")}>
              <Logo size="md" showText={true} />
            </div>
          </div>
          
          {/* Primary Navigation - Desktop */}
          <div className="hidden lg:flex items-center space-x-1" role="menubar" aria-label="Primary navigation">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActivePath(item.path);
              return (
                <Button
                  key={item.path}
                  variant="ghost"
                  className={`relative px-4 py-2.5 h-10 font-medium text-sm transition-all duration-200 ${
                    active
                      ? 'text-white bg-prime-accent/20 hover:bg-prime-accent/30' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => setLocation(item.path)}
                  role="menuitem"
                  aria-current={active ? 'page' : undefined}
                  aria-label={`Navigate to ${item.label}`}
                >
                  <Icon className="h-4 w-4 mr-2" aria-hidden="true" />
                  {item.label}
                  {active && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-prime-accent rounded-full" aria-hidden="true" />
                  )}
                </Button>
              );
            })}
          </div>
          
          {/* Right Side Actions - Desktop */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Search Button */}
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/10 p-2 h-10 w-10 transition-all duration-200"
              onClick={() => setSearchOpen(!searchOpen)}
              aria-label="Search"
            >
              <Search className="h-4 w-4" />
            </Button>

            {/* Notifications */}
            <Button
              variant="ghost"
              className="relative text-gray-300 hover:text-white hover:bg-white/10 p-2 h-10 w-10 transition-all duration-200"
              onClick={() => setLocation("/notifications")}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" aria-hidden="true" />
              {/* Notification Badge */}
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-prime-navy animate-pulse" aria-hidden="true" />
              <span className="sr-only">You have new notifications</span>
            </Button>

            {/* Admin Button - Simplified */}
            {user.role === 'ADMIN' && (
              <Button
                variant="ghost"
                className={`text-gray-300 hover:text-white hover:bg-white/10 px-3 py-2 h-10 font-medium text-sm transition-all duration-200 ${
                  location === '/admin' ? 'bg-purple-600/20 text-purple-300' : ''
                }`}
                onClick={() => setLocation("/admin")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin
              </Button>
            )}

            {/* User Menu Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-200 px-3 py-2 rounded-lg group"
                  aria-label="User menu"
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <span className="font-medium text-sm hidden lg:block">{user.name.split(' ')[0]}</span>
                    <ChevronDown className="h-3 w-3 transition-transform group-data-[state=open]:rotate-180" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                sideOffset={8}
                className="w-64 bg-white/98 backdrop-blur-xl border border-gray-200/50 shadow-xl rounded-xl p-2 mt-2 z-50"
              >
                {/* Simplified User Profile Header */}
                <div className="px-3 py-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-sm">
                      <span className="text-white font-semibold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-sm truncate">{user.name}</div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>
                </div>
                
                {/* Simplified Menu Items */}
                <div className="py-1">
                  <DropdownMenuItem 
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg cursor-pointer transition-colors"
                    onClick={() => setLocation('/settings')}
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-400" />
                    Account Settings
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 rounded-lg cursor-pointer transition-colors"
                    onClick={() => setLocation('/statements')}
                  >
                    <FileText className="h-4 w-4 mr-3 text-gray-400" />
                    Statements
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-purple-50 hover:text-purple-700 rounded-lg cursor-pointer transition-colors"
                    onClick={() => setLocation('/kyc/submit')}
                  >
                    <UserCheck className="h-4 w-4 mr-3 text-gray-400" />
                    ID Verification
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 rounded-lg cursor-pointer transition-colors"
                    onClick={() => setLocation('/documents')}
                  >
                    <Upload className="h-4 w-4 mr-3 text-gray-400" />
                    Documents
                  </DropdownMenuItem>
                </div>
                
                <DropdownMenuSeparator className="my-1" />
                
                {/* Sign Out */}
                <div className="py-1">
                  <DropdownMenuItem 
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 rounded-lg cursor-pointer transition-colors font-medium"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </DropdownMenuItem>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Notification Button */}
            <Button
              variant="ghost"
              className="relative text-gray-300 hover:text-white hover:bg-white/10 p-2 h-10 w-10 transition-all duration-200 md:hidden"
              onClick={() => setLocation("/notifications")}
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-prime-navy animate-pulse" />
            </Button>
            
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-white/10 p-2 h-10 w-10 rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-prime-slate/10 bg-prime-navy/98 backdrop-blur-md shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="px-4 pt-4 pb-6">
              {/* User Info */}
              <div className="px-4 py-3 mb-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-sm truncate">{user.name}</div>
                    <div className="text-xs text-gray-300 truncate">{user.email}</div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 mb-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActivePath(item.path);
                  return (
                    <Button
                      key={item.path}
                      variant="ghost"
                      className={`w-full justify-start h-12 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                        active
                          ? 'bg-prime-accent text-white shadow-lg' 
                          : 'text-gray-300 hover:text-white hover:bg-white/10'
                      }`}
                      onClick={() => {
                        setLocation(item.path);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {item.label}
                    </Button>
                  );
                })}

                {user.role === 'ADMIN' && (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start h-12 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                      location === '/admin' 
                        ? 'bg-purple-600/20 text-purple-300 shadow-lg' 
                        : 'text-gray-300 hover:text-white hover:bg-white/10'
                    }`}
                    onClick={() => {
                      setLocation("/admin");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    Admin
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className={`w-full justify-start h-12 px-4 py-3 rounded-lg font-medium text-sm transition-all duration-200 ${
                    location.startsWith('/settings') 
                      ? 'bg-prime-accent text-white shadow-lg' 
                      : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }`}
                  onClick={() => {
                    setLocation("/settings");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </Button>
              </div>

              {/* Sign Out Button */}
              <div className="pt-3 border-t border-white/10">
                <Button
                  variant="ghost"
                  className="w-full justify-start h-12 px-4 py-3 rounded-lg font-medium text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Search Overlay */}
        {searchOpen && (
          <div className="absolute top-16 left-0 right-0 bg-prime-navy/95 backdrop-blur-md border-b border-prime-slate/20 p-4 animate-in slide-in-from-top-2 duration-200">
            <div className="max-w-md mx-auto">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search transactions, accounts..."
                  className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-prime-accent focus:border-transparent"
                  autoFocus
                />
                <Button
                  variant="ghost"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white p-1 h-auto"
                  onClick={() => setSearchOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
