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
        "w-full flex items-center justify-center select-none pointer-events-none py-3",
        className
      )}
      aria-hidden="true"
    >
      <div className="h-[1px] flex-1 border-t border-dashed border-brass-500/40" />
      <div className="mx-3 flex items-center gap-2 px-3 py-1 rounded-full border border-brass-500/30 bg-ink-900 text-brass-400 shrink-0">
        <Compass className="w-3.5 h-3.5 text-brass-400 shrink-0 animate-[spin_20s_linear_infinite]" />
        <span className="font-mono text-[10px] tracking-wider uppercase text-slate-400 whitespace-nowrap">
          JOURNAL · LOG
        </span>
      </div>
      <div className="h-[1px] flex-1 border-t border-dashed border-brass-500/40" />
    </div>
  );
}
