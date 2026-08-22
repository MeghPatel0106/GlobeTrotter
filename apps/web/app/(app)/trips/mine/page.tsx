"use client";

import * as React from "react";
import Link from "next/link";
import {
  Compass,
  Plus,
  Route,
} from "lucide-react";
import {
  Card,
  CardContent,
  Button,
} from "@globetrotter/ui";

const filterTabs = [
  { id: "all", label: "All Trips" },
  { id: "upcoming", label: "Upcoming" },
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
];

export default function MyTripsPage() {
  const [activeTab, setActiveTab] = React.useState("all");

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
            </button>
          );
        })}
      </div>

      {/* Empty State / Journey Invitation Card */}
      <Card className="border-border bg-surface text-center py-12 px-4 sm:px-8">
        <CardContent className="max-w-md mx-auto flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
            <Compass className="w-7 h-7 animate-[spin_30s_linear_infinite]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
              No expeditions logged yet
            </h2>
            <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
              Your travel logbook is ready for your first voyage. Explore cities,
              customize multi-city day plans, and chronicle every memorable stop.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link href="/trips/create" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto gap-2">
                <Compass className="w-4 h-4" />
                <span>Explore Destinations</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
