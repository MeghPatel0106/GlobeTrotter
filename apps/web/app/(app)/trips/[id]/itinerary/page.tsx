"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  MapPin,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  DollarSign,
  ChevronRight,
  Plus,
  Route,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  RouteThreadDecoration,
} from "@globetrotter/ui";
import { tripsApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

export default function TripItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?returnTo=/trips/${tripId}/itinerary`);
    }
  }, [isAuthLoading, isAuthenticated, router, tripId]);

  const {
    data: trip,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => tripsApi.getById(tripId),
    enabled: !!tripId && isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Compass className="w-8 h-8 text-primary animate-spin" />
        <span className="text-sm font-mono text-muted-foreground">
          Loading expedition itinerary...
        </span>
      </div>
    );
  }

  if (isError || !trip) {
    return (
      <Card className="border-border bg-surface text-center p-8 max-w-lg mx-auto my-12">
        <CardContent className="space-y-4">
          <Compass className="w-10 h-10 text-destructive mx-auto" />
          <h2 className="text-xl font-bold text-foreground">
            Expedition Not Found
          </h2>
          <p className="text-xs text-muted-foreground">
            We could not retrieve the itinerary details for this trip ID from MongoDB.
          </p>
          <Link href="/dashboard">
            <Button variant="primary" size="md">
              Return to Dashboard
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const startFormatted = trip.startDate
    ? new Date(trip.startDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "TBD";

  const endFormatted = trip.endDate
    ? new Date(trip.endDate).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "TBD";

  const firstStop = trip.stops?.[0];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/trips/mine" className="hover:text-foreground transition-colors">
          Expeditions
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-semibold truncate">{trip.name}</span>
      </nav>

      {/* Hero Card / Trip Header */}
      <div className="relative overflow-hidden rounded-[16px] bg-surface border border-border p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-success/15 border border-success/30 text-success text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>EXPEDITION INITIALIZED · STATUS: {trip.status.toUpperCase()}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              {trip.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-1">
              {firstStop && (
                <span className="flex items-center gap-1 text-primary">
                  <MapPin className="w-3.5 h-3.5" />
                  {firstStop.cityName}, {firstStop.country}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {startFormatted} – {endFormatted}
              </span>
              {trip.totalBudgetEstimate && (
                <span className="flex items-center gap-1 text-success">
                  <DollarSign className="w-3.5 h-3.5" />
                  Budget: ${trip.totalBudgetEstimate.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button variant="secondary" size="md" className="gap-1.5 text-xs">
                <span>Dashboard</span>
              </Button>
            </Link>
            <Link href="/trips/mine">
              <Button variant="primary" size="md" className="gap-1.5 text-xs">
                <span>My Expeditions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <RouteThreadDecoration />

      {/* Initialized Gateway Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Route className="w-4 h-4 text-primary" />
            <h2 className="text-xl font-bold text-foreground">
              Gateway Stop & Schedule
            </h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Stop 1 of {trip.stops?.length || 1}
          </span>
        </div>

        {firstStop ? (
          <Card className="border-border bg-surface">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl text-primary">
                  {firstStop.cityName}, {firstStop.country}
                </CardTitle>
                <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-surface-subtle border border-border text-foreground">
                  Order: #{firstStop.orderIndex + 1}
                </span>
              </div>
              <CardDescription className="text-xs text-muted-foreground">
                Primary gateway stop created in MongoDB. Day-by-day scheduling and drag-and-drop activity assignment will unlock in Phase 3.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2 text-xs text-muted-foreground space-y-2">
              <div className="p-3.5 rounded-[8px] bg-surface-subtle border border-border flex items-center justify-between">
                <span className="font-mono">Section Timeline:</span>
                <span className="font-mono text-foreground font-medium">
                  {startFormatted} – {endFormatted}
                </span>
              </div>
            </CardContent>
          </Card>
        ) : (
          <p className="text-xs text-muted-foreground">No stops recorded yet.</p>
        )}
      </div>
    </div>
  );
}
