"use client";

import React, { forwardRef, useRef, useEffect, useState, useId } from 'react';
import { Input } from '@/components/ui/input';

type InputProps = React.ComponentProps<"input">;
import { Label } from '@/components/ui/label';
import { AccessibilityManager } from '@/lib/utils/accessibility';

interface AccessibleInputProps extends InputProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  invalid?: boolean;
  announceChanges?: boolean;
  announceOnFocus?: boolean;
  announceOnBlur?: boolean;
  maxLength?: number;
  showCharacterCount?: boolean;
  formatValue?: (value: string) => string;
  validateValue?: (value: string) => string | null;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  ({
    label,
    description,
    error,
    required = false,
    invalid = false,
    announceChanges = false,
    announceOnFocus = false,
    announceOnBlur = false,
    maxLength,
    showCharacterCount = false,
    formatValue,
    validateValue,
    value,
    onChange,
    onFocus,
    onBlur,
    id: providedId,
    ...props
  }, ref) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [internalValue, setInternalValue] = useState(value || '');
    // const [isFocused, setIsFocused] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const accessibilityManager = AccessibilityManager.getInstance();

    // Generate stable ID for accessibility associations
    const generatedId = useId();
    const inputId = providedId || generatedId;

    // Combine refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(inputRef.current);
        } else {
          ref.current = inputRef.current;
        }
      }
    }, [ref]);

    // Set up accessibility attributes
    useEffect(() => {
      const input = inputRef.current;
      if (!input) return;

      const inputId = input.id || `input-${Math.random().toString(36).substr(2, 9)}`;
      input.id = inputId;

      // Set up label association
      const labelElement = document.querySelector(`label[for="${inputId}"]`);
      if (labelElement) {
        input.setAttribute('aria-labelledby', labelElement.id || inputId + '-label');
      }

      // Set up description
      if (description) {
        const descId = inputId + '-description';
        const descElement = document.getElementById(descId);
        if (!descElement) {
          const desc = document.createElement('div');
          desc.id = descId;
          desc.className = 'sr-only';
          desc.textContent = description;
          document.body.appendChild(desc);
        }
        input.setAttribute('aria-describedby', descId);
      }

      // Set up error message
      if (error || validationError) {
        const errorId = inputId + '-error';
        const errorElement = document.getElementById(errorId);
        if (!errorElement) {
          const errorDiv = document.createElement('div');
          errorDiv.id = errorId;
          errorDiv.className = 'sr-only';
          errorDiv.textContent = error || validationError || '';
          document.body.appendChild(errorDiv);
        }
        input.setAttribute('aria-describedby', 
          `${input.getAttribute('aria-describedby') || ''} ${errorId}`.trim()
        );
        input.setAttribute('aria-invalid', 'true');
      } else {
        input.setAttribute('aria-invalid', 'false');
      }

      // Set up required attribute
      if (required) {
        input.setAttribute('aria-required', 'true');
      }

      // Set up max length
      if (maxLength) {
        input.setAttribute('aria-describedby', 
          `${input.getAttribute('aria-describedby') || ''} ${inputId}-count`.trim()
        );
      }
    }, [description, error, validationError, required, maxLength]);

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = event.target.value;

      // Format value if formatter provided
      if (formatValue) {
        newValue = formatValue(newValue);
      }

      // Validate value if validator provided
      if (validateValue) {
        const validationResult = validateValue(newValue);
        setValidationError(validationResult);
      }

      setInternalValue(newValue);

      // Announce changes if requested
      if (announceChanges) {
        const message = `Input changed to: ${newValue}`;
        accessibilityManager.announce(message, { priority: 'polite' });
      }

      // Call original onChange
      onChange?.(event);
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      // setIsFocused(true);

      // Announce focus if requested
      if (announceOnFocus) {
        const message = `Focused on ${label} input`;
        accessibilityManager.announce(message, { priority: 'polite' });
      }

      onFocus?.(event);
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      // setIsFocused(false);

      // Announce blur if requested
      if (announceOnBlur) {
        const message = `Left ${label} input`;
        accessibilityManager.announce(message, { priority: 'polite' });
      }

      onBlur?.(event);
    };

    const currentValue = value !== undefined ? value : internalValue;
    const currentError = error || validationError;
    const isInvalid = invalid || !!currentError;
    const characterCount = currentValue.toString().length;

    return (
      <div className="space-y-2">
        <Label
          htmlFor={inputId}
          className={isInvalid ? 'text-destructive' : ''}
        >
          {label}
          {required && <span className="text-destructive ml-1" aria-label="required">*</span>}
        </Label>

        <div className="relative">
          <Input
            ref={inputRef}
            id={inputId}
            value={currentValue}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            aria-invalid={isInvalid}
            aria-required={required}
            className={isInvalid ? 'border-destructive' : ''}
            {...props}
          />

          {showCharacterCount && maxLength && (
            <div
              id={`${inputId}-count`}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground"
              aria-live="polite"
            >
              {characterCount}/{maxLength}
            </div>
          )}
        </div>

        {description && (
          <p className="text-sm text-muted-foreground" id={`${inputId}-description`}>
            {description}
          </p>
        )}

        {currentError && (
          <p className="text-sm text-destructive" id={`${inputId}-error`} role="alert">
            {currentError}
          </p>
        )}

        {showCharacterCount && maxLength && (
          <div className="text-xs text-muted-foreground">
            {characterCount} of {maxLength} characters
            {characterCount > maxLength * 0.9 && (
              <span className="text-amber-600 ml-2">
                (Approaching limit)
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';
