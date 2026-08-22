"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Compass,
  Plus,
  Route,
  MapPin,
  Calendar,
  ArrowRight,
  RotateCcw,
  Sparkles,
  Globe2,
  Lock,
  EyeOff,
  Share2,
  Loader2,
  Trash2,
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
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState("all");
  const [deletingTrip, setDeletingTrip] = React.useState<Trip | null>(null);

  const {
    data: trips = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["trips", "mine"],
    queryFn: () => tripsApi.getUserTrips(50, "recent"),
    enabled: isAuthenticated,
    staleTime: 20 * 1000,
  });

  const toggleCommunityMutation = useMutation({
    mutationFn: async ({ tripId, action }: { tripId: string; action: "publish" | "unpublish" }) => {
      if (action === "publish") {
        return tripsApi.publishToCommunity(tripId);
      } else {
        return tripsApi.unpublishFromCommunity(tripId);
      }
    },
    onSuccess: (_, variables) => {
      toast.success(
        variables.action === "publish"
          ? "Trip published to Community!"
          : "Trip removed from Community."
      );
      queryClient.invalidateQueries({ queryKey: ["trips", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
    onError: () => {
      toast.error("Failed to update community status. Please try again.");
    },
  });

  const deleteTripMutation = useMutation({
    mutationFn: (tripId: string) => tripsApi.deleteTrip(tripId),
    onSuccess: () => {
      toast.success("Trip cancelled and permanently deleted from database.");
      setDeletingTrip(null);
      queryClient.invalidateQueries({ queryKey: ["trips", "mine"] });
      queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });
    },
    onError: () => {
      toast.error("Failed to delete trip. Please try again.");
    },
  });

  const handleToggleCommunity = (
    e: React.MouseEvent,
    tripId: string,
    action: "publish" | "unpublish"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    toggleCommunityMutation.mutate({ tripId, action });
  };

  const handleOpenDelete = (e: React.MouseEvent, trip: Trip) => {
    e.preventDefault();
    e.stopPropagation();
    setDeletingTrip(trip);
  };

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
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary mb-1 font-bold">
            <Route className="w-3.5 h-3.5" />
            <span>My Trips · Manager</span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            My Trips
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1">
            View and manage your multi-city trips, itineraries, budgets, and community shared trips.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 cursor-pointer min-h-[38px]"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/trips/create">
            <Button variant="primary" size="md" className="gap-2 shadow-xs cursor-pointer min-h-[38px]">
              <Plus className="w-4 h-4" />
              <span>Plan New Trip</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2 overflow-x-auto no-scrollbar">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-[8px] text-xs font-mono transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === tab.id
                ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                : "text-muted-foreground hover:text-foreground hover:bg-surface-hover"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Feed */}
      {isLoading ? (
        /* Loading Skeletons */
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
          <span>Failed to load your trips from database.</span>
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
                  ? "No trips planned yet"
                  : `No ${activeTab} trips found`}
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {activeTab === "all"
                  ? "Start planning your first trip. Choose destinations, customize your day-by-day itinerary, and track your travel expenses."
                  : "Switch to 'All Trips' or plan a new trip to add it here."}
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
            const isPublic = trip.visibility === "PUBLIC";
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
                <Card className="h-full border-border bg-surface hover:border-primary/50 transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs">
                  <Link href={`/trips/${trip.id}/itinerary`} className="block group flex-1 p-5 space-y-3">
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between gap-2">
                      {firstStop ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary truncate max-w-[55%]">
                          <MapPin className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {firstStop.cityName}, {firstStop.country}
                          </span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-mono">
                          <Compass className="w-3.5 h-3.5" />
                          Multi-City Trip
                        </span>
                      )}

                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* Community Badge */}
                        {isPublic ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-success/15 border border-success/30 text-success flex items-center gap-1">
                            <Globe2 className="w-3 h-3" />
                            <span>Community</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-surface-elevated border border-border text-muted-foreground flex items-center gap-1">
                            <Lock className="w-3 h-3" />
                            <span>Private</span>
                          </span>
                        )}

                        {/* Status Badge */}
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
                    </div>

                    {/* Trip Title */}
                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                      {trip.name}
                    </CardTitle>

                    {/* Date Range */}
                    {startDate && endDate && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                        <Calendar className="w-3.5 h-3.5 shrink-0 text-primary/70" />
                        <span>
                          {startDate} – {endDate}
                        </span>
                      </div>
                    )}

                    {trip.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {trip.description}
                      </p>
                    )}
                  </Link>

                  {/* Card Footer: Community Toggle, Cancel/Delete Button & View Itinerary CTA */}
                  <CardFooter className="p-3.5 sm:p-4 pt-3 border-t border-border bg-surface-subtle/30 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
                    <div className="flex items-center gap-2">
                      {/* Dedicated Community Publish / Remove Button */}
                      {isPublic ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={(e) => handleToggleCommunity(e, trip.id, "unpublish")}
                          disabled={toggleCommunityMutation.isPending}
                          className="h-8 px-2 text-xs gap-1 border-border hover:border-destructive/40 hover:text-destructive hover:bg-destructive/10 text-muted-foreground transition-colors cursor-pointer min-h-[34px]"
                          title="Remove from Community feed"
                        >
                          {toggleCommunityMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-destructive/80" />
                          )}
                          <span>Remove</span>
                        </Button>
                      ) : (
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={(e) => handleToggleCommunity(e, trip.id, "publish")}
                          disabled={toggleCommunityMutation.isPending}
                          className="h-8 px-2 text-xs gap-1 bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 font-semibold transition-colors cursor-pointer min-h-[34px]"
                          title="Publish to Community feed"
                        >
                          {toggleCommunityMutation.isPending ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Globe2 className="w-3 h-3 text-primary" />
                          )}
                          <span>Publish</span>
                        </Button>
                      )}

                      {/* Cancel / Delete Trip Button */}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleOpenDelete(e, trip)}
                        className="h-8 px-2 text-xs gap-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer min-h-[34px]"
                        title="Cancel & delete trip permanently"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel Trip</span>
                      </Button>
                    </div>

                    {/* View Itinerary Link */}
                    <Link
                      href={`/trips/${trip.id}/itinerary`}
                      className="text-primary font-semibold flex items-center gap-1 hover:underline ml-auto py-1"
                    >
                      <span>View Itinerary</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </CardFooter>
                </Card>
              </MotionFadeRise>
            );
          })}
        </MotionStaggerContainer>
      )}

      {/* CANCEL & DELETE TRIP CONFIRMATION MODAL */}
      {deletingTrip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-[16px] bg-surface border border-border p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-destructive/15 text-destructive shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">Cancel & Delete Trip?</h3>
                <p className="text-xs text-muted-foreground">Permanent database removal</p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Are you sure you want to cancel and permanently delete <strong className="text-foreground">“{deletingTrip.name}”</strong>? This action will remove all itinerary days, scheduled activities, and recorded expenses from the database.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setDeletingTrip(null)}
                disabled={deleteTripMutation.isPending}
                className="cursor-pointer"
              >
                Keep Trip
              </Button>

              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => deleteTripMutation.mutate(deletingTrip.id)}
                disabled={deleteTripMutation.isPending}
                className="gap-1.5 cursor-pointer"
              >
                {deleteTripMutation.isPending && (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                )}
                <span>Delete Trip</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
