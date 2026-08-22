"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { Label } from "./label";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  maxLength?: number;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      helperText,
      maxLength,
      value,
      defaultValue,
      onChange,
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

    const [charCount, setCharCount] = React.useState<number>(() => {
      if (typeof value === "string") return value.length;
      if (typeof defaultValue === "string") return defaultValue.length;
      return 0;
    });

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      onChange?.(e);
    };

    return (
      <div className="w-full flex flex-col gap-1.5">
        <div className="flex justify-between items-center">
          {label && (
            <Label htmlFor={inputId} required={required}>
              {label}
            </Label>
          )}
          {maxLength && (
            <span
              className={cn(
                "text-[11px] font-mono text-muted-foreground",
                charCount >= maxLength && "text-destructive font-semibold"
              )}
            >
              {charCount}/{maxLength}
            </span>
          )}
        </div>
        <div className="relative">
          <textarea
            ref={ref}
            id={inputId}
            disabled={disabled}
            required={required}
            maxLength={maxLength}
            value={value}
            defaultValue={defaultValue}
            onChange={handleChange}
            aria-invalid={!!error}
            aria-describedby={error ? errorId : helperText ? helperId : undefined}
            className={cn(
              "w-full min-h-[90px] px-3.5 py-2.5 text-sm bg-input-bg text-foreground placeholder:text-muted-foreground rounded-[8px] border transition-all duration-160 resize-y",
              "border-input-border hover:border-border",
              "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
              "disabled:bg-surface-elevated disabled:border-border-subtle disabled:text-muted-foreground disabled:cursor-not-allowed",
              error && "border-destructive/80 focus:border-destructive focus:ring-destructive/20",
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p id={errorId} className="text-xs text-destructive flex items-center gap-1 mt-0.5" role="alert">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p id={helperId} className="text-xs text-muted-foreground mt-0.5">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
