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

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <Label htmlFor={inputId} required={required}>
            {label}
          </Label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-500">
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
            className={cn(
              "w-full h-11 px-3.5 py-2 text-sm bg-ink-900/90 text-parchment-50 placeholder:text-slate-500 rounded-[8px] border transition-all duration-160",
              "border-slate-500/25 hover:border-slate-500/40",
              "focus:outline-none focus:border-brass-500 focus:ring-2 focus:ring-brass-500/20",
              "disabled:bg-ink-950/60 disabled:border-slate-500/10 disabled:text-slate-500 disabled:cursor-not-allowed",
              error && "border-coral-500/80 focus:border-coral-500 focus:ring-coral-500/20 pr-10",
              leftIcon && "pl-10",
              (rightIcon || isPassword) && "pr-10",
              className
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 p-1 text-slate-500 hover:text-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 rounded"
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
            <div className="absolute right-3 flex items-center pointer-events-none text-slate-500">
              {rightIcon}
            </div>
          )}
          {error && !isPassword && !rightIcon && (
            <div className="absolute right-3 flex items-center pointer-events-none text-coral-500">
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
