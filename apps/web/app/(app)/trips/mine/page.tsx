"use client";

import * as React from "react";
import Link from "next/link";
import {
  Compass,
  MapPin,
  Calendar,
  Plus,
  ArrowRight,
  Route,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-500/15 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-brass-400 mb-1">
            <Route className="w-3.5 h-3.5" />
            <span>Expeditions · Logbook</span>
          </div>
          <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-parchment-50">
            My Expeditions
          </h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Manage your planned routes, ongoing itineraries, and archived journeys
            across the globe.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/search">
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
              className={`px-3.5 py-1.5 rounded-[8px] text-xs font-medium transition-colors cursor-pointer min-h-[38px] whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 ${
                isActive
                  ? "bg-ink-800 text-brass-400 font-semibold border border-brass-500/30 shadow-xs"
                  : "text-slate-400 hover:text-parchment-50 hover:bg-ink-850 border border-transparent"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Empty State / Journey Invitation Card */}
      <Card className="border-slate-500/20 bg-ink-900 text-center py-12 px-4 sm:px-8">
        <CardContent className="max-w-md mx-auto flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-ink-800 border border-brass-500/30 flex items-center justify-center text-brass-400 shadow-inner">
            <Compass className="w-7 h-7 animate-[spin_30s_linear_infinite]" />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-parchment-50">
              No expeditions logged yet
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
              Your travel logbook is ready for your first voyage. Explore cities,
              customize multi-city day plans, and chronicle every memorable stop.
            </p>
          </div>
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <Link href="/search" className="w-full sm:w-auto">
              <Button variant="primary" size="md" className="w-full sm:w-auto gap-2">
                <Compass className="w-4 h-4 text-ink-950" />
                <span>Explore Destinations</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
