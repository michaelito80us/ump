'use client';
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/utils';

const consentCheckboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
  {
    variants: {
      variant: {
        default: 'border-primary',
        destructive: 'border-destructive data-[state=checked]:bg-destructive',
        secondary: 'border-secondary data-[state=checked]:bg-secondary',
      },
      size: {
        default: 'h-4 w-4',
        sm: 'h-3 w-3',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const consentLabelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: 'text-foreground',
        muted: 'text-muted-foreground',
        accent: 'text-accent-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ConsentCheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof consentCheckboxVariants> {
  label: string;
  description?: string;
  required?: boolean;
  onConsentChange?: (consented: boolean) => void;
  labelVariant?: VariantProps<typeof consentLabelVariants>['variant'];
  error?: string;
  'data-testid'?: string;
}

const ConsentCheckbox = React.forwardRef<
  HTMLInputElement,
  ConsentCheckboxProps
>(
  (
    {
      className,
      variant,
      size,
      label,
      description,
      required = false,
      onConsentChange,
      labelVariant = 'default',
      error,
      'data-testid': testId,
      onChange,
      checked: controlledChecked,
      ...props
    },
    ref
  ) => {
    const [internalChecked, setInternalChecked] = React.useState(
      controlledChecked ?? false
    );
    const checkboxId = React.useId();
    const descriptionId = React.useId();
    const errorId = React.useId();

    // Use controlled value if provided, otherwise use internal state
    const isChecked =
      controlledChecked !== undefined ? controlledChecked : internalChecked;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const checked = event.target.checked;

      // Only update internal state if not controlled
      if (controlledChecked === undefined) {
        setInternalChecked(checked);
      }

      onConsentChange?.(checked);
      onChange?.(event);
    };

    return (
      <div className="flex items-start space-x-2" data-testid={testId}>
        <input
          type="checkbox"
          id={checkboxId}
          ref={ref}
          className={cn(consentCheckboxVariants({ variant, size, className }))}
          checked={isChecked}
          onChange={handleChange}
          aria-describedby={
            [description && descriptionId, error && errorId]
              .filter(Boolean)
              .join(' ') || undefined
          }
          aria-required={required}
          aria-invalid={error ? 'true' : undefined}
          {...props}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor={checkboxId}
            className={cn(consentLabelVariants({ variant: labelVariant }))}
          >
            {label}
            {required && (
              <span className="ml-1 text-destructive" aria-label="required">
                *
              </span>
            )}
          </label>
          {description && (
            <p
              id={descriptionId}
              className="text-xs text-muted-foreground leading-relaxed"
            >
              {description}
            </p>
          )}
          {error && (
            <p
              id={errorId}
              className="text-xs text-destructive leading-relaxed"
            >
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }
);

ConsentCheckbox.displayName = 'ConsentCheckbox';

/**
 * Hook for managing GDPR consent state in plugins
 * Provides a standardized way to handle consent requirements
 */
export function useConsentCheckbox(initialConsent = false) {
  const [hasConsent, setHasConsent] = React.useState(initialConsent);
  const [isRequired, setIsRequired] = React.useState(false);

  const handleConsentChange = React.useCallback((consented: boolean) => {
    setHasConsent(consented);
  }, []);

  const requireConsent = React.useCallback(() => {
    setIsRequired(true);
  }, []);

  const validateConsent = React.useCallback(() => {
    if (isRequired && !hasConsent) {
      throw new Error('GDPR consent is required but not provided');
    }
    return hasConsent;
  }, [isRequired, hasConsent]);

  return {
    hasConsent,
    isRequired,
    handleConsentChange,
    requireConsent,
    validateConsent,
  };
}

export { ConsentCheckbox, consentCheckboxVariants, consentLabelVariants };
