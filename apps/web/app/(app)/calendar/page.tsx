"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Compass,
  MapPin,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  Layers,
  LayoutGrid,
  List,
  AlertCircle,
  Loader2,
  CalendarDays,
  RotateCcw,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
} from "@globetrotter/ui";
import { tripsApi, Trip, Stop } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Curated palette of harmonious accent themes for multi-day trip bars
const TRIP_ACCENT_STYLES = [
  {
    bg: "bg-emerald-500/15 dark:bg-emerald-500/20",
    border: "border-emerald-500/40 text-emerald-700 dark:text-emerald-300",
    indicator: "bg-emerald-500",
  },
  {
    bg: "bg-blue-500/15 dark:bg-blue-500/20",
    border: "border-blue-500/40 text-blue-700 dark:text-blue-300",
    indicator: "bg-blue-500",
  },
  {
    bg: "bg-amber-500/15 dark:bg-amber-500/20",
    border: "border-amber-500/40 text-amber-800 dark:text-amber-300",
    indicator: "bg-amber-500",
  },
  {
    bg: "bg-purple-500/15 dark:bg-purple-500/20",
    border: "border-purple-500/40 text-purple-700 dark:text-purple-300",
    indicator: "bg-purple-500",
  },
  {
    bg: "bg-cyan-500/15 dark:bg-cyan-500/20",
    border: "border-cyan-500/40 text-cyan-700 dark:text-cyan-300",
    indicator: "bg-cyan-500",
  },
];

interface CalendarDayCell {
  date: Date;
  dateStr: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export default function CalendarPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const shouldReduceMotion = !!useReducedMotion();

  // Navigation State: Active viewing month/year
  const [currentDate, setCurrentDate] = React.useState<Date>(() => new Date());
  const [slideDirection, setSlideDirection] = React.useState<number>(1); // 1 = next, -1 = prev
  const [viewFormat, setViewFormat] = React.useState<"grid" | "agenda">("grid");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
  const month1Indexed = month + 1;

