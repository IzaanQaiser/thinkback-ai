import React from 'react';

type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  disabled?: boolean;
};

const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  type = 'button',
  className = '',
  size = 'md',
  variant = 'primary',
  disabled = false,
}) => {
  const baseStyles =
    'inline-flex items-center justify-center font-semibold rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-dark-900 transition-all duration-200';

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  const variantStyles = {
    primary:
      'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 disabled:bg-primary-400/50 disabled:cursor-not-allowed',
    secondary:
      'bg-dark-700 text-white hover:bg-dark-600 focus:ring-dark-500 disabled:bg-dark-700/50 disabled:cursor-not-allowed',
    danger:
      'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 disabled:bg-red-500/50 disabled:cursor-not-allowed',
    ghost:
      'bg-transparent text-dark-300 hover:bg-dark-800 hover:text-white focus:ring-primary-500 disabled:text-dark-500 disabled:cursor-not-allowed shadow-none',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;
