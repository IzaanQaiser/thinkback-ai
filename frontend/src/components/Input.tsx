import React from 'react';

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  required?: boolean;
  endIcon?: React.ReactNode;
  onEndIconClick?: () => void;
  disabled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      className = '',
      required = false,
      endIcon,
      onEndIconClick,
      disabled = false
    },
    ref
  ) => {
    return (
      <div className={`${className}`}>
        {label && (
          <label className="block text-sm font-medium text-dark-600 dark:text-dark-300 mb-2">
            {label}
            {required && <span className="text-red-400 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            disabled={disabled}
            className="w-full pl-4 pr-16 py-3 border border-dark-300 dark:border-dark-700/60 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white/50 dark:bg-dark-800/60 backdrop-blur-sm shadow-sm text-dark-900 dark:text-dark-100 placeholder-dark-500"
          />
          {endIcon && (
              <button
                type="button"
                onClick={onEndIconClick}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-dark-500 dark:text-dark-400 hover:text-dark-900 dark:hover:text-white transition-colors"
              >
                {endIcon}
              </button>
          )}
        </div>
      </div>
    );
  }
);

export default Input;
