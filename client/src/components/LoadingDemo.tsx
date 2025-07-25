import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loading, LoadingSpinner, LoadingDots, LoadingPulse } from '@/components/ui/loading';
import { useLoadingContext } from '@/contexts/LoadingContext';
import { useLoading, useAsyncLoading } from '@/hooks/use-loading';

export function LoadingDemo() {
  const [showInline, setShowInline] = useState(false);
  const [showDefault, setShowDefault] = useState(false);
  const { showLoading, hideLoading } = useLoadingContext();
  const { isLoading, startLoading, stopLoading } = useLoading();

  const simulateAsyncOperation = async () => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    return 'Operation completed!';
  };

  const { isLoading: asyncLoading, execute } = useAsyncLoading(simulateAsyncOperation);

  const handleFullscreenDemo = () => {
    showLoading('Simulating page navigation...');
    setTimeout(() => {
      hideLoading();
    }, 3000);
  };

  const handleAsyncDemo = () => {
    execute().then(result => {
      console.log(result);
    });
  };

  return (
    <div className="min-h-screen bg-prime-navy p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Loading Components Demo</h1>
          <p className="text-xl text-gray-300">Showcase of beautiful loading animations</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fullscreen Loading Demo */}
          <Card className="bg-prime-charcoal border-prime-slate/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Fullscreen Loading</h3>
            <p className="text-gray-300 mb-4">Shows a fullscreen overlay with animated logo and progress bar</p>
            <Button onClick={handleFullscreenDemo} className="w-full">
              Show Fullscreen Loading
            </Button>
          </Card>

          {/* Default Loading Demo */}
          <Card className="bg-prime-charcoal border-prime-slate/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Default Loading</h3>
            <p className="text-gray-300 mb-4">Standard loading component with logo animation</p>
            <Button 
              onClick={() => setShowDefault(!showDefault)} 
              className="w-full mb-4"
            >
              {showDefault ? 'Hide' : 'Show'} Default Loading
            </Button>
            {showDefault && (
              <div className="bg-prime-navy/50 rounded-lg">
                <Loading variant="default" message="Processing your request..." />
              </div>
            )}
          </Card>

          {/* Inline Loading Demo */}
          <Card className="bg-prime-charcoal border-prime-slate/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Inline Loading</h3>
            <p className="text-gray-300 mb-4">Compact loading for inline use</p>
            <Button 
              onClick={() => setShowInline(!showInline)} 
              className="w-full mb-4"
            >
              {showInline ? 'Hide' : 'Show'} Inline Loading
            </Button>
            {showInline && (
              <Loading variant="inline" size="md" message="Loading data..." />
            )}
          </Card>

          {/* Loading Spinner Demo */}
          <Card className="bg-prime-charcoal border-prime-slate/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Spinner Variants</h3>
            <p className="text-gray-300 mb-4">Different spinner sizes and styles</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Small:</span>
                <LoadingSpinner size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Medium:</span>
                <LoadingSpinner size="md" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Large:</span>
                <LoadingSpinner size="lg" />
              </div>
            </div>
          </Card>

          {/* Loading Dots Demo */}
          <Card className="bg-prime-charcoal border-prime-slate/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Animated Dots</h3>
            <p className="text-gray-300 mb-4">Pulsing dots animation</p>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white">Small:</span>
                <LoadingDots size="sm" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Medium:</span>
                <LoadingDots size="md" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white">Large:</span>
                <LoadingDots size="lg" />
              </div>
            </div>
          </Card>

          {/* Loading Pulse Demo */}
          <Card className="bg-prime-charcoal border-prime-slate/20 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Pulse Animation</h3>
            <p className="text-gray-300 mb-4">Pulsing logo with scaling effect</p>
            <div className="flex justify-center">
              <LoadingPulse />
            </div>
          </Card>

          {/* Async Loading Hook Demo */}
          <Card className="bg-prime-charcoal border-prime-slate/20 p-6 md:col-span-2 lg:col-span-3">
            <h3 className="text-xl font-bold text-white mb-4">Async Loading Hook</h3>
            <p className="text-gray-300 mb-4">Using the useAsyncLoading hook for async operations</p>
            <div className="flex items-center gap-4">
              <Button 
                onClick={handleAsyncDemo} 
                disabled={asyncLoading}
                className="flex items-center gap-2"
              >
                {asyncLoading && <LoadingSpinner size="sm" />}
                {asyncLoading ? 'Processing...' : 'Start Async Operation'}
              </Button>
              
              <Button 
                onClick={() => startLoading('Custom loading message...')} 
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading && <LoadingSpinner size="sm" />}
                {isLoading ? 'Loading...' : 'Custom Loading'}
              </Button>
              
              {isLoading && (
                <Button variant="outline" onClick={stopLoading}>
                  Stop Loading
                </Button>
              )}
            </div>
          </Card>
        </div>

        {/* Minimal Loading Examples */}
        <Card className="bg-prime-charcoal border-prime-slate/20 p-6">
          <h3 className="text-xl font-bold text-white mb-4">Minimal Loading States</h3>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-gray-300 mb-2">Minimal SM</p>
              <Loading variant="minimal" size="sm" />
            </div>
            <div className="text-center">
              <p className="text-gray-300 mb-2">Minimal MD</p>
              <Loading variant="minimal" size="md" />
            </div>
            <div className="text-center">
              <p className="text-gray-300 mb-2">Minimal LG</p>
              <Loading variant="minimal" size="lg" />
            </div>
            <div className="text-center">
              <p className="text-gray-300 mb-2">Minimal XL</p>
              <Loading variant="minimal" size="xl" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}