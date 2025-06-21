import React from 'react';
import { Brain } from 'lucide-react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl'
  };

  const iconSizes = {
    sm: 20,
    md: 28,
    lg: 36
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <div className="bg-primary-500/10 rounded-lg p-2">
        <Brain className="text-dark-300" size={iconSizes[size]} />
      </div>
      <span className={`font-bold text-gray-100 ${sizeClasses[size]}`}>
        thinkback.ai
      </span>
    </div>
  );
};

export default Logo;
