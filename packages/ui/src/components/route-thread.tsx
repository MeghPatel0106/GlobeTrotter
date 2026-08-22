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
      <div className="h-[1px] flex-1 border-t border-dashed border-primary/40" />
      <div className="mx-3 flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-surface text-primary shrink-0 shadow-sm">
        <Compass className="w-3.5 h-3.5 text-primary shrink-0 animate-[spin_20s_linear_infinite]" />
        <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground whitespace-nowrap">
          JOURNAL · LOG
        </span>
      </div>
      <div className="h-[1px] flex-1 border-t border-dashed border-primary/40" />
    </div>
  );
}
