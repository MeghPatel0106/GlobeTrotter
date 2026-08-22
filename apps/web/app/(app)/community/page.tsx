"use client";

import * as React from "react";
import Link from "next/link";
import {
  Users,
  Compass,
  MapPin,
  Heart,
  Bookmark,
  Share2,
  Calendar,
  Sparkles,
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

const feedTabs = [
  { id: "recent", label: "Recent Dispatches" },
  { id: "featured", label: "Featured Itineraries" },
  { id: "picks", label: "Editor's Picks" },
];

const communityDispatches = [
  {
    id: "1",
    author: "Aarav Mehta",
    authorHandle: "@aarav_voyages",
    authorInitials: "AM",
    title: "10 Days Across the Japanese Alps & Historic Kyoto",
    route: "Tokyo → Takayama → Shirakawa-go → Kyoto",
    date: "August 18, 2026",
    days: "10 Days",
    budget: "$2,400 est.",
    likes: 42,
    excerpt:
      "Staring out the window of the Hida Wide View express through forested ravines was the highlight of this route. Make sure to reserve morning tea at Uji before entering Kyoto.",
    tag: "Cultural Itinerary",
  },
  {
    id: "2",
    author: "Elena Rostova",
    authorHandle: "@elena_wanders",
    authorInitials: "ER",
    title: "Tuscan Vineyards & Renaissance Backstreets",
    route: "Florence → San Gimignano → Siena → Val d'Orcia",
    date: "August 14, 2026",
    days: "7 Days",
    budget: "$1,850 est.",
    likes: 38,
    excerpt:
      "Avoid driving inside Florence's ZTL zone. Pick up your rental car near the airport on Day 3 before embarking south across the Cypress-lined hills of Crete Senesi.",
    tag: "Culinary & Scenic",
  },
  {
    id: "3",
    author: "Mateo Silva",
    authorHandle: "@mateo_expeditions",
    authorInitials: "MS",
    title: "The Oaxaca Culinary Route: Markets, Mezcal & Coast",
    route: "Oaxaca City → Hierve el Agua → Mazunte → Puerto Escondido",
    date: "August 09, 2026",
    days: "8 Days",
    budget: "$1,300 est.",
    likes: 29,
    excerpt:
      "Spend at least three nights in Oaxaca Centro to explore the 20 de Noviembre market and traditional ceramic workshops in San Bartolo Coyotepec.",
    tag: "Food & Heritage",
  },
];

export default function CommunityPage() {
  const [activeTab, setActiveTab] = React.useState("recent");
  const [likedPosts, setLikedPosts] = React.useState<Record<string, boolean>>({});

  const toggleLike = (id: string) => {
    setLikedPosts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="border-b border-slate-500/15 pb-5">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-brass-400 mb-1">
          <Users className="w-3.5 h-3.5" />
          <span>Travelers&apos; Dispatch</span>
        </div>
        <h1 className="font-serif text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-parchment-50">
          Community Logbook
        </h1>
        <p className="text-slate-400 text-sm mt-1 max-w-2xl">
          Read field notes, shared multi-city itineraries, and travel recommendations
          published by the GlobeTrotter explorer community.
        </p>
      </div>

      {/* Feed Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none" role="tablist">
        {feedTabs.map((tab) => {
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

      {/* Community Feed Dispatches */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {communityDispatches.map((dispatch) => {
          const isLiked = !!likedPosts[dispatch.id];
          const likeCount = dispatch.likes + (isLiked ? 1 : 0);

          return (
            <Card
              key={dispatch.id}
              className="border-slate-500/20 bg-ink-900 hover:border-slate-500/40 transition-colors flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                {/* Author Info */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-ink-800 border border-brass-500/40 flex items-center justify-center text-brass-400 font-serif text-xs font-bold shrink-0">
                      {dispatch.authorInitials}
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-parchment-50 block truncate">
                        {dispatch.author}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500 block truncate">
                        {dispatch.authorHandle}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 shrink-0">
                    {dispatch.date}
                  </span>
                </div>

                {/* Title */}
                <CardTitle className="text-lg leading-snug">
                  {dispatch.title}
                </CardTitle>

                {/* Route Thread Badge */}
                <div className="my-2 p-2 rounded-[8px] bg-ink-850 border border-slate-500/10">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono text-brass-400 font-medium overflow-hidden">
                    <Compass className="w-3 h-3 shrink-0 text-brass-500" />
                    <span className="truncate">{dispatch.route}</span>
                  </div>
                </div>

                <CardDescription className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                  {dispatch.excerpt}
                </CardDescription>
              </CardHeader>

              <CardFooter className="pt-3 border-t border-slate-500/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-ink-800 border border-slate-500/20 text-[10px] font-mono text-slate-300">
                    {dispatch.days}
                  </span>
                  <span className="text-[10px] font-mono text-sage-400">
                    {dispatch.budget}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => toggleLike(dispatch.id)}
                    aria-label={`Like dispatch by ${dispatch.author}`}
                    className={`p-1.5 rounded-md min-h-[36px] min-w-[36px] flex items-center justify-center gap-1 text-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass-500 cursor-pointer ${
                      isLiked
                        ? "text-coral-500 bg-coral-500/10"
                        : "text-slate-400 hover:text-coral-400"
                    }`}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 ${
                        isLiked ? "fill-coral-500 text-coral-500" : ""
                      }`}
                    />
                    <span className="font-mono text-[10px]">{likeCount}</span>
                  </button>

                  <Link
                    href="/trips/mine"
                    className="text-brass-400 hover:text-brass-300 font-medium flex items-center gap-1 p-1.5 min-h-[36px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass-500 rounded"
                    aria-label={`View itinerary for ${dispatch.title}`}
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
