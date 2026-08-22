"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Compass,
  Plus,
  Search,
  MapPin,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  SlidersHorizontal,
  RotateCcw,
  Clock,
  Navigation,
  Globe,
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
import { useAuth } from "@/lib/auth-context";
import { citiesApi, tripsApi, City, Trip } from "@/lib/api";

export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isAuthenticated } = useAuth();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"popularity" | "cost" | "name">("popularity");
  const [filterRegion, setFilterRegion] = React.useState<string>("all");

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Fetch top destinations from real MongoDB
  const {
    data: topCities = [],
    isLoading: isCitiesLoading,
    isError: isCitiesError,
    refetch: refetchCities,
  } = useQuery({
    queryKey: ["cities", "top"],
    queryFn: () => citiesApi.getTop(6),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch user's recent trips from real MongoDB
  const {
    data: recentTrips = [],
    isLoading: isTripsLoading,
    isError: isTripsError,
    refetch: refetchTrips,
  } = useQuery({
    queryKey: ["trips", "recent"],
    queryFn: () => tripsApi.getUserTrips(3, "recent"),
    enabled: isAuthenticated,
    staleTime: 60 * 1000,
  });

  // Filtered and sorted cities
  const displayedCities = React.useMemo(() => {
    let result = [...topCities];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.country.toLowerCase().includes(q) ||
          (c.description && c.description.toLowerCase().includes(q))
      );
    }

    if (filterRegion !== "all") {
      result = result.filter((c) => {
        if (filterRegion === "asia") return ["Japan", "India", "Thailand"].includes(c.country);
        if (filterRegion === "europe") return ["Italy", "Spain", "Iceland", "France"].includes(c.country);
        if (filterRegion === "americas") return ["Mexico", "USA", "Argentina"].includes(c.country);
        if (filterRegion === "africa") return ["South Africa", "Morocco"].includes(c.country);
        return true;
      });
    }

    result.sort((a, b) => {
      if (sortBy === "popularity") return (b.popularityScore || 0) - (a.popularityScore || 0);
      if (sortBy === "cost") return (a.costIndex || 0) - (b.costIndex || 0);
      return a.name.localeCompare(b.name);
    });

    return result;
  }, [topCities, searchQuery, sortBy, filterRegion]);

  if (isAuthLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Compass className="w-9 h-9 text-primary animate-spin" />
        <span className="text-sm font-mono text-muted-foreground">
          Decrypting session journal...
        </span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="space-y-10 pb-12">
      {/* 1. HERO / EDITORIAL BANNER */}
      <section className="relative overflow-hidden rounded-[16px] bg-surface border border-border p-6 sm:p-10 shadow-sm">
        {/* Subtle Decorative Background Compass */}
        <div className="absolute right-0 bottom-0 opacity-[0.04] pointer-events-none transform translate-x-12 translate-y-12">
          <Compass className="w-80 h-80 text-primary" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>EXPEDITION DISPATCH · ATLAS & INK</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-foreground leading-[1.15]">
              Where will your next journey take you,{" "}
              <span className="text-primary underline decoration-primary/30 underline-offset-8">
                {user.firstName}
              </span>
              ?
            </h1>

            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              Curate multi-city voyages, explore vetted cultural stops, and chronicle
              day-by-day itineraries with personalized budgets.
            </p>
          </div>

          {/* Primary Action Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <Link href="/trips/create" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto gap-2.5 shadow-md hover:shadow-lg font-semibold min-h-[48px]"
              >
                <Plus className="w-5 h-5" />
                <span>Plan a Trip</span>
              </Button>
            </Link>

            <Link href="/search" className="w-full sm:w-auto">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto gap-2 border-border hover:border-primary/40 min-h-[48px]"
              >
                <Compass className="w-4 h-4 text-primary" />
                <span>Explore Cities</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 2. PREVIOUS / ONGOING EXPEDITIONS SECTION */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Your Expeditions
            </h2>
          </div>
          {recentTrips.length > 0 && (
            <Link
              href="/trips/mine"
              className="text-xs font-mono text-primary hover:underline flex items-center gap-1"
            >
              <span>View all trips</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {/* Trips Data State */}
        {isTripsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="h-44 rounded-[14px] bg-surface-subtle border border-border animate-pulse p-6 space-y-3"
              >
                <div className="h-4 w-2/3 bg-surface-elevated rounded" />
                <div className="h-3 w-1/2 bg-surface-elevated rounded" />
                <div className="h-3 w-4/5 bg-surface-elevated rounded pt-4" />
              </div>
            ))}
          </div>
        ) : isTripsError ? (
          <div className="p-6 rounded-[14px] bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between gap-4">
            <span>Failed to load your expedition logs from MongoDB.</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchTrips()}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        ) : recentTrips.length === 0 ? (
          /* Empty State for New Users */
          <Card className="border-border bg-surface text-center py-10 px-6">
            <CardContent className="max-w-md mx-auto flex flex-col items-center gap-3.5">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
                <Navigation className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  No trips yet — plan your first one
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Start mapping out your next destination, organize activities, and watch your daily budget come together.
                </p>
              </div>
              <Link href="/trips/create" className="pt-2">
                <Button variant="primary" size="md" className="gap-2">
                  <Plus className="w-4 h-4" />
                  <span>Start Your First Journey</span>
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          /* Recent Trips Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {recentTrips.map((trip) => {
              const startFormatted = trip.startDate
                ? new Date(trip.startDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "TBD";
              const endFormatted = trip.endDate
                ? new Date(trip.endDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "";
              const stopCount = trip.stops?.length || 0;
              const firstStop = trip.stops?.[0];

              return (
                <Card
                  key={trip.id}
                  className="border-border bg-surface hover:border-primary/50 transition-colors flex flex-col justify-between group"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono text-muted-foreground mb-1">
                      <span className="flex items-center gap-1 text-primary font-medium">
                        <MapPin className="w-3.5 h-3.5" />
                        {firstStop ? `${firstStop.cityName}, ${firstStop.country}` : "Multi-city"}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[10px] uppercase font-mono text-primary">
                        {trip.status}
                      </span>
                    </div>

                    <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">
                      {trip.name}
                    </CardTitle>

                    <CardDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {startFormatted} {endFormatted ? `– ${endFormatted}` : ""}
                      </span>
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="pt-3 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-mono text-muted-foreground">
                      {stopCount} {stopCount === 1 ? "Stop" : "Stops"}
                    </span>
                    <Link
                      href={`/trips/mine`}
                      className="text-primary hover:underline font-medium flex items-center gap-1 p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                    >
                      <span>Open Journal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. TOP REGIONAL SELECTIONS & DISCOVERY SECTION */}
      <section className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" />
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Top Regional Selections
            </h2>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            Curated historical & cultural hubs
          </span>
        </div>

        {/* Search & Filter Controls Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Live Search Input */}
          <div className="sm:col-span-6 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by city, country, or landmark..."
              aria-label="Filter top destinations"
              className="w-full h-10 pl-10 pr-4 rounded-[8px] bg-input-bg border border-input-border text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
            />
          </div>

          {/* Region Filter */}
          <div className="sm:col-span-3">
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              aria-label="Filter by region"
              className="w-full h-10 px-3 rounded-[8px] bg-input-bg border border-input-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="all">All Regions</option>
              <option value="asia">Asia & Pacific</option>
              <option value="europe">Europe</option>
              <option value="americas">Americas</option>
              <option value="africa">Africa</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort destinations"
              className="w-full h-10 px-3 rounded-[8px] bg-input-bg border border-input-border text-xs sm:text-sm text-foreground focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="popularity">Sort by: Popularity</option>
              <option value="cost">Sort by: Budget Level</option>
              <option value="name">Sort by: Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* City Cards Grid with Staggered Motion */}
        {isCitiesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-80 rounded-[14px] bg-surface-subtle border border-border animate-pulse flex flex-col justify-between p-5"
              >
                <div className="h-32 bg-surface-elevated rounded-lg mb-3" />
                <div className="h-4 w-3/4 bg-surface-elevated rounded mb-2" />
                <div className="h-3 w-1/2 bg-surface-elevated rounded" />
              </div>
            ))}
          </div>
        ) : isCitiesError ? (
          <div className="p-6 rounded-[14px] bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between gap-4">
            <span>Failed to load curated destinations from MongoDB database.</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => refetchCities()}
              className="text-xs gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </Button>
          </div>
        ) : displayedCities.length === 0 ? (
          <Card className="border-border bg-surface text-center py-10 px-6">
            <CardContent className="max-w-md mx-auto flex flex-col items-center gap-3">
              <Compass className="w-8 h-8 text-primary/60" />
              <h3 className="text-base font-semibold text-foreground">
                No matching destinations found
              </h3>
              <p className="text-xs text-muted-foreground">
                Try searching for a different region or clearing the filter query.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery("");
                  setFilterRegion("all");
                }}
                className="text-xs mt-1"
              >
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          <MotionStaggerContainer
            staggerDelay={0.06}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayedCities.map((city) => {
              const costBadges = Array.from({ length: city.costIndex || 3 }, () => "$").join("");

              return (
                <MotionFadeRise key={city.id}>
                  <Card className="overflow-hidden border-border bg-surface hover:border-primary/40 transition-all duration-200 flex flex-col justify-between h-full group">
                    {/* Destination Visual Banner */}
                    {city.imageUrl && (
                      <div className="relative h-44 w-full overflow-hidden bg-surface-subtle">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={city.imageUrl}
                          alt={city.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs border border-white/20 text-white text-[11px] font-mono font-medium">
                          {city.popularityScore}% Popularity
                        </div>
                        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 text-white text-xs font-mono font-semibold drop-shadow-sm">
                          <MapPin className="w-3.5 h-3.5 text-primary" />
                          <span>{city.country}</span>
                        </div>
                      </div>
                    )}

                    <CardHeader className="p-5 pb-3">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <CardTitle className="text-xl group-hover:text-primary transition-colors">
                          {city.name}
                        </CardTitle>
                        <span className="font-mono text-xs text-primary font-bold">
                          {costBadges}
                        </span>
                      </div>

                      <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {city.description}
                      </CardDescription>
                    </CardHeader>

                    <CardFooter className="p-5 pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="font-mono text-[11px] text-muted-foreground">
                        Atlas & Ink Pick
                      </span>

                      <Link
                        href={`/trips/create?cityId=${city.id}&cityName=${encodeURIComponent(city.name)}&country=${encodeURIComponent(city.country)}`}
                        className="w-auto"
                      >
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-1.5 text-xs h-9 px-3"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Plan Voyage</span>
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                </MotionFadeRise>
              );
            })}
          </MotionStaggerContainer>
        )}
      </section>
    </div>
  );
}
