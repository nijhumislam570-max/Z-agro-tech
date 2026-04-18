import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { trackError } from '@/lib/analytics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary component that catches JavaScript errors in child components.
 * Displays a friendly shadcn/ui Card fallback UI instead of a blank white screen.
 * Automatically logs errors to the analytics service for monitoring.
 */
class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });

    if (import.meta.env.DEV) {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Component stack:', errorInfo.componentStack);
    }

    trackError(error, {
      componentStack: errorInfo.componentStack,
      url: window.location.href,
    });

    // Auto-recover from chunk-load failures caused by stale cached HTML
    // referencing old asset hashes after a new deploy. Use sessionStorage
    // to prevent infinite reload loops (only reload once per session per error).
    const isChunkLoadError =
      error.message?.includes('Failed to fetch dynamically imported module') ||
      error.message?.includes('Loading chunk') ||
      error.message?.includes('Importing a module script failed');

    if (isChunkLoadError) {
      const reloadKey = `chunk_reload_${error.message.slice(0, 60)}`;
      if (!sessionStorage.getItem(reloadKey)) {
        sessionStorage.setItem(reloadKey, '1');
        window.location.reload();
      }
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  private handleGoHome = () => {
    window.location.href = '/';
  };

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="max-w-md w-full shadow-lg border-destructive/20">
            <CardHeader className="text-center pb-2">
              {/* Error Icon */}
              <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">
                Something went wrong
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                An unexpected error occurred. Your data is safe — try reloading the page.
              </p>
            </CardHeader>

            {/* Error Details — Development Only */}
            {import.meta.env.DEV && this.state.error && (
              <CardContent className="pt-0">
                <div className="bg-muted/60 rounded-lg p-4 border border-border">
                  <p className="text-xs font-mono text-destructive break-all leading-relaxed">
                    {this.state.error.message}
                  </p>
                  {this.state.errorInfo?.componentStack && (
                    <details className="mt-2">
                      <summary className="text-xs text-muted-foreground cursor-pointer">
                        Component stack
                      </summary>
                      <pre className="text-[10px] text-muted-foreground mt-1 overflow-auto max-h-32 whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            )}

            <CardFooter className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button
                onClick={this.handleReload}
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Reload Page
              </Button>
              <Button
                onClick={this.handleRetry}
                variant="outline"
                className="w-full gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleGoHome}
                variant="ghost"
                className="w-full gap-2"
              >
                <Home className="h-4 w-4" />
                Go Home
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
