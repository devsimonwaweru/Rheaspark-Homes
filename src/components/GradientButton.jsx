import React from 'react';

export default function GradientButton({ children, className = '', size = 'md', ...props }) {
  // Size configurations
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg'
  };

  return (
    <button
      className={`
        bg-gradient-to-r from-primary-blue to-primary-green 
        text-white font-semibold 
        rounded-lg shadow-md 
        hover:shadow-lg hover:-translate-y-0.5 
        transition-all duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}