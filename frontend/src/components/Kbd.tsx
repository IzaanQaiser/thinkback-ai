import React from 'react';

type KbdProps = {
  children: React.ReactNode;
  className?: string;
};

const Kbd: React.FC<KbdProps> = ({ children, className = '' }) => {
  return (
    <kbd className={`text-sm font-mono text-dark-500 dark:text-dark-400 ${className}`}>
      {children}
    </kbd>
  );
};

export default Kbd;
