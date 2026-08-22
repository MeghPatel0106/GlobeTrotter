"use client";

import * as React from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isPassword?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      isPassword = false,
      disabled,
      required,
      id,
      style,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, "-") : generatedId);
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    const [showPassword, setShowPassword] = React.useState(false);
    const effectiveType = isPassword ? (showPassword ? "text" : "password") : type;

    const hasRightContent = isPassword || rightIcon || error;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative flex items-center w-full">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-500 z-10">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={effectiveType}
            disabled={disabled}
            required={required}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            style={{
              paddingLeft: leftIcon ? "2.75rem" : "0.875rem",
              paddingRight: hasRightContent ? "2.75rem" : "0.875rem",
              ...style,
            }}
            className={cn(
              "w-full h-11 py-2 text-sm bg-ink-900 text-parchment-50 placeholder:text-slate-500 rounded-[8px] border transition-colors duration-160",
              "border-slate-500/25 hover:border-slate-500/40",
              "focus:outline-none focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20",
              "disabled:bg-ink-950/60 disabled:border-slate-500/10 disabled:text-slate-500 disabled:cursor-not-allowed",
              error && "border-coral-500/80 focus:border-coral-500 focus:ring-coral-500/20",
              leftIcon ? "pl-11" : "pl-3.5",
              hasRightContent ? "pr-11" : "pr-3.5",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 rounded cursor-pointer z-10"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
            </button>
          )}
          {!isPassword && rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-500 z-10">
              {rightIcon}
            </div>
          )}
          {error && !isPassword && !rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-coral-500 z-10">
              <AlertCircle className="h-4 w-4" aria-hidden="true" />
            </div>
          )}
        </div>
        {error ? (
          <p id={errorId} className="text-xs text-coral-500 flex items-center gap-1 mt-0.5" role="alert">
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-slate-500 mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
