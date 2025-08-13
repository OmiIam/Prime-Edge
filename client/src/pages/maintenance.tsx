import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Logo from '@/components/logo';
import { Wrench, Clock, RefreshCw, Home } from 'lucide-react';

export default function MaintenancePage() {
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.httpEquiv = 'Cache-Control';
    meta.content = 'no-cache, no-store, must-revalidate';
    document.head.appendChild(meta);

    const pragma = document.createElement('meta');
    pragma.httpEquiv = 'Pragma';
    pragma.content = 'no-cache';
    document.head.appendChild(pragma);

    const expires = document.createElement('meta');
    expires.httpEquiv = 'Expires';
    expires.content = '0';
    document.head.appendChild(expires);

    return () => {
      document.head.removeChild(meta);
      document.head.removeChild(pragma);
      document.head.removeChild(expires);
    };
  }, []);

  const handleRefresh = () => {
    window.location.reload();
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-prime-navy flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <Card className="gradient-card border-prime-slate/30 shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Logo size="lg" showText={false} />
            </div>
            <div className="flex justify-center mb-4">
              <div className="relative">
                <Wrench className="h-16 w-16 text-prime-accent animate-pulse" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-white mb-2">
              System Maintenance
            </CardTitle>
            <p className="text-gray-300">Prime Edge Banking Platform</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <Alert className="bg-yellow-500/20 border-yellow-500/30">
              <Clock className="h-4 w-4 text-yellow-400" />
              <AlertDescription className="text-yellow-200">
                We're currently performing system upgrades to enhance your banking experience.
              </AlertDescription>
            </Alert>

            <div className="text-center space-y-4">
              <p className="text-gray-300 leading-relaxed">
                During this time, login and account access are temporarily unavailable. 
                This upgrade will improve system performance, security, and add new features 
                to better serve your banking needs.
              </p>
            </div>

            <div className="p-4 bg-prime-slate/20 rounded-lg border border-prime-slate/30">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <div className="w-3 h-3 bg-prime-accent rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-white">
                  Maintenance in Progress
                </span>
              </div>
              <p className="text-sm text-gray-300 text-center">
                We expect to complete this upgrade shortly. Please check back in a few minutes.
              </p>
            </div>

            <div className="flex flex-col space-y-3">
              <Button 
                onClick={handleRefresh}
                className="w-full bg-prime-accent hover:bg-blue-600 text-white font-semibold py-3"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Check Status
              </Button>
              <Button 
                variant="outline"
                onClick={handleGoHome}
                className="w-full border-prime-slate/30 text-gray-300 hover:text-white hover:bg-prime-slate/20 font-semibold py-3"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Homepage
              </Button>
            </div>

            <div className="text-center pt-4 border-t border-prime-slate/30">
              <p className="text-sm text-gray-400 mb-2">
                Need immediate assistance?
              </p>
              <p className="text-sm text-gray-300">
                Contact our support team at{' '}
                <a 
                  href="mailto:support@primeedgefinancebank.com" 
                  className="text-prime-accent hover:text-blue-400 font-medium"
                >
                  support@primeedgefinancebank.com
                </a>
              </p>
            </div>

            <div className="text-center text-xs text-gray-500 pt-2">
              <p>© 2025 Prime Edge Finance Bank. All rights reserved.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}