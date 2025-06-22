import React from 'react';
import { Brain } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => {
  const { theme } = useTheme();

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
        <Brain className="text-primary-500 dark:text-dark-300" size={iconSizes[size]} />
      </div>
      <span className={`font-bold text-dark-900 dark:text-gray-100 ${sizeClasses[size]} hidden sm:inline`}>
        thinkback.ai
      </span>
    </div>
  );
};

export default Logo;
