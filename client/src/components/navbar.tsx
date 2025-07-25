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
                <Button variant="ghost" className="text-gray-300 hover:text-white">
                  <User className="h-4 w-4 mr-2" />
                  {user.name}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 bg-prime-charcoal border-prime-slate/30">
                <DropdownMenuItem className="text-gray-300 focus:bg-prime-slate/20 focus:text-white cursor-default">
                  <div className="flex flex-col">
                    <span className="font-medium">{user.name}</span>
                    <span className="text-sm text-gray-400">{user.email}</span>
                    <span className="text-xs text-prime-accent capitalize">{user.role}</span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-prime-slate/30" />
                <DropdownMenuItem 
                  className="text-gray-300 focus:bg-prime-slate/20 focus:text-white cursor-pointer"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
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
