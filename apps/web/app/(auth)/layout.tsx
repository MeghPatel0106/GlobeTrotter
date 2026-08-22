import * as React from "react";
import Link from "next/link";
import { Compass, MapPin, Navigation } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-ink-950 bg-atlas-grid flex flex-col justify-between selection:bg-brass-500/30 selection:text-brass-400">
      {/* Top Cartographic Header Bar - Identical to App Header */}
      <header className="w-full border-b border-slate-500/15 px-4 sm:px-8 py-3 flex items-center justify-between bg-ink-900 sticky top-0 z-30">
        <Link
          href="/"
          className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 rounded-md p-1 min-h-[44px]"
          aria-label="GlobeTrotter Home"
        >
          <div className="w-8 h-8 rounded-[8px] bg-brass-500 flex items-center justify-center text-ink-950 shadow-sm group-hover:bg-brass-400 transition-colors">
            <Compass className="w-5 h-5 text-ink-950" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif font-bold text-lg tracking-tight text-parchment-50 leading-none">
              GlobeTrotter
            </span>
            <span className="font-mono text-[9px] tracking-widest text-brass-400 uppercase leading-tight">
              Atlas & Ink
            </span>
          </div>
        </Link>

        {/* Subtle Journal Coordinates Meta */}
        <div className="hidden sm:flex items-center gap-4 text-slate-400 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-brass-500" />
            23°01&apos;N 72°35&apos;E
          </span>
          <span className="h-3 w-[1px] bg-slate-500/30" />
          <span className="flex items-center gap-1.5 text-sage-400">
            <Navigation className="w-3.5 h-3.5 text-sage-500" />
            EXPEDITION LOG
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8">
        <div className="w-full max-w-[540px] my-4">{children}</div>
      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-slate-500/15 px-4 sm:px-8 py-3 text-center text-xs font-mono text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-2 bg-ink-950/80">
        <span>© 2026 GlobeTrotter · Built for Odoo × LDCE Hackathon</span>
        <span className="text-[11px] text-slate-500">
          Personalized Multi-City Route Planner
        </span>
      </footer>
    </div>
  );
}
