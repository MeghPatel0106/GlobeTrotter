"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Plus,
  Route,
  MapPin,
  Calendar,
  DollarSign,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  MotionStaggerContainer,
  MotionFadeRise,
} from "@globetrotter/ui";
import { tripsApi, Trip } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

const filterTabs = [
  { id: "all", label: "All Trips" },
  { id: "upcoming", label: "Upcoming & Draft" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
];

export default function MyTripsPage() {
  const { isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = React.useState("all");

  const {
    data: trips = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["trips", "mine"],
    queryFn: () => tripsApi.getUserTrips(50, "recent"),
    enabled: isAuthenticated,
    staleTime: 30 * 1000,
  });

  const now = new Date();

  // Filter trips based on tab
  const filteredTrips = React.useMemo(() => {
    if (!trips || trips.length === 0) return [];

    return trips.filter((trip) => {
      if (activeTab === "all") return true;

      const startDate = trip.startDate ? new Date(trip.startDate) : null;
      const endDate = trip.endDate ? new Date(trip.endDate) : null;

      if (activeTab === "upcoming") {
        return (
          trip.status === "DRAFT" ||
          trip.status === "PLANNED" ||
          (startDate && startDate > now)
        );
      }

      if (activeTab === "ongoing") {
        return (
          trip.status === "ONGOING" ||
          (startDate && endDate && startDate <= now && endDate >= now)
        );
      }

      if (activeTab === "completed") {
        return (
          trip.status === "COMPLETED" ||
          (endDate && endDate < now && trip.status !== "DRAFT")
        );
      }

      return true;
    });
  }, [trips, activeTab, now]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary mb-1">
            <Route className="w-3.5 h-3.5" />
            <span>Expeditions · Logbook</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            My Expeditions
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-xl">
            Manage your planned routes, ongoing itineraries, and archived journeys
            across the globe.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/trips/create">
            <Button variant="primary" size="md" className="gap-2 shrink-0">
              <Plus className="w-4 h-4" />
              <span>Plan Expedition</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {filterTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-150 cursor-pointer min-h-[38px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? "bg-surface text-foreground font-semibold border border-primary/50 shadow-xs dark:bg-surface-elevated dark:text-primary dark:border-primary/30"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-transparent"
              }`}
            >
              {tab.label}
              {trips.length > 0 && tab.id === "all" && (
                <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-primary/15 text-primary text-[10px] font-mono">
                  {trips.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        /* Shimmer Loading Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-56 rounded-[14px] bg-surface border border-border animate-pulse p-6 space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="h-3 w-1/3 bg-surface-elevated rounded" />
                <div className="h-5 w-3/4 bg-surface-elevated rounded" />
                <div className="h-3 w-1/2 bg-surface-elevated rounded pt-2" />
              </div>
              <div className="h-4 w-full bg-surface-elevated rounded pt-4" />
            </div>
          ))}
        </div>
      ) : isError ? (
        /* Error State */
        <div className="p-6 rounded-[14px] bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between gap-4">
          <span>Failed to load your expedition logs from database.</span>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="text-xs gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </Button>
        </div>
      ) : filteredTrips.length === 0 ? (
        /* Empty State */
        <Card className="border-border bg-surface text-center py-12 px-4 sm:px-8">
          <CardContent className="max-w-md mx-auto flex flex-col items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
              <Compass className="w-7 h-7 animate-[spin_30s_linear_infinite]" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                {activeTab === "all"
                  ? "No expeditions logged yet"
                  : `No ${activeTab} expeditions found`}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {activeTab === "all"
                  ? "Your travel logbook is ready for your first voyage. Explore cities, customize multi-city day plans, and chronicle every memorable stop."
                  : "Switch to 'All Trips' or plan a new voyage to add itineraries to this tab."}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <Link href="/trips/create" className="w-full sm:w-auto">
                <Button variant="primary" size="md" className="w-full sm:w-auto gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Plan a Trip</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Populated Trip Cards Grid */
        <MotionStaggerContainer staggerDelay={0.06} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrips.map((trip) => {
            const firstStop = trip.stops?.[0];
            const startDate = trip.startDate
              ? new Date(trip.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : null;
            const endDate = trip.endDate
              ? new Date(trip.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : null;

            return (
              <MotionFadeRise key={trip.id}>
                <Link href={`/trips/${trip.id}/itinerary`} className="block group h-full">
                  <Card className="h-full border-border bg-surface hover:border-primary/50 transition-all duration-200 flex flex-col justify-between overflow-hidden">
                    <CardHeader className="space-y-2.5 pb-3">
                      {/* Top Meta Bar */}
                      <div className="flex items-center justify-between gap-2">
                        {firstStop ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {firstStop.cityName}, {firstStop.country}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
                            <Compass className="w-3.5 h-3.5" />
                            Multi-City Route
                          </span>
                        )}

                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold shrink-0 ${
                            trip.status === "DRAFT"
                              ? "bg-surface-subtle border border-border text-muted-foreground"
                              : trip.status === "ONGOING"
                              ? "bg-success/15 border border-success/30 text-success"
                              : trip.status === "COMPLETED"
                              ? "bg-muted text-muted-foreground"
                              : "bg-primary/15 border border-primary/30 text-primary"
                          }`}
                        >
                          {trip.status}
                        </span>
                      </div>

                      {/* Trip Title */}
                      <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                        {trip.name}
                      </CardTitle>

                      {/* Date Range */}
                      {startDate && endDate && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                          <Calendar className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {startDate} – {endDate}
                          </span>
                        </div>
                      )}
                    </CardHeader>

                    {/* Card Footer / Details */}
                    <CardFooter className="pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>
                        {trip.stops?.length || 1}{" "}
                        {trip.stops?.length === 1 ? "Stop" : "Stops"}
                      </span>

                      <span className="text-primary font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                        <span>Open Journal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              </MotionFadeRise>
            );
          })}
        </MotionStaggerContainer>
      )}
    </div>
  );
}
