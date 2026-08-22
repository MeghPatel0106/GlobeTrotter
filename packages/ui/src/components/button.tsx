"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      leftIcon,
      rightIcon,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-160 cursor-pointer select-none rounded-[8px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 focus-visible:ring-offset-2 focus-visible:ring-offset-ink-950 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]";

    const variants = {
      primary:
        "bg-brass-500 text-ink-950 hover:bg-brass-400 font-semibold shadow-sm hover:shadow-[0_4px_16px_rgba(201,151,63,0.25)]",
      secondary:
        "bg-ink-800 text-parchment-50 hover:bg-ink-900 border border-slate-500/20 hover:border-slate-500/40",
      outline:
        "border border-brass-500/60 text-brass-500 hover:bg-brass-500/10 hover:border-brass-500",
      ghost:
        "text-slate-300 hover:text-parchment-50 hover:bg-ink-800/60",
      destructive:
        "bg-coral-500 text-white hover:bg-coral-500/90 shadow-sm",
    };

    const sizes = {
      sm: "h-9 px-3 text-xs gap-1.5 min-h-[36px]",
      md: "h-11 px-4 text-sm gap-2 min-h-[44px]", // WCAG minimum 44px
      lg: "h-12 px-6 text-base gap-2.5 min-h-[48px]",
      icon: "h-11 w-11 p-0 min-h-[44px] min-w-[44px]",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        aria-busy={isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin text-current shrink-0" aria-hidden="true" />
            <span className="opacity-80">{children}</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";
