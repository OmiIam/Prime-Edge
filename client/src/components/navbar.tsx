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
              className="text-gray-300 hover:text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
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
          <div className="md:hidden border-t border-prime-slate/20 bg-prime-navy/95 backdrop-blur-sm">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* User Info */}
              <div className="px-3 py-3 border-b border-prime-slate/20 mb-2">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <div className="text-white font-medium">{user.name}</div>
                    <div className="text-sm text-gray-400">{user.email}</div>
                    <div className="text-xs text-prime-accent capitalize">{user.role}</div>
                  </div>
                </div>
              </div>

              {/* Navigation Links */}
              <Button
                variant="ghost"
                className={`w-full justify-start ${location === '/dashboard' 
                  ? 'bg-prime-accent text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-prime-slate/20'
                }`}
                onClick={() => {
                  setLocation("/dashboard");
                  setMobileMenuOpen(false);
                }}
              >
                <User className="h-4 w-4 mr-3" />
                Dashboard
              </Button>

              {user.role === 'ADMIN' && (
                <Button
                  variant="ghost"
                  className={`w-full justify-start ${location === '/admin' 
                    ? 'bg-prime-accent text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-prime-slate/20'
                  }`}
                  onClick={() => {
                    setLocation("/admin");
                    setMobileMenuOpen(false);
                  }}
                >
                  <Shield className="h-4 w-4 mr-3" />
                  Admin Panel
                </Button>
              )}

              {/* Sign Out Button */}
              <div className="pt-2 border-t border-prime-slate/20 mt-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
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
      </div>
    </nav>
  );
}
