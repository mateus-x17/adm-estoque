import React from 'react';

export const Button = ({
  variant = 'primary',
  disabled = false,
  children,
  className = '',
  ...props
}) => {
  const styles = {
    primary: 'btn-primary',
    secondary: 'btn-secondary',
    danger: 'rounded-full bg-accent-red/10 text-accent-red hover:bg-accent-red/20 font-semibold transition-all duration-300',
  };

  return (
    <button
      disabled={disabled}
      className={`${styles[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
};
