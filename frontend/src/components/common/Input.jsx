import React from 'react';

export const Input = ({ label, error, touched, className = '', ...props }) => {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1 text-text-primary">{label}</label>}
      <input
        className={`w-full px-5 py-3 rounded-full border border-[var(--color-border-light)] bg-[var(--color-surface)] text-sm text-text-primary placeholder:text-text-secondary focus:border-accent-purple outline-none transition-colors duration-200 ${touched && error ? 'border-accent-red focus:border-accent-red' : ''}`}
        {...props}
      />
      {touched && error && <p className="mt-2 text-xs text-accent-red px-2">{error}</p>}
    </div>
  );
};
