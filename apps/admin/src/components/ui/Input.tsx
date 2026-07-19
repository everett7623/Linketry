import React from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Input({ label, error, hint, className, id, ...props }: InputProps) {
  const generatedId = React.useId().replace(/:/g, '');
  const inputId = id ?? `input-${generatedId}`;
  const errorId = `${inputId}-error`;
  const hintId = `${inputId}-hint`;
  const describedBy =
    [props['aria-describedby'], error ? errorId : hint ? hintId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        id={inputId}
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : props['aria-invalid']}
        className={clsx(
          'w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-red-500 focus:ring-red-500' : 'border-slate-700 hover:border-slate-600',
          className
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({ label, error, className, id, children, ...props }: SelectProps) {
  const generatedId = React.useId().replace(/:/g, '');
  const selectId = id ?? `select-${generatedId}`;
  const errorId = `${selectId}-error`;
  const describedBy =
    [props['aria-describedby'], error ? errorId : undefined].filter(Boolean).join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : props['aria-invalid']}
        className={clsx(
          'w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-red-500' : 'border-slate-700 hover:border-slate-600',
          className
        )}
      >
        {children}
      </select>
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const generatedId = React.useId().replace(/:/g, '');
  const taId = id ?? `textarea-${generatedId}`;
  const errorId = `${taId}-error`;
  const hintId = `${taId}-hint`;
  const describedBy =
    [props['aria-describedby'], error ? errorId : hint ? hintId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={taId} className="text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        id={taId}
        {...props}
        aria-describedby={describedBy}
        aria-invalid={error ? true : props['aria-invalid']}
        className={clsx(
          'w-full rounded-lg border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent',
          error ? 'border-red-500' : 'border-slate-700 hover:border-slate-600',
          className
        )}
      />
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      )}
    </div>
  );
}
