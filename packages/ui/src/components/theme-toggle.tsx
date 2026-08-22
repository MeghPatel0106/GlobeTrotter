"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { cn } from "../lib/utils";

export interface ThemeToggleProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  showLabel?: boolean;
}

export function ThemeToggle({
  className,
  showLabel = false,
  ...props
}: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={cn(
          "w-11 h-11 min-h-[44px] min-w-[44px] rounded-[8px] border border-border bg-surface-subtle opacity-50 flex items-center justify-center",
          className
        )}
        aria-hidden="true"
      />
    );
  }

  const isDark = (resolvedTheme || theme) === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "h-11 min-h-[44px] min-w-[44px] px-2.5 rounded-[8px] border border-border bg-surface-subtle hover:bg-surface-hover text-foreground flex items-center justify-center gap-2 transition-all duration-160 cursor-pointer select-none",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        className
      )}
      aria-label={isDark ? "Switch to parchment light mode" : "Switch to atlas dark mode"}
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      {...props}
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-primary transition-transform duration-200 rotate-0 hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-primary transition-transform duration-200 rotate-0 hover:-rotate-12" />
      )}
      {showLabel && (
        <span className="text-xs font-mono tracking-wider uppercase">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
