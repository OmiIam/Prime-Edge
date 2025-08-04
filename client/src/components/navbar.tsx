import { Button } from "@/components/ui/button";
import { authManager } from "@/lib/auth";
import { useLocation } from "wouter";
import Logo from "@/components/logo";
import { LogOut, User, Settings, Shield, Menu, X, FileText, Upload } from "lucide-react";
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
              <DropdownMenuContent 
                align="end" 
                sideOffset={8}
                className="w-80 bg-white/98 backdrop-blur-xl border-2 border-gray-100 shadow-2xl rounded-2xl p-3 mt-2 z-50"
                style={{
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)'
                }}
              >
                {/* User Profile Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl mb-3 border-2 border-slate-100 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-14 h-14 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-xl">
                        <span className="text-white font-bold text-xl">
                          {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg mb-1">{user.name}</div>
                      <div className="text-sm text-gray-700 font-medium mb-3">{user.email}</div>
                      <div className="inline-flex items-center px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-md uppercase tracking-wider">
                        <Shield className="h-3 w-3 mr-1.5" />
                        {user.role}
                      </div>
                    </div>
                  </div>
                </div>
                
                <DropdownMenuSeparator className="bg-gray-300 my-3 h-px" />
                
                {/* Action Items */}
                <div className="space-y-2">
                  <DropdownMenuItem 
                    className="text-gray-800 hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 hover:text-blue-800 cursor-pointer rounded-xl px-5 py-4 font-semibold transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-blue-200"
                    onClick={() => setLocation('/dashboard')}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base">Dashboard</span>
                      <span className="text-xs text-gray-600 font-medium">View your account overview</span>
                    </div>
                  </DropdownMenuItem>
                  
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem 
                      className="text-gray-800 hover:bg-gradient-to-r hover:from-purple-50 hover:to-purple-100 hover:text-purple-800 cursor-pointer rounded-xl px-5 py-4 font-semibold transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-purple-200"
                      onClick={() => setLocation('/admin')}
                    >
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                        <Shield className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base">Admin Panel</span>
                        <span className="text-xs text-gray-600 font-medium">System management</span>
                      </div>
                    </DropdownMenuItem>
                  )}
                  
                  <DropdownMenuItem 
                    className="text-gray-800 hover:bg-gradient-to-r hover:from-green-50 hover:to-green-100 hover:text-green-800 cursor-pointer rounded-xl px-5 py-4 font-semibold transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-green-200"
                    onClick={() => setLocation('/statements')}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base">Statements</span>
                      <span className="text-xs text-gray-600 font-medium">Account statements & reports</span>
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuItem 
                    className="text-gray-800 hover:bg-gradient-to-r hover:from-orange-50 hover:to-orange-100 hover:text-orange-800 cursor-pointer rounded-xl px-5 py-4 font-semibold transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-orange-200"
                    onClick={() => setLocation('/documents')}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                      <Upload className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base">Documents</span>
                      <span className="text-xs text-gray-600 font-medium">Upload & manage files</span>
                    </div>
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem 
                    className="text-gray-800 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-100 hover:text-gray-900 cursor-pointer rounded-xl px-5 py-4 font-semibold transition-all duration-300 hover:shadow-md hover:scale-[1.02] border border-transparent hover:border-gray-200"
                    onClick={() => setLocation('/settings')}
                  >
                    <div className="w-10 h-10 bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                      <Settings className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-base">Settings</span>
                      <span className="text-xs text-gray-600 font-medium">Account preferences</span>
                    </div>
                  </DropdownMenuItem>
                </div>
                
                <DropdownMenuSeparator className="bg-gray-300 my-3 h-px" />
                
                {/* Sign Out */}
                <DropdownMenuItem 
                  className="text-red-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 hover:text-red-800 cursor-pointer rounded-xl px-5 py-4 font-bold transition-all duration-300 hover:shadow-md hover:scale-[1.02] border-2 border-red-200 hover:border-red-300"
                  onClick={handleLogout}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
                    <LogOut className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-base">Sign Out</span>
                    <span className="text-xs text-red-600 font-medium">End your current session</span>
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
