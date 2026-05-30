import React from 'react';

export const Input = ({ label, error, touched, className = '', ...props }) => {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <input
        className={`w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white ${touched && error ? 'border-red-500 focus:ring-red-100' : ''}`}
        {...props}
      />
      {touched && error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
