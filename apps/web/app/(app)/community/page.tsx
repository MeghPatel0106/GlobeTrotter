"use client";

import * as React from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Users,
  Compass,
  Heart,
  ArrowRight,
  MapPin,
  Calendar,
  Sparkles,
  AlertCircle,
  RotateCcw,
  Plus,
  Share2,
  Wallet,
  Globe2,
  TrendingUp,
  Clock,
  ExternalLink,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  MotionFadeRise,
  MotionStaggerContainer,
} from "@globetrotter/ui";
import { tripsApi, CommunityTrip } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getCurrencySymbol, getCurrencyForCountry } from "@/lib/currency";

type CommunitySort = "newest" | "most_liked";

const FEED_TABS: { id: CommunitySort; label: string; icon: any }[] = [
  { id: "newest", label: "Newest Trips", icon: Clock },
  { id: "most_liked", label: "Most Liked Itineraries", icon: TrendingUp },
];

export default function CommunityPage() {
  const { user, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = React.useState<CommunitySort>("newest");
  const [imgErrors, setImgErrors] = React.useState<Record<string, boolean>>({});

  // 1. Fetch Real Public Trips Feed from MongoDB
  const {
    data: publicTrips = [],
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery<CommunityTrip[]>({
    queryKey: ["community", "feed", activeTab],
    queryFn: () => tripsApi.getCommunityFeed(activeTab, 30),
    staleTime: 20 * 1000,
  });

  // 2. Optimistic Like Mutation
  const likeMutation = useMutation({
    mutationFn: (tripId: string) => tripsApi.toggleLike(tripId),
    onMutate: async (tripId: string) => {
      if (!isAuthenticated) {
        toast.error("Please log in to like community itineraries.");
        throw new Error("Unauthorized");
      }

      await queryClient.cancelQueries({ queryKey: ["community", "feed", activeTab] });
      const previousTrips = queryClient.getQueryData<CommunityTrip[]>([
        "community",
        "feed",
        activeTab,
      ]);

      // Optimistically update feed cache
      if (previousTrips) {
        queryClient.setQueryData<CommunityTrip[]>(
          ["community", "feed", activeTab],
          previousTrips.map((t) => {
            if (t.id === tripId) {
              const currentlyLiked = Boolean(t.isLiked);
              const currentCount = t.likesCount || 0;
              return {
                ...t,
                isLiked: !currentlyLiked,
                likesCount: currentlyLiked ? Math.max(0, currentCount - 1) : currentCount + 1,
              };
            }
            return t;
          })
        );
      }

      return { previousTrips };
    },
    onError: (err: any, _tripId, context) => {
      if (context?.previousTrips) {
        queryClient.setQueryData(["community", "feed", activeTab], context.previousTrips);
      }
      if (err.message !== "Unauthorized") {
        toast.error("Could not update like. Please try again.");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["community", "feed"] });
    },
  });

  const handleToggleLike = (e: React.MouseEvent, tripId: string) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate(tripId);
  };

  const handleImageError = (tripId: string) => {
    setImgErrors((prev) => ({ ...prev, [tripId]: true }));
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>Community Feed · Public Itineraries</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Community Trips
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
            Real multi-city trips shared by GlobeTrotter travelers. Explore curated itineraries, budget breakdowns, and copy routes for your journey.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="text-xs gap-1.5 min-h-[38px] cursor-pointer"
            title="Refresh community feed"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin text-primary" : ""}`} />
            <span>Refresh</span>
          </Button>

          <Link href="/trips/create">
            <Button
              variant="primary"
              size="sm"
              className="text-xs gap-1.5 min-h-[38px] shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share a Trip</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Feed Sort Filter Bar */}
      <div className="flex items-center gap-2 border-b border-border pb-1" role="tablist">
        {FEED_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[10px] text-xs font-semibold transition-all duration-150 cursor-pointer min-h-[42px] border-b-2 ${
                isActive
                  ? "bg-surface text-primary border-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Feed State Handling */}

      {/* Loading Skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-border bg-surface rounded-[16px] p-6 space-y-4 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-elevated" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-36 bg-surface-elevated rounded" />
                  <div className="h-3 w-24 bg-surface-elevated rounded" />
                </div>
              </div>
              <div className="h-6 w-3/4 bg-surface-elevated rounded" />
              <div className="h-4 w-full bg-surface-elevated rounded" />
              <div className="h-40 w-full bg-surface-elevated rounded-[12px]" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {!isLoading && isError && (
        <Card className="border-border bg-surface rounded-[16px] p-10 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="text-base font-bold text-foreground">Failed to load community trips</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Unable to connect to the community feed. Check your connection or try refreshing.
          </p>
          <Button variant="secondary" size="sm" onClick={() => refetch()} className="mt-2">
            Retry Feed
          </Button>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && publicTrips.length === 0 && (
        <Card className="border-border bg-surface rounded-[16px] p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mx-auto">
            <Globe2 className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              No shared trips yet — publish your first trip.
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              When you or other travelers publish a trip, it will automatically appear here in the community feed.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link href="/trips/mine">
              <Button variant="primary" size="sm" className="text-xs min-h-[38px] shadow-xs">
                <span>View My Trips</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* 4. Populated Public Trip Cards */}
      {!isLoading && !isError && publicTrips.length > 0 && (
        <MotionStaggerContainer staggerDelay={0.06} className="space-y-5">
          {publicTrips.map((trip) => {
            const author = trip.userId || {
              firstName: "Traveler",
              lastName: "",
              username: "traveler",
              photoUrl: null,
            };
            const authorInitials =
              (author.firstName?.[0] || "") + (author.lastName?.[0] || "") ||
              author.username?.[0]?.toUpperCase() ||
              "T";

            const stopsList = trip.stops || [];
            const routeChain =
              stopsList.length > 0
                ? stopsList.map((s) => s.cityName).join(" → ")
                : "Custom Trip";

            const primaryCountry = stopsList[0]?.country || "Global";
            const currencySymbol = getCurrencySymbol(primaryCountry);
            const currencyCode = getCurrencyForCountry(primaryCountry).code;

            const startDateStr = trip.startDate
              ? new Date(trip.startDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : "TBD";
            const endDateStr = trip.endDate
              ? new Date(trip.endDate).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "TBD";

            const isLiked = Boolean(trip.isLiked);
            const likesCount = trip.likesCount || 0;
            const hasCover = Boolean(trip.coverPhotoUrl && !imgErrors[trip.id]);
            const shareUrl = `/share/${trip.shareToken}`;

            return (
              <MotionFadeRise key={trip.id}>
                <Card className="border border-border bg-surface rounded-[16px] overflow-hidden shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200">
                  {/* Card Header: Author Meta */}
                  <CardHeader className="p-4 sm:p-5 pb-3 flex flex-row items-center justify-between gap-3 border-b border-border/40 bg-surface-subtle/30">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full overflow-hidden border border-primary/40 bg-surface-elevated flex items-center justify-center text-primary font-bold text-xs shrink-0 shadow-xs">
                        {author.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={author.photoUrl}
                            alt={author.firstName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span>{authorInitials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-foreground block truncate">
                          {author.firstName} {author.lastName}
                        </span>
                        <span className="font-mono text-[11px] text-muted-foreground block truncate">
                          @{author.username}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground shrink-0">
                      <Calendar className="w-3.5 h-3.5 text-primary" />
                      <span>
                        {startDateStr} – {endDateStr}
                      </span>
                    </div>
                  </CardHeader>

                  {/* Card Body */}
                  <CardContent className="p-4 sm:p-6 space-y-3.5">
                    {/* Route Thread Badge */}
                    <div className="flex items-center gap-2 text-xs font-mono text-primary font-bold">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{routeChain}</span>
                    </div>

                    {/* Trip Title */}
                    <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground hover:text-primary transition-colors">
                      <Link href={shareUrl}>{trip.name}</Link>
                    </h2>

                    {/* Description / Excerpt */}
                    {trip.description && (
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {trip.description}
                      </p>
                    )}

                    {/* Cover Photo if present */}
                    {hasCover && (
                      <div className="w-full h-48 sm:h-64 rounded-[12px] overflow-hidden border border-border/70 relative">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={trip.coverPhotoUrl}
                          alt={trip.name}
                          onError={() => handleImageError(trip.id)}
                          className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                        />
                      </div>
                    )}

                    {/* Trip Summary Pills */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      {trip.totalBudgetEstimate != null && trip.totalBudgetEstimate > 0 && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-primary/10 border border-primary/25 text-primary font-mono font-semibold">
                          <Wallet className="w-3.5 h-3.5" />
                          <span>
                            {currencySymbol}
                            {trip.totalBudgetEstimate.toLocaleString()} {currencyCode} Planned
                          </span>
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-surface-elevated border border-border text-muted-foreground font-mono text-[11px]">
                        <span>{stopsList.length} {stopsList.length === 1 ? "Stop" : "Stops"}</span>
                      </span>

                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-success/10 border border-success/20 text-success font-mono text-[11px]">
                        <Share2 className="w-3 h-3" />
                        <span>Public Itinerary</span>
                      </span>
                    </div>
                  </CardContent>

                  {/* Card Footer: Like Button & View Trip CTA */}
                  <CardFooter className="p-4 sm:p-5 pt-3 border-t border-border/60 flex items-center justify-between gap-3 bg-surface-subtle/20">
                    {/* Interactive Like Action with Scale-Pop */}
                    <button
                      type="button"
                      onClick={(e) => handleToggleLike(e, trip.id)}
                      disabled={likeMutation.isPending}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-[8px] border text-xs font-mono transition-all duration-150 cursor-pointer select-none active:scale-110 min-h-[44px] min-w-[56px] ${
                        isLiked
                          ? "bg-rose-500/15 border-rose-500/40 text-rose-500 font-bold shadow-xs"
                          : "bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                      }`}
                      aria-label={isLiked ? "Unlike trip" : "Like trip"}
                    >
                      <Heart
                        className={`w-4 h-4 transition-transform ${
                          isLiked ? "fill-rose-500 text-rose-500 scale-110" : ""
                        }`}
                      />
                      <span>{likesCount}</span>
                    </button>

                    {/* View Shared Trip CTA */}
                    <Link href={shareUrl}>
                      <Button
                        variant="primary"
                        size="sm"
                        className="text-xs gap-1.5 min-h-[40px] shadow-xs cursor-pointer"
                      >
                        <span>View Trip</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </CardFooter>
                </Card>
              </MotionFadeRise>
            );
          })}
        </MotionStaggerContainer>
      )}
    </div>
  );
}
