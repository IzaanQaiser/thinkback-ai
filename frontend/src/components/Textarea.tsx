import React from 'react';

interface TextareaProps {
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  placeholder,
  value,
  onChange,
  className = '',
  rows = 4,
  required = false,
  disabled = false
}) => {
  return (
    <div className={`${className}`}>
      {label && (
        <label className="block text-sm font-medium text-dark-600 dark:text-dark-300 mb-2">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        rows={rows}
        disabled={disabled}
        className="w-full px-4 py-3 border border-dark-300 dark:border-dark-700/60 rounded-2xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white/50 dark:bg-dark-800/60 backdrop-blur-sm shadow-sm resize-none text-dark-900 dark:text-dark-100 placeholder-dark-500"
      />
    </div>
  );
};

export default Textarea;
