"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  MapPin,
  Compass,
  ArrowRight,
  Sparkles,
  RotateCcw,
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
import { citiesApi, City } from "@/lib/api";
import { getCurrencySymbol } from "@/lib/currency";

const regionFilters = [
  { id: "all", label: "All Destinations" },
  { id: "india", label: "India" },
  { id: "asia", label: "Asia & Pacific" },
  { id: "europe", label: "Europe" },
  { id: "americas", label: "Americas" },
  { id: "africa", label: "Africa & Middle East" },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeRegion, setActiveRegion] = React.useState("all");

  // Fetch real destinations from MongoDB
  const {
    data: allCities = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["cities", "search", searchQuery],
    queryFn: () =>
      searchQuery.trim()
        ? citiesApi.search(searchQuery, 50)
        : citiesApi.getTop(50),
    staleTime: 60 * 1000,
  });

  const filteredDestinations = React.useMemo(() => {
    let list = [...allCities];

    if (activeRegion !== "all") {
      list = list.filter((c) => {
        if (activeRegion === "india") return c.country.toLowerCase() === "india";
        if (activeRegion === "asia")
          return ["japan", "thailand", "indonesia"].includes(c.country.toLowerCase());
        if (activeRegion === "europe")
          return ["italy", "spain", "iceland", "france"].includes(c.country.toLowerCase());
        if (activeRegion === "americas")
          return ["mexico", "usa"].includes(c.country.toLowerCase());
        if (activeRegion === "africa")
          return ["south africa", "egypt", "united arab emirates"].includes(c.country.toLowerCase());
        return true;
      });
    }

    return list;
  }, [allCities, activeRegion]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-5">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary mb-1">
          <Compass className="w-3.5 h-3.5" />
          <span>Cartography & Discovery · Catalog</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Explore Destinations
        </h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Search historic Indian cities, global cultural capitals, and curated multi-city stops
          for your next custom itinerary.
        </p>
      </div>

      {/* Search Input Bar & Filter Pills */}
      <div className="space-y-3">
        <div className="relative">
          <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search city, state, or country (e.g. Mumbai, Kerala, Rajasthan, Kyoto, Florence)..."
            aria-label="Search destinations"
            className="w-full h-11 pl-11 pr-4 rounded-[8px] bg-input-bg border border-input-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Region Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {regionFilters.map((tab) => {
            const isActive = activeRegion === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveRegion(tab.id)}
                className={`px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-all duration-150 cursor-pointer min-h-[38px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-surface text-foreground font-semibold border border-primary/50 shadow-xs dark:bg-surface-elevated dark:text-primary dark:border-primary/30"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-transparent"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Destinations Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-72 rounded-[14px] bg-surface border border-border animate-pulse p-4 space-y-3 flex flex-col justify-between"
            >
              <div className="h-36 bg-surface-elevated rounded-lg" />
              <div className="h-4 w-2/3 bg-surface-elevated rounded" />
              <div className="h-3 w-1/2 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="p-6 rounded-[14px] bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center justify-between gap-4">
          <span>Failed to load destinations from MongoDB catalog.</span>
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
      ) : filteredDestinations.length > 0 ? (
        <MotionStaggerContainer staggerDelay={0.04} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDestinations.map((dest) => {
            const sym = getCurrencySymbol(dest.country);
            const costBadges = sym.repeat(dest.costIndex || 2);

            return (
              <MotionFadeRise key={dest.id}>
                <Card className="border-border bg-surface hover:border-primary/40 transition-all duration-200 flex flex-col justify-between h-full group overflow-hidden">
                  {dest.imageUrl && (
                    <div className="relative h-40 w-full overflow-hidden bg-surface-subtle">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={dest.imageUrl}
                        alt={dest.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          // Clean fallback hiding broken img
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-mono font-medium">
                        {dest.popularityScore}% Popularity
                      </div>
                      <div className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 text-white text-xs font-mono font-semibold drop-shadow-sm">
                        <MapPin className="w-3.5 h-3.5 text-primary" />
                        <span>{dest.country}</span>
                      </div>
                    </div>
                  )}

                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <CardTitle className="text-lg text-foreground group-hover:text-primary transition-colors">
                        {dest.name}
                      </CardTitle>
                      <span className="font-mono text-xs text-primary font-bold">
                        {costBadges}
                      </span>
                    </div>
                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {dest.description}
                    </CardDescription>
                  </CardHeader>

                  <CardFooter className="p-4 pt-2 border-t border-border flex items-center justify-between text-xs">
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {dest.country === "India" ? "Incredible India" : "Global Atlas"}
                    </span>
                    <Link
                      href={`/trips/create?cityId=${dest.id}&cityName=${encodeURIComponent(dest.name)}&country=${encodeURIComponent(dest.country)}`}
                    >
                      <Button variant="primary" size="sm" className="h-8 px-3 text-xs gap-1">
                        <span>Plan Trip</span>
                        <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </MotionFadeRise>
            );
          })}
        </MotionStaggerContainer>
      ) : (
        <Card className="border-border bg-surface text-center py-12 px-6">
          <CardContent className="max-w-md mx-auto flex flex-col items-center gap-3">
            <Compass className="w-10 h-10 text-primary/60" />
            <h2 className="text-lg font-semibold text-foreground">
              No matching destinations found
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              We couldn&apos;t find any destination matching &ldquo;{searchQuery}&rdquo;.
              Try searching for a different city, state (e.g. Kerala, Rajasthan), or clear the search bar.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setActiveRegion("all");
              }}
              className="mt-2 text-xs"
            >
              Clear Search
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
