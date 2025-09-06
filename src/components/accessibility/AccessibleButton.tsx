"use client";

import React, { forwardRef, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VariantProps } from 'class-variance-authority';
import { buttonVariants } from '@/components/ui/button';

type ButtonProps = React.ComponentProps<"button"> & 
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };
import { AccessibilityManager } from '@/lib/utils/accessibility';

interface AccessibleButtonProps extends ButtonProps {
  ariaLabel?: string;
  ariaDescription?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaPressed?: boolean;
  ariaCurrent?: boolean;
  announceOnClick?: boolean;
  announceText?: string;
  keyboardShortcut?: string;
  focusOnMount?: boolean;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  ({
    children,
    ariaLabel,
    ariaDescription,
    ariaExpanded,
    ariaControls,
    ariaPressed,
    ariaCurrent,
    announceOnClick = false,
    announceText,
    keyboardShortcut,
    focusOnMount = false,
    onClick,
    ...props
  }, ref) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const accessibilityManager = AccessibilityManager.getInstance();

    // Combine refs
    useEffect(() => {
      if (ref) {
        if (typeof ref === 'function') {
          ref(buttonRef.current);
        } else {
          ref.current = buttonRef.current;
        }
      }
    }, [ref]);

    // Focus on mount if requested
    useEffect(() => {
      if (focusOnMount && buttonRef.current) {
        buttonRef.current.focus();
      }
    }, [focusOnMount]);

    // Set up accessibility attributes
    useEffect(() => {
      const button = buttonRef.current;
      if (!button) return;

      if (ariaLabel) {
        AccessibilityManager.setAriaLabel(button, ariaLabel);
      }

      if (ariaDescription) {
        AccessibilityManager.setAriaDescription(button, ariaDescription);
      }

      if (ariaExpanded !== undefined) {
        button.setAttribute('aria-expanded', ariaExpanded.toString());
      }

      if (ariaControls) {
        button.setAttribute('aria-controls', ariaControls);
      }

      if (ariaPressed !== undefined) {
        button.setAttribute('aria-pressed', ariaPressed.toString());
      }

      if (ariaCurrent !== undefined) {
        button.setAttribute('aria-current', ariaCurrent.toString());
      }

      // Add keyboard shortcut info
      if (keyboardShortcut) {
        const currentLabel = button.getAttribute('aria-label') || button.textContent || '';
        button.setAttribute('aria-label', `${currentLabel} (${keyboardShortcut})`);
      }
    }, [
      ariaLabel,
      ariaDescription,
      ariaExpanded,
      ariaControls,
      ariaPressed,
      ariaCurrent,
      keyboardShortcut,
    ]);

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      // Announce action if requested
      if (announceOnClick) {
        const message = announceText || `Button clicked: ${ariaLabel || children}`;
        accessibilityManager.announce(message, { priority: 'polite' });
      }

      // Call original onClick
      onClick?.(event);
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
      // Handle keyboard shortcuts
      if (keyboardShortcut) {
        const shortcut = keyboardShortcut.toLowerCase();
        const isCtrl = shortcut.includes('ctrl') && event.ctrlKey;
        const isAlt = shortcut.includes('alt') && event.altKey;
        const isShift = shortcut.includes('shift') && event.shiftKey;
        const key = shortcut.split('+').pop()?.toLowerCase();

        if (key && event.key.toLowerCase() === key) {
          if (shortcut.includes('ctrl') && !isCtrl) return;
          if (shortcut.includes('alt') && !isAlt) return;
          if (shortcut.includes('shift') && !isShift) return;

          event.preventDefault();
          buttonRef.current?.click();
        }
      }
    };

    return (
      <Button
        ref={buttonRef}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';
