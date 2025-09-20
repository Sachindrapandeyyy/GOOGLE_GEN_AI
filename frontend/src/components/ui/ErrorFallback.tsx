import React from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Button from './Button';

interface ErrorFallbackProps {
  error?: Error;
  resetErrorBoundary?: () => void;
  message?: string;
  title?: string;
  showHomeButton?: boolean;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
  message = 'We encountered a problem while loading this content.',
  title = 'Something went wrong',
  showHomeButton = true,
}) => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-[300px] flex flex-col items-center justify-center p-6 bg-red-50 rounded-xl border border-red-100 text-center"
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <AlertCircle size={48} className="text-red-500 mb-4" />
      </motion.div>
      
      <h2 className="text-xl font-semibold text-red-800 mb-2">{title}</h2>
      
      <p className="text-red-700 mb-4 max-w-md">
        {message}
      </p>
      
      {error && (
        <div className="text-sm text-red-600 mb-6 px-4 py-2 bg-red-100 rounded-lg max-w-md overflow-auto">
          <code>{error.message}</code>
        </div>
      )}
      
      <div className="flex flex-wrap gap-3 justify-center">
        {resetErrorBoundary && (
          <Button
            variant="primary"
            onClick={resetErrorBoundary}
            icon={<RefreshCw size={16} />}
            className="bg-red-600 hover:bg-red-700"
          >
            Try Again
          </Button>
        )}
        
        {showHomeButton && (
          <Button
            variant="outline"
            onClick={handleGoHome}
            icon={<Home size={16} />}
            className="border-red-600 text-red-600"
          >
            Go to Home
          </Button>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorFallback;
