import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
  gradient?: string;
  icon?: ReactNode;
  title?: string;
  subtitle?: string;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  interactive = false,
  gradient,
  icon,
  title,
  subtitle,
}) => {
  const baseClasses = 'rounded-2xl shadow-md p-6 overflow-hidden';
  const interactiveClasses = interactive
    ? 'cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 active:shadow-md active:translate-y-0'
    : '';
  const gradientClasses = gradient ? `bg-gradient-to-br ${gradient} text-white` : 'bg-white';
  
  return (
    <motion.div
      className={`${baseClasses} ${interactiveClasses} ${gradientClasses} ${className}`}
      onClick={onClick}
      whileHover={interactive ? { scale: 1.02 } : {}}
      whileTap={interactive ? { scale: 0.98 } : {}}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {(icon || title || subtitle) && (
        <div className="mb-4">
          {icon && <div className="mb-3">{icon}</div>}
          {title && <h3 className="text-lg font-semibold mb-1">{title}</h3>}
          {subtitle && <p className="text-sm opacity-80">{subtitle}</p>}
        </div>
      )}
      {children}
    </motion.div>
  );
};

export default Card;
