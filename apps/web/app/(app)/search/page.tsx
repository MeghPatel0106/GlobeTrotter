"use client";

import * as React from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Compass,
  ArrowRight,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
} from "@globetrotter/ui";

const categories = [
  { id: "all", label: "All Regions" },
  { id: "heritage", label: "Cultural & Heritage" },
  { id: "culinary", label: "Culinary & Wine" },
  { id: "nature", label: "Coastal & Nature" },
  { id: "architecture", label: "Architecture" },
];

const featuredDestinations = [
  {
    name: "Kyoto",
    region: "Kansai, Japan",
    coordinates: "35°01'N 135°46'E",
    description:
      "Ancient imperial temples, serene bamboo groves, traditional machiya teahouses, and centuries-old artisan traditions.",
    tag: "Historic & Zen",
    duration: "4–6 Days",
  },
  {
    name: "Florence",
    region: "Tuscany, Italy",
    coordinates: "43°46'N 11°15'E",
    description:
      "Renaissance masterpieces, cobblestone corridors, sunset views over the Ponte Vecchio, and Tuscan culinary heritage.",
    tag: "Art & Renaissance",
    duration: "3–5 Days",
  },
  {
    name: "Oaxaca",
    region: "Oaxaca, Mexico",
    coordinates: "17°03'N 96°43'E",
    description:
      "Rich Zapotec architecture, indigenous craft markets, renowned mole varieties, and vibrant artisanal mezcal distilleries.",
    tag: "Culinary & Crafts",
    duration: "4–5 Days",
  },
  {
    name: "Barcelona",
    region: "Catalonia, Spain",
    coordinates: "41°23'N 2°10'E",
    description:
      "Modernist Gaudi marvels, sun-drenched Mediterranean coastline, Gothic quarters, and bustling neighborhood tapas bars.",
    tag: "Modernism & Coast",
    duration: "3–5 Days",
  },
  {
    name: "Reykjavik",
    region: "Capital Region, Iceland",
    coordinates: "64°08'N 21°56'W",
    description:
      "Gateway to geothermal lagoons, volcanic lava fields, dramatic cascading waterfalls, and nocturnal aurora displays.",
    tag: "Volcanic & Aurora",
    duration: "5–7 Days",
  },
  {
    name: "Cape Town",
    region: "Western Cape, South Africa",
    coordinates: "33°55'S 18°25'E",
    description:
      "Dramatic Table Mountain panoramas, rugged peninsula coastlines, world-class vineyard valleys, and coastal penguin colonies.",
    tag: "Coastal & Mountains",
    duration: "4–6 Days",
  },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [activeCategory, setActiveCategory] = React.useState("all");

  const filteredDestinations = featuredDestinations.filter((dest) => {
    const matchesSearch =
      dest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.region.toLowerCase().includes(searchQuery.toLowerCase()) ||
      dest.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-border pb-5">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary mb-1">
          <Compass className="w-3.5 h-3.5" />
          <span>Cartography & Discovery</span>
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Explore Destinations
        </h1>
        <p className="text-muted-foreground text-sm mt-1 max-w-2xl">
          Search historic cities, cultural highlights, and multi-city route stops
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
            placeholder="Search destination, country, or keyword (e.g. Kyoto, Tuscany, temples)..."
            aria-label="Search destinations"
            className="w-full h-11 pl-11 pr-4 rounded-[8px] bg-input-bg border border-input-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-colors cursor-pointer min-h-[38px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  isActive
                    ? "bg-surface-elevated text-primary font-semibold border border-primary/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-surface-hover border border-transparent"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Destination Grid */}
      {filteredDestinations.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDestinations.map((dest) => (
            <Card
              key={dest.name}
              className="border-border bg-surface hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2 text-xs font-mono text-muted-foreground mb-1">
                  <span className="flex items-center gap-1 text-primary font-medium">
                    <MapPin className="w-3.5 h-3.5" />
                    {dest.region}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {dest.coordinates}
                  </span>
                </div>
                <CardTitle className="text-xl text-foreground">{dest.name}</CardTitle>
                <CardDescription className="text-xs text-muted-foreground line-clamp-3 mt-1.5">
                  {dest.description}
                </CardDescription>
              </CardHeader>

              <CardFooter className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[11px] font-mono text-foreground">
                    {dest.tag}
                  </span>
                  <span className="text-[11px] font-mono text-muted-foreground">
                    {dest.duration}
                  </span>
                </div>
                <Link
                  href="/trips/mine"
                  className="text-primary hover:underline font-medium flex items-center gap-1 p-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                >
                  <span>Add to Trip</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border bg-surface text-center py-12 px-6">
          <CardContent className="max-w-md mx-auto flex flex-col items-center gap-3">
            <Compass className="w-10 h-10 text-primary/60" />
            <h2 className="text-lg font-semibold text-foreground">
              No matching destinations found
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm">
              We couldn&apos;t find any destination matching &ldquo;{searchQuery}&rdquo;.
              Try searching for a different city or clearing the search bar.
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSearchQuery("")}
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
