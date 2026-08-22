import * as React from "react";
import Link from "next/link";
import { Compass, MapPin, Navigation } from "lucide-react";
import { ThemeToggle } from "@globetrotter/ui";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-background bg-atlas-grid flex flex-col justify-between selection:bg-primary/30 selection:text-primary transition-colors duration-200">
      {/* Top Cartographic Header Bar */}
      <header className="w-full border-b border-border px-4 sm:px-8 py-3 flex items-center justify-between bg-surface sticky top-0 z-30 shadow-[0_1px_3px_rgba(20,28,44,0.05)] dark:shadow-none transition-colors duration-200">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md p-1 min-h-[44px]"
          aria-label="GlobeTrotter Home"
        >
          <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center text-primary-foreground shadow-xs group-hover:bg-primary-hover transition-colors">
            <Compass className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-foreground leading-none">
              GlobeTrotter
            </span>
            <span className="font-mono text-[9px] tracking-widest text-primary uppercase leading-tight">
              Atlas & Ink
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3 sm:gap-4">
          {/* Subtle Journal Coordinates Meta */}
          <div className="hidden sm:flex items-center gap-3 text-muted-foreground text-xs font-mono">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              23°01&apos;N 72°35&apos;E
            </span>
            <span className="h-3 w-[1px] bg-border" />
            <span className="flex items-center gap-1.5 text-success">
              <Navigation className="w-3.5 h-3.5" />
              EXPEDITION LOG
            </span>
          </div>

          {/* Global Theme Switcher */}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-4xl my-4 flex justify-center">{children}</div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-border px-4 sm:px-8 py-3 text-center text-xs font-mono text-muted-foreground flex flex-col sm:flex-row items-center justify-between gap-2 bg-surface/90">
        <span>© 2026 GlobeTrotter · Built for Odoo × LDCE Hackathon</span>
        <span className="text-[11px] text-muted-foreground">
          Personalized Multi-City Route Planner
        </span>
      </footer>
    </div>
  );
}
