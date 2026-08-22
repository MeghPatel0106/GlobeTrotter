"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Compass,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  ArrowRight,
  Globe,
  Users,
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
  const { user, isLoading, isAuthenticated } = useAuth();

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
      <div className="relative overflow-hidden rounded-[14px] bg-ink-900 border border-slate-500/20 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sage-500/15 border border-sage-500/30 text-sage-400 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>AUTHENTICATED · EXPLORER JOURNAL ACTIVE</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-parchment-50">
              Welcome, {user.firstName}!
            </h1>
            <p className="text-slate-400 text-sm max-w-xl leading-relaxed">
              Your explorer journal is active. Access your customized multi-city
              itineraries, community voyages, and curated destination guides.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/search">
              <Button
                variant="primary"
                size="md"
                className="gap-2 shadow-sm"
              >
                <Compass className="w-4 h-4 text-ink-950" />
                <span>Explore Cities</span>
              </Button>
            </Link>
            <Link href="/trips/mine">
              <Button
                variant="secondary"
                size="md"
                className="gap-2 border-slate-500/25 hover:border-slate-500/40"
              >
                <span>My Trips</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Subtle Decorative Cartography Line */}
        <div className="absolute right-0 bottom-0 opacity-5 pointer-events-none transform translate-x-12 translate-y-12">
          <Compass className="w-64 h-64 text-brass-400" />
        </div>
      </div>

      {/* Grid: Profile Details + System Verification Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: User Profile Details */}
        <Card className="lg:col-span-2 border-slate-500/20 bg-ink-900">
          <CardHeader className="border-b border-slate-500/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden border-2 border-brass-500/60 bg-ink-800 flex items-center justify-center text-brass-400 font-serif text-2xl font-bold shadow-md shrink-0">
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
              <div className="min-w-0">
                <CardTitle className="text-xl truncate">
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
              <div className="flex items-center gap-2.5 text-slate-300 p-3 rounded-[8px] bg-ink-850 border border-slate-500/10">
                <Mail className="w-4 h-4 text-brass-500/80 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Email
                  </span>
                  <span className="truncate font-medium">{user.email}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300 p-3 rounded-[8px] bg-ink-850 border border-slate-500/10">
                <Phone className="w-4 h-4 text-brass-500/80 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Phone
                  </span>
                  <span className="truncate font-medium">
                    {user.phone || "Not specified"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300 p-3 rounded-[8px] bg-ink-850 border border-slate-500/10">
                <MapPin className="w-4 h-4 text-brass-500/80 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-mono text-slate-500 uppercase">
                    Home Base
                  </span>
                  <span className="truncate font-medium">
                    {[user.city, user.country].filter(Boolean).join(", ") ||
                      "Location not set"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-slate-300 p-3 rounded-[8px] bg-ink-850 border border-slate-500/10">
                <Calendar className="w-4 h-4 text-brass-500/80 shrink-0" />
                <div className="flex flex-col min-w-0">
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
              <div className="p-4 rounded-[8px] bg-ink-850 border border-slate-500/15">
                <span className="text-[11px] font-mono text-slate-400 uppercase block mb-1">
                  Traveler Bio / Travel Style
                </span>
                <p className="text-sm text-parchment-50 leading-relaxed italic break-words">
                  &ldquo;{user.additionalInfo}&rdquo;
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right: Account Status & Expedition Readiness */}
        <Card className="border-slate-500/20 bg-ink-900 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-slate-500/10">
            <div className="flex items-center gap-2 text-brass-400">
              <ShieldCheck className="w-5 h-5" />
              <CardTitle className="text-base font-serif">
                Account & Expedition Status
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Profile credentials and security certificates active.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-4 space-y-3 text-xs flex-1">
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Verified Explorer Profile & Credentials</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Encrypted Session & Token Rotation Active</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Multi-City Route Planner Engine Ready</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Community Travel Logbook Access Granted</span>
            </div>
            <div className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="w-4 h-4 text-sage-500 shrink-0 mt-0.5" />
              <span>Atlas & Ink Typography System Synchronized</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discovery & Expedition Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/trips/mine"
          className="group p-5 rounded-[14px] bg-ink-900 border border-slate-500/20 hover:border-brass-500/50 transition-colors flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-ink-800 border border-slate-500/20 flex items-center justify-center text-brass-400 group-hover:border-brass-500/40">
              <MapPin className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brass-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h2 className="font-serif font-semibold text-base text-parchment-50">
              My Expeditions
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Review planned itineraries, active stops, and archived journey logs.
            </p>
          </div>
        </Link>

        <Link
          href="/search"
          className="group p-5 rounded-[14px] bg-ink-900 border border-slate-500/20 hover:border-brass-500/50 transition-colors flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-ink-800 border border-slate-500/20 flex items-center justify-center text-brass-400 group-hover:border-brass-500/40">
              <Globe className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brass-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h2 className="font-serif font-semibold text-base text-parchment-50">
              Explore Destinations
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Discover cultural landmarks, culinary spots, and city highlights.
            </p>
          </div>
        </Link>

        <Link
          href="/community"
          className="group p-5 rounded-[14px] bg-ink-900 border border-slate-500/20 hover:border-brass-500/50 transition-colors flex flex-col justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500"
        >
          <div className="flex items-center justify-between">
            <div className="w-9 h-9 rounded-lg bg-ink-800 border border-slate-500/20 flex items-center justify-center text-brass-400 group-hover:border-brass-500/40">
              <Users className="w-4 h-4" />
            </div>
            <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brass-400 group-hover:translate-x-0.5 transition-all" />
          </div>
          <div>
            <h2 className="font-serif font-semibold text-base text-parchment-50">
              Community Logbook
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Read travel field notes and route advice from fellow wanderers.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
