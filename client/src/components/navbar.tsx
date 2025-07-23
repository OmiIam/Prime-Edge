import { Button } from "@/components/ui/button";
import { authManager } from "@/lib/auth";
import { useLocation } from "wouter";
import { LogOut, User, Settings, Shield } from "lucide-react";
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
    role: string;
  };
}

export default function Navbar({ user }: NavbarProps) {
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    authManager.logout();
    setLocation("/");
  };

  return (
    <nav className="fixed w-full top-0 z-50 bg-prime-navy/95 backdrop-blur-sm border-b border-prime-slate/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white cursor-pointer" onClick={() => setLocation("/dashboard")}>
              Prime Edge <span className="text-prime-accent">Banking</span>
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {user.role === 'admin' && (
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
        </div>
      </div>
    </nav>
  );
}
