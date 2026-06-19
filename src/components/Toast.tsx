import React from 'react';

interface ToastProps {
  show: boolean;
  message: string;
  variant?: 'indigo' | 'red';
}

const variantClasses: Record<string, string> = {
  indigo: 'bg-indigo-600',
  red: 'bg-red-600',
};

export function Toast({ show, message, variant = 'indigo' }: ToastProps) {
  return (
    <div
      className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 pointer-events-none ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className={`${variantClasses[variant]} text-white px-4 py-2 rounded-full shadow-lg text-sm font-medium flex items-center gap-2`}>
        <span>{message}</span>
      </div>
    </div>
  );
}
