import { Button } from "@/components/ui/button";
import { authManager } from "@/lib/auth";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { LogOut, User, Settings, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
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

  const handleLogout = () => {
    authManager.logout();
    // Note: authManager.logout() now handles the redirect automatically
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-prime-navy/95 backdrop-blur-sm border-b border-prime-slate/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="cursor-pointer" onClick={() => setLocation("/dashboard")}>
              <Logo size="md" showText={true} />
            </div>
          </div>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user.role === 'ADMIN' && (
              <Button
                variant={location === '/admin' ? 'default' : 'ghost'}
                className={location === '/admin' 
                  ? 'bg-prime-accent hover:bg-blue-600' 
                  : 'text-gray-300 hover:text-white'
                }
                onClick={() => setLocation("/admin")}
              >
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Button>
            )}
            
            <Button
              variant={location === '/dashboard' ? 'default' : 'ghost'}
              className={location === '/dashboard' 
                ? 'bg-prime-accent hover:bg-blue-600' 
                : 'text-gray-300 hover:text-white'
              }
              onClick={() => setLocation("/dashboard")}
            >
              Dashboard
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  className="text-gray-200 hover:text-white hover:bg-white/10 transition-all duration-200 px-4 py-2 rounded-lg border border-transparent hover:border-white/20 shadow-sm hover:shadow-md"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                      <span className="text-white font-bold text-sm">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">{user.name}</span>
                      <span className="text-xs text-gray-400 uppercase tracking-wide">{user.role}</span>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72 bg-white border border-gray-200 shadow-2xl rounded-xl p-2 mt-2">
                {/* User Profile Header */}
                <div className="px-4 py-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mb-2 border border-blue-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <span className="text-white font-bold text-lg">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-base mb-1">{user.name}</div>
                      <div className="text-sm text-gray-600 font-medium mb-2">{user.email}</div>
                      <div className="inline-flex items-center px-3 py-1 text-xs font-bold bg-blue-100 text-blue-800 rounded-full border border-blue-200 uppercase tracking-wider">
                        <Shield className="h-3 w-3 mr-1" />
                        {user.role}
                      </div>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuSeparator className="bg-gray-200 my-2" />
                
                {/* Action Items */}
                <div className="space-y-1">
                  <DropdownMenuItem 
                    className="text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer rounded-lg px-4 py-3 font-medium transition-all duration-200 hover:shadow-sm"
                    onClick={() => setLocation('/dashboard')}
                  >
                    <User className="h-4 w-4 mr-3 text-blue-600" />
                    <div className="flex flex-col">
                      <span>Dashboard</span>
                      <span className="text-xs text-gray-500">View your account</span>
                    </div>
                  </DropdownMenuItem>
                  
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem 
                      className="text-gray-700 hover:bg-purple-50 hover:text-purple-700 cursor-pointer rounded-lg px-4 py-3 font-medium transition-all duration-200 hover:shadow-sm"
                      onClick={() => setLocation('/admin')}
                    >
                      <Shield className="h-4 w-4 mr-3 text-purple-600" />
                      <div className="flex flex-col">
                        <span>Admin Panel</span>
                        <span className="text-xs text-gray-500">System management</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    className="text-gray-700 hover:bg-gray-50 hover:text-gray-900 cursor-pointer rounded-lg px-4 py-3 font-medium transition-all duration-200 hover:shadow-sm"
                    onClick={() => setLocation('/settings')}
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-600" />
                    <div className="flex flex-col">
                      <span>Settings</span>
                      <span className="text-xs text-gray-500">Account preferences</span>
                    </div>
                  </DropdownMenuItem>
                </div>
                
                <DropdownMenuSeparator className="bg-gray-200 my-2" />
                
                {/* Sign Out */}
                <DropdownMenuItem 
                  className="text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer rounded-lg px-4 py-3 font-semibold transition-all duration-200 hover:shadow-sm border border-transparent hover:border-red-200"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  <div className="flex flex-col">
                    <span>Sign Out</span>
                    <span className="text-xs text-red-500">End your session</span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              className="text-gray-300 hover:text-white hover:bg-prime-slate/20 p-3 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg transition-all duration-200"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-prime-slate/20 bg-prime-navy/98 backdrop-blur-md shadow-xl">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {/* User Info */}
              <div className="px-4 py-4 border-b border-prime-slate/20 mb-4 bg-prime-charcoal/30 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-base">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-semibold text-base truncate">{user.name}</div>
                    <div className="text-sm text-gray-300 truncate">{user.email}</div>
                    <div className="inline-flex items-center px-2 py-1 mt-1 text-xs font-medium text-prime-accent bg-prime-accent/10 rounded-full border border-prime-accent/20">
                      {user.role}
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className={`w-full justify-start min-h-[48px] px-4 py-3 rounded-xl font-medium text-base transition-all duration-200 ${location === '/dashboard' 
                    ? 'bg-prime-accent text-white shadow-lg scale-[1.02]' 
                    : 'text-gray-300 hover:text-white hover:bg-prime-slate/30 hover:scale-[1.01]'
                  }`}
                  onClick={() => {
                    setLocation("/dashboard");
                    setMobileMenuOpen(false);
                  }}
                >
                  <User className="h-5 w-5 mr-4" />
                  Dashboard
                </Button>

                {user.role === 'ADMIN' && (
                  <Button
                    variant="ghost"
                    className={`w-full justify-start min-h-[48px] px-4 py-3 rounded-xl font-medium text-base transition-all duration-200 ${location === '/admin' 
                      ? 'bg-prime-accent text-white shadow-lg scale-[1.02]' 
                      : 'text-gray-300 hover:text-white hover:bg-prime-slate/30 hover:scale-[1.01]'
                    }`}
                    onClick={() => {
                      setLocation("/admin");
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Shield className="h-5 w-5 mr-4" />
                    Admin Panel
                  </Button>
                )}

                <Button
                  variant="ghost"
                  className={`w-full justify-start min-h-[48px] px-4 py-3 rounded-xl font-medium text-base transition-all duration-200 ${location.startsWith('/settings') 
                    ? 'bg-prime-accent text-white shadow-lg scale-[1.02]' 
                    : 'text-gray-300 hover:text-white hover:bg-prime-slate/30 hover:scale-[1.01]'
                  }`}
                  onClick={() => {
                    setLocation("/settings");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Settings className="h-5 w-5 mr-4" />
                  Settings
                </Button>
              </div>

              {/* Sign Out Button */}
              <div className="pt-4 border-t border-prime-slate/20 mt-4">
                <Button
                  variant="ghost"
                  className="w-full justify-start min-h-[48px] px-4 py-3 rounded-xl font-medium text-base text-red-400 hover:text-red-300 hover:bg-red-500/15 transition-all duration-200 hover:scale-[1.01]"
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-5 w-5 mr-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
