"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  Compass,
  MapPin,
  Calendar,
  Clock,
  Sparkles,
  Copy,
  ArrowRight,
  Layers,
  Star,
  Moon,
  Sunrise,
  Sun,
  Sunset,
  DollarSign,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Navigation,
  Share2,
  User,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  ThemeToggle,
} from "@globetrotter/ui";
import { tripsApi, Trip, Stop } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getCurrencyForCountry, getCurrencySymbol, formatMoney } from "@/lib/currency";

interface ProcessedActivity {
  id: string;
  name: string;
  timeSlot: string;
  category: string;
  details: string;
  cost: number;
  isFree: boolean;
  orderIndex: number;
  dayNumber: number;
  durationMinutes?: number;
  rating?: number;
}

interface ProcessedDay {
  dayNumber: number;
  dateStr: string | null;
  formattedDate: string;
  cityName: string;
  country: string;
  legIndex: number;
  totalLegs: number;
  stopNotes?: string;
  activities: ProcessedActivity[];
}

interface CitySection {
  stopId: string;
  cityName: string;
  country: string;
  legIndex: number;
  startDate?: string | null;
  endDate?: string | null;
  sectionBudget?: number | null;
  notes?: string | null;
  days: ProcessedDay[];
}

export default function PublicShareTripPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const shareToken = params.token as string;
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();
  const shouldReduceMotion = !!useReducedMotion();

  const [activeCityFilter, setActiveCityFilter] = React.useState<string>("all");

  // Fetch Public Trip Data by Token
  const {
    data: trip,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["public-trip", shareToken],
    queryFn: () => tripsApi.getPublicTrip(shareToken),
    enabled: !!shareToken,
    retry: 1,
    staleTime: 60 * 1000,
  });

  // Copy Public Trip Mutation
  const copyTripMutation = useMutation({
    mutationFn: () => tripsApi.copyPublicTrip(shareToken),
    onSuccess: (newTrip) => {
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(`Copied "${newTrip.name}" to your expeditions!`);
      router.push(`/trips/${newTrip.id}/itinerary`);
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to copy this trip.");
    },
  });

  // Handle Copy This Trip Action
  const handleCopyTrip = () => {
    if (!isAuthenticated) {
      // Redirect to login preserving the return action
      router.push(`/login?returnTo=${encodeURIComponent(`/share/${shareToken}?action=copy`)}`);
      return;
    }
    copyTripMutation.mutate();
  };

  // Auto-trigger copy if returning from login with action=copy
  React.useEffect(() => {
    const action = searchParams.get("action");
    if (action === "copy" && isAuthenticated && !isAuthLoading && trip && !copyTripMutation.isPending) {
      copyTripMutation.mutate();
    }
  }, [searchParams, isAuthenticated, isAuthLoading, trip]);

  // Process Destination Sections & Days
  const citySections: CitySection[] = React.useMemo(() => {
    if (!trip) return [];

    const stops: Stop[] = Array.isArray(trip.stops)
      ? [...trip.stops].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      : [];

    if (stops.length === 0) return [];

    const resultSections: CitySection[] = [];
    const msPerDay = 1000 * 60 * 60 * 24;
    let runningDayNumber = 1;

    let rollingDate = trip.startDate
      ? new Date(trip.startDate)
      : stops[0]?.startDate
      ? new Date(stops[0].startDate)
      : null;

    const standardTimeSlots = [
      "08:30 AM",
      "11:30 AM",
      "02:30 PM",
      "05:30 PM",
      "07:30 PM",
    ];

    stops.forEach((stop, stopIdx) => {
      const rawItems = stop.itineraryItems || [];
      const stopId = stop.id || (stop as any)._id || `stop-${stopIdx}`;

      let stopDaysCount = 1;
      let stopStart: Date | null = null;
      let stopEnd: Date | null = null;

      if (stop.startDate && stop.endDate) {
        const s = new Date(stop.startDate);
        const e = new Date(stop.endDate);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
          stopStart = s;
          stopEnd = e;
          stopDaysCount = Math.max(1, Math.round((e.getTime() - s.getTime()) / msPerDay) + 1);
        }
      }

      if (!stopStart) {
        if (rollingDate && !isNaN(rollingDate.getTime())) {
          stopStart = new Date(rollingDate);
        }
        stopDaysCount = Math.max(1, Math.ceil(rawItems.length / 3) || 1);
      }

      const sectionDays: ProcessedDay[] = [];

      for (let dayOffset = 0; dayOffset < stopDaysCount; dayOffset++) {
        const currentDayNumber = runningDayNumber++;

        let dayDate: Date | null = null;
        let dateStr: string | null = null;
        let formattedDate = `Day ${currentDayNumber}`;

        if (stopStart) {
          dayDate = new Date(stopStart.getTime() + dayOffset * msPerDay);
          dateStr = dayDate.toISOString().split("T")[0];
          formattedDate = dayDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
        }

        const matchedItems: ProcessedActivity[] = [];

        rawItems.forEach((item, itemIdx) => {
          const isExplicitGlobalMatch = item.dayNumber === currentDayNumber;
          const isExplicitRelativeMatch = item.dayNumber === dayOffset + 1 && stopDaysCount > 1;
          const isSingleDayStop = stopDaysCount === 1;
          const isDistributed =
            !item.dayNumber &&
            (stopDaysCount > 1 ? itemIdx % stopDaysCount === dayOffset : true);

          if (isExplicitGlobalMatch || isExplicitRelativeMatch || isSingleDayStop || isDistributed) {
            matchedItems.push({
              id: item.id || (item as any)._id || `act-${stopId}-${currentDayNumber}-${itemIdx}`,
              name: item.activityName || "Sightseeing Exploration",
              timeSlot: item.startTime || standardTimeSlots[itemIdx % standardTimeSlots.length],
              category: "Sightseeing & Highlights",
              details: `Experience ${item.activityName || "cultural attractions"} in ${stop.cityName}.`,
              cost: item.costOverride ?? 0,
              isFree: item.costOverride === 0 || item.costOverride == null,
              orderIndex: item.orderIndex ?? itemIdx,
              dayNumber: item.dayNumber || currentDayNumber,
            });
          }
        });

        if (dayOffset === 0 && matchedItems.length === 0 && rawItems.length > 0) {
          rawItems.forEach((item, itemIdx) => {
            matchedItems.push({
              id: item.id || (item as any)._id || `act-${stopId}-${currentDayNumber}-${itemIdx}`,
              name: item.activityName || "Sightseeing Exploration",
              timeSlot: item.startTime || standardTimeSlots[itemIdx % standardTimeSlots.length],
              category: "Sightseeing & Highlights",
              details: `Experience ${item.activityName || "cultural attractions"} in ${stop.cityName}.`,
              cost: item.costOverride ?? 0,
              isFree: item.costOverride === 0 || item.costOverride == null,
              orderIndex: item.orderIndex ?? itemIdx,
              dayNumber: item.dayNumber || currentDayNumber,
            });
          });
        }

        matchedItems.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

        sectionDays.push({
          dayNumber: currentDayNumber,
          dateStr,
          formattedDate,
          cityName: stop.cityName,
          country: stop.country,
          legIndex: stopIdx + 1,
          totalLegs: stops.length,
          stopNotes: stop.notes,
          activities: matchedItems,
        });
      }

      resultSections.push({
        stopId,
        cityName: stop.cityName,
        country: stop.country,
        legIndex: stopIdx + 1,
        startDate: stop.startDate
          ? new Date(stop.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null,
        endDate: stop.endDate
          ? new Date(stop.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null,
        sectionBudget: stop.sectionBudget,
        notes: stop.notes,
        days: sectionDays,
      });

      if (stopStart) {
        rollingDate = new Date(stopStart.getTime() + stopDaysCount * msPerDay);
      }
    });

    return resultSections;
  }, [trip]);

  const allDays = React.useMemo(() => {
    return citySections.flatMap((sec) => sec.days);
  }, [citySections]);

  const displayedSections = React.useMemo(() => {
    if (activeCityFilter === "all") return citySections;
    return citySections.filter((sec) => sec.stopId === activeCityFilter);
  }, [citySections, activeCityFilter]);

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b border-border px-4 sm:px-8 py-3 bg-surface">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center text-primary-foreground">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-foreground">GlobeTrotter</span>
            </div>
            <div className="h-9 w-32 bg-surface-elevated rounded-[8px] animate-pulse" />
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-pulse">
          <div className="h-6 w-48 bg-surface-elevated rounded" />
          <div className="h-12 w-2/3 bg-surface-elevated rounded-[10px]" />
          <div className="h-28 bg-surface rounded-[14px] border border-border" />
          <div className="space-y-6 pt-4">
            <div className="h-64 bg-surface rounded-[14px] border border-border" />
          </div>
        </main>
      </div>
    );
  }

  // Error / Invalid Token State
  if (isError || !trip) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <header className="border-b border-border px-4 sm:px-8 py-3 bg-surface">
          <div className="max-w-5xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center text-primary-foreground">
                <Compass className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-foreground">GlobeTrotter</span>
            </Link>
            <ThemeToggle />
          </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="max-w-md w-full p-8 text-center space-y-4 shadow-lg border-border">
            <div className="p-3.5 rounded-full bg-destructive/10 text-destructive w-14 h-14 mx-auto flex items-center justify-center">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-foreground">Itinerary Unavailable</h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                This itinerary is no longer available or the share link has expired.
              </p>
            </div>
            <Link href="/">
              <Button variant="primary" size="md" className="mt-2 w-full">
                Explore GlobeTrotter
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  const tripStartFormatted = trip.startDate
    ? new Date(trip.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const tripEndFormatted = trip.endDate
    ? new Date(trip.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const stopsList = Array.isArray(trip.stops) ? trip.stops : [];
  const primaryCountry = stopsList[0]?.country || "Global";
  const tripCurrency = getCurrencyForCountry((trip as any).currency || primaryCountry);
  const tripCurrencySymbol = tripCurrency.symbol;
  const authorName = (trip as any).userId?.firstName
    ? `${(trip as any).userId.firstName} ${(trip as any).userId.lastName || ""}`.trim()
    : "GlobeTrotter Explorer";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-primary/30 selection:text-primary">
      {/* 1. Public Top Navigation Header */}
      <header className="w-full border-b border-border px-4 sm:px-8 py-3 bg-surface sticky top-0 z-40 shadow-xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-[8px] bg-primary flex items-center justify-center text-primary-foreground shadow-xs group-hover:bg-primary-hover transition-colors">
              <Compass className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-foreground leading-none">
                GlobeTrotter
              </span>
              <span className="font-mono text-[9px] tracking-widest text-primary uppercase leading-tight">
                Public Itinerary
              </span>
            </div>
          </Link>

          {/* Primary CTA: Copy this Trip + Theme Toggle */}
          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleCopyTrip}
              disabled={copyTripMutation.isPending}
              className="gap-2 text-xs font-semibold shadow-xs min-h-[40px] px-4 cursor-pointer"
            >
              {copyTripMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
              ) : (
                <Copy className="w-4 h-4 text-primary-foreground" />
              )}
              <span>Copy this Trip</span>
            </Button>
          </div>
        </div>
      </header>

      {/* 2. Main Public Itinerary View */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8">
        {/* Banner & Trip Overview */}
        <div className="space-y-4 border-b border-border pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[6px] bg-primary/10 border border-primary/20 text-primary uppercase font-bold">
                <Compass className="w-3.5 h-3.5" />
                <span>Shared Voyage · {primaryCountry}</span>
              </span>

              <span className="text-muted-foreground">
                Curated by <strong className="text-foreground">{authorName}</strong>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
              {trip.name}
            </h1>

            {trip.description && (
              <p className="text-muted-foreground text-xs sm:text-sm max-w-3xl leading-relaxed">
                {trip.description}
              </p>
            )}
          </div>

          {/* Highlights Meta Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[12px] bg-surface border border-border text-xs">
            {/* Timeline */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-[8px] bg-primary/10 text-primary shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                  Voyage Timeline
                </span>
                <span className="font-semibold text-foreground truncate block">
                  {tripStartFormatted && tripEndFormatted
                    ? `${tripStartFormatted} – ${tripEndFormatted}`
                    : `${allDays.length} Days Planned`}
                </span>
              </div>
            </div>

            {/* Destination Route */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-[8px] bg-primary/10 text-primary shrink-0">
                <Navigation className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                  Destination Legs ({stopsList.length})
                </span>
                <span className="font-semibold text-foreground truncate block">
                  {stopsList.length > 0
                    ? stopsList.map((s) => s.cityName).join(" → ")
                    : "Single destination"}
                </span>
              </div>
            </div>

            {/* Budget Estimate */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-2 rounded-[8px] bg-primary/10 text-primary shrink-0">
                <DollarSign className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                  Planned Budget
                </span>
                <span className="font-semibold text-foreground truncate block">
                  {trip.totalBudgetEstimate != null && trip.totalBudgetEstimate > 0
                    ? `${tripCurrencySymbol}${trip.totalBudgetEstimate.toLocaleString()}`
                    : `${allDays.length} Days Curated`}
                </span>
              </div>
            </div>
          </div>

          {/* Destination Filter Pills */}
          {citySections.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              <span className="text-[11px] font-mono text-muted-foreground shrink-0 uppercase">
                Filter City:
              </span>
              <button
                type="button"
                onClick={() => setActiveCityFilter("all")}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                  activeCityFilter === "all"
                    ? "bg-primary text-primary-foreground shadow-2xs"
                    : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                All Destinations ({citySections.length})
              </button>
              {citySections.map((sec) => (
                <button
                  key={sec.stopId}
                  type="button"
                  onClick={() => setActiveCityFilter(sec.stopId)}
                  className={`px-3 py-1.5 rounded-[8px] text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeCityFilter === sec.stopId
                      ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                      : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                  }`}
                >
                  <MapPin className="w-3 h-3 text-primary" />
                  <span>
                    {sec.cityName} ({sec.days.length}d)
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Day-by-Day Read-Only Itinerary Sections */}
        <div className="space-y-12 sm:space-y-14">
          {displayedSections.map((section) => (
            <div key={section.stopId} className="space-y-6 sm:space-y-8">
              {/* City Section Banner */}
              <div className="p-4 sm:p-5 rounded-[14px] bg-gradient-to-r from-surface to-surface-subtle border border-primary/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-[6px] bg-primary text-primary-foreground text-xs font-mono font-bold">
                      Leg #{section.legIndex}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-foreground">
                      {section.cityName}, {section.country}
                    </h2>
                    <span className="text-xs font-mono text-muted-foreground">
                      ({section.days.length} Day{section.days.length === 1 ? "" : "s"} Scheduled)
                    </span>
                  </div>

                  {section.notes && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {section.notes}
                    </p>
                  )}
                </div>

                {section.sectionBudget != null && (
                  <span className="px-3 py-1 rounded-[8px] bg-success/10 border border-success/30 text-success text-xs font-mono font-bold self-start sm:self-center">
                    {getCurrencySymbol(section.country)}{section.sectionBudget.toLocaleString()}
                  </span>
                )}
              </div>

              {/* Day Blocks */}
              <div className="space-y-6 sm:space-y-8">
                {section.days.map((day) => {
                  const morningActs = day.activities.filter((a) => {
                    const slot = a.timeSlot.toUpperCase();
                    return slot.includes("08:") || slot.includes("09:") || slot.includes("10:") || slot.includes("11:");
                  });

                  const afternoonActs = day.activities.filter((a) => {
                    const slot = a.timeSlot.toUpperCase();
                    return slot.includes("12:") || slot.includes("01:") || slot.includes("02:") || slot.includes("03:") || slot.includes("04:") || slot.includes("05:");
                  });

                  const eveningActs = day.activities.filter((a) => {
                    const slot = a.timeSlot.toUpperCase();
                    return slot.includes("06:") || slot.includes("07:") || slot.includes("08:");
                  });

                  const dayActsTotal = day.activities.reduce((acc, a) => acc + (a.cost || 0), 0);

                  const renderReadonlyActivityCard = (act: ProcessedActivity) => (
                    <div
                      key={act.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-[10px] bg-surface-subtle/50 border border-border"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-surface border border-border text-[11px] font-mono text-primary font-bold">
                            <Clock className="w-3 h-3" />
                            <span>{act.timeSlot}</span>
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-surface-elevated text-[10px] font-mono text-muted-foreground uppercase">
                            <Sparkles className="w-2.5 h-2.5 text-primary" />
                            <span>{act.category}</span>
                          </span>
                        </div>
                        <h4 className="font-bold text-sm sm:text-base text-foreground">
                          {act.name}
                        </h4>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {act.details}
                        </p>
                      </div>

                      <div className="rounded-[8px] bg-surface border border-border px-3 py-1.5 flex items-center gap-2 self-start sm:self-center shrink-0">
                        <span className="text-[10px] font-mono text-muted-foreground uppercase">
                          Cost
                        </span>
                        <span className="font-bold text-xs sm:text-sm text-success">
                          {getCurrencySymbol(day.country)}{act.cost > 0 ? act.cost.toLocaleString() : "0 (Free)"}
                        </span>
                      </div>
                    </div>
                  );

                  return (
                    <Card
                      key={`day-${day.dayNumber}`}
                      className="border border-border bg-surface rounded-[14px] shadow-xs overflow-hidden"
                    >
                      {/* Day Header */}
                      <div className="p-4 sm:p-5 bg-surface-subtle/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 border border-primary/40 font-mono font-bold text-xs text-primary shrink-0">
                            {day.dayNumber}
                          </div>

                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-base sm:text-lg text-foreground">
                                Day {day.dayNumber}
                              </span>
                              <span className="text-muted-foreground text-sm font-normal">
                                · {day.cityName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-0.5">
                              <span>{day.formattedDate}</span>
                              {day.dateStr && (
                                <>
                                  <span>•</span>
                                  <span>{day.cityName}, {day.country}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-mono text-primary font-semibold self-start sm:self-center px-2.5 py-1 rounded bg-primary/10 border border-primary/20">
                          {day.activities.length} Sights Planned
                        </span>
                      </div>

                      {/* Day Sessions */}
                      <div className="p-4 sm:p-6 space-y-6">
                        {day.activities.length > 0 ? (
                          <div className="space-y-6">
                            {/* Morning Session */}
                            {morningActs.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2 text-xs font-mono font-semibold text-foreground/90 uppercase tracking-wider pb-1 border-b border-border/50">
                                  <div className="flex items-center gap-2">
                                    <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Morning Session · 08:30 AM – 11:30 AM</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {morningActs.length} Activities
                                  </span>
                                </div>
                                <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-amber-500/30">
                                  {morningActs.map((act) => renderReadonlyActivityCard(act))}
                                </div>
                              </div>
                            )}

                            {/* Afternoon Session */}
                            {afternoonActs.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2 text-xs font-mono font-semibold text-foreground/90 uppercase tracking-wider pb-1 border-b border-border/50">
                                  <div className="flex items-center gap-2">
                                    <Sun className="w-3.5 h-3.5 text-orange-500" />
                                    <span>Afternoon Session · 12:00 PM – 05:30 PM</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {afternoonActs.length} Activities
                                  </span>
                                </div>
                                <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-orange-500/30">
                                  {afternoonActs.map((act) => renderReadonlyActivityCard(act))}
                                </div>
                              </div>
                            )}

                            {/* Evening Twilight Session */}
                            {eveningActs.length > 0 && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-between gap-2 text-xs font-mono font-semibold text-foreground/90 uppercase tracking-wider pb-1 border-b border-border/50">
                                  <div className="flex items-center gap-2">
                                    <Sunset className="w-3.5 h-3.5 text-purple-500" />
                                    <span>Evening Twilight · 06:00 PM – 08:00 PM</span>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground">
                                    {eveningActs.length} Activities
                                  </span>
                                </div>
                                <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-purple-500/30">
                                  {eveningActs.map((act) => renderReadonlyActivityCard(act))}
                                </div>
                              </div>
                            )}

                            {/* Rest Session */}
                            <div className="p-3.5 rounded-[12px] bg-surface-subtle/70 border border-border/80 flex items-start gap-3 text-xs">
                              <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                                <Moon className="w-4 h-4" />
                              </div>
                              <div className="space-y-0.5 flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-foreground">
                                    08:00 PM Onwards · Free Leisure & Rest
                                  </span>
                                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-surface border border-border text-muted-foreground">
                                    No More Planned Sights
                                  </span>
                                </div>
                                <p className="text-muted-foreground leading-relaxed">
                                  No further activities scheduled for tonight. Enjoy local food and rest up for the next day.
                                </p>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="py-6 text-center text-xs text-muted-foreground italic">
                            No sights or tours scheduled for Day {day.dayNumber}.
                          </div>
                        )}

                        {/* Day Total Bar */}
                        <div className="p-3 rounded-[10px] bg-surface-elevated border border-border flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-mono text-[11px]">
                            {day.activities.length} Sights & Activities
                          </span>
                          <span className="font-mono font-bold text-success text-sm flex items-center gap-1">
                            <span>Day Estimated Cost:</span>
                            <span>{getCurrencySymbol(day.country)}{dayActsTotal.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Bottom Sticky CTA Footer */}
        <div className="p-6 rounded-[16px] bg-gradient-to-r from-primary/15 via-surface to-primary/10 border border-primary/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg">
          <div className="space-y-1">
            <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center justify-center sm:justify-start gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Love this itinerary?</span>
            </h3>
            <p className="text-xs text-muted-foreground max-w-md">
              Clone this voyage to your GlobeTrotter account to customize activities, track expenses, and view the day-by-day map.
            </p>
          </div>

          <Button
            type="button"
            variant="primary"
            size="lg"
            onClick={handleCopyTrip}
            disabled={copyTripMutation.isPending}
            className="gap-2 font-semibold shadow-md min-h-[44px] px-6 shrink-0 w-full sm:w-auto"
          >
            {copyTripMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span>Copy this Trip</span>
          </Button>
        </div>
      </main>
    </div>
  );
}
