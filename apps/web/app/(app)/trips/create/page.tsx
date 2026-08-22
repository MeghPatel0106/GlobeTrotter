"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Compass,
  MapPin,
  Calendar,
  DollarSign,
  Sparkles,
  ArrowRight,
  Clock,
  Star,
  Search,
  Check,
  ChevronRight,
  AlertCircle,
  FileText,
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
  MotionStaggerContainer,
  MotionFadeRise,
  RouteThreadDecoration,
} from "@globetrotter/ui";
import { citiesApi, tripsApi, City, Activity } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function CreateTripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Initial params if passed from Dashboard
  const initialCityId = searchParams.get("cityId") || "";
  const initialCityName = searchParams.get("cityName") || "";
  const initialCountry = searchParams.get("country") || "";

  const [tripName, setTripName] = React.useState(
    initialCityName ? `Voyage to ${initialCityName}` : ""
  );
  const [selectedCity, setSelectedCity] = React.useState<{
    id: string;
    name: string;
    country: string;
  } | null>(
    initialCityName
      ? { id: initialCityId, name: initialCityName, country: initialCountry }
      : null
  );

  const [citySearch, setCitySearch] = React.useState(initialCityName);
  const [isCityDropdownOpen, setIsCityDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Date state
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login?returnTo=/trips/create");
    }
  }, [isAuthLoading, isAuthenticated, router]);

  // Click outside to close city dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Live search for cities
  const { data: searchResults = [] } = useQuery({
    queryKey: ["cities", "search", citySearch],
    queryFn: () => citiesApi.search(citySearch, 6),
    enabled: isCityDropdownOpen && citySearch.trim().length > 0,
    staleTime: 30 * 1000,
  });

  // Top 6 Activities for selected city
  const { data: activities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["cities", selectedCity?.id, "activities"],
    queryFn: () => (selectedCity?.id ? citiesApi.getActivities(selectedCity.id, 6) : []),
    enabled: !!selectedCity?.id,
    staleTime: 5 * 60 * 1000,
  });

  const handleSelectCity = (city: City) => {
    setSelectedCity({ id: city.id, name: city.name, country: city.country });
    setCitySearch(`${city.name}, ${city.country}`);
    setIsCityDropdownOpen(false);
    if (!tripName || tripName.startsWith("Voyage to ")) {
      setTripName(`Voyage to ${city.name}`);
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next.city;
      return next;
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!tripName.trim()) {
      newErrors.tripName = "Trip name is required.";
    }

    if (!selectedCity) {
      newErrors.city = "Please select a destination city.";
    }

    if (!startDate) {
      newErrors.startDate = "Start date is required.";
    } else if (startDate < todayStr) {
      newErrors.startDate = "Start date cannot be in the past.";
    }

    if (!endDate) {
      newErrors.endDate = "End date is required.";
    } else if (startDate && endDate < startDate) {
      newErrors.endDate = "End date cannot be earlier than start date.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedCity) {
      toast.error("Please resolve form validation errors before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        name: tripName.trim(),
        startDate,
        endDate,
        cityId: selectedCity.id,
        cityName: selectedCity.name,
        country: selectedCity.country,
        sectionBudget: budget ? parseFloat(budget) : undefined,
        notes: notes.trim() || undefined,
      };

      const createdTrip = await tripsApi.createTrip(payload);
      toast.success("Expedition created in your travel journal!", {
        duration: 2500,
      });

      // Redirect to itinerary builder
      router.push(`/trips/${createdTrip.id}/itinerary`);
    } catch (err: any) {
      const msg = err?.message || "Failed to create trip. Please check your details.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Dashboard
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link href="/trips/mine" className="hover:text-foreground transition-colors">
          Expeditions
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-primary font-semibold">New Voyage</span>
      </nav>

      {/* Page Header */}
      <div className="border-b border-border pb-5">
        <div className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-primary mb-1">
          <Compass className="w-3.5 h-3.5" />
          <span>Itinerary Initiation · Phase 2</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Chart a New Voyage
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-2xl">
          Set your journey timeline, choose your primary gateway destination, and
          preview handpicked local activities for your day-by-day itinerary.
        </p>
      </div>

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Trip Creation Form (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Trip Name */}
            <div className="space-y-1.5">
              <Input
                label="Expedition / Trip Name"
                placeholder="e.g. Autumn in Kyoto or Mediterranean Odyssey"
                value={tripName}
                onChange={(e) => {
                  setTripName(e.target.value);
                  if (errors.tripName) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.tripName;
                      return next;
                    });
                  }
                }}
                required
                error={errors.tripName}
                disabled={isSubmitting}
                leftIcon={<FileText className="w-4 h-4" />}
              />
            </div>

            {/* Destination Search & Select */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground select-none inline-flex items-center gap-1">
                <span>Select Primary Gateway City</span>
                <span className="text-destructive text-sm font-semibold" aria-hidden="true">*</span>
              </label>

              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none z-10">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={citySearch}
                  onFocus={() => setIsCityDropdownOpen(true)}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                    setIsCityDropdownOpen(true);
                  }}
                  placeholder="Search city or country (e.g. Kyoto, Florence, Barcelona)..."
                  disabled={isSubmitting}
                  aria-invalid={!!errors.city}
                  className="w-full h-11 pl-11 pr-4 rounded-[8px] bg-input-bg border border-input-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                />
              </div>

              {errors.city && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.city}</span>
                </p>
              )}

              {/* Autocomplete Dropdown */}
              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 max-h-60 overflow-y-auto rounded-[10px] bg-surface border border-border shadow-xl z-50 divide-y divide-border/60">
                  {searchResults.length > 0 ? (
                    searchResults.map((city) => (
                      <button
                        key={city.id}
                        type="button"
                        onClick={() => handleSelectCity(city)}
                        className="w-full px-4 py-3 text-left flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <MapPin className="w-4 h-4 text-primary shrink-0" />
                          <div>
                            <span className="font-semibold text-sm text-foreground block">
                              {city.name}
                            </span>
                            <span className="text-xs text-muted-foreground block">
                              {city.country}
                            </span>
                          </div>
                        </div>
                        {selectedCity?.id === city.id && (
                          <Check className="w-4 h-4 text-primary shrink-0" />
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      {citySearch.trim()
                        ? `No destinations found matching "${citySearch}".`
                        : "Type a destination name above."}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Date Range: Start Date & End Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Input
                  type="date"
                  label="Expedition Start Date"
                  min={todayStr}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (errors.startDate) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.startDate;
                        return next;
                      });
                    }
                  }}
                  required
                  error={errors.startDate}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Input
                  type="date"
                  label="Expedition End Date"
                  min={startDate || todayStr}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    if (errors.endDate) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.endDate;
                        return next;
                      });
                    }
                  }}
                  required
                  error={errors.endDate}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Budget & Notes Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                label="Target Budget ($ USD, optional)"
                placeholder="e.g. 2500"
                min={0}
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                leftIcon={<DollarSign className="w-4 h-4" />}
                disabled={isSubmitting}
              />

              <div className="sm:col-span-2">
                <Textarea
                  label="Expedition Notes / Objectives (optional)"
                  placeholder="e.g. Focus on historic temple walks, culinary masterclasses, and coastal photography..."
                  maxLength={400}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <RouteThreadDecoration className="py-2" />

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full sm:flex-1 h-12 text-base font-semibold"
                isLoading={isSubmitting}
              >
                <span>Save Trip & Build Itinerary</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>

              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto h-12 text-sm"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN: 6 Activity / Place Suggestion Cards (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between gap-2 border-b border-border pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                Gateway Suggestions
              </h2>
            </div>
            {selectedCity && (
              <span className="text-xs font-mono text-primary font-medium">
                {selectedCity.name}
              </span>
            )}
          </div>

          {!selectedCity ? (
            /* Empty State before City Selection */
            <Card className="border-border bg-surface text-center p-8">
              <CardContent className="space-y-3 p-0 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-muted-foreground">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  No destination selected
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Choose a gateway city on the left to reveal 6 curated activity recommendations and cultural highlights.
                </p>
              </CardContent>
            </Card>
          ) : isActivitiesLoading ? (
            /* Loading State */
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div
                  key={n}
                  className="h-20 rounded-[10px] bg-surface-subtle border border-border animate-pulse p-3.5 space-y-2"
                >
                  <div className="h-3 w-1/3 bg-surface-elevated rounded" />
                  <div className="h-4 w-3/4 bg-surface-elevated rounded" />
                </div>
              ))}
            </div>
          ) : activities.length === 0 ? (
            <Card className="border-border bg-surface text-center p-6">
              <p className="text-xs text-muted-foreground">
                No predefined activity cards available for {selectedCity.name} yet. You can add custom activities in the Itinerary Builder.
              </p>
            </Card>
          ) : (
            /* 6 Suggestions Grid */
            <MotionStaggerContainer staggerDelay={0.05} className="space-y-3">
              {activities.map((act) => (
                <MotionFadeRise key={act.id}>
                  <div className="p-3.5 rounded-[10px] bg-surface border border-border hover:border-primary/40 transition-colors flex flex-col justify-between gap-2 shadow-xs group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[10px] font-mono text-primary uppercase">
                            {act.category || "Highlight"}
                          </span>
                          {act.rating && (
                            <span className="flex items-center gap-0.5 text-[11px] font-mono text-primary font-bold">
                              <Star className="w-3 h-3 fill-primary text-primary" />
                              {act.rating}
                            </span>
                          )}
                        </div>
                        <h3 className="font-medium text-sm text-foreground group-hover:text-primary transition-colors leading-snug line-clamp-1">
                          {act.name}
                        </h3>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-xs font-mono font-bold text-foreground block">
                          {act.cost === 0 ? "Free" : `$${act.cost}`}
                        </span>
                        {act.durationMinutes && (
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5 justify-end mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {Math.floor(act.durationMinutes / 60)}h{" "}
                            {act.durationMinutes % 60 ? `${act.durationMinutes % 60}m` : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {act.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {act.description}
                      </p>
                    )}
                  </div>
                </MotionFadeRise>
              ))}
            </MotionStaggerContainer>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CreateTripPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
          <Compass className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm font-mono text-muted-foreground">
            Opening voyage planner...
          </span>
        </div>
      }
    >
      <CreateTripForm />
    </React.Suspense>
  );
}