  // Protect route with auth
  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?returnTo=/calendar");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Fetch real trips from MongoDB for this month / user
  const {
    data: trips = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["trips", "calendar", month1Indexed, year],
    queryFn: () => tripsApi.getCalendarTrips(month1Indexed, year),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  // Calculate 7-day grid cells for the current month
  const calendarGrid: CalendarDayCell[] = React.useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
    const daysInMonth = lastDayOfMonth.getDate();

    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    const cells: CalendarDayCell[] = [];

    // Previous month trailing days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const pDay = prevMonthLastDay - i;
      const pDate = new Date(year, month - 1, pDay);
      const dateStr = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, "0")}-${String(pDate.getDate()).padStart(2, "0")}`;
      cells.push({
        date: pDate,
        dateStr,
        dayNumber: pDay,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const cDate = new Date(year, month, i);
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        date: cDate,
        dateStr,
        dayNumber: i,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
      });
    }

    // Next month leading days to complete the 35 or 42 grid
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const nDate = new Date(year, month + 1, i);
      const dateStr = `${nDate.getFullYear()}-${String(nDate.getMonth() + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
      cells.push({
        date: nDate,
        dateStr,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
      });
    }

    return cells;
  }, [year, month]);

  // Process trips to normalize start and end dates in YYYY-MM-DD format
  const processedTrips = React.useMemo(() => {
    return trips.map((trip, idx) => {
      let startStr = "";
      let endStr = "";

      if (trip.startDate) {
        startStr = new Date(trip.startDate).toISOString().split("T")[0];
      }
      if (trip.endDate) {
        endStr = new Date(trip.endDate).toISOString().split("T")[0];
      }

      // Fallback from stops if trip level dates are unset
      if (!startStr && trip.stops && trip.stops.length > 0) {
        const firstStop = trip.stops[0];
        if (firstStop.startDate) {
          startStr = new Date(firstStop.startDate).toISOString().split("T")[0];
        }
      }
      if (!endStr && trip.stops && trip.stops.length > 0) {
        const lastStop = trip.stops[trip.stops.length - 1];
        if (lastStop.endDate) {
          endStr = new Date(lastStop.endDate).toISOString().split("T")[0];
        } else if (lastStop.startDate) {
          endStr = new Date(lastStop.startDate).toISOString().split("T")[0];
        }
      }

      // Default single day if only start is present
      if (startStr && !endStr) {
        endStr = startStr;
      } else if (!startStr && endStr) {
        startStr = endStr;
      }

      const style = TRIP_ACCENT_STYLES[idx % TRIP_ACCENT_STYLES.length];

      return {
        ...trip,
        startStr,
        endStr,
        style,
      };
    });
  }, [trips]);

  // Navigation handlers
  const handlePrevMonth = () => {
    setSlideDirection(-1);
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setSlideDirection(1);
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setSlideDirection(today > currentDate ? 1 : -1);
    setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1));
  };

  // Month Title Formatter (e.g. "August 2026")
  const monthTitle = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Filter trips active in current month for the Agenda view
  const monthTrips = React.useMemo(() => {
    const startOfMonthStr = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const endOfMonthDate = new Date(year, month + 1, 0);
    const endOfMonthStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(endOfMonthDate.getDate()).padStart(2, "0")}`;

    return processedTrips.filter((t) => {
      if (!t.startStr || !t.endStr) return false;
      return t.startStr <= endOfMonthStr && t.endStr >= startOfMonthStr;
    });
  }, [processedTrips, year, month]);

  // Framer Motion Animation Variants for previous/next month slide
  const slideVariants = {
    enter: (direction: number) => ({
      x: shouldReduceMotion ? 0 : direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: shouldReduceMotion ? 0 : direction > 0 ? -30 : 30,
      opacity: 0,
    }),
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* 1. Header & Navigation Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary">
            <Compass className="w-3.5 h-3.5 animate-[spin_20s_linear_infinite]" />
            <span>Trip Schedule</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Trip Calendar & Timeline
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Visual day-by-day timeline of your planned trips and destination stops.
          </p>
        </div>

        {/* Action Controls: Today + Prev/Next + View Mode Toggle */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {/* Today Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleToday}
            className="text-xs font-semibold border-border hover:bg-surface-hover min-h-[38px] px-3 cursor-pointer shadow-2xs"
          >
            <CalendarDays className="w-3.5 h-3.5 text-primary mr-1.5" />
            <span>Today</span>
          </Button>

          {/* Month Navigation Arrows */}
          <div className="inline-flex items-center rounded-[10px] bg-surface border border-border p-1 shadow-2xs">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous month"
              className="p-1.5 rounded-[7px] text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 text-xs sm:text-sm font-bold text-foreground min-w-[130px] sm:min-w-[150px] text-center select-none font-mono">
              {monthTitle}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next month"
              className="p-1.5 rounded-[7px] text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer min-h-[32px] min-w-[32px] flex items-center justify-center"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Grid vs Agenda Toggle (Mobile and Desktop) */}
          <div className="inline-flex p-1 rounded-[10px] bg-surface border border-border text-xs">
            <button
              type="button"
              onClick={() => setViewFormat("grid")}
              aria-label="Calendar Grid View"
              className={`p-1.5 px-2.5 rounded-[7px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewFormat === "grid"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => setViewFormat("agenda")}
              aria-label="Agenda List View"
              className={`p-1.5 px-2.5 rounded-[7px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewFormat === "agenda"
                  ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Agenda</span>
            </button>
          </div>

          {/* New Trip Shortcut */}
          <Link href="/trips/create">
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="gap-1.5 text-xs min-h-[38px] shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Plan Trip</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Loading State */}
      {isLoading || isAuthLoading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-10 bg-surface rounded-[10px] border border-border" />
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <div
                key={i}
                className="h-24 bg-surface rounded-[10px] border border-border"
              />
            ))}
          </div>
        </div>
      ) : isError ? (
        /* Error State */
        <Card className="p-8 text-center space-y-4 border-destructive/30 bg-destructive/5">
          <div className="p-3 rounded-full bg-destructive/10 text-destructive w-12 h-12 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Failed to Load Calendar
            </h3>
            <p className="text-xs text-muted-foreground">
              There was an error communicating with the server.
            </p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="gap-1.5 text-xs text-primary"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </Button>
        </Card>
      ) : (
        /* Main Calendar Experience */
        <AnimatePresence mode="wait" custom={slideDirection}>
          <motion.div
            key={`${year}-${month}-${viewFormat}`}
            custom={slideDirection}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.18, ease: "easeInOut" }}
            className="space-y-4"
          >
            {/* =========================================================================
                A. DESKTOP / TABLET 7-DAY CALENDAR GRID VIEW
                ========================================================================= */}
            {viewFormat === "grid" && (
              <div className="space-y-2">
                {/* Day-of-Week Column Headers */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-[11px] sm:text-xs font-mono font-bold text-muted-foreground uppercase py-2 bg-surface-subtle/50 rounded-[10px] border border-border select-none">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="py-0.5">
                      {day}
                    </div>
                  ))}
                </div>

                {/* 7-Day Grid Matrix */}
                <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                  {calendarGrid.map((cell) => {
                    // Find trips that span this date
                    const activeTrips = processedTrips.filter((t) => {
                      if (!t.startStr || !t.endStr) return false;
                      return cell.dateStr >= t.startStr && cell.dateStr <= t.endStr;
                    });

                    return (
                      <div
                        key={cell.dateStr}
                        className={`min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 rounded-[10px] border flex flex-col justify-between transition-colors ${
                          cell.isCurrentMonth
                            ? "bg-surface border-border hover:border-primary/40"
                            : "bg-surface-subtle/30 border-border/40 text-muted-foreground/50"
                        } ${
                          cell.isToday
                            ? "ring-2 ring-primary ring-offset-1 ring-offset-background border-primary"
                            : ""
                        }`}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-mono font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                              cell.isToday
                                ? "bg-primary text-primary-foreground font-bold"
                                : cell.isCurrentMonth
                                ? "text-foreground"
                                : "text-muted-foreground/60"
                            }`}
                          >
                            {cell.dayNumber}
                          </span>

                          {cell.isToday && (
                            <span className="hidden sm:inline text-[9px] font-mono font-bold uppercase text-primary tracking-wider">
                              Today
                            </span>
                          )}
                        </div>

                        {/* Multi-Day Trip Spanning Chips */}
                        <div className="space-y-1 my-1 overflow-hidden">
                          {activeTrips.slice(0, 2).map((trip) => {
                            const isStart = cell.dateStr === trip.startStr;
                            const isEnd = cell.dateStr === trip.endStr;
                            const isSingleDay = trip.startStr === trip.endStr;

                            // Calculate styling based on span
                            let spanRadius = "rounded-[6px]";
                            if (!isSingleDay) {
                              if (isStart) {
                                spanRadius = "rounded-l-[6px] rounded-r-none border-r-0";
                              } else if (isEnd) {
                                spanRadius = "rounded-r-[6px] rounded-l-none border-l-0";
                              } else {
                                spanRadius = "rounded-none border-x-0";
                              }
                            }

                            return (
                              <Link
                                key={trip.id}
                                href={`/trips/${trip.id}/itinerary`}
                                title={`${trip.name} (${trip.startStr} – ${trip.endStr})`}
                                className={`block w-full text-left px-1.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-medium border transition-transform hover:scale-[1.02] cursor-pointer truncate ${trip.style.bg} ${trip.style.border} ${spanRadius}`}
                              >
                                <div className="flex items-center gap-1 min-w-0">
                                  {isStart && (
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${trip.style.indicator}`}
                                    />
                                  )}
                                  <span className="truncate font-semibold">
                                    {isStart || !cell.isCurrentMonth || cell.date.getDay() === 0
                                      ? trip.name
                                      : "·"}
                                  </span>
                                </div>
                              </Link>
                            );
                          })}

                          {activeTrips.length > 2 && (
                            <span className="text-[9px] font-mono text-muted-foreground block text-right px-1">
                              +{activeTrips.length - 2} more
                            </span>
                          )}
                        </div>

                        <div className="h-0.5" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* =========================================================================
                B. AGENDA / TIMELINE LIST VIEW (Mobile Friendly & Detailed)
                ========================================================================= */}
            {viewFormat === "agenda" && (
              <div className="space-y-4">
                {monthTrips.length === 0 ? (
                  <Card className="p-10 text-center space-y-4 border-dashed border-border bg-surface-subtle/40 rounded-[14px]">
                    <div className="p-3 rounded-full bg-primary/10 text-primary w-12 h-12 mx-auto flex items-center justify-center">
                      <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-foreground">
                        No Trips in {monthTitle}
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        You have no trips scheduled for this month. Plan a new journey or navigate between months.
                      </p>
                    </div>
                    <Link href="/trips/create">
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        className="gap-1.5 text-xs text-primary-foreground"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Plan New Trip</span>
                      </Button>
                    </Link>
                  </Card>
                ) : (
                  <div className="space-y-3.5">
                    {monthTrips.map((trip) => {
                      const startFormatted = trip.startStr
                        ? new Date(trip.startStr).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Flexible Date";

                      const endFormatted = trip.endStr
                        ? new Date(trip.endStr).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : null;

                      const stopsList = Array.isArray(trip.stops) ? trip.stops : [];

                      return (
                        <Card
                          key={trip.id}
                          className="border border-border bg-surface hover:border-primary/50 transition-all rounded-[14px] shadow-xs overflow-hidden group"
                        >
                          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="space-y-2 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className={`px-2.5 py-0.5 rounded-[6px] text-xs font-mono font-bold border ${trip.style.bg} ${trip.style.border}`}
                                >
                                  {startFormatted}
                                  {endFormatted && ` – ${endFormatted}`}
                                </span>

                                <span className="px-2 py-0.5 rounded-[6px] bg-surface-subtle border border-border text-[11px] font-mono text-muted-foreground">
                                  {stopsList.length} Stop{stopsList.length === 1 ? "" : "s"}
                                </span>
                              </div>

                              <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                {trip.name}
                              </h3>

                              {trip.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                  {trip.description}
                                </p>
                              )}

                              {/* Route Destinations */}
                              {stopsList.length > 0 && (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono pt-1 flex-wrap">
                                  <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                                  <span>
                                    {stopsList.map((s) => s.cityName).join(" → ")}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Action Link to Itinerary */}
                            <div className="shrink-0 self-end sm:self-center">
                              <Link href={`/trips/${trip.id}/itinerary`}>
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="gap-1.5 text-xs text-primary border border-primary/30 hover:bg-primary/10 min-h-[40px] px-4 font-semibold cursor-pointer"
                                >
                                  <span>View Itinerary</span>
                                  <ArrowRight className="w-3.5 h-3.5" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 3. Empty Month Summary Bar when in Grid view with zero trips */}
            {viewFormat === "grid" && monthTrips.length === 0 && (
              <div className="p-4 rounded-[12px] bg-surface border border-border/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-primary shrink-0" />
                  <span>
                    No trips currently scheduled in {monthTitle}.
                  </span>
                </div>

                <Link
                  href="/trips/create"
                  className="text-primary font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Plan a trip for this month</span>
                </Link>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
