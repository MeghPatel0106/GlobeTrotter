"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, Reorder, useDragControls, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  Compass,
  MapPin,
  Calendar,
  DollarSign,
  ChevronRight,
  Plus,
  GripVertical,
  Pencil,
  Trash2,
  Route,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Search,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Input,
  Textarea,
  Label,
} from "@globetrotter/ui";
import { tripsApi, stopsApi, citiesApi, Trip, Stop, City, AddStopInput, UpdateStopInput } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

// Sub-component for an individual reorderable section item
function SectionReorderItem({
  stop,
  idx,
  totalStops,
  onEdit,
  onDeleteRequest,
  onMoveUp,
  onMoveDown,
  shouldReduceMotion,
}: {
  stop: Stop;
  idx: number;
  totalStops: number;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  shouldReduceMotion: boolean;
}) {
  const dragControls = useDragControls();

  const stopStart = stop.startDate
    ? new Date(stop.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;
  const stopEnd = stop.endDate
    ? new Date(stop.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  return (
    <Reorder.Item
      value={stop}
      dragListener={false}
      dragControls={dragControls}
      className="list-none"
      transition={shouldReduceMotion ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 28 }}
      whileDrag={
        shouldReduceMotion
          ? {}
          : {
              scale: 1.015,
              boxShadow:
                "0 14px 28px -4px rgba(20, 28, 44, 0.12), 0 8px 12px -6px rgba(20, 28, 44, 0.08)",
              zIndex: 30,
            }
      }
    >
      <Card className="border-border bg-surface hover:border-primary/40 transition-all duration-150 shadow-xs overflow-hidden rounded-[14px]">
        <div className="flex items-stretch min-h-[96px]">
          {/* Dedicated Drag Handle: minimum 44x44px touch target, does not interfere with normal scrolling */}
          <div className="flex flex-col items-center justify-between w-11 sm:w-12 shrink-0 bg-surface-subtle/40 border-r border-border py-1 select-none">
            <button
              type="button"
              onClick={onMoveUp}
              disabled={idx === 0}
              aria-label={`Move ${stop.cityName} leg up`}
              className="p-1 rounded text-muted-foreground/60 hover:text-foreground disabled:opacity-15 disabled:hover:text-muted-foreground/60 transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[24px]"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>

            <div
              onPointerDown={(e) => {
                e.preventDefault();
                dragControls.start(e);
              }}
              aria-label={`Drag to reorder section ${idx + 1}: ${stop.cityName}`}
              title="Drag to reorder section"
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded text-muted-foreground hover:text-primary active:text-primary cursor-grab active:cursor-grabbing touch-none transition-colors"
            >
              <GripVertical className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>

            <button
              type="button"
              onClick={onMoveDown}
              disabled={idx === totalStops - 1}
              aria-label={`Move ${stop.cityName} leg down`}
              className="p-1 rounded text-muted-foreground/60 hover:text-foreground disabled:opacity-15 disabled:hover:text-muted-foreground/60 transition-colors cursor-pointer disabled:cursor-not-allowed min-h-[24px]"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section Content */}
          <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 min-w-0">
            <div className="space-y-1.5 flex-1 min-w-0">
              {/* Order index + City / Country */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-[6px] bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-semibold shrink-0">
                  Leg #{idx + 1}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-foreground truncate">
                  {stop.cityName}
                  {stop.country && (
                    <span className="text-muted-foreground font-normal text-sm ml-1.5">
                      · {stop.country}
                    </span>
                  )}
                </h3>
              </div>

              {/* Notes / Description */}
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {stop.notes ||
                  `Destination leg for ${stop.cityName}. Activities, accommodation, and day plans.`}
              </p>

              {/* Date Range & Budget Meta */}
              <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-muted-foreground pt-1">
                {stopStart && stopEnd && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>
                      {stopStart} – {stopEnd}
                    </span>
                  </span>
                )}

                {stop.sectionBudget != null && (
                  <span className="flex items-center gap-0.5 text-success font-medium">
                    <span className="font-bold">₹</span>
                    <span>{stop.sectionBudget.toLocaleString()}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Edit & Delete Action Buttons */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/60 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onEdit}
                aria-label={`Edit ${stop.cityName} section`}
                className="p-2 min-h-[38px] min-w-[38px] rounded-[8px] border border-border bg-surface text-muted-foreground hover:text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={onDeleteRequest}
                aria-label={`Delete ${stop.cityName} section`}
                className="p-2 min-h-[38px] min-w-[38px] rounded-[8px] border border-border bg-surface text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </Reorder.Item>
  );
}

export default function TripItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const tripId = params.id as string;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const shouldReduceMotion = !!useReducedMotion();

  // Form states
  const [isAddFormOpen, setIsAddFormOpen] = React.useState(false);
  const [editingStopId, setEditingStopId] = React.useState<string | null>(null);

  // Form input fields
  const [citySearch, setCitySearch] = React.useState("");
  const [selectedCity, setSelectedCity] = React.useState<{
    id?: string;
    name: string;
    country: string;
  } | null>(null);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = React.useState(false);
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [sectionBudget, setSectionBudget] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [formError, setFormError] = React.useState("");

  // Delete Confirmation Dialog state
  const [deletingStop, setDeletingStop] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // Local reorderable stops list
  const [orderedStops, setOrderedStops] = React.useState<Stop[]>([]);

  const addFormRef = React.useRef<HTMLDivElement>(null);
  const editFormRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push(`/login?returnTo=/trips/${tripId}/itinerary`);
    }
  }, [isAuthLoading, isAuthenticated, router, tripId]);

  // Fetch real trip and stops from MongoDB
  const {
    data: trip,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => tripsApi.getById(tripId),
    enabled: !!tripId && isAuthenticated,
    staleTime: 30 * 1000,
  });

  // Sync orderedStops when trip data is loaded / updated
  React.useEffect(() => {
    if (trip?.stops && Array.isArray(trip.stops)) {
      const sorted = [...trip.stops].sort(
        (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
      );
      setOrderedStops(sorted);
    }
  }, [trip?.stops]);

  // Live search for destination cities
  const { data: searchResults = [] } = useQuery({
    queryKey: ["cities", "search", citySearch],
    queryFn: () => citiesApi.search(citySearch, 8),
    enabled: isCityDropdownOpen && citySearch.trim().length > 0,
    staleTime: 30 * 1000,
  });

  // Top activities for selected city
  const { data: cityActivities = [] } = useQuery({
    queryKey: ["cities", selectedCity?.id, "activities"],
    queryFn: () => (selectedCity?.id ? citiesApi.getActivities(selectedCity.id, 4) : []),
    enabled: !!selectedCity?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Add Stop Mutation
  const addStopMutation = useMutation({
    mutationFn: (data: AddStopInput) => tripsApi.addStop(tripId, data),
    onSuccess: (updatedTrip) => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      const addedLegName = selectedCity?.name || citySearch.split(",")[0].trim();
      toast.success(`Added ${addedLegName} section to itinerary`);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to add section to this itinerary.";
      setFormError(msg);
      toast.error(msg);
    },
  });

  // Update Stop Mutation
  const updateStopMutation = useMutation({
    mutationFn: ({ stopId, data }: { stopId: string; data: UpdateStopInput }) =>
      stopsApi.update(stopId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Section updated successfully");
      resetForm();
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to update section.";
      setFormError(msg);
      toast.error(msg);
    },
  });

  // Delete Stop Mutation
  const deleteStopMutation = useMutation({
    mutationFn: (stopId: string) => stopsApi.delete(stopId),
    onSuccess: () => {
      const deletedName = deletingStop?.name || "Destination";
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(`Removed ${deletedName} leg from expedition`);
      setDeletingStop(null);
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to delete section from MongoDB.";
      toast.error(msg);
    },
  });

  // Reorder Stops Mutation
  const reorderStopsMutation = useMutation({
    mutationFn: (stopIds: string[]) => tripsApi.reorderStops(tripId, stopIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: (err: any) => {
      toast.error("Failed to save reordered section sequence.");
    },
  });

  // Handle Drag Reorder Commit
  const handleReorder = (newOrder: Stop[]) => {
    setOrderedStops(newOrder);
    const stopIds = newOrder
      .map((s) => s.id || s._id)
      .filter((id): id is string => !!id);
    if (stopIds.length > 0) {
      reorderStopsMutation.mutate(stopIds);
    }
  };

  // Move a stop up by one position
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newOrder = [...orderedStops];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    handleReorder(newOrder);
  };

  // Move a stop down by one position
  const handleMoveDown = (index: number) => {
    if (index >= orderedStops.length - 1) return;
    const newOrder = [...orderedStops];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1];
    newOrder[index + 1] = temp;
    handleReorder(newOrder);
  };

  // Reset Form
  const resetForm = () => {
    setIsAddFormOpen(false);
    setEditingStopId(null);
    setCitySearch("");
    setSelectedCity(null);
    setIsCityDropdownOpen(false);
    setStartDate("");
    setEndDate("");
    setSectionBudget("");
    setNotes("");
    setFormError("");
  };

  // Open Edit Form
  const handleStartEdit = (stop: Stop, stopId: string) => {
    setEditingStopId(stopId);
    setIsAddFormOpen(false);
    setSelectedCity({
      id: stop.cityId,
      name: stop.cityName,
      country: stop.country,
    });
    setCitySearch(`${stop.cityName}, ${stop.country}`);
    setStartDate(stop.startDate ? stop.startDate.split("T")[0] : "");
    setEndDate(stop.endDate ? stop.endDate.split("T")[0] : "");
    setSectionBudget(stop.sectionBudget != null ? stop.sectionBudget.toString() : "");
    setNotes(stop.notes || "");
    setFormError("");

    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  // Open Add Form
  const handleOpenAddForm = () => {
    resetForm();
    setIsAddFormOpen(true);

    if (orderedStops.length > 0) {
      const lastStop = orderedStops[orderedStops.length - 1];
      if (lastStop.endDate) {
        const lastEndDate = new Date(lastStop.endDate);
        const nextStart = new Date(lastEndDate);
        nextStart.setDate(nextStart.getDate() + 1);
        const nextEnd = new Date(nextStart);
        nextEnd.setDate(nextEnd.getDate() + 3);
        setStartDate(nextStart.toISOString().split("T")[0]);
        setEndDate(nextEnd.toISOString().split("T")[0]);
      }
    }

    setTimeout(() => {
      addFormRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  };

  // Handle Form Submit
  const handleSubmitSection = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!selectedCity && !citySearch.trim()) {
      const err = "Destination city is required.";
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!startDate) {
      const err = "Start date is required.";
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!endDate) {
      const err = "End date is required.";
      setFormError(err);
      toast.error(err);
      return;
    }

    if (endDate < startDate) {
      const err = "End date cannot be earlier than start date.";
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!sectionBudget || isNaN(Number(sectionBudget)) || Number(sectionBudget) <= 0) {
      const err = "Section budget is required and must be greater than ₹0.";
      setFormError(err);
      toast.error(err);
      return;
    }

    if (!notes.trim()) {
      const err = "Section notes and itinerary goals are required.";
      setFormError(err);
      toast.error(err);
      return;
    }

    const cityName = selectedCity?.name || citySearch.split(",")[0].trim();
    const country =
      selectedCity?.country ||
      (citySearch.includes(",") ? citySearch.split(",")[1].trim() : "India");

    const payload: AddStopInput = {
      cityId: selectedCity?.id,
      cityName,
      country,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      sectionBudget: parseFloat(sectionBudget),
      notes: notes.trim(),
    };

    if (editingStopId) {
      updateStopMutation.mutate({ stopId: editingStopId, data: payload });
    } else {
      addStopMutation.mutate(payload);
    }
  };

  // Format trip dates
  const tripStartFormatted = trip?.startDate
    ? new Date(trip.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const tripEndFormatted = trip?.endDate
    ? new Date(trip.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  // Loading Skeleton State
  if (isLoading || isAuthLoading) {
    return (
      <div className="max-w-[720px] mx-auto space-y-6 pt-2">
        <div className="h-44 rounded-[16px] bg-surface border border-border animate-pulse p-6 space-y-3">
          <div className="h-4 w-1/4 bg-surface-elevated rounded" />
          <div className="h-7 w-3/4 bg-surface-elevated rounded" />
          <div className="h-4 w-1/2 bg-surface-elevated rounded pt-2" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-28 rounded-[14px] bg-surface border border-border animate-pulse p-5 flex items-center justify-between gap-4"
            >
              <div className="space-y-2 flex-1">
                <div className="h-5 w-1/3 bg-surface-elevated rounded" />
                <div className="h-3 w-2/3 bg-surface-elevated rounded" />
              </div>
              <div className="h-8 w-16 bg-surface-elevated rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error State
  if (isError || !trip) {
    return (
      <div className="max-w-[720px] mx-auto pt-6">
        <Card className="border-border bg-surface text-center p-8">
          <CardContent className="space-y-4">
            <div className="w-12 h-12 rounded-full bg-destructive/10 border border-destructive/30 flex items-center justify-center text-destructive mx-auto">
              <Compass className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-foreground">
                Expedition Not Found
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                We could not retrieve the itinerary sections for this trip ID from MongoDB.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => refetch()}
                className="gap-1.5 text-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </Button>
              <Link href="/trips/mine">
                <Button variant="primary" size="sm" className="text-xs">
                  <span>My Expeditions</span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSubmitting = addStopMutation.isPending || updateStopMutation.isPending;

  return (
    <div className="max-w-[720px] mx-auto space-y-7 pb-16 pt-1">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground"
      >
        <Link
          href="/dashboard"
          className="hover:text-foreground transition-colors"
        >
          Dashboard
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
        <Link
          href="/trips/mine"
          className="hover:text-foreground transition-colors"
        >
          Expeditions
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/60" />
        <span className="text-primary font-semibold truncate max-w-[200px] sm:max-w-xs">
          {trip.name}
        </span>
      </nav>

      {/* Trip Header & Summary Card */}
      <div className="relative overflow-hidden rounded-[16px] bg-surface border border-border p-6 sm:p-7 shadow-xs">
        <div className="space-y-4">
          {/* Status Badge & Subtitle */}
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary">
              <Route className="w-3.5 h-3.5" />
              <span>Itinerary Builder · Route Sequence</span>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono uppercase font-semibold shrink-0 ${
                trip.status === "DRAFT"
                  ? "bg-surface-subtle border border-border text-muted-foreground"
                  : trip.status === "ONGOING"
                  ? "bg-success/15 border border-success/30 text-success"
                  : "bg-primary/15 border border-primary/30 text-primary"
              }`}
            >
              {trip.status}
            </span>
          </div>

          {/* Trip Title */}
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
            {trip.name}
          </h1>

          {/* Trip Summary / Notes */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {trip.description ||
              `Custom multi-city travel itinerary with ${orderedStops.length} destination leg${
                orderedStops.length === 1 ? "" : "s"
              }. Organize your route schedule, activities, and budget allocations.`}
          </p>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-muted-foreground pt-3 border-t border-border">
            {tripStartFormatted && tripEndFormatted && (
              <span className="flex items-center gap-1.5 text-foreground">
                <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>
                  {tripStartFormatted} – {tripEndFormatted}
                </span>
              </span>
            )}

            {trip.totalBudgetEstimate != null && (
              <span className="flex items-center gap-1 text-success font-medium">
                <span className="font-bold">₹</span>
                <span>{trip.totalBudgetEstimate.toLocaleString()} Budget</span>
              </span>
            )}

            <span className="text-muted-foreground font-mono">
              {orderedStops.length} {orderedStops.length === 1 ? "Leg Logged" : "Legs Logged"}
            </span>
          </div>
        </div>
      </div>

      {/* Itinerary Sections Container */}
      <div className="space-y-4">
        {/* Sections Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-foreground">
              Itinerary Sections
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-muted-foreground">
              {orderedStops.length} {orderedStops.length === 1 ? "Leg" : "Legs"}
            </span>
            {orderedStops.length > 1 && (
              <span className="text-[11px] font-mono text-primary/80 hidden sm:inline">
                (Drag handle or use arrows to reorder)
              </span>
            )}
          </div>
        </div>

        {/* Empty State */}
        {orderedStops.length === 0 && !isAddFormOpen && (
          <Card className="border-border bg-surface text-center py-12 px-6">
            <CardContent className="max-w-md mx-auto flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary shadow-xs">
                <Compass className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">
                  No sections yet — add your first destination.
                </h3>
                <p className="text-xs text-muted-foreground">
                  Begin structuring your route by logging destination legs, dates, and budget allocations.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                className="gap-1.5 text-xs mt-2"
                onClick={handleOpenAddForm}
              >
                <Plus className="w-4 h-4" />
                <span>Add First Section</span>
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Populated Reorderable Sections List */}
        {orderedStops.length > 0 && (
          <Reorder.Group
            axis="y"
            values={orderedStops}
            onReorder={handleReorder}
            className="space-y-3.5 p-0 m-0"
          >
            {orderedStops.map((stop, idx) => {
              const stopId = (stop.id || stop._id || idx.toString()) as string;
              const isEditingThis = editingStopId === stopId;

              if (isEditingThis) {
                return (
                  <div key={stopId} ref={editFormRef} className="scroll-mt-24">
                    <Card className="border-2 border-primary bg-surface p-5 sm:p-6 shadow-md rounded-[14px]">
                      <form onSubmit={handleSubmitSection} className="space-y-4">
                        <div className="flex items-center justify-between border-b border-border pb-3">
                          <span className="font-bold text-sm text-primary flex items-center gap-2">
                            <Pencil className="w-4 h-4" />
                            <span>Edit Leg #{idx + 1}: {stop.cityName}</span>
                          </span>
                          <button
                            type="button"
                            onClick={resetForm}
                            aria-label="Close edit form"
                            className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Edit Fields */}
                        <div className="space-y-3.5">
                          <Input
                            label="Destination City"
                            required
                            value={citySearch}
                            onChange={(e) => setCitySearch(e.target.value)}
                            placeholder="e.g. Kyoto, Japan or Mumbai, India"
                            leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
                          />

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Input
                              label="Start Date"
                              type="date"
                              required
                              value={startDate}
                              onChange={(e) => setStartDate(e.target.value)}
                            />

                            <Input
                              label="End Date"
                              type="date"
                              required
                              value={endDate}
                              onChange={(e) => setEndDate(e.target.value)}
                            />

                            <Input
                              label="Section Budget (₹ INR)"
                              type="number"
                              min="1"
                              required
                              value={sectionBudget}
                              onChange={(e) => setSectionBudget(e.target.value)}
                              placeholder="e.g. 15000"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <Label required className="text-xs font-medium text-foreground">
                              Section Notes & Highlights
                            </Label>
                            <Textarea
                              required
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              placeholder="Key attractions, hotels, or day goals..."
                              rows={2}
                              className="text-xs sm:text-sm"
                            />
                          </div>
                        </div>

                        {formError && (
                          <div className="p-2.5 rounded-[8px] bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{formError}</span>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={resetForm}
                            className="text-xs"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            size="sm"
                            disabled={isSubmitting}
                            className="text-xs gap-1.5"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Check className="w-3.5 h-3.5" />
                            )}
                            <span>Save Changes</span>
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </div>
                );
              }

              return (
                <SectionReorderItem
                  key={stopId}
                  stop={stop}
                  idx={idx}
                  totalStops={orderedStops.length}
                  onEdit={() => handleStartEdit(stop, stopId)}
                  onDeleteRequest={() => setDeletingStop({ id: stopId, name: stop.cityName })}
                  onMoveUp={() => handleMoveUp(idx)}
                  onMoveDown={() => handleMoveDown(idx)}
                  shouldReduceMotion={shouldReduceMotion}
                />
              );
            })}
          </Reorder.Group>
        )}

        {/* Expandable Add Section Form */}
        <AnimatePresence>
          {isAddFormOpen && (
            <motion.div
              ref={addFormRef}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="scroll-mt-24"
            >
              <Card className="border-2 border-primary/70 bg-surface shadow-lg p-5 sm:p-6 rounded-[14px]">
                <form onSubmit={handleSubmitSection} className="space-y-4">
                  <div className="flex items-center justify-between border-b border-border pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs">
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">
                        Add Destination Leg (Stop #{orderedStops.length + 1})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={resetForm}
                      aria-label="Close add form"
                      className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Destination City Input with built-in LeftIcon */}
                  <div className="relative">
                    <Input
                      label="Destination City"
                      required
                      value={citySearch}
                      onChange={(e) => {
                        setCitySearch(e.target.value);
                        setIsCityDropdownOpen(true);
                      }}
                      onFocus={() => setIsCityDropdownOpen(true)}
                      placeholder="Search city, state, or country (e.g. Udaipur, Tokyo, Paris)..."
                      leftIcon={<Search className="w-4 h-4 text-muted-foreground" />}
                    />

                    {/* Autocomplete Dropdown */}
                    {isCityDropdownOpen && searchResults.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-1.5 bg-surface border border-border rounded-[10px] shadow-xl z-50 max-h-52 overflow-y-auto">
                        {searchResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setSelectedCity({ id: c.id, name: c.name, country: c.country });
                              setCitySearch(`${c.name}, ${c.country}`);
                              setIsCityDropdownOpen(false);
                            }}
                            className="w-full px-3.5 py-2.5 text-left hover:bg-surface-hover flex items-center justify-between text-xs transition-colors border-b border-border/40 last:border-0 cursor-pointer"
                          >
                            <span className="font-semibold text-foreground">
                              {c.name},{" "}
                              <span className="font-normal text-muted-foreground">
                                {c.country}
                              </span>
                            </span>
                            <span className="text-[10px] font-mono text-primary font-semibold">
                              {c.country === "India" ? "India" : "Global"}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Quick Activity Tags when city is selected */}
                  {selectedCity && cityActivities.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[11px] font-mono text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-primary" />
                        Suggested highlights for {selectedCity.name}:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {cityActivities.map((act) => (
                          <button
                            key={act.name}
                            type="button"
                            onClick={() => {
                              setNotes((prev) =>
                                prev ? `${prev} · ${act.name}` : act.name
                              );
                            }}
                            className="px-2.5 py-1 rounded-full text-[10px] bg-surface-subtle hover:bg-primary/10 hover:text-primary border border-border transition-colors cursor-pointer"
                          >
                            + {act.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dates & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Input
                      label="Start Date"
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />

                    <Input
                      label="End Date"
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />

                    <Input
                      label="Section Budget (₹ INR)"
                      type="number"
                      min="1"
                      required
                      value={sectionBudget}
                      onChange={(e) => setSectionBudget(e.target.value)}
                      placeholder="e.g. 15000"
                    />
                  </div>

                  {/* Notes / Highlights */}
                  <div className="space-y-1.5">
                    <Label required className="text-xs font-medium text-foreground">
                      Section Notes & Itinerary Goals
                    </Label>
                    <Textarea
                      required
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Planned sights, hotel booking, transit, or tour notes..."
                      rows={2}
                      className="text-xs sm:text-sm"
                    />
                  </div>

                  {formError && (
                    <div className="p-2.5 rounded-[8px] bg-destructive/10 text-destructive text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={resetForm}
                      className="text-xs"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={isSubmitting}
                      className="text-xs gap-1.5"
                    >
                      {isSubmitting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      <span>Add Leg to Itinerary</span>
                    </Button>
                  </div>
                </form>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* + Add Another Section Action Button */}
        {!isAddFormOpen && !editingStopId && (
          <motion.div
            whileHover={{ scale: 1.008 }}
            whileTap={{ scale: 0.992 }}
            transition={{ duration: 0.15 }}
            className="pt-1"
          >
            <button
              type="button"
              onClick={handleOpenAddForm}
              className="w-full py-3.5 px-4 rounded-[12px] border-2 border-dashed border-border hover:border-primary/60 bg-surface/50 hover:bg-surface text-muted-foreground hover:text-foreground text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer shadow-xs min-h-[48px]"
            >
              <Plus className="w-4 h-4 text-primary" />
              <span>+ Add another Section</span>
            </button>
          </motion.div>
        )}
      </div>

      {/* Bottom Navigation / Action Bar */}
      <div className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link href="/trips/mine" className="w-full sm:w-auto">
          <Button variant="secondary" size="md" className="w-full sm:w-auto text-xs">
            <span>Back to Expeditions</span>
          </Button>
        </Link>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto text-xs gap-1.5"
            >
              <span>View Itinerary Journal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Delete Confirmation Modal Dialog */}
      <AnimatePresence>
        {deletingStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-md bg-surface border border-border rounded-[16px] p-6 shadow-2xl space-y-4"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
              aria-describedby="delete-dialog-desc"
            >
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-full bg-destructive/15 border border-destructive/30 flex items-center justify-center text-destructive shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0 flex-1">
                  <h3 id="delete-dialog-title" className="text-base font-bold text-foreground">
                    Delete Itinerary Section?
                  </h3>
                  <p id="delete-dialog-desc" className="text-xs text-muted-foreground leading-relaxed">
                    Are you sure you want to remove the <strong className="text-foreground">{deletingStop.name}</strong> section from this expedition? This action cannot be undone.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setDeletingStop(null)}
                  disabled={deleteStopMutation.isPending}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteStopMutation.mutate(deletingStop.id)}
                  disabled={deleteStopMutation.isPending}
                  className="text-xs gap-1.5"
                >
                  {deleteStopMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  <span>Delete Leg</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
