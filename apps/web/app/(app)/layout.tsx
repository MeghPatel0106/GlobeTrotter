"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Compass,
  LayoutDashboard,
  LogOut,
  MapPin,
  Search,
  Users,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@globetrotter/ui";
import { useAuth } from "@/lib/auth-context";

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    isActive: (pathname: string) => pathname === "/dashboard",
  },
  {
    label: "My Trips",
    href: "/trips/mine",
    icon: MapPin,
    isActive: (pathname: string) => pathname.startsWith("/trips"),
  },
  {
    label: "Explore",
    href: "/search",
    icon: Search,
    isActive: (pathname: string) => pathname.startsWith("/search"),
  },
  {
    label: "Community",
    href: "/community",
    icon: Users,
    isActive: (pathname: string) => pathname.startsWith("/community"),
  },
];

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
      <header className="w-full border-b border-slate-500/15 px-4 sm:px-8 py-3 flex items-center justify-between bg-ink-900 sticky top-0 z-40">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
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

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1.5 text-sm font-medium" aria-label="Main navigation">
            {navItems.map((item) => {
              const active = item.isActive(pathname);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 rounded-[8px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 ${
                    active
                      ? "bg-ink-800 text-brass-400 font-semibold border border-brass-500/30"
                      : "text-slate-400 hover:text-parchment-50 hover:bg-ink-850 border border-transparent"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
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
                <div className="w-8 h-8 rounded-full overflow-hidden border border-brass-500/50 bg-ink-800 flex items-center justify-center text-brass-400 font-bold text-xs shrink-0">
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
                aria-label="Log out of session"
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
      <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8 max-w-7xl w-full mx-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-ink-900 border-t border-slate-500/15 px-2 py-1 pb-safe flex items-center justify-around"
      >
        {navItems.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg min-h-[44px] min-w-[56px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 ${
                active
                  ? "text-brass-400 font-semibold"
                  : "text-slate-400 hover:text-parchment-50"
              }`}
              aria-current={active ? "page" : undefined}
            >
              <Icon className={`w-5 h-5 ${active ? "text-brass-400" : "text-slate-400"}`} />
              <span className="text-[10px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
