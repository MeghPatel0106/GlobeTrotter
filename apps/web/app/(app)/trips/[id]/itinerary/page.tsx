"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence, Reorder, useDragControls, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
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
  Sparkles,
  Search,
  X,
  Check,
  AlertCircle,
  AlertTriangle,
  Loader2,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  Clock,
  Layers,
  Navigation,
  Star,
  Moon,
  Sunrise,
  Sun,
  Sunset,
  ArrowUp,
  ArrowDown,
  Receipt,
  Car,
  Bed,
  Utensils,
  Ticket,
  Wallet,
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCheck,
  Share2,
  Copy,
  ExternalLink,
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
  Input,
  Textarea,
  Label,
} from "@globetrotter/ui";
import {
  tripsApi,
  stopsApi,
  citiesApi,
  itineraryItemsApi,
  expensesApi,
  Trip,
  Stop,
  Activity,
  Expense,
  ExpenseCategory,
  AddStopInput,
  UpdateStopInput,
  CreateItineraryItemInput,
  UpdateItineraryItemInput,
  CreateExpenseInput,
  UpdateExpenseInput,
} from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { getCurrencyForCountry, getCurrencySymbol, formatMoney } from "@/lib/currency";

// Register ScrollTrigger plugin safely
if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// Available standard time slots strictly between 8:30 AM and 8:00 PM
const VALID_TIME_SLOTS = [
  "08:30 AM",
  "10:00 AM",
  "11:30 AM",
  "01:00 PM",
  "02:30 PM",
  "04:00 PM",
  "05:30 PM",
  "07:00 PM",
  "08:00 PM",
];

// Expense Categories
const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string; icon: any; color: string }[] = [
  { key: "TRANSPORT", label: "Transport", icon: Car, color: "#3B82F6" },
  { key: "STAY", label: "Stay", icon: Bed, color: "#8B5CF6" },
  { key: "ACTIVITY", label: "Activity", icon: Ticket, color: "#10B981" },
  { key: "MEAL", label: "Meal", icon: Utensils, color: "#F59E0B" },
  { key: "OTHER", label: "Other", icon: Receipt, color: "#64748B" },
];

interface FormPlaceItem {
  id?: string;
  activityId?: string;
  activityName: string;
  costOverride?: number;
}

interface ProcessedActivity {
  id: string;
  activityId?: string;
  name: string;
  timeSlot: string;
  category: string;
  details: string;
  cost: number;
  isFree: boolean;
  orderIndex: number;
  dayNumber: number;
  durationMinutes?: number;
  rating?: number;
}

interface ProcessedDay {
  dayNumber: number;
  dateStr: string | null;
  formattedDate: string;
  cityName: string;
  country: string;
  stopId: string;
  legIndex: number;
  totalLegs: number;
  stopNotes?: string;
  activities: ProcessedActivity[];
  rawStop: Stop;
}

interface CitySection {
  stopId: string;
  cityName: string;
  country: string;
  legIndex: number;
  startDate?: string | null;
  endDate?: string | null;
  sectionBudget?: number | null;
  notes?: string | null;
  days: ProcessedDay[];
  rawStop: Stop;
}

interface EditingActivityState {
  id: string;
  name: string;
  dayNumber: number;
  timeSlot: string;
  cost: number;
  stopId: string;
  cityName: string;
  day?: ProcessedDay;
}

interface DeletingActivityState {
  id: string;
  name: string;
  dayNumber: number;
  stopId: string;
}

// Custom Recharts Donut Tooltip
function CustomPieTooltip({ active, payload, currencySymbol = "₹" }: any) {
  if (active && payload && payload.length) {
    const data = payload[0];
    const sym = data.payload.currencySymbol || currencySymbol;
    return (
      <div className="p-2.5 rounded-[8px] bg-surface border border-border shadow-xl text-xs space-y-0.5">
        <div className="font-bold text-foreground flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span>{data.name}</span>
        </div>
        <p className="font-mono text-success font-bold">{sym}{data.value?.toLocaleString()}</p>
        <p className="text-[10px] font-mono text-muted-foreground">{data.payload.percentage}% of total spending</p>
      </div>
    );
  }
  return null;
}

// Custom Recharts Bar Tooltip
function CustomBarTooltip({ active, payload, label, currencySymbol = "₹" }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const sym = data.currencySymbol || currencySymbol;
    return (
      <div className="p-2.5 rounded-[8px] bg-surface border border-border shadow-xl text-xs space-y-1">
        <div className="font-bold text-foreground">{label} ({data.cityName})</div>
        <p className="font-mono text-success font-bold">Spent: {sym}{data.spent?.toLocaleString()}</p>
        {data.budget > 0 && (
          <p className="font-mono text-muted-foreground text-[11px]">Budget: {sym}{data.budget?.toLocaleString()}</p>
        )}
        {data.isOverbudget && (
          <p className="text-[11px] font-bold text-destructive flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            <span>Over budget by {sym}{(data.spent - data.budget).toLocaleString()}</span>
          </p>
        )}
      </div>
    );
  }
  return null;
}

