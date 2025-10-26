/**
 * Enhanced Button component with micro-interactions and accessibility
 */

'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode, useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface EnhancedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'neon';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  ripple?: boolean;
}

const EnhancedButton = forwardRef<HTMLButtonElement, EnhancedButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      ripple = true,
      children,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);
    const buttonRef = useRef<HTMLButtonElement>(null);

    const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!ripple) return;
      
      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      const newRipple = {
        id: Date.now(),
        x,
        y
      };

      setRipples((prev: any) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev: any) => prev.filter((r: any) => r.id !== newRipple.id));
      }, 600);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(event);
      onClick?.(event);
    };

    const baseClasses = 'relative overflow-hidden transition-all duration-200 ease-in-out transform-gpu';
    
    const variantClasses = {
      default: 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95 shadow-lg hover:shadow-xl',
      destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-lg hover:shadow-xl',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95',
      secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:scale-95',
      ghost: 'hover:bg-gray-100 active:scale-95',
      link: 'text-blue-600 underline-offset-2 hover:underline active:scale-95',
      neon: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 active:scale-95 shadow-lg hover:shadow-xl animate-pulse-glow'
    };

    const sizeClasses = {
      default: 'px-4 py-2 text-sm font-medium min-h-[44px]',
      sm: 'px-3 py-1.5 text-xs font-medium min-h-[36px]',
      lg: 'px-6 py-3 text-base font-medium min-h-[52px]',
      icon: 'p-2 min-h-[44px] min-w-[44px]'
    };

    return (
      <button
        ref={ref}
        className={cn(
          baseClasses,
          variantClasses[variant],
          sizeClasses[size],
          fullWidth && 'w-full',
          disabled && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={disabled || isLoading}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {ripple && (
          <span className="absolute inset-0 overflow-hidden rounded-inherit">
            {ripples.map((ripple: any) => (
              <span
                key={ripple.id}
                className="absolute bg-white/30 rounded-full animate-ripple"
                style={{
                  left: ripple.x - 10,
                  top: ripple.y - 10,
                  width: 20,
                  height: 20
                }}
              />
            ))}
          </span>
        )}

        {/* Loading state */}
        {isLoading && (
          <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
        )}

        {/* Left icon */}
        {leftIcon && !isLoading && (
          <span className="mr-2" aria-hidden="true">
            {leftIcon}
          </span>
        )}

        {/* Button content */}
        <span className="relative z-10">
          {children}
        </span>

        {/* Right icon */}
        {rightIcon && !isLoading && (
          <span className="ml-2" aria-hidden="true">
            {rightIcon}
          </span>
        )}

        {/* Screen reader announcement for loading */}
        {isLoading && (
          <span className="sr-only" role="status" aria-live="polite">
            Loading, please wait
          </span>
        )}
      </button>
    );
  }
);

EnhancedButton.displayName = 'EnhancedButton';

export { EnhancedButton };