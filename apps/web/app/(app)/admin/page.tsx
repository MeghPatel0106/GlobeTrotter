"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  Compass,
  Globe2,
  Sparkles,
  TrendingUp,
  MapPin,
  Calendar,
  Layers,
  Search,
  RotateCcw,
  User as UserIcon,
  Activity as ActivityIcon,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUpRight,
  DollarSign,
  BarChart3,
  Flame,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  MotionFadeRise,
  MotionStaggerContainer,
} from "@globetrotter/ui";
import {
  adminApi,
  AdminSummary,
  AdminUserItem,
  AdminCityStat,
  AdminActivityStat,
  AdminTrendPoint,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Available Blueprint Tabs
type AdminTab = "users" | "cities" | "activities" | "trends";

const TABS: { id: AdminTab; label: string; icon: any }[] = [
  { id: "users", label: "Manage Users", icon: Users },
  { id: "cities", label: "Popular Cities", icon: MapPin },
  { id: "activities", label: "Popular Activities", icon: Sparkles },
  { id: "trends", label: "User Trends & Analytics", icon: TrendingUp },
];

// Custom Accessible Recharts Tooltip
function CustomAdminTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 rounded-[10px] bg-surface border border-border shadow-2xl text-xs space-y-1 z-50">
        <p className="font-bold text-foreground font-mono">{label}</p>
        <div className="space-y-0.5">
          {payload.map((item: any, idx: number) => (
            <div key={idx} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: item.color || item.fill || "#C9973F" }}
                />
                <span>{item.name}:</span>
              </span>
              <span className="font-mono font-bold text-foreground">
                {typeof item.value === "number" ? item.value.toLocaleString() : item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [activeTab, setActiveTab] = React.useState<AdminTab>("users");
  const [userSearch, setUserSearch] = React.useState("");

  // Role Verification Check
  React.useEffect(() => {
    if (!isAuthLoading) {
      if (!isAuthenticated || user?.role !== "ADMIN") {
        toast.error("Access Denied: Administrator privileges required.");
        router.replace("/dashboard");
      }
    }
  }, [isAuthLoading, isAuthenticated, user, router]);

  // 1. Fetch KPI Summary
  const {
    data: summary,
    isLoading: isSummaryLoading,
    isError: isSummaryError,
    refetch: refetchSummary,
  } = useQuery<AdminSummary>({
    queryKey: ["admin", "summary"],
    queryFn: adminApi.getSummary,
    enabled: isAuthenticated && user?.role === "ADMIN",
    staleTime: 30 * 1000,
  });

  // 2. Fetch Users Directory
  const {
    data: users = [],
    isLoading: isUsersLoading,
    isError: isUsersError,
    refetch: refetchUsers,
  } = useQuery<AdminUserItem[]>({
    queryKey: ["admin", "users"],
    queryFn: adminApi.getUsers,
    enabled: isAuthenticated && user?.role === "ADMIN",
    staleTime: 30 * 1000,
  });

  // 3. Fetch Popular Cities
  const {
    data: popularCities = [],
    isLoading: isCitiesLoading,
    isError: isCitiesError,
    refetch: refetchCities,
  } = useQuery<AdminCityStat[]>({
    queryKey: ["admin", "cities"],
    queryFn: () => adminApi.getPopularCities(10),
    enabled: isAuthenticated && user?.role === "ADMIN",
    staleTime: 30 * 1000,
  });

  // 4. Fetch Popular Activities
  const {
    data: popularActivities = [],
    isLoading: isActivitiesLoading,
    isError: isActivitiesError,
    refetch: refetchActivities,
  } = useQuery<AdminActivityStat[]>({
    queryKey: ["admin", "activities"],
    queryFn: () => adminApi.getPopularActivities(10),
    enabled: isAuthenticated && user?.role === "ADMIN",
    staleTime: 30 * 1000,
  });

  // 5. Fetch Trends
  const {
    data: trends = [],
    isLoading: isTrendsLoading,
    isError: isTrendsError,
    refetch: refetchTrends,
  } = useQuery<AdminTrendPoint[]>({
    queryKey: ["admin", "trends"],
    queryFn: adminApi.getTrends,
    enabled: isAuthenticated && user?.role === "ADMIN",
    staleTime: 30 * 1000,
  });

  const handleRefreshAll = () => {
    refetchSummary();
    refetchUsers();
    refetchCities();
    refetchActivities();
    refetchTrends();
    toast.success("Admin telemetry synchronized.");
  };

  // Filtered Users List
  const filteredUsers = React.useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase().trim();
    return users.filter(
      (u) =>
        u.firstName.toLowerCase().includes(q) ||
        u.lastName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  // Access Denial / Loading Screen
  if (isAuthLoading || (user && user.role !== "ADMIN")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
        <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground">
            Verifying Administrator Credentials...
          </h2>
          <p className="text-xs text-muted-foreground">
            Authenticating role-based operational permissions from MongoDB.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 1. Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Root Ops · Platform Telemetry</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Admin & Analytics Center
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm max-w-2xl">
            Live MongoDB platform analytics, user registry management, top voyage destinations, and growth trends.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRefreshAll}
            className="text-xs gap-1.5 shadow-2xs cursor-pointer min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Sync Telemetry</span>
          </Button>
        </div>
      </div>

      {/* 2. Top Metric KPI Overview Grid */}
      <MotionStaggerContainer
        staggerDelay={0.05}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {/* Metric 1: Total Users */}
        <MotionFadeRise>
          <Card className="border-border bg-surface shadow-xs">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground uppercase">
                  Total Explorers
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {isSummaryLoading ? (
                    <span className="inline-block w-12 h-7 bg-surface-elevated animate-pulse rounded" />
                  ) : (
                    summary?.totalUsers.toLocaleString() || "0"
                  )}
                </div>
                <span className="text-[10px] font-mono text-primary flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-success" />
                  <span>Active Registered Profiles</span>
                </span>
              </div>
              <div className="p-3 rounded-[12px] bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Users className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </MotionFadeRise>

        {/* Metric 2: Total Expeditions */}
        <MotionFadeRise>
          <Card className="border-border bg-surface shadow-xs">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground uppercase">
                  Total Expeditions
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {isSummaryLoading ? (
                    <span className="inline-block w-12 h-7 bg-surface-elevated animate-pulse rounded" />
                  ) : (
                    summary?.totalTrips.toLocaleString() || "0"
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <Compass className="w-3 h-3 text-primary" />
                  <span>Planned Multi-City Routes</span>
                </span>
              </div>
              <div className="p-3 rounded-[12px] bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Layers className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </MotionFadeRise>

        {/* Metric 3: Public Shared Voyages */}
        <MotionFadeRise>
          <Card className="border-border bg-surface shadow-xs">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground uppercase">
                  Public Voyages
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {isSummaryLoading ? (
                    <span className="inline-block w-12 h-7 bg-surface-elevated animate-pulse rounded" />
                  ) : (
                    summary?.totalPublicTrips.toLocaleString() || "0"
                  )}
                </div>
                <span className="text-[10px] font-mono text-success flex items-center gap-1">
                  <Globe2 className="w-3 h-3 text-success" />
                  <span>Tokenized Share Links</span>
                </span>
              </div>
              <div className="p-3 rounded-[12px] bg-success/10 border border-success/20 text-success shrink-0">
                <Globe2 className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </MotionFadeRise>

        {/* Metric 4: Sights & Activities Planned */}
        <MotionFadeRise>
          <Card className="border-border bg-surface shadow-xs">
            <CardContent className="p-5 flex items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-muted-foreground uppercase">
                  Curated Activities
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {isSummaryLoading ? (
                    <span className="inline-block w-12 h-7 bg-surface-elevated animate-pulse rounded" />
                  ) : (
                    summary?.totalActivitiesPlanned.toLocaleString() || "0"
                  )}
                </div>
                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-primary" />
                  <span>Itinerary Slot Items</span>
                </span>
              </div>
              <div className="p-3 rounded-[12px] bg-primary/10 border border-primary/20 text-primary shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </MotionFadeRise>
      </MotionStaggerContainer>

      {/* 3. Navigation Tab Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-border" role="tablist">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-[10px] text-xs font-semibold transition-all duration-150 cursor-pointer min-h-[42px] border-b-2 whitespace-nowrap ${
                isActive
                  ? "bg-surface text-primary border-primary shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground hover:bg-surface-hover border-transparent"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
              <span>{tab.label}</span>
              {tab.id === "users" && users.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-primary/15 text-primary text-[10px] font-mono">
                  {users.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* 4. TAB CONTENTS */}

      {/* =========================================================================
          TAB 1: MANAGE USERS
          ========================================================================= */}
      {activeTab === "users" && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search explorers by name, email, or username..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 text-xs rounded-[8px] bg-input-bg border border-input-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <span className="text-xs font-mono text-muted-foreground">
              Showing {filteredUsers.length} of {users.length} explorers
            </span>
          </div>

          <Card className="border-border bg-surface rounded-[14px] overflow-hidden shadow-xs">
            {isUsersLoading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-12 w-full bg-surface-elevated animate-pulse rounded-[8px]" />
                ))}
              </div>
            ) : isUsersError ? (
              <div className="p-12 text-center space-y-3">
                <AlertCircle className="w-8 h-8 text-destructive mx-auto" />
                <p className="text-sm font-semibold text-foreground">Failed to load user directory.</p>
                <Button variant="secondary" size="sm" onClick={() => refetchUsers()}>
                  Retry
                </Button>
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <Users className="w-8 h-8 text-muted-foreground mx-auto" />
                <h3 className="text-sm font-bold text-foreground">No Explorers Found</h3>
                <p className="text-xs text-muted-foreground">
                  No registered users match your search query &quot;{userSearch}&quot;.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-subtle/80 border-b border-border text-[11px] font-mono text-muted-foreground uppercase">
                    <tr>
                      <th className="py-3 px-4 font-semibold">Explorer</th>
                      <th className="py-3 px-4 font-semibold">Email & Phone</th>
                      <th className="py-3 px-4 font-semibold">Role</th>
                      <th className="py-3 px-4 font-semibold">Trips</th>
                      <th className="py-3 px-4 font-semibold">Registered</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredUsers.map((u) => {
                      const joinDate = new Date(u.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                      const isAdmin = u.role === "ADMIN";

                      return (
                        <tr
                          key={u.id}
                          className="hover:bg-surface-hover/50 transition-colors"
                        >
                          {/* Name + Username */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                                {u.firstName?.charAt(0) || <UserIcon className="w-3.5 h-3.5" />}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-foreground block truncate">
                                  {u.firstName} {u.lastName}
                                </span>
                                <span className="font-mono text-[10px] text-muted-foreground block truncate">
                                  @{u.username}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3.5 px-4 text-foreground/90 font-mono text-[11px]">
                            <div>{u.email}</div>
                            {u.phone && (
                              <div className="text-muted-foreground text-[10px]">{u.phone}</div>
                            )}
                          </td>

                          {/* Role Badge */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                                isAdmin
                                  ? "bg-primary/20 text-primary border border-primary/40"
                                  : "bg-surface-elevated text-muted-foreground border border-border"
                              }`}
                            >
                              {isAdmin && <ShieldCheck className="w-2.5 h-2.5" />}
                              <span>{u.role}</span>
                            </span>
                          </td>

                          {/* Trips count */}
                          <td className="py-3.5 px-4 font-mono font-semibold text-foreground">
                            <span className="px-2 py-0.5 rounded bg-surface-subtle border border-border">
                              {u.tripsCount} {u.tripsCount === 1 ? "Trip" : "Trips"}
                            </span>
                          </td>

                          {/* Joined date */}
                          <td className="py-3.5 px-4 text-muted-foreground font-mono text-[11px]">
                            {joinDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* =========================================================================
          TAB 2: POPULAR CITIES
          ========================================================================= */}
      {activeTab === "cities" && (
        <div className="space-y-6">
          {isCitiesLoading ? (
            <div className="h-64 w-full bg-surface-elevated animate-pulse rounded-[14px]" />
          ) : isCitiesError ? (
            <Card className="p-8 text-center border-border bg-surface">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Failed to aggregate city data.</p>
              <Button variant="secondary" size="sm" onClick={() => refetchCities()} className="mt-3">
                Retry
              </Button>
            </Card>
          ) : popularCities.length === 0 ? (
            <Card className="p-12 text-center border-border bg-surface space-y-2">
              <MapPin className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No City Data Yet</h3>
              <p className="text-xs text-muted-foreground">
                As explorers plan expeditions, popular destination legs will appear here automatically.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Popular Cities Bar Chart */}
              <Card className="lg:col-span-7 border-border bg-surface rounded-[14px] p-5 shadow-xs flex flex-col justify-between">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <span>Top Visited Destinations Frequency</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Aggregated stop legs scheduled across all explorer itineraries.
                  </CardDescription>
                </CardHeader>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={popularCities}
                      margin={{ top: 10, right: 10, left: -20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis
                        dataKey="cityName"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                        interval={0}
                        angle={-30}
                        textAnchor="end"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      />
                      <Tooltip content={<CustomAdminTooltip />} />
                      <Bar
                        dataKey="visitCount"
                        name="Stop Visits"
                        fill="#C9973F"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Popular Cities Ranked Leaderboard */}
              <Card className="lg:col-span-5 border-border bg-surface rounded-[14px] p-5 shadow-xs">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>Destination Rankings</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Ranked by traveler leg selections
                  </CardDescription>
                </CardHeader>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {popularCities.map((city, idx) => (
                    <div
                      key={city.cityName}
                      className="flex items-center justify-between p-2.5 rounded-[8px] bg-surface-subtle border border-border text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-primary/15 text-primary font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-foreground truncate block">
                            {city.cityName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            {city.country}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <span className="font-bold text-primary block">
                          {city.visitCount} {city.visitCount === 1 ? "Stop" : "Stops"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 3: POPULAR ACTIVITIES
          ========================================================================= */}
      {activeTab === "activities" && (
        <div className="space-y-6">
          {isActivitiesLoading ? (
            <div className="h-64 w-full bg-surface-elevated animate-pulse rounded-[14px]" />
          ) : isActivitiesError ? (
            <Card className="p-8 text-center border-border bg-surface">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Failed to aggregate activity data.</p>
              <Button variant="secondary" size="sm" onClick={() => refetchActivities()} className="mt-3">
                Retry
              </Button>
            </Card>
          ) : popularActivities.length === 0 ? (
            <Card className="p-12 text-center border-border bg-surface space-y-2">
              <Sparkles className="w-8 h-8 text-muted-foreground mx-auto" />
              <h3 className="text-base font-bold text-foreground">No Activities Scheduled Yet</h3>
              <p className="text-xs text-muted-foreground">
                As travelers add sights, tours, and culinary experiences to their itinerary days, rankings will show here.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Activities Bar Chart */}
              <Card className="lg:col-span-7 border-border bg-surface rounded-[14px] p-5 shadow-xs flex flex-col justify-between">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <span>Top Scheduled Sights & Tours</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Most frequently booked itinerary experiences.
                  </CardDescription>
                </CardHeader>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={popularActivities}
                      margin={{ top: 10, right: 10, left: -20, bottom: 35 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis
                        dataKey="activityName"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
                        interval={0}
                        angle={-35}
                        textAnchor="end"
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      />
                      <Tooltip content={<CustomAdminTooltip />} />
                      <Bar
                        dataKey="count"
                        name="Times Scheduled"
                        fill="#10B981"
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Activity Rankings List */}
              <Card className="lg:col-span-5 border-border bg-surface rounded-[14px] p-5 shadow-xs">
                <CardHeader className="p-0 pb-4">
                  <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span>Activity Leaderboard</span>
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Ordered by itinerary item selections
                  </CardDescription>
                </CardHeader>

                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {popularActivities.map((act, idx) => (
                    <div
                      key={act.activityName}
                      className="flex items-center justify-between p-2.5 rounded-[8px] bg-surface-subtle border border-border text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-500 font-mono font-bold flex items-center justify-center text-[10px] shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <span className="font-bold text-foreground truncate block">
                            {act.activityName}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono block">
                            Avg: ₹{act.averageCost.toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono">
                        <span className="font-bold text-emerald-500 block">
                          {act.count} {act.count === 1 ? "Book" : "Books"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 4: USER TRENDS & ANALYTICS
          ========================================================================= */}
      {activeTab === "trends" && (
        <div className="space-y-6">
          {isTrendsLoading ? (
            <div className="h-80 w-full bg-surface-elevated animate-pulse rounded-[14px]" />
          ) : isTrendsError ? (
            <Card className="p-8 text-center border-border bg-surface">
              <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">Failed to calculate growth trends.</p>
              <Button variant="secondary" size="sm" onClick={() => refetchTrends()} className="mt-3">
                Retry
              </Button>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Trends Area / Line Chart */}
              <Card className="border-border bg-surface rounded-[14px] p-5 sm:p-6 shadow-xs">
                <CardHeader className="p-0 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary" />
                      <span>Platform Growth Telemetry (Monthly Trends)</span>
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground mt-0.5">
                      Tracking monthly user registrations and voyage route creation events.
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="flex items-center gap-1.5 text-primary">
                      <span className="w-3 h-3 rounded-full bg-primary" />
                      <span>Users Added</span>
                    </span>
                    <span className="flex items-center gap-1.5 text-blue-500">
                      <span className="w-3 h-3 rounded-full bg-blue-500" />
                      <span>Expeditions Created</span>
                    </span>
                  </div>
                </CardHeader>

                <div className="h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={trends}
                      margin={{ top: 10, right: 20, left: -15, bottom: 10 }}
                    >
                      <defs>
                        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#C9973F" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#C9973F" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="tripGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
                      <XAxis
                        dataKey="period"
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      />
                      <YAxis
                        allowDecimals={false}
                        tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                      />
                      <Tooltip content={<CustomAdminTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="usersCount"
                        name="New Explorers"
                        stroke="#C9973F"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#userGrad)"
                        isAnimationActive={true}
                      />
                      <Area
                        type="monotone"
                        dataKey="tripsCount"
                        name="Created Expeditions"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#tripGrad)"
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Conversion & Ratio Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="p-4 border-border bg-surface text-xs space-y-1 shadow-xs">
                  <span className="font-mono text-muted-foreground uppercase text-[10px]">
                    Trips Per Explorer
                  </span>
                  <div className="text-xl font-bold text-foreground font-mono">
                    {summary && summary.totalUsers > 0
                      ? (summary.totalTrips / summary.totalUsers).toFixed(1)
                      : "0.0"}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Average route creation velocity per account.
                  </p>
                </Card>

                <Card className="p-4 border-border bg-surface text-xs space-y-1 shadow-xs">
                  <span className="font-mono text-muted-foreground uppercase text-[10px]">
                    Public Share Rate
                  </span>
                  <div className="text-xl font-bold text-success font-mono">
                    {summary && summary.totalTrips > 0
                      ? `${Math.round((summary.totalPublicTrips / summary.totalTrips) * 100)}%`
                      : "0%"}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Proportion of voyages published with public share tokens.
                  </p>
                </Card>

                <Card className="p-4 border-border bg-surface text-xs space-y-1 shadow-xs">
                  <span className="font-mono text-muted-foreground uppercase text-[10px]">
                    Sights Density
                  </span>
                  <div className="text-xl font-bold text-primary font-mono">
                    {summary && summary.totalTrips > 0
                      ? (summary.totalActivitiesPlanned / summary.totalTrips).toFixed(1)
                      : "0.0"}
                  </div>
                  <p className="text-muted-foreground text-[11px]">
                    Average booked itinerary attractions per trip.
                  </p>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
