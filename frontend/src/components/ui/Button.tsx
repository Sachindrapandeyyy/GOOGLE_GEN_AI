import React, { ReactNode, ButtonHTMLAttributes } from 'react';
import { motion } from 'framer-motion';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes
  const baseClasses = 'font-medium rounded-xl transition-all duration-300 flex items-center justify-center';
  
  // Variant classes
  const variantClasses = {
    primary: 'bg-primary-400 text-white hover:bg-primary-500 active:bg-primary-600 disabled:bg-primary-200',
    secondary: 'bg-secondary-300 text-white hover:bg-secondary-400 active:bg-secondary-500 disabled:bg-secondary-200',
    accent: 'bg-accent-400 text-white hover:bg-accent-500 active:bg-accent-600 disabled:bg-accent-200',
    outline: 'border-2 border-primary-400 text-primary-400 hover:bg-primary-50 disabled:border-primary-200 disabled:text-primary-200',
    ghost: 'text-primary-400 hover:bg-primary-50 disabled:text-primary-200',
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'text-sm py-2 px-3',
    md: 'text-base py-2.5 px-4',
    lg: 'text-lg py-3 px-5',
  };
  
  // Width classes
  const widthClasses = fullWidth ? 'w-full' : '';
  
  // Disabled classes
  const disabledClasses = disabled || isLoading ? 'cursor-not-allowed opacity-70' : '';
  
  return (
    <motion.button as={undefined as any}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClasses} ${disabledClasses} ${className}`}
      whileHover={!disabled && !isLoading ? { scale: 1.03 } : {}}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : {}}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && <span className="mr-2">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="ml-2">{icon}</span>}
        </>
      )}
    </motion.button>
  );
};

export default Button;
