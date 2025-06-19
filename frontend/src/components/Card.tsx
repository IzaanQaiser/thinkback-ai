import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
}

const Card: React.FC<CardProps> = ({ children, className = '', hover = false }) => {
  return (
    <div className={`bg-dark-900/80 backdrop-blur-sm rounded-2xl shadow-xl border border-dark-800/50 ${hover ? 'hover:shadow-2xl hover:border-dark-700/50 hover:bg-dark-900/90 transition-all duration-300' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
