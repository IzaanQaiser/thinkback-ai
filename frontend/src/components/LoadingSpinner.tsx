import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = 'Loading...', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className={`flex items-center justify-center space-x-2 ${className}`}>
      <div className={`animate-spin rounded-full border-2 border-dark-300 border-t-primary-500 ${sizeClasses[size]}`} />
      {text && (
        <span className="text-dark-600 dark:text-dark-400 text-sm">{text}</span>
      )}
    </div>
  );
};

export default LoadingSpinner; 