"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, LogOut, MapPin, Navigation, User as UserIcon } from "lucide-react";
import { Button } from "@globetrotter/ui";
import { useAuth } from "@/lib/auth-context";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, logout, isLoading } = useAuth();

  return (
    <div className="min-h-screen w-full bg-ink-950 flex flex-col selection:bg-brass-500/30 selection:text-brass-400">
      {/* Top Navbar */}
      <header className="w-full border-b border-slate-500/15 px-4 sm:px-8 py-3.5 flex items-center justify-between backdrop-blur-md bg-ink-900/90 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 rounded-md p-1"
          >
            <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-brass-500 to-brass-400 flex items-center justify-center text-ink-950 shadow-md group-hover:scale-105 transition-transform duration-160">
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

          {/* Navigation Links Shell */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <Link
              href="/dashboard"
              className={`px-3 py-1.5 rounded-md transition-colors ${
                pathname === "/dashboard"
                  ? "bg-ink-800 text-brass-400 font-semibold"
                  : "text-slate-400 hover:text-parchment-50 hover:bg-ink-850"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/trips/mine"
              className="px-3 py-1.5 rounded-md text-slate-400 hover:text-parchment-50 hover:bg-ink-850 transition-colors"
            >
              My Trips
            </Link>
            <Link
              href="/search"
              className="px-3 py-1.5 rounded-md text-slate-400 hover:text-parchment-50 hover:bg-ink-850 transition-colors"
            >
              Explore
            </Link>
            <Link
              href="/community"
              className="px-3 py-1.5 rounded-md text-slate-400 hover:text-parchment-50 hover:bg-ink-850 transition-colors"
            >
              Community
            </Link>
          </nav>
        </div>

        {/* User Account Controls */}
        <div className="flex items-center gap-3">
          {isLoading ? (
            <div className="h-8 w-24 bg-ink-800 rounded animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-right">
                <div className="hidden sm:flex flex-col">
                  <span className="text-xs font-semibold text-parchment-50 leading-none">
                    {user.firstName} {user.lastName}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 leading-tight">
                    @{user.username}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-full overflow-hidden border border-brass-500/50 bg-ink-800 flex items-center justify-center text-brass-400 font-bold text-xs">
                  {user.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoUrl}
                      alt={user.firstName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user.firstName?.charAt(0) || <UserIcon className="w-4 h-4" />
                  )}
                </div>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={logout}
                className="text-xs gap-1.5 border-slate-500/20 hover:border-coral-500/40 hover:text-coral-400"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Log out</span>
              </Button>
            </div>
          ) : (
            <Link href="/login">
              <Button size="sm">Log in</Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main App Page */}
      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}
