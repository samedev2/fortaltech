import { useId, type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FieldShellProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
  /** Render the label for screen readers only. */
  srOnlyLabel?: boolean;
}

/**
 * Label + control + error/hint wrapper.
 * Wires up aria-describedby / aria-invalid so validation messages are
 * announced by screen readers instead of being purely visual.
 */
export function FieldShell({
  label,
  id,
  error,
  hint,
  required,
  className,
  children,
  srOnlyLabel,
}: FieldShellProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={cn('space-y-2', className)}>
      <label htmlFor={id} className={cn('field-label', srOnlyLabel && 'sr-only')}>
        {label}
        {required && (
          <span className="ml-1 text-brand-400" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs leading-relaxed text-white/35">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="flex items-start gap-1.5 text-xs font-medium leading-relaxed text-red-400">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  );
}

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

export function TextInput({
  label,
  error,
  hint,
  required,
  className,
  fieldClassName,
  ...props
}: TextInputProps) {
  const autoId = useId();
  const id = props.name ? `field-${props.name}` : autoId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <FieldShell
      label={label}
      id={id}
      error={error}
      hint={hint}
      required={required}
      className={fieldClassName}
    >
      <input
        {...props}
        id={id}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn('field', className)}
      />
    </FieldShell>
  );
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
}

export function TextArea({
  label,
  error,
  hint,
  required,
  className,
  fieldClassName,
  rows = 4,
  ...props
}: TextAreaProps) {
  const autoId = useId();
  const id = props.name ? `field-${props.name}` : autoId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <FieldShell
      label={label}
      id={id}
      error={error}
      hint={hint}
      required={required}
      className={fieldClassName}
    >
      <textarea
        {...props}
        id={id}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn('field resize-y', className)}
      />
    </FieldShell>
  );
}

interface SelectFieldProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
  fieldClassName?: string;
  children: ReactNode;
}

export function SelectField({
  label,
  error,
  hint,
  required,
  className,
  fieldClassName,
  children,
  ...props
}: SelectFieldProps) {
  const autoId = useId();
  const id = props.name ? `field-${props.name}` : autoId;
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <FieldShell
      label={label}
      id={id}
      error={error}
      hint={hint}
      required={required}
      className={fieldClassName}
    >
      <div className="relative">
        <select
          {...props}
          id={id}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn('field appearance-none pr-10', className)}
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M6 8l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </FieldShell>
  );
}
