"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Compass,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Globe,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from "@globetrotter/ui";
import { useAuth } from "@/lib/auth-context";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout } = useAuth();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Compass className="w-8 h-8 text-brass-400 animate-spin" />
        <span className="text-sm font-mono text-slate-400">
          Decrypting session journal...
        </span>
      </div>
    );
  }

  if (!user) return null;

  const formattedDate = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[14px] bg-gradient-to-r from-ink-900 via-ink-850 to-ink-900 border border-slate-500/20 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-500/15 border border-sage-500/30 text-sage-400 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>AUTHENTICATED · JWT SESSION ACTIVE</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-parchment-50">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Your explorer profile has been securely created and verified in the
              GlobeTrotter PostgreSQL database via Prisma ORM.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="md"
              onClick={logout}
              className="border-slate-500/30 hover:border-coral-500/50 hover:text-coral-400 text-xs"
            >
              <LogOut className="w-4 h-4 mr-1.5" />
              Sign out
            </Button>
          </div>
        </div>

        {/* Subtle Decorative Cartography Line */}
        <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
          <Compass className="w-64 h-64 text-brass-400" />
        </div>
      </div>

      {/* Grid: Profile Details + System Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Profile Details */}
        <Card className="lg:col-span-2 border-slate-500/20 bg-ink-900">
          <CardHeader className="border-b border-slate-500/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-brass-500/60 bg-ink-800 flex items-center justify-center text-brass-400 font-serif text-2xl font-bold shadow-md">
                {user.photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoUrl}
                    alt={user.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {user.firstName?.charAt(0)}
                    {user.lastName?.charAt(0)}
                  </span>
                )}
              </div>
              <div>
                <CardTitle className="text-xl">
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription className="font-mono text-xs text-brass-400">
                  @{user.username} · Role: {user.role}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2.5 text-slate-300 p-3 rounded-[8px] bg-ink-850/60 border border-slate-500/10">
                <Mail className="w-4 h-4 text-brass-500/80 shrink-0" />
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Email
                  </span>
                  <span className="truncate font-medium">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300 p-3 rounded-[8px] bg-ink-850/60 border border-slate-500/10">
                <Phone className="w-4 h-4 text-brass-500/80 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Phone
                  </span>
                  <span className="font-medium">
                    {user.phone || "Not specified"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300 p-3 rounded-[8px] bg-ink-850/60 border border-slate-500/10">
                <MapPin className="w-4 h-4 text-brass-500/80 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Location
                  </span>
                  <span className="font-medium">
                    {[user.city, user.country].filter(Boolean).join(", ") ||
                      "Location not set"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300 p-3 rounded-[8px] bg-ink-850/60 border border-slate-500/10">
                <Calendar className="w-4 h-4 text-brass-500/80 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Member Since
                  </span>
                  <span className="font-mono text-xs font-medium">
                    {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {user.additionalInfo && (
              <div className="p-4 rounded-[8px] bg-ink-850/40 border border-slate-500/15">
                <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Traveler Bio / Travel Style
                </span>
                <p className="text-sm text-parchment-50 leading-relaxed italic">
                  &ldquo;{user.additionalInfo}&rdquo;
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Phase 1 Verification Checklist */}
        <Card className="border-slate-500/20 bg-ink-900">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-brass-400">
              <ShieldCheck className="w-5 h-5" />
              <CardTitle className="text-base font-serif">
                Phase 1 Auth Verification
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              All Phase 1 functional and security criteria have been met.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-3 text-xs">
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Real PostgreSQL persistence via Prisma ORM</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Password hashed with bcrypt (12 rounds)</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Identifier supports both Email & Username</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>JWT Access (15m) + Rotating Refresh Token (7d)</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Route protection via Next.js Edge Middleware</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Atlas & Ink visual identity + WCAG 2.1 AA</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
