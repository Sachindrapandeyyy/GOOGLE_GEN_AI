import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    
    // Here you could send the error to an error reporting service
    // reportError(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="min-h-[300px] flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl border border-red-100">
          <AlertTriangle size={48} className="text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-700 mb-4 text-center max-w-md">
            We encountered an error while trying to display this content.
          </p>
          <div className="text-sm text-red-600 mb-6 px-4 py-2 bg-red-100 rounded-lg max-w-md overflow-auto">
            <code>{this.state.error?.message || 'Unknown error'}</code>
          </div>
          <Button
            variant="primary"
            onClick={this.handleReset}
            icon={<RefreshCw size={16} />}
            className="bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