// Sub-component for an individual reorderable section item in Manage Mode
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
          {/* Dedicated Drag Handle */}
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
          <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4 min-w-0">
              <div className="space-y-1.5 flex-1 min-w-0">
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

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {stop.notes ||
                    `Destination leg for ${stop.cityName}. Activities, accommodation, and day plans.`}
                </p>

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
                      <span className="font-bold">{getCurrencySymbol(stop.country)}</span>
                      <span>{stop.sectionBudget.toLocaleString()}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Edit & Delete Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-start">
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

            {/* Selected Places & Activities List */}
            {stop.itineraryItems && stop.itineraryItems.length > 0 && (
              <div className="pt-2.5 border-t border-border/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-semibold text-primary flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    <span>Places & Activities ({stop.itineraryItems.length}):</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {stop.itineraryItems.map((item, itemIdx) => (
                    <span
                      key={item.id || (item as any)._id || itemIdx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-surface-subtle border border-border text-xs text-foreground font-medium"
                    >
                      <Check className="w-3 h-3 text-primary shrink-0" />
                      <span>{item.activityName || "Attraction"}</span>
                      {item.startTime && (
                        <span className="text-[10px] font-mono text-primary/80 ml-0.5">
                          · {item.startTime}
                        </span>
                      )}
                      {item.costOverride !== undefined && item.costOverride !== null && (
                        <span className="text-[10px] font-mono text-muted-foreground ml-0.5">
                          {item.costOverride === 0
                            ? "Free"
                            : `${getCurrencySymbol(stop.country)}${item.costOverride}`}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            )}
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

  // Mode state: 'view' = Itinerary View, 'manage' = Edit Sections
  const [viewMode, setViewMode] = React.useState<"view" | "manage">("view");

  // Selected City Filter in Itinerary View ('all' or specific stopId)
  const [activeCityFilter, setActiveCityFilter] = React.useState<string>("all");

  // =========================================================================
  // BUDGET SUMMARY MODAL STATE (PHASE 4 STEP 5)
  // =========================================================================
  const [isBudgetSummaryOpen, setIsBudgetSummaryOpen] = React.useState(false);
  const [isMounted, setIsMounted] = React.useState(false);

  // =========================================================================
  // PUBLIC SHARE MODAL STATE
  // =========================================================================
  const [isShareModalOpen, setIsShareModalOpen] = React.useState(false);
  const [shareToken, setShareToken] = React.useState<string>("");
  const [isCopied, setIsCopied] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Add Activity Modal State
  const [targetAddActivityDay, setTargetAddActivityDay] = React.useState<ProcessedDay | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = React.useState<string>("08:30 AM");
  const [activitySearchInput, setActivitySearchInput] = React.useState("");
  const [debouncedActivitySearch, setDebouncedActivitySearch] = React.useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = React.useState("all");
  const [selectedCostFilter, setSelectedCostFilter] = React.useState("all");
  const [customActivityName, setCustomActivityName] = React.useState("");
  const [customActivityCost, setCustomActivityCost] = React.useState("");

  // Edit Activity Modal State
  const [editingActivity, setEditingActivity] = React.useState<EditingActivityState | null>(null);
  const [editActivityName, setEditActivityName] = React.useState("");
  const [editActivityDayNumber, setEditActivityDayNumber] = React.useState<number>(1);
  const [editActivityTimeSlot, setEditActivityTimeSlot] = React.useState("08:30 AM");
  const [editActivityCost, setEditActivityCost] = React.useState("");

  // Delete Activity Confirmation Dialog State
  const [deletingActivity, setDeletingActivity] = React.useState<DeletingActivityState | null>(null);

  // Expense Management States
  const [targetAddExpenseDay, setTargetAddExpenseDay] = React.useState<ProcessedDay | null>(null);
  const [expenseCategory, setExpenseCategory] = React.useState<ExpenseCategory>("MEAL");
  const [expenseAmount, setExpenseAmount] = React.useState("");
  const [expenseNotes, setExpenseNotes] = React.useState("");
  const [expenseDate, setExpenseDate] = React.useState("");

  // Edit Expense State
  const [editingExpense, setEditingExpense] = React.useState<Expense | null>(null);
  const [editExpenseCategory, setEditExpenseCategory] = React.useState<ExpenseCategory>("MEAL");
  const [editExpenseAmount, setEditExpenseAmount] = React.useState("");
  const [editExpenseNotes, setEditExpenseNotes] = React.useState("");
  const [editExpenseDate, setEditExpenseDate] = React.useState("");
  const [editExpenseDayNumber, setEditExpenseDayNumber] = React.useState<number>(1);

  // Delete Expense State
  const [deletingExpense, setDeletingExpense] = React.useState<Expense | null>(null);

  // Form states for adding/editing sections
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

  // Places / activities inside the section form
  const [formPlaces, setFormPlaces] = React.useState<FormPlaceItem[]>([]);
  const [newPlaceInput, setNewPlaceInput] = React.useState("");

  // Delete Confirmation Dialog state
  const [deletingStop, setDeletingStop] = React.useState<{
    id: string;
    name: string;
  } | null>(null);

  // Local reorderable stops list
  const [orderedStops, setOrderedStops] = React.useState<Stop[]>([]);

  // ScrollTrigger timeline line references
  const containerRef = React.useRef<HTMLDivElement>(null);
  const threadPathRef = React.useRef<SVGPathElement>(null);
  const [svgHeight, setSvgHeight] = React.useState(800);

  const addFormRef = React.useRef<HTMLDivElement>(null);
  const editFormRef = React.useRef<HTMLDivElement>(null);
  const activitySearchInputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search query by 300ms (>= 250ms requirement)
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedActivitySearch(activitySearchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [activitySearchInput]);

  // Authentication protection
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
  } = useQuery({
    queryKey: ["trip", tripId],
    queryFn: () => tripsApi.getById(tripId),
    enabled: !!tripId && isAuthenticated,
    staleTime: 30 * 1000,
  });

  // Fetch real trip expenses from MongoDB
  const {
    data: tripExpenses = [],
    isLoading: isExpensesLoading,
  } = useQuery({
    queryKey: ["trip-expenses", tripId],
    queryFn: () => expensesApi.getTripExpenses(tripId),
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

  const tripCountry = trip?.stops && trip.stops.length > 0 ? trip.stops[0].country : null;

  // Live search for destination cities in Section form (filtered by tripCountry)
  const { data: searchResults = [] } = useQuery({
    queryKey: ["cities", "search", citySearch, tripCountry],
    queryFn: () => citiesApi.search(citySearch, 8, tripCountry || undefined),
    enabled: isCityDropdownOpen && citySearch.trim().length > 0,
    staleTime: 30 * 1000,
  });

  // Top activities for selected city in section builder
  const { data: cityActivities = [] } = useQuery({
    queryKey: ["cities", selectedCity?.id, "activities"],
    queryFn: () => (selectedCity?.id ? citiesApi.getActivities(selectedCity.id, { top: 6 }) : []),
    enabled: !!selectedCity?.id,
    staleTime: 5 * 60 * 1000,
  });

  // Activity search query for Add Activity Modal (City-Restricted & Debounced)
  const {
    data: modalActivities = [],
    isLoading: isActivitiesSearchLoading,
    isError: isActivitiesSearchError,
    refetch: refetchModalActivities,
  } = useQuery({
    queryKey: [
      "activities-search",
      targetAddActivityDay?.stopId,
      targetAddActivityDay?.cityName,
      debouncedActivitySearch,
      selectedCategoryFilter,
      selectedCostFilter,
    ],
    queryFn: () => {
      if (!targetAddActivityDay) return [];
      const cityId = (targetAddActivityDay.rawStop?.cityId as any) || targetAddActivityDay.stopId || "";
      const maxCost =
        selectedCostFilter === "free"
          ? 0
          : selectedCostFilter === "under1000"
          ? 1000
          : selectedCostFilter === "under5000"
          ? 5000
          : undefined;

      return citiesApi.getActivities(cityId, {
        top: 25,
        q: debouncedActivitySearch.trim() || undefined,
        category: selectedCategoryFilter !== "all" ? selectedCategoryFilter : undefined,
        maxCost,
        cityName: targetAddActivityDay.cityName,
      });
    },
    enabled: !!targetAddActivityDay,
    staleTime: 30 * 1000,
  });

  // Calculate City Sections & Day-by-Day Sessions
  const citySections: CitySection[] = React.useMemo(() => {
    if (!trip) return [];

    const stops: Stop[] = Array.isArray(trip.stops)
      ? [...trip.stops].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      : [];

    if (stops.length === 0) return [];

    const resultSections: CitySection[] = [];
    const msPerDay = 1000 * 60 * 60 * 24;
    let runningDayNumber = 1;

    let rollingDate = trip.startDate
      ? new Date(trip.startDate)
      : stops[0]?.startDate
      ? new Date(stops[0].startDate)
      : null;

    const standardTimeSlots = [
      "08:30 AM",
      "11:30 AM",
      "02:30 PM",
      "05:30 PM",
      "07:30 PM",
    ];

    stops.forEach((stop, stopIdx) => {
      const rawItems = stop.itineraryItems || [];
      const stopId = stop.id || (stop as any)._id || `stop-${stopIdx}`;

      let stopDaysCount = 1;
      let stopStart: Date | null = null;
      let stopEnd: Date | null = null;

      if (stop.startDate && stop.endDate) {
        const s = new Date(stop.startDate);
        const e = new Date(stop.endDate);
        if (!isNaN(s.getTime()) && !isNaN(e.getTime()) && e >= s) {
          stopStart = s;
          stopEnd = e;
          stopDaysCount = Math.max(1, Math.round((e.getTime() - s.getTime()) / msPerDay) + 1);
        }
      }

      if (!stopStart) {
        if (rollingDate && !isNaN(rollingDate.getTime())) {
          stopStart = new Date(rollingDate);
        }
        stopDaysCount = Math.max(1, Math.ceil(rawItems.length / 3) || 1);
      }

      const sectionDays: ProcessedDay[] = [];

      for (let dayOffset = 0; dayOffset < stopDaysCount; dayOffset++) {
        const currentDayNumber = runningDayNumber++;

        let dayDate: Date | null = null;
        let dateStr: string | null = null;
        let formattedDate = `Day ${currentDayNumber}`;

        if (stopStart) {
          dayDate = new Date(stopStart.getTime() + dayOffset * msPerDay);
          dateStr = dayDate.toISOString().split("T")[0];
          formattedDate = dayDate.toLocaleDateString("en-US", {
            weekday: "short",
            month: "short",
            day: "numeric",
          });
        }

        const matchedItems: ProcessedActivity[] = [];

        rawItems.forEach((item, itemIdx) => {
          const isExplicitGlobalMatch = item.dayNumber === currentDayNumber;
          const isExplicitRelativeMatch = item.dayNumber === dayOffset + 1 && stopDaysCount > 1;
          const isSingleDayStop = stopDaysCount === 1;
          const isDistributed =
            !item.dayNumber &&
            (stopDaysCount > 1 ? itemIdx % stopDaysCount === dayOffset : true);

          if (isExplicitGlobalMatch || isExplicitRelativeMatch || isSingleDayStop || isDistributed) {
            matchedItems.push({
              id: item.id || (item as any)._id || `act-${stopId}-${currentDayNumber}-${itemIdx}`,
              activityId: item.activityId ? String(item.activityId) : undefined,
              name: item.activityName || "Sightseeing Exploration",
              timeSlot: item.startTime || standardTimeSlots[itemIdx % standardTimeSlots.length],
              category: "Sightseeing & Highlights",
              details: `Experience ${item.activityName || "cultural attractions"} in ${stop.cityName}.`,
              cost: item.costOverride ?? 0,
              isFree: item.costOverride === 0 || item.costOverride == null,
              orderIndex: item.orderIndex ?? itemIdx,
              dayNumber: item.dayNumber || currentDayNumber,
            });
          }
        });

        // Safety fallback: on the first day of this stop, ensure all activities of the stop appear if matchedItems is empty
        if (dayOffset === 0 && matchedItems.length === 0 && rawItems.length > 0) {
          rawItems.forEach((item, itemIdx) => {
            matchedItems.push({
              id: item.id || (item as any)._id || `act-${stopId}-${currentDayNumber}-${itemIdx}`,
              activityId: item.activityId ? String(item.activityId) : undefined,
              name: item.activityName || "Sightseeing Exploration",
              timeSlot: item.startTime || standardTimeSlots[itemIdx % standardTimeSlots.length],
              category: "Sightseeing & Highlights",
              details: `Experience ${item.activityName || "cultural attractions"} in ${stop.cityName}.`,
              cost: item.costOverride ?? 0,
              isFree: item.costOverride === 0 || item.costOverride == null,
              orderIndex: item.orderIndex ?? itemIdx,
              dayNumber: item.dayNumber || currentDayNumber,
            });
          });
        }

        // Sort items chronologically by time slot and order index
        matchedItems.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

        sectionDays.push({
          dayNumber: currentDayNumber,
          dateStr,
          formattedDate,
          cityName: stop.cityName,
          country: stop.country,
          stopId,
          rawStop: stop,
          legIndex: stopIdx + 1,
          totalLegs: stops.length,
          stopNotes: stop.notes,
          activities: matchedItems,
        });
      }

      resultSections.push({
        stopId,
        cityName: stop.cityName,
        country: stop.country,
        legIndex: stopIdx + 1,
        startDate: stop.startDate
          ? new Date(stop.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null,
        endDate: stop.endDate
          ? new Date(stop.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
          : null,
        sectionBudget: stop.sectionBudget,
        notes: stop.notes,
        rawStop: stop,
        days: sectionDays,
      });

      if (stopStart) {
        rollingDate = new Date(stopStart.getTime() + stopDaysCount * msPerDay);
      }
    });

    return resultSections;
  }, [trip]);

  // Flattened all days list for overview metrics
  const allDays = React.useMemo(() => {
    return citySections.flatMap((sec) => sec.days);
  }, [citySections]);

  // Filtered sections depending on top city filter
  const displayedSections = React.useMemo(() => {
    if (activeCityFilter === "all") return citySections;
    return citySections.filter((sec) => sec.stopId === activeCityFilter);
  }, [citySections, activeCityFilter]);

  // ===========================================================================
  // BUDGET SUMMARY ANALYTICS (PHASE 4 STEP 5)
  // ===========================================================================
  const budgetAnalytics = React.useMemo(() => {
    if (!trip) {
      return {
        totalBudget: 0,
        activityCostsTotal: 0,
        directExpensesTotal: 0,
        totalSpent: 0,
        remaining: 0,
        isOverbudget: false,
        dailyAverage: 0,
        categoryBreakdown: [],
        dailyBreakdown: [],
        overbudgetDays: [],
        hasAnySpending: false,
      };
    }

    const stops = Array.isArray(trip.stops) ? trip.stops : [];
    const totalBudget =
      trip.totalBudgetEstimate ||
      stops.reduce((acc, s) => acc + (s.sectionBudget || 0), 0);

    // Sum of all activities cost
    let activityCostsTotal = 0;
    stops.forEach((stop) => {
      (stop.itineraryItems || []).forEach((item) => {
        activityCostsTotal += item.costOverride || 0;
      });
    });

    // Sum of all direct expenses
    let directExpensesTotal = 0;
    tripExpenses.forEach((exp) => {
      directExpensesTotal += exp.amount || 0;
    });

    const totalSpent = activityCostsTotal + directExpensesTotal;
    const remaining = totalBudget - totalSpent;
    const isOverbudget = totalBudget > 0 && totalSpent > totalBudget;
    const totalDaysCount = Math.max(1, allDays.length);
    const dailyAverage = Math.round(totalSpent / totalDaysCount);

    // Category breakdown
    const catMap: Record<ExpenseCategory, number> = {
      TRANSPORT: 0,
      STAY: 0,
      ACTIVITY: activityCostsTotal, // Include activities cost in Activity category
      MEAL: 0,
      OTHER: 0,
    };

    tripExpenses.forEach((exp) => {
      if (catMap[exp.category] !== undefined) {
        catMap[exp.category] += exp.amount || 0;
      } else {
        catMap.OTHER += exp.amount || 0;
      }
    });

    const categoryBreakdown = Object.entries(catMap)
      .map(([key, amount]) => {
        const catKey = key as ExpenseCategory;
        const meta =
          EXPENSE_CATEGORIES.find((c) => c.key === catKey) ||
          EXPENSE_CATEGORIES[4];
        const percentage =
          totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0;
        return {
          key: catKey,
          name: meta.label,
          amount,
          percentage,
          color: meta.color,
        };
      })
      .filter((c) => c.amount > 0 || totalSpent === 0);

    // Daily breakdown & Overbudget detection
    const overbudgetDays: {
      dayNumber: number;
      cityName: string;
      spent: number;
      budget: number;
      overAmount: number;
    }[] = [];

    const dailyBreakdown = allDays.map((day) => {
      const dayActsCost = day.activities.reduce(
        (acc, a) => acc + (a.cost || 0),
        0
      );
      const dayDirectCost = tripExpenses
        .filter((e) => e.dayNumber === day.dayNumber)
        .reduce((acc, e) => acc + (e.amount || 0), 0);
      const daySpent = dayActsCost + dayDirectCost;

      const stopDays =
        allDays.filter((d) => d.stopId === day.stopId).length || 1;
      const dayBudget = day.rawStop?.sectionBudget
        ? Math.round(day.rawStop.sectionBudget / stopDays)
        : totalBudget > 0
        ? Math.round(totalBudget / totalDaysCount)
        : 0;

      const isDayOver = dayBudget > 0 && daySpent > dayBudget;
      const overAmount = Math.max(0, daySpent - dayBudget);

      if (isDayOver) {
        overbudgetDays.push({
          dayNumber: day.dayNumber,
          cityName: day.cityName,
          spent: daySpent,
          budget: dayBudget,
          overAmount,
        });
      }

      return {
        name: `Day ${day.dayNumber}`,
        dayNumber: day.dayNumber,
        cityName: day.cityName,
        spent: daySpent,
        budget: dayBudget,
        isOverbudget: isDayOver,
      };
    });

    const hasAnySpending = totalSpent > 0;

    return {
      totalBudget,
      activityCostsTotal,
      directExpensesTotal,
      totalSpent,
      remaining,
      isOverbudget,
      dailyAverage,
      categoryBreakdown,
      dailyBreakdown,
      overbudgetDays,
      hasAnySpending,
    };
  }, [trip, tripExpenses, allDays]);

  // Keep track of container height for dynamic SVG Route Thread
  React.useEffect(() => {
    if (viewMode !== "view" || !containerRef.current) return;

    const updateHeight = () => {
      if (containerRef.current) {
        setSvgHeight(containerRef.current.scrollHeight);
      }
    };

    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [allDays, viewMode, displayedSections, tripExpenses]);

  // GSAP ScrollTrigger for Route Thread
  React.useEffect(() => {
    if (viewMode !== "view" || !threadPathRef.current || !containerRef.current || allDays.length === 0)
      return;

    const path = threadPathRef.current;

    if (shouldReduceMotion) {
      gsap.set(path, { strokeDashoffset: 0 });
      return;
    }

    let pathLength = 0;
    try {
      pathLength = path.getTotalLength();
    } catch {
      pathLength = 1200;
    }

    gsap.set(path, {
      strokeDasharray: pathLength,
      strokeDashoffset: pathLength,
    });

    const st = ScrollTrigger.create({
      trigger: containerRef.current,
      start: "top 75%",
      end: "bottom 85%",
      scrub: 0.6,
      onUpdate: (self) => {
        const drawOffset = pathLength * (1 - self.progress);
        gsap.to(path, {
          strokeDashoffset: drawOffset,
          duration: 0.1,
          overwrite: "auto",
          ease: "none",
        });
      },
    });

    return () => {
      st.kill();
    };
  }, [shouldReduceMotion, allDays, svgHeight, viewMode]);

  // ===========================================================================
  // PERSISTED ITINERARY ITEM MUTATIONS
  // ===========================================================================

  const createItineraryItemMutation = useMutation({
    mutationFn: (data: CreateItineraryItemInput) => itineraryItemsApi.create(data),
    onSuccess: (updatedTrip, variables) => {
      if (updatedTrip) {
        queryClient.setQueryData(["trip", tripId], updatedTrip);
      }
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(`Added "${variables.activityName}" to Day ${variables.dayNumber || 1}!`);
      handleCloseAddActivityModal();
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to save activity to MongoDB.";
      toast.error(msg);
    },
  });

  const updateItineraryItemMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateItineraryItemInput }) =>
      itineraryItemsApi.update(id, data),
    onSuccess: (updatedTrip, variables) => {
      if (updatedTrip) {
        queryClient.setQueryData(["trip", tripId], updatedTrip);
      }
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(
        variables.data.activityName
          ? `Updated "${variables.data.activityName}"!`
          : "Activity updated successfully!"
      );
      setEditingActivity(null);
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to update activity.";
      toast.error(msg);
    },
  });

  const deleteItineraryItemMutation = useMutation({
    mutationFn: (itemId: string) => itineraryItemsApi.delete(itemId),
    onSuccess: (updatedTrip) => {
      if (updatedTrip) {
        queryClient.setQueryData(["trip", tripId], updatedTrip);
      }
      const deletedName = deletingActivity?.name || "Activity";
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success(`Removed "${deletedName}" from itinerary.`);
      setDeletingActivity(null);
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to remove activity.";
      toast.error(msg);
    },
  });

  const reorderItineraryItemsMutation = useMutation({
    mutationFn: ({ stopId, itemIds }: { stopId: string; itemIds: string[] }) =>
      itineraryItemsApi.reorder(stopId, itemIds),
    onSuccess: (updatedTrip) => {
      if (updatedTrip) {
        queryClient.setQueryData(["trip", tripId], updatedTrip);
      }
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
    },
    onError: () => {
      toast.error("Failed to persist activity order.");
    },
  });

  // ===========================================================================
  // PERSISTED EXPENSE MUTATIONS
  // ===========================================================================

  const createExpenseMutation = useMutation({
    mutationFn: (data: CreateExpenseInput) => expensesApi.create(tripId, data),
    onSuccess: (savedExpense) => {
      queryClient.invalidateQueries({ queryKey: ["trip-expenses", tripId] });
      const sym = getCurrencySymbol(savedExpense.currency);
      toast.success(
        `Recorded ${sym}${savedExpense.amount.toLocaleString()} ${savedExpense.category.toLowerCase()} expense!`
      );
      setTargetAddExpenseDay(null);
      setExpenseAmount("");
      setExpenseNotes("");
      setExpenseCategory("MEAL");
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to record expense.";
      toast.error(msg);
    },
  });

  const updateExpenseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseInput }) =>
      expensesApi.update(id, data),
    onSuccess: (updatedExpense) => {
      queryClient.invalidateQueries({ queryKey: ["trip-expenses", tripId] });
      const sym = getCurrencySymbol(updatedExpense.currency);
      toast.success(
        `Updated expense to ${sym}${updatedExpense.amount.toLocaleString()} (${updatedExpense.category})!`
      );
      setEditingExpense(null);
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to update expense.";
      toast.error(msg);
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: (expenseId: string) => expensesApi.delete(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip-expenses", tripId] });
      toast.success("Expense removed from day.");
      setDeletingExpense(null);
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to remove expense.";
      toast.error(msg);
    },
  });

  // Handler for Opening Add Expense Dialog
  const handleOpenAddExpense = (day: ProcessedDay) => {
    setTargetAddExpenseDay(day);
    setExpenseCategory("MEAL");
    setExpenseAmount("");
    setExpenseNotes("");
    setExpenseDate(day.dateStr || new Date().toISOString().split("T")[0]);
  };

  // Handler for Submitting Add Expense
  const handleSaveNewExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetAddExpenseDay) return;

    const amountNum = parseFloat(expenseAmount);
    const dayCurrency = getCurrencyForCountry(targetAddExpenseDay.country || trip?.stops?.[0]?.country);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(`Please enter a valid expense amount greater than ${dayCurrency.symbol}0.`);
      return;
    }

    createExpenseMutation.mutate({
      tripId,
      stopId: targetAddExpenseDay.stopId,
      dayNumber: targetAddExpenseDay.dayNumber,
      category: expenseCategory,
      amount: amountNum,
      currency: dayCurrency.code,
      date: expenseDate || undefined,
      notes: expenseNotes.trim() || undefined,
    });
  };

  // Handler for Opening Edit Expense Modal
  const handleOpenEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setEditExpenseCategory(expense.category);
    setEditExpenseAmount(String(expense.amount));
    setEditExpenseNotes(expense.notes || "");
    setEditExpenseDate(
      expense.date ? new Date(expense.date).toISOString().split("T")[0] : ""
    );
    setEditExpenseDayNumber(expense.dayNumber || 1);
  };

  // Handler for Submitting Edit Expense
  const handleSaveEditedExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    const amountNum = parseFloat(editExpenseAmount);
    const expCurrency = getCurrencyForCountry(editingExpense.currency || trip?.stops?.[0]?.country);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error(`Please enter a valid expense amount greater than ${expCurrency.symbol}0.`);
      return;
    }

    updateExpenseMutation.mutate({
      id: editingExpense.id,
      data: {
        category: editExpenseCategory,
        amount: amountNum,
        currency: expCurrency.code,
        notes: editExpenseNotes.trim() || undefined,
        date: editExpenseDate || undefined,
        dayNumber: editExpenseDayNumber,
      },
    });
  };

  // Handler for Moving an Activity Up within a Day
  const handleMoveActivityUp = (day: ProcessedDay, actIdx: number) => {
    if (actIdx <= 0) return;
    const currentActs = [...day.activities];
    const targetItem = currentActs[actIdx];
    const prevItem = currentActs[actIdx - 1];

    const stop = day.rawStop;
    if (!stop?.itineraryItems) return;

    const allStopItems = [...stop.itineraryItems];
    const targetStopIdx = allStopItems.findIndex(
      (it) => (it.id || (it as any)._id) === targetItem.id
    );
    const prevStopIdx = allStopItems.findIndex(
      (it) => (it.id || (it as any)._id) === prevItem.id
    );

    if (targetStopIdx !== -1 && prevStopIdx !== -1) {
      const temp = allStopItems[targetStopIdx];
      allStopItems[targetStopIdx] = allStopItems[prevStopIdx];
      allStopItems[prevStopIdx] = temp;

      const itemIds = allStopItems
        .map((it) => it.id || (it as any)._id)
        .filter(Boolean) as string[];

      reorderItineraryItemsMutation.mutate({
        stopId: day.stopId,
        itemIds,
      });
    }
  };

  // Handler for Moving an Activity Down within a Day
  const handleMoveActivityDown = (day: ProcessedDay, actIdx: number) => {
    if (actIdx >= day.activities.length - 1) return;
    const currentActs = [...day.activities];
    const targetItem = currentActs[actIdx];
    const nextItem = currentActs[actIdx + 1];

    const stop = day.rawStop;
    if (!stop?.itineraryItems) return;

    const allStopItems = [...stop.itineraryItems];
    const targetStopIdx = allStopItems.findIndex(
      (it) => (it.id || (it as any)._id) === targetItem.id
    );
    const nextStopIdx = allStopItems.findIndex(
      (it) => (it.id || (it as any)._id) === nextItem.id
    );

    if (targetStopIdx !== -1 && nextStopIdx !== -1) {
      const temp = allStopItems[targetStopIdx];
      allStopItems[targetStopIdx] = allStopItems[nextStopIdx];
      allStopItems[nextStopIdx] = temp;

      const itemIds = allStopItems
        .map((it) => it.id || (it as any)._id)
        .filter(Boolean) as string[];

      reorderItineraryItemsMutation.mutate({
        stopId: day.stopId,
        itemIds,
      });
    }
  };

  // Handler for opening Edit Activity Modal
  const handleOpenEditActivity = (act: ProcessedActivity, day: ProcessedDay) => {
    setEditingActivity({
      id: act.id,
      name: act.name,
      dayNumber: act.dayNumber,
      timeSlot: act.timeSlot,
      cost: act.cost,
      stopId: day.stopId,
      cityName: day.cityName,
    });
    setEditActivityName(act.name);
    setEditActivityDayNumber(act.dayNumber);
    setEditActivityTimeSlot(act.timeSlot || "08:30 AM");
    setEditActivityCost(act.cost ? String(act.cost) : "0");
  };

  // Handler for saving edited activity
  const handleSaveEditedActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingActivity) return;

    const trimmedName = editActivityName.trim();
    if (!trimmedName) {
      toast.error("Activity name is required.");
      return;
    }

    const costNum = editActivityCost ? parseFloat(editActivityCost) : 0;

    updateItineraryItemMutation.mutate({
      id: editingActivity.id,
      data: {
        activityName: trimmedName,
        dayNumber: editActivityDayNumber,
        startTime: editActivityTimeSlot,
        costOverride: isNaN(costNum) ? 0 : costNum,
      },
    });
  };

  // Handler for opening Delete Activity confirmation
  const handleOpenDeleteActivity = (act: ProcessedActivity, day: ProcessedDay) => {
    setDeletingActivity({
      id: act.id,
      name: act.name,
      dayNumber: day.dayNumber,
      stopId: day.stopId,
    });
  };

  // Add Stop Mutation
  const addStopMutation = useMutation({
    mutationFn: (data: AddStopInput) => tripsApi.addStop(tripId, data),
    onSuccess: (updatedTrip) => {
      if (updatedTrip) {
        queryClient.setQueryData(["trip", tripId], updatedTrip);
      }
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      const addedLegName = selectedCity?.name || citySearch.split(",")[0].trim();
      toast.success(`Added ${addedLegName} destination to itinerary!`);
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
    onSuccess: (updatedTrip) => {
      if (updatedTrip) {
        queryClient.setQueryData(["trip", tripId], updatedTrip);
      }
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Itinerary updated successfully");
      resetForm();
    },
    onError: (err: any) => {
      const msg = err?.message || "Failed to update itinerary.";
      setFormError(msg);
      toast.error(msg);
    },
  });

  // Delete Stop Mutation
  const deleteStopMutation = useMutation({
    mutationFn: (stopId: string) => stopsApi.delete(stopId),
    onSuccess: (updatedTrip) => {
      if (updatedTrip) {
        queryClient.setQueryData(["trip", tripId], updatedTrip);
      }
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
    onError: () => {
      toast.error("Failed to save reordered section sequence.");
    },
  });

  // Reorder Handler
  const handleReorder = (newOrder: Stop[]) => {
    const updated = newOrder.map((s, idx) => ({ ...s, orderIndex: idx }));
    setOrderedStops(updated);

    const stopIds = updated
      .map((s) => s.id || (s as any)._id)
      .filter((id): id is string => Boolean(id));

    if (stopIds.length > 0) {
      reorderStopsMutation.mutate(stopIds);
    }
  };

  // Keyboard / 1-Click Move Handlers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...orderedStops];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index - 1];
    newOrder[index - 1] = temp;
    handleReorder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === orderedStops.length - 1) return;
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
    setFormPlaces([]);
    setNewPlaceInput("");
  };

  // Open Edit Form
  const handleStartEdit = (stop: Stop, stopId: string) => {
    setEditingStopId(stopId);
    setIsAddFormOpen(false);
    setSelectedCity({
      id: stop.cityId as any,
      name: stop.cityName,
      country: stop.country,
    });
    setCitySearch(`${stop.cityName}, ${stop.country}`);
    setStartDate(stop.startDate ? new Date(stop.startDate).toISOString().split("T")[0] : "");
    setEndDate(stop.endDate ? new Date(stop.endDate).toISOString().split("T")[0] : "");
    setSectionBudget(stop.sectionBudget != null ? String(stop.sectionBudget) : "");
    setNotes(stop.notes || "");
    setFormError("");

    if (stop.itineraryItems && Array.isArray(stop.itineraryItems)) {
      setFormPlaces(
        stop.itineraryItems.map((item) => ({
          id: item.id || (item as any)._id,
          activityId: item.activityId as any,
          activityName: item.activityName || "",
          costOverride: item.costOverride,
        }))
      );
    } else {
      setFormPlaces([]);
    }

    setViewMode("manage");
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
  };

  // Handle Save Section (Add or Edit)
  const handleSaveSection = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const cityName = selectedCity?.name || citySearch.split(",")[0]?.trim();
    const country = selectedCity?.country || tripCountry || "India";

    if (!cityName) {
      setFormError("Destination city name is required.");
      return;
    }

    if (startDate && endDate && endDate < startDate) {
      setFormError("End date cannot be earlier than start date.");
      return;
    }

    const payload: AddStopInput = {
      cityId: selectedCity?.id,
      cityName,
      country,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      sectionBudget: sectionBudget ? parseFloat(sectionBudget) : undefined,
      notes: notes.trim() || undefined,
      itineraryItems: formPlaces.map((p, idx) => ({
        activityId: p.activityId,
        activityName: p.activityName,
        startTime: VALID_TIME_SLOTS[idx % VALID_TIME_SLOTS.length],
        costOverride: p.costOverride,
        orderIndex: idx,
        dayNumber: 1,
      })),
    };

    if (editingStopId) {
      updateStopMutation.mutate({ stopId: editingStopId, data: payload });
    } else {
      addStopMutation.mutate(payload);
    }
  };

  // Open Add Activity Modal for a specific Day
  const handleOpenAddActivityModal = (day: ProcessedDay) => {
    setTargetAddActivityDay(day);

    // Pick next available time slot based on current activity count
    const existingCount = day.activities.length;
    const nextSlot = VALID_TIME_SLOTS[Math.min(existingCount, VALID_TIME_SLOTS.length - 1)];
    setSelectedTimeSlot(nextSlot);

    setActivitySearchInput("");
    setDebouncedActivitySearch("");
    setSelectedCategoryFilter("all");
    setSelectedCostFilter("all");
    setCustomActivityName("");
    setCustomActivityCost("");
    setTimeout(() => {
      activitySearchInputRef.current?.focus();
    }, 80);
  };

  // Close Add Activity Modal
  const handleCloseAddActivityModal = () => {
    setTargetAddActivityDay(null);
  };

  // Handle Adding an Activity to Itinerary (Persisted to MongoDB via POST /itinerary-items)
  const handleSelectActivityForDay = (act: {
    id?: string;
    name: string;
    cost?: number;
    durationMinutes?: number;
  }) => {
    if (!targetAddActivityDay || !targetAddActivityDay.stopId) return;

    const stop = targetAddActivityDay.rawStop;
    if (!stop) return;

    const existingItems = stop.itineraryItems || [];

    // Duplicate Prevention Check
    const isAlreadyAdded = existingItems.some(
      (item) =>
        (item.activityName && item.activityName.toLowerCase() === act.name.toLowerCase()) ||
        (act.id && item.activityId && String(item.activityId) === String(act.id))
    );

    if (isAlreadyAdded) {
      toast.error(`"${act.name}" is already in this itinerary.`);
      return;
    }

    createItineraryItemMutation.mutate({
      stopId: targetAddActivityDay.stopId,
      activityId: act.id && !act.id.startsWith("custom-") ? act.id : undefined,
      activityName: act.name.trim(),
      dayNumber: targetAddActivityDay.dayNumber,
      startTime: selectedTimeSlot || "08:30 AM",
      orderIndex: existingItems.length,
      costOverride: act.cost !== undefined ? act.cost : 0,
    });
  };

  // Handle adding custom activity from modal
  const handleAddCustomModalActivity = () => {
    const trimmed = (customActivityName || activitySearchInput).trim();
    if (!trimmed) {
      toast.error("Please enter an activity name.");
      return;
    }

    const costNum = customActivityCost ? parseFloat(customActivityCost) : 0;

    handleSelectActivityForDay({
      id: `custom-${Date.now()}`,
      name: trimmed,
      cost: isNaN(costNum) ? 0 : costNum,
    });
  };

  // Add custom place to section form
  const handleAddFormCustomPlace = () => {
    const trimmed = newPlaceInput.trim();
    if (!trimmed) return;
    setFormPlaces((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}`,
        activityName: trimmed,
        costOverride: 0,
      },
    ]);
    setNewPlaceInput("");
  };

  // Toggle suggested activity in section form
  const handleToggleFormActivity = (act: { id: string; name: string; cost?: number }) => {
    const exists = formPlaces.some(
      (p) => p.activityName.toLowerCase() === act.name.toLowerCase()
    );
    if (exists) {
      setFormPlaces((prev) =>
        prev.filter((p) => p.activityName.toLowerCase() !== act.name.toLowerCase())
      );
    } else {
      setFormPlaces((prev) => [
        ...prev,
        {
          id: act.id,
          activityId: act.id,
          activityName: act.name,
          costOverride: act.cost,
        },
      ]);
    }
  };

  // Open Budget Summary modal
  const handleOpenBudgetSummary = () => {
    setIsBudgetSummaryOpen(true);
  };

  // Share Trip Mutation
  const shareTripMutation = useMutation({
    mutationFn: () => tripsApi.shareTrip(tripId),
    onSuccess: (data) => {
      setShareToken(data.shareToken);
      setIsShareModalOpen(true);
      queryClient.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.success("Public share link generated!");
    },
    onError: (err: any) => {
      toast.error(err?.message || "Failed to generate share link.");
    },
  });

  // Open Share Modal
  const handleOpenShareModal = () => {
    if (trip?.shareToken) {
      setShareToken(trip.shareToken);
      setIsShareModalOpen(true);
    } else {
      shareTripMutation.mutate();
    }
  };

  // Copy Public Share URL
  const handleCopyShareLink = () => {
    const tokenToCopy = shareToken || trip?.shareToken;
    if (!tokenToCopy) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/share/${tokenToCopy}`;
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    toast.success("Share link copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Loading Skeleton State
  if (isLoading || isAuthLoading) {
    return (
      <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 py-6 animate-pulse">
        <div className="h-4 w-40 bg-surface-elevated rounded" />
        <div className="h-10 w-2/3 bg-surface-elevated rounded-[10px]" />
        <div className="h-24 bg-surface rounded-[14px] border border-border" />
        <div className="space-y-6 pt-4">
          <div className="h-64 bg-surface rounded-[14px] border border-border" />
          <div className="h-64 bg-surface rounded-[14px] border border-border" />
        </div>
      </div>
    );
  }

  // Error / Not Found State
  if (isError || !trip) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="p-4 rounded-full bg-destructive/10 text-destructive w-12 h-12 mx-auto flex items-center justify-center">
          <Compass className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Voyage Not Found</h2>
        <p className="text-sm text-muted-foreground">
          The requested expedition itinerary could not be loaded.
        </p>
        <Link href="/trips/mine">
          <Button variant="secondary" size="sm" className="mt-2">
            Back to Expeditions
          </Button>
        </Link>
      </div>
    );
  }

  const tripStartFormatted = trip.startDate
    ? new Date(trip.startDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const tripEndFormatted = trip.endDate
    ? new Date(trip.endDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const stopsList = Array.isArray(trip.stops) ? trip.stops : [];
  const primaryCountry = stopsList[0]?.country || "India";
  const tripCurrency = getCurrencyForCountry((trip as any).currency || primaryCountry);
  const tripCurrencySymbol = tripCurrency.symbol;

  // Check which activities in modal are already added to target day's stop
  const targetDayExistingNames = new Set(
    (targetAddActivityDay?.rawStop?.itineraryItems || []).map((i) => (i.activityName || "").toLowerCase())
  );
  const targetDayExistingIds = new Set(
    (targetAddActivityDay?.rawStop?.itineraryItems || []).map((i) => String(i.activityId || ""))
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
      {/* 1. Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-1.5 sm:gap-2 text-xs font-mono text-muted-foreground overflow-x-auto pb-1"
      >
        <Link href="/dashboard" className="hover:text-foreground transition-colors shrink-0">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <Link href="/trips/mine" className="hover:text-foreground transition-colors shrink-0">
          Expeditions
        </Link>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-foreground truncate max-w-[160px] sm:max-w-[240px] font-medium">
          {trip.name}
        </span>
        <ChevronRight className="w-3.5 h-3.5 shrink-0" />
        <span className="text-primary font-semibold shrink-0">
          {viewMode === "view" ? "Itinerary Sessions & Plan" : "Edit Destination Sections"}
        </span>
      </nav>

      {/* 2. Page Header & Trip Overview Card */}
      <div className="space-y-4 border-b border-border pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary">
              <Compass className="w-3.5 h-3.5 animate-[spin_20s_linear_infinite]" />
              <span>
                Expedition Itinerary · {primaryCountry}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground truncate">
              {trip.name}
            </h1>
            {trip.description && (
              <p className="text-muted-foreground text-xs sm:text-sm max-w-3xl line-clamp-2">
                {trip.description}
              </p>
            )}
          </div>

          {/* Top Actions: Mode Switcher + Budget Button */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <div className="inline-flex p-1 rounded-[10px] bg-surface border border-border text-xs">
              <button
                type="button"
                onClick={() => setViewMode("view")}
                className={`px-3 py-1.5 rounded-[7px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "view"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Route className="w-3.5 h-3.5" />
                <span>Day Itinerary</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("manage")}
                className={`px-3 py-1.5 rounded-[7px] font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "manage"
                    ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>Edit Sections</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleOpenBudgetSummary}
              className="gap-2 border-primary/40 text-primary hover:bg-primary/10 hover:border-primary transition-colors cursor-pointer min-h-[40px] shadow-2xs font-semibold"
            >
              <DollarSign className="w-4 h-4 text-primary" />
              <span>View Budget</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleOpenShareModal}
              disabled={shareTripMutation.isPending}
              className="gap-2 border-border text-foreground hover:bg-surface-hover hover:border-primary/40 transition-colors cursor-pointer min-h-[40px] shadow-2xs font-semibold"
            >
              {shareTripMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
              ) : (
                <Share2 className="w-4 h-4 text-primary" />
              )}
              <span>Share Trip</span>
            </Button>
          </div>
        </div>

        {/* Route Meta & Section Highlights Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-[12px] bg-surface border border-border text-xs">
          {/* Date Range */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-[8px] bg-primary/10 text-primary shrink-0">
              <Calendar className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                Timeline
              </span>
              <span className="font-semibold text-foreground truncate block">
                {tripStartFormatted && tripEndFormatted
                  ? `${tripStartFormatted} – ${tripEndFormatted}`
                  : `${allDays.length} Days Planned`}
              </span>
            </div>
          </div>

          {/* Destination Route */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-[8px] bg-primary/10 text-primary shrink-0">
              <Navigation className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                Route Legs ({stopsList.length})
              </span>
              <span className="font-semibold text-foreground truncate block">
                {stopsList.length > 0
                  ? stopsList.map((s) => s.cityName).join(" → ")
                  : "No destination legs"}
              </span>
            </div>
          </div>

          {/* Day / Budget Overview */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-[8px] bg-primary/10 text-primary shrink-0">
              <Wallet className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-mono text-muted-foreground uppercase block">
                Expedition Spending
              </span>
              <span className="font-semibold text-foreground truncate block">
                Spent: {tripCurrencySymbol}{budgetAnalytics.totalSpent.toLocaleString()}
                {budgetAnalytics.totalBudget > 0 && (
                  <span className="text-muted-foreground font-normal ml-1">
                    / {tripCurrencySymbol}{budgetAnalytics.totalBudget.toLocaleString()}
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* City Filter Pills (Jump / Filter to Destination City) */}
        {viewMode === "view" && citySections.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
            <span className="text-[11px] font-mono text-muted-foreground shrink-0 uppercase">
              Filter City Section:
            </span>
            <button
              type="button"
              onClick={() => setActiveCityFilter("all")}
              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                activeCityFilter === "all"
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-surface text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              All Destinations ({citySections.length})
            </button>
            {citySections.map((sec) => (
              <button
                key={sec.stopId}
                type="button"
                onClick={() => setActiveCityFilter(sec.stopId)}
                className={`px-3 py-1.5 rounded-[8px] text-xs font-medium shrink-0 transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCityFilter === sec.stopId
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                }`}
              >
                <MapPin className="w-3 h-3 text-primary" />
                <span>
                  {sec.cityName} ({sec.days.length}d)
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW MODE 1: DAY-BY-DAY ITINERARY SESSIONS & CITY SECTIONS
          ========================================================================= */}
      {viewMode === "view" && (
        <div className="relative pt-2" ref={containerRef}>
          {/* GSAP-Driven Signature Route Thread (Left Timeline Track) */}
          <div
            className="absolute left-4 sm:left-6 top-6 bottom-6 w-8 pointer-events-none select-none z-0 hidden sm:block"
            aria-hidden="true"
          >
            <svg className="w-full h-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
              <line
                x1="16"
                y1="0"
                x2="16"
                y2={svgHeight}
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="4 6"
                className="text-border"
              />
              <path
                ref={threadPathRef}
                d={`M 16 0 L 16 ${svgHeight}`}
                fill="none"
                stroke="var(--primary)"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-opacity duration-300"
              />
            </svg>
          </div>

          {/* Sections List */}
          {displayedSections.length === 0 ? (
            <Card className="p-8 text-center space-y-4 border-dashed border-border">
              <div className="p-3 rounded-full bg-primary/10 text-primary w-12 h-12 mx-auto flex items-center justify-center">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg text-foreground">No Destinations in Itinerary</h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                This expedition does not have any destination sections configured yet.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setViewMode("manage");
                  setIsAddFormOpen(true);
                }}
                className="gap-1.5 text-xs text-primary"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Destination Section</span>
              </Button>
            </Card>
          ) : (
            <div className="space-y-12 sm:space-y-14">
              {displayedSections.map((section) => (
                <div key={section.stopId} className="space-y-6 sm:space-y-8">
                  {/* CITY SECTION BANNER */}
                  <div className="sm:pl-16">
                    <div className="p-4 sm:p-5 rounded-[14px] bg-gradient-to-r from-surface to-surface-subtle border border-primary/30 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-[6px] bg-primary text-primary-foreground text-xs font-mono font-bold">
                            Leg #{section.legIndex}
                          </span>
                          <h2 className="text-lg sm:text-xl font-bold text-foreground">
                            {section.cityName}, {section.country}
                          </h2>
                          <span className="text-xs font-mono text-muted-foreground">
                            ({section.days.length} Day{section.days.length === 1 ? "" : "s"} Scheduled)
                          </span>
                        </div>

                        {section.notes && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {section.notes}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-center">
                        {section.sectionBudget != null && (
                          <span className="px-3 py-1 rounded-[8px] bg-success/10 border border-success/30 text-success text-xs font-mono font-bold">
                            {getCurrencySymbol(section.country)}{section.sectionBudget.toLocaleString()}
                          </span>
                        )}

                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => handleStartEdit(section.rawStop, section.stopId)}
                          className="h-8 px-2.5 text-xs gap-1.5 border border-border"
                        >
                          <Pencil className="w-3 h-3 text-primary" />
                          <span>Edit Leg</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* DAYS IN THIS CITY SECTION */}
                  <div className="space-y-8 sm:space-y-10">
                    {section.days.map((day) => {
                      const hasActivities = day.activities.length > 0;

                      // Filter recorded direct expenses for this specific day
                      const dayExpenses = tripExpenses.filter(
                        (e) => e.dayNumber === day.dayNumber
                      );

                      // Calculate running daily total (Activity costs + Recorded expenses)
                      const activityCostsTotal = day.activities.reduce(
                        (acc, a) => acc + (a.cost || 0),
                        0
                      );
                      const recordedExpensesTotal = dayExpenses.reduce(
                        (acc, e) => acc + (e.amount || 0),
                        0
                      );
                      const dailyRunningTotal = activityCostsTotal + recordedExpensesTotal;

                      // Separate activities into structured daily sessions
                      const morningActs = day.activities.filter((a) => {
                        const slot = a.timeSlot.toUpperCase();
                        return (
                          slot.includes("08:") ||
                          slot.includes("09:") ||
                          slot.includes("10:") ||
                          slot.includes("11:")
                        );
                      });

                      const afternoonActs = day.activities.filter((a) => {
                        const slot = a.timeSlot.toUpperCase();
                        return (
                          slot.includes("12:") ||
                          slot.includes("01:") ||
                          slot.includes("02:") ||
                          slot.includes("03:") ||
                          slot.includes("04:") ||
                          slot.includes("05:")
                        );
                      });

                      const eveningActs = day.activities.filter((a) => {
                        const slot = a.timeSlot.toUpperCase();
                        return (
                          slot.includes("06:") ||
                          slot.includes("07:") ||
                          slot.includes("08:")
                        );
                      });

                      // Render single activity block with Edit, Delete & Move buttons
                      const renderActivityCard = (act: ProcessedActivity, actIdx: number, actsList: ProcessedActivity[]) => {
                        return (
                          <motion.div
                            key={act.id}
                            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: actIdx * 0.04 }}
                            className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3 rounded-[10px] bg-surface-subtle/50 border border-border hover:border-primary/40 transition-all group"
                          >
                            <div className="space-y-1 flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-surface border border-border text-[11px] font-mono text-primary font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>{act.timeSlot}</span>
                                </span>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] bg-surface-elevated text-[10px] font-mono text-muted-foreground uppercase">
                                  <Sparkles className="w-2.5 h-2.5 text-primary" />
                                  <span>{act.category}</span>
                                </span>
                              </div>
                              <h4 className="font-bold text-sm sm:text-base text-foreground">
                                {act.name}
                              </h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {act.details}
                              </p>
                            </div>

                            <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0">
                              {/* Expense Pill */}
                              <div className="rounded-[8px] bg-surface border border-border px-3 py-1.5 flex items-center gap-2 min-w-[120px] justify-between">
                                <span className="text-[10px] font-mono text-muted-foreground uppercase">
                                  Expense
                                </span>
                                <span className="font-bold text-xs sm:text-sm text-success">
                                  {getCurrencySymbol(day.country)}{act.cost > 0 ? act.cost.toLocaleString() : "0 (Free)"}
                                </span>
                              </div>

                              {/* Interactive Actions: Move Up, Move Down, Edit, Delete */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleMoveActivityUp(day, day.activities.indexOf(act))}
                                  disabled={day.activities.indexOf(act) === 0}
                                  title="Move Up"
                                  aria-label={`Move ${act.name} up`}
                                  className="p-1.5 rounded-[6px] border border-border bg-surface text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:hover:text-muted-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ArrowUp className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleMoveActivityDown(day, day.activities.indexOf(act))}
                                  disabled={day.activities.indexOf(act) === day.activities.length - 1}
                                  title="Move Down"
                                  aria-label={`Move ${act.name} down`}
                                  className="p-1.5 rounded-[6px] border border-border bg-surface text-muted-foreground hover:text-foreground disabled:opacity-20 disabled:hover:text-muted-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ArrowDown className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenEditActivity(act, day)}
                                  title="Edit Activity"
                                  aria-label={`Edit ${act.name}`}
                                  className="p-1.5 rounded-[6px] border border-border bg-surface text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors cursor-pointer"
                                >
                                  <Pencil className="w-3 h-3" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenDeleteActivity(act, day)}
                                  title="Remove Activity"
                                  aria-label={`Remove ${act.name}`}
                                  className="p-1.5 rounded-[6px] border border-border bg-surface text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      };

                      return (
                        <div
                          key={`day-${day.dayNumber}`}
                          className="relative sm:pl-16 transition-all"
                        >
                          {/* Waypoint Marker on the Route Thread */}
                          <div
                            className="hidden sm:flex absolute left-4 top-0 -translate-x-1/2 w-8 h-8 rounded-full bg-surface border-2 border-primary items-center justify-center font-mono font-bold text-xs text-primary shadow-xs z-10"
                            title={`Day ${day.dayNumber}`}
                          >
                            <span>{day.dayNumber}</span>
                          </div>

                          {/* Day Container Card */}
                          <Card className="border border-border bg-surface hover:border-border/80 transition-all rounded-[14px] shadow-xs overflow-hidden">
                            {/* DAY HEADER */}
                            <div className="p-4 sm:p-5 bg-surface-subtle/40 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-3">
                                <div className="sm:hidden flex items-center justify-center w-8 h-8 rounded-full bg-primary/15 border border-primary/40 font-mono font-bold text-xs text-primary shrink-0">
                                  {day.dayNumber}
                                </div>

                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-bold text-base sm:text-lg text-foreground">
                                      Day {day.dayNumber}
                                    </span>
                                    <span className="text-muted-foreground text-sm font-normal">
                                      · {day.cityName}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mt-0.5">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-3 h-3 text-primary shrink-0" />
                                      <span>{day.cityName}, {day.country}</span>
                                    </span>
                                    {day.dateStr && (
                                      <>
                                        <span>•</span>
                                        <span>{day.formattedDate}</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Leg Context & Actions: Add Activity + Add Expense */}
                              <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono font-semibold">
                                  <Compass className="w-3 h-3" />
                                  <span>Leg {day.legIndex} of {day.totalLegs}</span>
                                </span>

                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleOpenAddActivityModal(day)}
                                  className="h-7 px-2 text-xs gap-1 text-primary border border-primary/30 hover:bg-primary/10"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>Add Activity</span>
                                </Button>

                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenAddExpense(day)}
                                  className="h-7 px-2 text-xs gap-1 text-foreground border border-border hover:bg-surface-hover"
                                >
                                  <Receipt className="w-3 h-3 text-primary" />
                                  <span>+ Expense</span>
                                </Button>
                              </div>
                            </div>

                            {/* SESSIONS & ACTIVITIES */}
                            <div className="p-4 sm:p-6 space-y-6">
                              {hasActivities ? (
                                <div className="space-y-6">
                                  {/* 1. MORNING SESSION (08:30 AM – 11:30 AM) */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground/90 uppercase tracking-wider pb-1 border-b border-border/50">
                                      <Sunrise className="w-3.5 h-3.5 text-amber-500" />
                                      <span>Morning Session · 08:30 AM – 11:30 AM</span>
                                    </div>

                                    {morningActs.length > 0 ? (
                                      <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-amber-500/30">
                                        {morningActs.map((act, actIdx) => renderActivityCard(act, actIdx, morningActs))}
                                      </div>
                                    ) : (
                                      <div className="p-2.5 rounded-[8px] bg-surface-subtle/20 border border-dashed border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                                        <span>No morning activities scheduled (08:30 AM – 11:30 AM).</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedTimeSlot("08:30 AM");
                                            handleOpenAddActivityModal(day);
                                          }}
                                          className="text-primary hover:underline text-xs font-semibold cursor-pointer"
                                        >
                                          + Add Morning Activity
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* 2. AFTERNOON SESSION (12:00 PM – 05:30 PM) */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground/90 uppercase tracking-wider pb-1 border-b border-border/50">
                                      <Sun className="w-3.5 h-3.5 text-orange-500" />
                                      <span>Afternoon Session · 12:00 PM – 05:30 PM</span>
                                    </div>

                                    {afternoonActs.length > 0 ? (
                                      <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-orange-500/30">
                                        {afternoonActs.map((act, actIdx) => renderActivityCard(act, actIdx, afternoonActs))}
                                      </div>
                                    ) : (
                                      <div className="p-2.5 rounded-[8px] bg-surface-subtle/20 border border-dashed border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                                        <span>No afternoon activities scheduled (12:00 PM – 05:30 PM).</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedTimeSlot("02:30 PM");
                                            handleOpenAddActivityModal(day);
                                          }}
                                          className="text-primary hover:underline text-xs font-semibold cursor-pointer"
                                        >
                                          + Add Afternoon Activity
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* 3. EVENING TWILIGHT SESSION (06:00 PM – 08:00 PM) */}
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-mono font-semibold text-foreground/90 uppercase tracking-wider pb-1 border-b border-border/50">
                                      <Sunset className="w-3.5 h-3.5 text-purple-500" />
                                      <span>Evening Twilight Session · 06:00 PM – 08:00 PM</span>
                                    </div>

                                    {eveningActs.length > 0 ? (
                                      <div className="space-y-3 pl-2 sm:pl-3 border-l-2 border-purple-500/30">
                                        {eveningActs.map((act, actIdx) => renderActivityCard(act, actIdx, eveningActs))}
                                      </div>
                                    ) : (
                                      <div className="p-2.5 rounded-[8px] bg-surface-subtle/20 border border-dashed border-border/60 text-xs text-muted-foreground flex items-center justify-between">
                                        <span>No evening activities scheduled (06:00 PM – 08:00 PM).</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setSelectedTimeSlot("07:00 PM");
                                            handleOpenAddActivityModal(day);
                                          }}
                                          className="text-primary hover:underline text-xs font-semibold cursor-pointer"
                                        >
                                          + Add Evening Activity
                                        </button>
                                      </div>
                                    )}
                                  </div>

                                  {/* 4. EVENING WRAP-UP & REST (AFTER 8:00 PM — NO PLAN ADDED) */}
                                  <div className="p-3.5 sm:p-4 rounded-[12px] bg-surface-subtle/70 border border-border/80 flex items-start gap-3 text-xs">
                                    <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                                      <Moon className="w-4 h-4" />
                                    </div>
                                    <div className="space-y-0.5 flex-1">
                                      <div className="font-semibold text-foreground flex items-center gap-2">
                                        <span>08:00 PM Onwards · Evening Wrap-up & Leisure</span>
                                        <span className="px-2 py-0.5 rounded-[4px] bg-surface border border-border text-[10px] font-mono text-muted-foreground">
                                          Rest Time
                                        </span>
                                      </div>
                                      <p className="text-muted-foreground leading-relaxed">
                                        After 8:00 PM no activities are planned. Enjoy dinner, explore at your own pace, or rest up for the next day.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* EMPTY DAY STATE */
                                <div className="space-y-4">
                                  <div className="py-8 px-4 text-center rounded-[12px] border border-dashed border-border bg-surface-subtle/30 space-y-3">
                                    <div className="space-y-1">
                                      <p className="text-sm font-semibold text-foreground">
                                        No activities yet for Day {day.dayNumber}.
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        Plan curated tours and sights across morning, afternoon, and evening sessions (08:30 AM to 08:00 PM).
                                      </p>
                                    </div>

                                    <div>
                                      <Button
                                        type="button"
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => handleOpenAddActivityModal(day)}
                                        className="gap-1.5 text-xs text-primary hover:bg-primary/10 border border-dashed border-primary/40 min-h-[44px] cursor-pointer"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>+ Add Activity to Day {day.dayNumber}</span>
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Evening Wrap-up banner */}
                                  <div className="p-3 rounded-[10px] bg-surface-subtle/50 border border-border flex items-center gap-2.5 text-xs text-muted-foreground">
                                    <Moon className="w-3.5 h-3.5 text-primary shrink-0" />
                                    <span>
                                      Schedule activities between 08:30 AM and 08:00 PM. After 8:00 PM is reserved for free leisure and rest.
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* RECORDED DAY EXPENSES & RUNNING DAILY TOTAL */}
                              <div className="pt-4 border-t border-border/80 space-y-3">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                  <span className="text-xs font-mono font-semibold text-foreground flex items-center gap-1.5 uppercase">
                                    <Receipt className="w-3.5 h-3.5 text-primary" />
                                    <span>Day {day.dayNumber} Expenses ({dayExpenses.length}):</span>
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleOpenAddExpense(day)}
                                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Record Expense</span>
                                  </button>
                                </div>

                                {dayExpenses.length > 0 ? (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {dayExpenses.map((exp) => {
                                      const categoryMeta =
                                        EXPENSE_CATEGORIES.find((c) => c.key === exp.category) ||
                                        EXPENSE_CATEGORIES[4];
                                      const IconComp = categoryMeta.icon;

                                      return (
                                        <div
                                          key={exp.id}
                                          className="p-2.5 rounded-[8px] bg-surface-subtle/60 border border-border flex items-center justify-between gap-2.5"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            <div className="p-1.5 rounded-[6px] bg-primary/10 text-primary shrink-0">
                                              <IconComp className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-foreground">
                                                  {categoryMeta.label}
                                                </span>
                                                <span className="text-[11px] font-mono font-bold text-success">
                                                  {getCurrencySymbol(exp.currency || day.country)}{exp.amount.toLocaleString()}
                                                </span>
                                              </div>
                                              {exp.notes && (
                                                <p className="text-[11px] text-muted-foreground truncate max-w-[140px] sm:max-w-[180px]">
                                                  {exp.notes}
                                                </p>
                                              )}
                                            </div>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0">
                                            <button
                                              type="button"
                                              onClick={() => handleOpenEditExpense(exp)}
                                              title="Edit Expense"
                                              aria-label="Edit expense"
                                              className="p-1 rounded text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => setDeletingExpense(exp)}
                                              title="Delete Expense"
                                              aria-label="Delete expense"
                                              className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
                                            >
                                              <Trash2 className="w-3 h-3" />
                                            </button>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <p className="text-[11px] text-muted-foreground italic">
                                    No extra meals, stays, or transport expenses recorded for Day {day.dayNumber} yet.
                                  </p>
                                )}

                                {/* RUNNING DAILY TOTAL BAR */}
                                <div className="p-3 rounded-[10px] bg-surface-elevated border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                                  <div className="flex items-center gap-3 text-muted-foreground font-mono text-[11px] flex-wrap">
                                    <span>Activities: {getCurrencySymbol(day.country)}{activityCostsTotal.toLocaleString()}</span>
                                    <span>•</span>
                                    <span>Direct Expenses: {getCurrencySymbol(day.country)}{recordedExpensesTotal.toLocaleString()}</span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className="font-mono uppercase text-[11px] text-muted-foreground font-semibold">
                                      Daily Total:
                                    </span>
                                    <span className="font-mono text-base font-bold text-success flex items-center gap-0.5">
                                      <span>{getCurrencySymbol(day.country)}</span>
                                      <span>{dailyRunningTotal.toLocaleString()}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW MODE 2: MANAGE & EDIT SECTIONS
          ========================================================================= */}
      {viewMode === "manage" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border">
            <div>
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <span>Destination Sections & Leg Builder</span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Add, edit, reorder destination stops, and curate places & sights for this trip.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {!isAddFormOpen && !editingStopId && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    resetForm();
                    setIsAddFormOpen(true);
                    setTimeout(() => {
                      addFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }, 50);
                  }}
                  className="gap-1.5 text-xs shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Section</span>
                </Button>
              )}

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setViewMode("view")}
                className="gap-1.5 text-xs border-border text-foreground hover:bg-surface-hover"
              >
                <Route className="w-3.5 h-3.5 text-primary" />
                <span>Back to Itinerary View</span>
              </Button>
            </div>
          </div>

          {/* ADD / EDIT SECTION FORM */}
          {(isAddFormOpen || editingStopId) && (
            <div ref={editingStopId ? editFormRef : addFormRef}>
              <Card className="border-primary/40 bg-surface-subtle/70 shadow-lg rounded-[14px] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <CardHeader className="pb-3 border-b border-border/60">
                  <CardTitle className="text-base sm:text-lg flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span>{editingStopId ? "Edit Destination Section" : "Add Destination Section"}</span>
                    </span>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {tripCountry ? `Destinations are filtered to ${tripCountry}.` : "Configure details for this leg."}
                  </CardDescription>
                </CardHeader>

                <form onSubmit={handleSaveSection}>
                  <CardContent className="p-4 sm:p-6 space-y-4">
                    {formError && (
                      <div className="p-3 rounded-[8px] bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{formError}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 relative">
                      <Label required htmlFor="section-city-input">
                        Destination City
                      </Label>
                      <div className="relative">
                        <Input
                          id="section-city-input"
                          type="text"
                          value={citySearch}
                          onFocus={() => setIsCityDropdownOpen(true)}
                          onChange={(e) => {
                            setCitySearch(e.target.value);
                            setIsCityDropdownOpen(true);
                            if (selectedCity && selectedCity.name !== e.target.value) {
                              setSelectedCity(null);
                            }
                          }}
                          placeholder={`Search ${tripCountry || ""} city (e.g. Ahmedabad, Mumbai)...`}
                          leftIcon={<MapPin className="w-4 h-4 text-primary" />}
                        />

                        {isCityDropdownOpen && (
                          <div className="absolute top-full left-0 right-0 mt-1.5 max-h-56 overflow-y-auto rounded-[10px] bg-surface border border-border shadow-xl z-50 divide-y divide-border/60">
                            {searchResults.length > 0 ? (
                              searchResults.map((city) => (
                                <button
                                  key={city.id}
                                  type="button"
                                  onClick={() => {
                                    setSelectedCity(city);
                                    setCitySearch(`${city.name}, ${city.country}`);
                                    setIsCityDropdownOpen(false);
                                  }}
                                  className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                                    <div>
                                      <span className="font-semibold text-sm text-foreground block">{city.name}</span>
                                      <span className="text-xs text-muted-foreground block">{city.country}</span>
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1.5">
                                    <Plus className="w-3 h-3" /><span>Select</span>
                                  </span>
                                </button>
                              ))
                            ) : (
                              <div className="p-3 text-center text-xs text-muted-foreground">
                                {citySearch.trim()
                                  ? `No cities found matching "${citySearch}".`
                                  : "Type to search destination cities."}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Input
                          label="Start Date"
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Input
                          label="End Date"
                          type="date"
                          value={endDate}
                          min={startDate}
                          onChange={(e) => setEndDate(e.target.value)}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Input
                          label="Section Budget (₹ INR)"
                          type="number"
                          placeholder="e.g. 15000"
                          value={sectionBudget}
                          onChange={(e) => setSectionBudget(e.target.value)}
                          leftIcon={<DollarSign className="w-4 h-4 text-primary" />}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Textarea
                        label="Section Objectives / Notes"
                        placeholder="e.g. Key sights, hotel reservations, or exploration highlights..."
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2 pt-2 border-t border-border/60">
                      <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span>Places & Activities for this Section ({formPlaces.length})</span>
                      </Label>

                      {formPlaces.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 p-2.5 rounded-[8px] bg-surface border border-border">
                          {formPlaces.map((place, pIdx) => (
                            <span
                              key={place.id || pIdx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-surface-elevated border border-primary/30 text-foreground text-xs font-medium"
                            >
                              <span>{place.activityName}</span>
                              <button
                                type="button"
                                onClick={() =>
                                  setFormPlaces((prev) => prev.filter((_, idx) => idx !== pIdx))
                                }
                                className="text-muted-foreground hover:text-destructive p-0.5 rounded cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <Input
                            type="text"
                            placeholder="Add custom sight/activity name (e.g. Riverfront Walk, Street Food Tour)..."
                            value={newPlaceInput}
                            onChange={(e) => setNewPlaceInput(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddFormCustomPlace();
                              }
                            }}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          onClick={handleAddFormCustomPlace}
                          disabled={!newPlaceInput.trim()}
                          className="text-xs shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </Button>
                      </div>

                      {cityActivities.length > 0 && (
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[11px] font-mono text-muted-foreground uppercase">
                            Suggested for {selectedCity?.name}:
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {cityActivities.map((act) => {
                              const isAdded = formPlaces.some(
                                (p) => p.activityName.toLowerCase() === act.name.toLowerCase()
                              );
                              return (
                                <button
                                  key={act.id}
                                  type="button"
                                  onClick={() => handleToggleFormActivity(act)}
                                  className={`text-xs px-2.5 py-1 rounded-[6px] border transition-colors flex items-center gap-1 cursor-pointer ${
                                    isAdded
                                      ? "bg-primary/15 border-primary text-primary font-semibold"
                                      : "bg-surface border-border text-foreground hover:bg-surface-hover"
                                  }`}
                                >
                                  {isAdded ? <Check className="w-3 h-3 text-primary" /> : <Plus className="w-3 h-3 text-muted-foreground" />}
                                  <span>{act.name}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="p-4 sm:p-6 pt-0 border-t border-border/60 flex items-center justify-end gap-2.5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                      disabled={addStopMutation.isPending || updateStopMutation.isPending}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={addStopMutation.isPending || updateStopMutation.isPending}
                      className="gap-1.5"
                    >
                      {(addStopMutation.isPending || updateStopMutation.isPending) && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      <span>{editingStopId ? "Update Section" : "Save Section"}</span>
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </div>
          )}

          {/* REORDERABLE SECTION LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono text-muted-foreground px-1">
              <span>Section Sequence ({orderedStops.length} Legs)</span>
              <span>Drag handle or click arrows to reorder</span>
            </div>

            {orderedStops.length === 0 ? (
              <Card className="p-8 text-center space-y-3 border-dashed border-border">
                <p className="text-sm font-semibold text-foreground">No sections in this trip.</p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsAddFormOpen(true)}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Section</span>
                </Button>
              </Card>
            ) : (
              <Reorder.Group
                axis="y"
                values={orderedStops}
                onReorder={handleReorder}
                className="space-y-3.5 list-none p-0 m-0"
              >
                {orderedStops.map((stop, idx) => (
                  <SectionReorderItem
                    key={stop.id || (stop as any)._id || idx}
                    stop={stop}
                    idx={idx}
                    totalStops={orderedStops.length}
                    onEdit={() => handleStartEdit(stop, stop.id || (stop as any)._id)}
                    onDeleteRequest={() =>
                      setDeletingStop({
                        id: stop.id || (stop as any)._id,
                        name: stop.cityName,
                      })
                    }
                    onMoveUp={() => handleMoveUp(idx)}
                    onMoveDown={() => handleMoveDown(idx)}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                ))}
              </Reorder.Group>
            )}
          </div>
        </div>
      )}

      {/* 4. Bottom Itinerary Footer Summary */}
      <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary shrink-0" />
          <span>
            {allDays.length} Days sequenced · {stopsList.length} Destination Leg
            {stopsList.length === 1 ? "" : "s"}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenBudgetSummary}
            className="gap-1.5 text-xs border-primary/40 text-primary hover:bg-primary/10 cursor-pointer min-h-[40px]"
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>View Budget Summary</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleOpenShareModal}
            disabled={shareTripMutation.isPending}
            className="gap-1.5 text-xs border-border text-foreground hover:bg-surface-hover cursor-pointer min-h-[40px]"
          >
            <Share2 className="w-3.5 h-3.5 text-primary" />
            <span>Share Trip</span>
          </Button>
        </div>
      </div>

      {/* =========================================================================
          SHARE TRIP MODAL
          ========================================================================= */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[16px] bg-surface border border-border p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Share Expedition Itinerary</h3>
                    <p className="text-xs text-muted-foreground">Public Read-Only Link</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsShareModalOpen(false)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Anyone with this public link can view your itinerary, route legs, daily sessions, and budget summary in read-only mode, and copy it to their own account.
                </p>

                <div className="space-y-1.5">
                  <Label>Public Itinerary Link</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="text"
                      readOnly
                      value={
                        typeof window !== "undefined"
                          ? `${window.location.origin}/share/${shareToken || trip?.shareToken || ""}`
                          : `/share/${shareToken || trip?.shareToken || ""}`
                      }
                      className="font-mono text-xs select-all bg-surface-subtle"
                    />
                    <Button
                      type="button"
                      variant={isCopied ? "primary" : "secondary"}
                      size="md"
                      onClick={handleCopyShareLink}
                      className="gap-1.5 text-xs shrink-0 min-h-[40px] px-3.5 font-semibold"
                    >
                      {isCopied ? (
                        <>
                          <CheckCheck className="w-4 h-4 text-primary-foreground" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 text-primary" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-muted-foreground font-mono">
                  <span className="flex items-center gap-1 text-[11px]">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Protected with opaque share token</span>
                  </span>

                  <Link
                    href={`/share/${shareToken || trip?.shareToken || ""}`}
                    target="_blank"
                    className="text-primary hover:underline flex items-center gap-1 text-[11px] font-semibold"
                  >
                    <span>Preview Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsShareModalOpen(false)}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          5. BUDGET SUMMARY MODAL / DRAWER (PHASE 4 STEP 5)
          ========================================================================= */}
      <AnimatePresence>
        {isBudgetSummaryOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, y: 40, scale: 0.96 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-3xl max-h-[92vh] flex flex-col rounded-t-[20px] sm:rounded-[18px] bg-surface border border-border shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle/80 flex items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 rounded-[10px] bg-primary/10 text-primary shrink-0">
                    <Wallet className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-foreground">
                      Expedition Budget Summary
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {trip.name} · {allDays.length} Days Planned
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBudgetSummaryOpen(false)}
                  aria-label="Close budget summary"
                  className="p-2 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
                {/* 1. Summary Metrics Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Total Spent */}
                  <div className="p-3.5 rounded-[12px] bg-surface-subtle border border-border space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                      Total Spent
                    </span>
                    <p className="text-base sm:text-lg font-mono font-bold text-foreground">
                      {tripCurrencySymbol}{budgetAnalytics.totalSpent.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Activities + Direct
                    </span>
                  </div>

                  {/* Planned Budget */}
                  <div className="p-3.5 rounded-[12px] bg-surface-subtle border border-border space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                      Trip Budget
                    </span>
                    <p className="text-base sm:text-lg font-mono font-bold text-foreground">
                      {tripCurrencySymbol}{budgetAnalytics.totalBudget.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Target allocation
                    </span>
                  </div>

                  {/* Remaining Amount */}
                  <div
                    className={`p-3.5 rounded-[12px] border space-y-1 ${
                      budgetAnalytics.remaining < 0
                        ? "bg-destructive/10 border-destructive/30 text-destructive"
                        : "bg-success/10 border-success/30 text-success"
                    }`}
                  >
                    <span className="text-[10px] font-mono uppercase font-semibold block">
                      {budgetAnalytics.remaining < 0 ? "Over Budget" : "Remaining"}
                    </span>
                    <p className="text-base sm:text-lg font-mono font-bold">
                      {budgetAnalytics.remaining < 0
                        ? `-${tripCurrencySymbol}${Math.abs(budgetAnalytics.remaining).toLocaleString()}`
                        : `${tripCurrencySymbol}${budgetAnalytics.remaining.toLocaleString()}`}
                    </p>
                    <span className="text-[10px] opacity-80 block">
                      {budgetAnalytics.remaining < 0 ? "Exceeded target" : "Available funds"}
                    </span>
                  </div>

                  {/* Daily Average */}
                  <div className="p-3.5 rounded-[12px] bg-surface-subtle border border-border space-y-1">
                    <span className="text-[10px] font-mono text-muted-foreground uppercase font-semibold">
                      Daily Average
                    </span>
                    <p className="text-base sm:text-lg font-mono font-bold text-foreground">
                      {tripCurrencySymbol}{budgetAnalytics.dailyAverage.toLocaleString()}
                    </p>
                    <span className="text-[10px] text-muted-foreground block">
                      Per scheduled day
                    </span>
                  </div>
                </div>

                {/* 2. Overbudget Detection Banner (Coral / Destructive Alert) */}
                {(budgetAnalytics.isOverbudget || budgetAnalytics.overbudgetDays.length > 0) && (
                  <div className="p-3.5 sm:p-4 rounded-[12px] bg-destructive/10 border border-destructive/30 space-y-2 text-xs text-destructive">
                    <div className="flex items-center gap-2 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>Budget Alert</span>
                    </div>

                    <div className="space-y-1 pl-6 text-xs">
                      {budgetAnalytics.isOverbudget && (
                        <p>
                          Total trip spending of <strong>{tripCurrencySymbol}{budgetAnalytics.totalSpent.toLocaleString()}</strong> exceeds your total planned budget by <strong>{tripCurrencySymbol}{Math.abs(budgetAnalytics.remaining).toLocaleString()}</strong>.
                        </p>
                      )}

                      {budgetAnalytics.overbudgetDays.map((od) => (
                        <p key={od.dayNumber}>
                          • <strong>Day {od.dayNumber} ({od.cityName})</strong> is <strong>{tripCurrencySymbol}{od.overAmount.toLocaleString()}</strong> over its daily allocation (Spent: {tripCurrencySymbol}{od.spent.toLocaleString()} / Budget: {tripCurrencySymbol}{od.budget.toLocaleString()}).
                        </p>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Empty State or Charts */}
                {!budgetAnalytics.hasAnySpending ? (
                  <div className="py-12 px-4 text-center rounded-[12px] border border-dashed border-border bg-surface-subtle/40 space-y-3">
                    <div className="p-3 rounded-full bg-primary/10 text-primary w-12 h-12 mx-auto flex items-center justify-center">
                      <Receipt className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-foreground text-sm">No expenses yet</h4>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                        Your budget summary will appear here once you add spending and activity expenses to your itinerary.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* A. CATEGORY BREAKDOWN (DONUT PIE CHART) */}
                    <div className="p-4 sm:p-5 rounded-[14px] bg-surface-subtle/50 border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold uppercase text-foreground flex items-center gap-2">
                          <PieChartIcon className="w-4 h-4 text-primary" />
                          <span>Category Breakdown</span>
                        </h4>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {budgetAnalytics.categoryBreakdown.length} Categories
                        </span>
                      </div>

                      {/* Donut Chart */}
                      {isMounted && (
                        <div className="h-48 sm:h-52 w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={budgetAnalytics.categoryBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={48}
                                outerRadius={72}
                                paddingAngle={3}
                                dataKey="amount"
                                isAnimationActive={!shouldReduceMotion}
                              >
                                {budgetAnalytics.categoryBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<CustomPieTooltip currencySymbol={tripCurrencySymbol} />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Legend Items */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-border/60">
                        {budgetAnalytics.categoryBreakdown.map((cat) => (
                          <div
                            key={cat.key}
                            className="flex items-center justify-between text-xs p-1.5 rounded-[6px] bg-surface border border-border"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                              <span className="truncate text-foreground font-medium">{cat.name}</span>
                            </div>
                            <div className="text-right shrink-0 font-mono">
                              <span className="font-bold text-foreground">{tripCurrencySymbol}{cat.amount.toLocaleString()}</span>
                              <span className="text-[10px] text-muted-foreground ml-1">({cat.percentage}%)</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* B. DAILY BREAKDOWN (BAR CHART) */}
                    <div className="p-4 sm:p-5 rounded-[14px] bg-surface-subtle/50 border border-border space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono font-bold uppercase text-foreground flex items-center gap-2">
                          <BarChart3 className="w-4 h-4 text-primary" />
                          <span>Daily Spending</span>
                        </h4>
                        <span className="text-[11px] font-mono text-muted-foreground">
                          {budgetAnalytics.dailyBreakdown.length} Days
                        </span>
                      </div>

                      {/* Bar Chart */}
                      {isMounted && (
                        <div className="h-48 sm:h-52 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={budgetAnalytics.dailyBreakdown}
                              margin={{ top: 10, right: 10, left: -18, bottom: 0 }}
                            >
                              <XAxis
                                dataKey="name"
                                tick={{ fontSize: 10, fill: "currentColor" }}
                                stroke="var(--border)"
                              />
                              <YAxis
                                tick={{ fontSize: 10, fill: "currentColor" }}
                                stroke="var(--border)"
                                tickFormatter={(v) => `${tripCurrencySymbol}${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                              />
                              <RechartsTooltip content={<CustomBarTooltip currencySymbol={tripCurrencySymbol} />} />
                              <Bar
                                dataKey="spent"
                                radius={[4, 4, 0, 0]}
                                isAnimationActive={!shouldReduceMotion}
                              >
                                {budgetAnalytics.dailyBreakdown.map((entry, index) => (
                                  <Cell
                                    key={`bar-${index}`}
                                    fill={entry.isOverbudget ? "#EF4444" : "#10B981"}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Daily List Summary */}
                      <div className="space-y-1.5 pt-2 border-t border-border/60 max-h-36 overflow-y-auto pr-1">
                        {budgetAnalytics.dailyBreakdown.map((d) => (
                          <div
                            key={d.dayNumber}
                            className="flex items-center justify-between text-xs py-1 px-2 rounded-[6px] bg-surface border border-border"
                          >
                            <span className="font-medium text-foreground">
                              {d.name} ({d.cityName})
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${d.isOverbudget ? "text-destructive" : "text-success"}`}>
                                {tripCurrencySymbol}{d.spent.toLocaleString()}
                              </span>
                              {d.budget > 0 && (
                                <span className="text-[10px] font-mono text-muted-foreground">
                                  / {tripCurrencySymbol}{d.budget.toLocaleString()}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-border bg-surface-subtle/80 flex items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] font-mono text-muted-foreground">
                  All costs calculated in {tripCurrencySymbol} ({tripCurrency.code}) from live MongoDB records
                </span>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setIsBudgetSummaryOpen(false)}
                  className="min-h-[40px] px-4 font-semibold"
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 6. ADD ACTIVITY MODAL WITH TIME SLOT PICKER (8:30 AM to 8:00 PM) */}
      <AnimatePresence>
        {targetAddActivityDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.96, y: 12 }}
              className="w-full max-w-2xl max-h-[90vh] flex flex-col rounded-[16px] bg-surface border border-border shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-4 sm:p-5 border-b border-border bg-surface-subtle/70 flex items-center justify-between gap-3 shrink-0">
                <div>
                  <div className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-primary uppercase">
                    <Compass className="w-3.5 h-3.5" />
                    <span>
                      Day {targetAddActivityDay.dayNumber} · Leg {targetAddActivityDay.legIndex}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
                    <span>Add Activity in {targetAddActivityDay.cityName}</span>
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Schedule activities between 08:30 AM and 08:00 PM.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCloseAddActivityModal}
                  className="p-1.5 rounded-[8px] text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Time Slot Picker (08:30 AM to 08:00 PM) */}
              <div className="p-3.5 sm:p-4 border-b border-border bg-surface-subtle/40 space-y-2 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-foreground flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>Choose Time Slot (08:30 AM – 08:00 PM):</span>
                  </span>
                  <span className="text-[11px] font-mono text-primary font-bold">
                    Selected: {selectedTimeSlot}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                  {VALID_TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-mono font-medium shrink-0 transition-colors cursor-pointer ${
                        selectedTimeSlot === slot
                          ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                          : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      {slot}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search & Filter Toolbar */}
              <div className="p-3.5 sm:p-4 border-b border-border bg-surface space-y-3 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <input
                    ref={activitySearchInputRef}
                    type="text"
                    value={activitySearchInput}
                    onChange={(e) => setActivitySearchInput(e.target.value)}
                    placeholder={`Search activities in ${targetAddActivityDay.cityName} by name or category...`}
                    className="w-full h-10 pl-10 pr-9 text-xs sm:text-sm rounded-[9px] bg-input-bg border border-input-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  {activitySearchInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setActivitySearchInput("");
                        setDebouncedActivitySearch("");
                        activitySearchInputRef.current?.focus();
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Category & Cost Filters */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0 uppercase">Category:</span>
                  {["all", "Sightseeing", "Culture", "Culinary", "Nature", "Adventure"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                        selectedCategoryFilter === cat
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-surface-subtle text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      {cat === "all" ? "All Categories" : cat}
                    </button>
                  ))}

                  <div className="h-4 w-[1px] bg-border mx-1 shrink-0" />

                  <span className="text-[11px] font-mono text-muted-foreground shrink-0 uppercase">Cost:</span>
                  {[
                    { key: "all", label: "All" },
                    { key: "free", label: `Free (${getCurrencySymbol(targetAddActivityDay?.country)}0)` },
                    { key: "under1000", label: `< ${getCurrencySymbol(targetAddActivityDay?.country)}1,000` },
                    { key: "under5000", label: `< ${getCurrencySymbol(targetAddActivityDay?.country)}5,000` },
                  ].map((filter) => (
                    <button
                      key={filter.key}
                      type="button"
                      onClick={() => setSelectedCostFilter(filter.key)}
                      className={`px-2.5 py-1 rounded-[6px] text-xs font-medium shrink-0 transition-colors cursor-pointer ${
                        selectedCostFilter === filter.key
                          ? "bg-primary text-primary-foreground font-semibold"
                          : "bg-surface-subtle text-muted-foreground hover:text-foreground border border-border"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Modal Body / Results List */}
              <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 divide-y divide-border/60">
                {isActivitiesSearchLoading ? (
                  <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center justify-center gap-2.5">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span>Searching curated activities in {targetAddActivityDay.cityName}...</span>
                  </div>
                ) : isActivitiesSearchError ? (
                  <div className="py-8 text-center text-xs space-y-3">
                    <p className="text-destructive font-medium">Failed to load activities for {targetAddActivityDay.cityName}.</p>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => refetchModalActivities()}
                    >
                      Retry Search
                    </Button>
                  </div>
                ) : modalActivities.length > 0 ? (
                  modalActivities.map((act, actIdx) => {
                    const isAlreadyAdded =
                      targetDayExistingNames.has((act.name || "").toLowerCase()) ||
                      (act.id && targetDayExistingIds.has(String(act.id)));

                    return (
                      <div
                        key={act.id || actIdx}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                          actIdx > 0 ? "pt-3.5" : ""
                        }`}
                      >
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm sm:text-base text-foreground">
                              {act.name}
                            </span>
                            {act.category && (
                              <span className="px-2 py-0.5 rounded-[4px] bg-primary/10 border border-primary/20 text-primary text-[10px] font-mono uppercase">
                                {act.category}
                              </span>
                            )}
                          </div>

                          {act.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {act.description}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground pt-0.5">
                            {act.rating && (
                              <span className="flex items-center gap-1 text-primary font-semibold">
                                <Star className="w-3 h-3 fill-primary text-primary" />
                                <span>{act.rating.toFixed(1)}</span>
                              </span>
                            )}

                            {act.durationMinutes && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{act.durationMinutes} min</span>
                              </span>
                            )}

                            <span className="font-semibold text-success flex items-center gap-0.5">
                              <span>{getCurrencySymbol(targetAddActivityDay?.country)}</span>
                              <span>{act.cost ? act.cost.toLocaleString() : "0 (Free)"}</span>
                            </span>
                          </div>
                        </div>

                        {/* Add Button / Already Added State */}
                        <div className="shrink-0 self-end sm:self-center">
                          {isAlreadyAdded ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[8px] bg-primary/15 border border-primary/30 text-primary text-xs font-mono font-bold select-none">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Added</span>
                            </span>
                          ) : (
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              onClick={() => handleSelectActivityForDay(act)}
                              disabled={createItineraryItemMutation.isPending}
                              className="gap-1.5 text-xs text-primary border border-primary/30 hover:bg-primary/10 min-h-[40px] px-3.5"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Add at {selectedTimeSlot}</span>
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-6 text-center space-y-3">
                    <p className="text-xs text-muted-foreground">
                      No activities found matching &quot;{debouncedActivitySearch}&quot; in {targetAddActivityDay.cityName}.
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      You can add it as a custom activity below.
                    </p>
                  </div>
                )}

                {/* Custom Activity Entry Fallback */}
                <div className="pt-4 border-t border-border/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      <span>Add Custom Place or Tour to Day {targetAddActivityDay.dayNumber}</span>
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <div className="flex-1 w-full">
                      <Input
                        type="text"
                        placeholder="e.g. Private Heritage Walk, Night Food Market..."
                        value={customActivityName}
                        onChange={(e) => setCustomActivityName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddCustomModalActivity();
                          }
                        }}
                      />
                    </div>
                    <div className="w-full sm:w-32">
                      <Input
                        type="number"
                        placeholder={`Cost (${getCurrencySymbol(targetAddActivityDay?.country)})`}
                        value={customActivityCost}
                        onChange={(e) => setCustomActivityCost(e.target.value)}
                        leftIcon={<DollarSign className="w-3.5 h-3.5 text-primary" />}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleAddCustomModalActivity}
                      disabled={!(customActivityName.trim() || activitySearchInput.trim()) || createItineraryItemMutation.isPending}
                      className="text-xs shrink-0 w-full sm:w-auto"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add at {selectedTimeSlot}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 border-t border-border bg-surface-subtle/50 flex items-center justify-between gap-3 shrink-0">
                <span className="text-[11px] font-mono text-muted-foreground">
                  Restricted to {targetAddActivityDay.cityName} · {targetAddActivityDay.country}
                </span>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCloseAddActivityModal}
                >
                  Done
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 7. EDIT ACTIVITY MODAL */}
      <AnimatePresence>
        {editingActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[16px] bg-surface border border-border p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Edit Activity Details</h3>
                    <p className="text-xs text-muted-foreground">{editingActivity.cityName}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingActivity(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedActivity} className="space-y-4">
                <div className="space-y-1.5">
                  <Label required>Activity Name</Label>
                  <Input
                    type="text"
                    value={editActivityName}
                    onChange={(e) => setEditActivityName(e.target.value)}
                    placeholder="e.g. Gateway of India Tour"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label required>Assigned Day</Label>
                    <select
                      value={editActivityDayNumber}
                      onChange={(e) => setEditActivityDayNumber(parseInt(e.target.value, 10))}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-[9px] bg-input-bg border border-input-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      {allDays.map((d) => (
                        <option key={d.dayNumber} value={d.dayNumber}>
                          Day {d.dayNumber} ({d.cityName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Estimated Cost ({getCurrencySymbol(stopsList.find(s => s.cityName === editingActivity.cityName)?.country || primaryCountry)} {getCurrencyForCountry(stopsList.find(s => s.cityName === editingActivity.cityName)?.country || primaryCountry).code})</Label>
                    <Input
                      type="number"
                      value={editActivityCost}
                      onChange={(e) => setEditActivityCost(e.target.value)}
                      placeholder="0 for Free"
                      leftIcon={<DollarSign className="w-4 h-4 text-primary" />}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Scheduled Time Slot (08:30 AM – 08:00 PM)</Label>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    {VALID_TIME_SLOTS.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setEditActivityTimeSlot(slot)}
                        className={`px-2.5 py-1.5 rounded-[8px] text-xs font-mono shrink-0 transition-colors cursor-pointer ${
                          editActivityTimeSlot === slot
                            ? "bg-primary text-primary-foreground font-bold shadow-2xs"
                            : "bg-surface text-muted-foreground hover:text-foreground border border-border"
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingActivity(null)}
                    disabled={updateItineraryItemMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={updateItineraryItemMutation.isPending || !editActivityName.trim()}
                    className="gap-1.5"
                  >
                    {updateItineraryItemMutation.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Save Changes</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 8. REMOVE ACTIVITY CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deletingActivity && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-[14px] bg-surface border border-border p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-destructive/10 text-destructive shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Remove &quot;{deletingActivity.name}&quot;?
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This will remove this activity from Day {deletingActivity.dayNumber} in MongoDB.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingActivity(null)}
                  disabled={deleteItineraryItemMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteItineraryItemMutation.mutate(deletingActivity.id)}
                  disabled={deleteItineraryItemMutation.isPending}
                  className="gap-1.5"
                >
                  {deleteItineraryItemMutation.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Remove Activity</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 9. ADD EXPENSE MODAL */}
      <AnimatePresence>
        {targetAddExpenseDay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[16px] bg-surface border border-border p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Record Expense</h3>
                    <p className="text-xs text-muted-foreground">
                      Day {targetAddExpenseDay.dayNumber} · {targetAddExpenseDay.cityName}, {targetAddExpenseDay.country}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setTargetAddExpenseDay(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveNewExpense} className="space-y-4">
                <div className="space-y-1.5">
                  <Label required>Expense Category</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => {
                      const IconC = cat.icon;
                      const isSelected = expenseCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setExpenseCategory(cat.key)}
                          className={`p-2.5 rounded-[10px] border flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                              : "bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          <IconC className="w-4 h-4" />
                          <span className="text-[11px]">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label required>Amount ({getCurrencySymbol(targetAddExpenseDay.country)} {getCurrencyForCountry(targetAddExpenseDay.country).code})</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder={`e.g. 450 in ${getCurrencyForCountry(targetAddExpenseDay.country).code}`}
                      value={expenseAmount}
                      onChange={(e) => setExpenseAmount(e.target.value)}
                      leftIcon={<DollarSign className="w-4 h-4 text-primary" />}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={expenseDate}
                      onChange={(e) => setExpenseDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Description / Notes</Label>
                  <Input
                    type="text"
                    placeholder="e.g. Taxi fare from station, Local specialty meal..."
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setTargetAddExpenseDay(null)}
                    disabled={createExpenseMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={createExpenseMutation.isPending || !expenseAmount}
                    className="gap-1.5"
                  >
                    {createExpenseMutation.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Save Expense</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 10. EDIT EXPENSE MODAL */}
      <AnimatePresence>
        {editingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-[16px] bg-surface border border-border p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-[8px] bg-primary/10 text-primary">
                    <Pencil className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Edit Expense Details</h3>
                    <p className="text-xs text-muted-foreground">Day {editingExpense.dayNumber || 1}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="p-1 rounded text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEditedExpense} className="space-y-4">
                <div className="space-y-1.5">
                  <Label required>Expense Category</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {EXPENSE_CATEGORIES.map((cat) => {
                      const IconC = cat.icon;
                      const isSelected = editExpenseCategory === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => setEditExpenseCategory(cat.key)}
                          className={`p-2.5 rounded-[10px] border flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-primary text-primary-foreground font-bold border-primary shadow-xs"
                              : "bg-surface border-border text-muted-foreground hover:text-foreground hover:bg-surface-hover"
                          }`}
                        >
                          <IconC className="w-4 h-4" />
                          <span className="text-[11px]">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label required>Amount ({getCurrencySymbol(editingExpense.currency || primaryCountry)})</Label>
                    <Input
                      type="number"
                      step="any"
                      min="0.01"
                      value={editExpenseAmount}
                      onChange={(e) => setEditExpenseAmount(e.target.value)}
                      leftIcon={<DollarSign className="w-4 h-4 text-primary" />}
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label required>Assigned Day</Label>
                    <select
                      value={editExpenseDayNumber}
                      onChange={(e) => setEditExpenseDayNumber(parseInt(e.target.value, 10))}
                      className="w-full h-10 px-3 text-xs sm:text-sm rounded-[9px] bg-input-bg border border-input-border text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    >
                      {allDays.map((d) => (
                        <option key={d.dayNumber} value={d.dayNumber}>
                          Day {d.dayNumber} ({d.cityName})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={editExpenseDate}
                      onChange={(e) => setEditExpenseDate(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Description / Notes</Label>
                  <Input
                    type="text"
                    value={editExpenseNotes}
                    onChange={(e) => setEditExpenseNotes(e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingExpense(null)}
                    disabled={updateExpenseMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={updateExpenseMutation.isPending || !editExpenseAmount}
                    className="gap-1.5"
                  >
                    {updateExpenseMutation.isPending && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    <span>Save Changes</span>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 11. DELETE EXPENSE CONFIRMATION DIALOG */}
      <AnimatePresence>
        {deletingExpense && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-[14px] bg-surface border border-border p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-destructive/10 text-destructive shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Remove Expense of {getCurrencySymbol(deletingExpense.currency || primaryCountry)}{deletingExpense.amount.toLocaleString()}?
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This will remove this {deletingExpense.category.toLowerCase()} expense from Day {deletingExpense.dayNumber || 1} in MongoDB.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingExpense(null)}
                  disabled={deleteExpenseMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteExpenseMutation.mutate(deletingExpense.id)}
                  disabled={deleteExpenseMutation.isPending}
                  className="gap-1.5"
                >
                  {deleteExpenseMutation.isPending && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>Remove Expense</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 12. Delete Section Confirmation Dialog Modal */}
      <AnimatePresence>
        {deletingStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-[14px] bg-surface border border-border p-5 space-y-4 shadow-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-full bg-destructive/10 text-destructive shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    Delete {deletingStop.name} Section?
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This will permanently remove the destination leg and its attached activities from your itinerary.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeletingStop(null)}
                  disabled={deleteStopMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteStopMutation.mutate(deletingStop.id)}
                  disabled={deleteStopMutation.isPending}
                  className="gap-1.5"
                >
                  {deleteStopMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Delete Section</span>
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
