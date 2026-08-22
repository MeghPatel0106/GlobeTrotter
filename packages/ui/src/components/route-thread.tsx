"use client";

import * as React from "react";
import { Compass } from "lucide-react";
import { cn } from "../lib/utils";

export interface RouteThreadDecorationProps {
  className?: string;
}

export function RouteThreadDecoration({ className }: RouteThreadDecorationProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center select-none pointer-events-none py-3",
        className
      )}
      aria-hidden="true"
    >
      <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-brass-500/30 to-brass-500/50 dashed-border" />
      <div className="mx-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-brass-500/25 bg-ink-900/60 text-brass-400">
        <Compass className="w-3.5 h-3.5 text-brass-400 animate-[spin_20s_linear_infinite]" />
        <span className="font-mono text-[10px] tracking-widest uppercase text-slate-400">
          JOURNAL · LOG
        </span>
      </div>
      <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-brass-500/30 to-brass-500/50" />
    </div>
  );
}
