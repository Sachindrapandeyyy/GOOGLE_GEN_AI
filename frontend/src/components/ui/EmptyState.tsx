import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  secondaryAction,
  className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center text-center p-8 ${className}`}
    >
      {icon && (
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-4 text-gray-400"
        >
          {icon}
        </motion.div>
      )}
      
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm">{description}</p>
      )}
      
      {action && (
        <div className="flex flex-wrap gap-3 justify-center">
          <Button
            variant="primary"
            onClick={action.onClick}
            icon={action.icon}
          >
            {action.label}
          </Button>
          
          {secondaryAction && (
            <Button
              variant="outline"
              onClick={secondaryAction.onClick}
              icon={secondaryAction.icon}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default EmptyState;
