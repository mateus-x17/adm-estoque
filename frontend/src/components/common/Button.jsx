import React from 'react';

export const Button = ({
  variant = 'primary',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const styles = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };

  return (
    <button
      disabled={disabled}
      className={`px-4 py-2 rounded-xl font-semibold transition ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
