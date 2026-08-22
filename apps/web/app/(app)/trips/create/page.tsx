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
  X,
  Plus,
  Loader2,
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

  // Multi-city destinations state
  const [selectedCities, setSelectedCities] = React.useState<City[]>([]);
  const [cityInputText, setCityInputText] = React.useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Auto-fill initial city if coming from a "Plan Trip" link
  React.useEffect(() => {
    if (initialCityName && selectedCities.length === 0) {
      setSelectedCities([
        {
          id: initialCityId || `temp-${Date.now()}`,
          name: initialCityName,
          country: initialCountry || "India",
          popularityScore: 90,
          costIndex: 2,
          description: "",
          region: "global",
        } as City,
      ]);
    }
  }, [initialCityId, initialCityName, initialCountry]);

  // Trip basic info state
  const [tripName, setTripName] = React.useState(
    initialCityName ? `Voyage to ${initialCityName}` : ""
  );

  // Automatically update trip name when cities change (if untouched by user)
  const isTripNameCustomized = React.useRef(false);

  const updateTripNameFromCities = (cities: City[]) => {
    if (cities.length === 0) {
      if (!isTripNameCustomized.current) setTripName("");
      return;
    }
    if (!isTripNameCustomized.current) {
      if (cities.length === 1) {
        setTripName(`Voyage to ${cities[0].name}`);
      } else if (cities.length === 2) {
        setTripName(`Voyage to ${cities[0].name} & ${cities[1].name}`);
      } else {
        setTripName(`${cities.map((c) => c.name).join(" → ")}`);
      }
    }
  };

  // Date state
  const todayStr = new Date().toISOString().split("T")[0];
  const [startDate, setStartDate] = React.useState("");
  const [endDate, setEndDate] = React.useState("");
  const [budget, setBudget] = React.useState("");
  const [notes, setNotes] = React.useState("");

  // Validation errors
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Right sidebar filter for activity suggestions
  const [activeSuggestionCityId, setActiveSuggestionCityId] = React.useState<string>("all");

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
  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ["cities", "search", cityInputText],
    queryFn: () => citiesApi.search(cityInputText.trim(), 8),
    enabled: isCityDropdownOpen && cityInputText.trim().length > 0,
    staleTime: 30 * 1000,
  });

  // Top suggestions when search is empty
  const { data: topCities = [] } = useQuery({
    queryKey: ["cities", "top-gateway-suggestions"],
    queryFn: () => citiesApi.getTop(6),
    enabled: isCityDropdownOpen && cityInputText.trim().length === 0,
    staleTime: 5 * 60 * 1000,
  });

  // Curated activities for all selected cities
  const { data: multiCityActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["cities", "multi-activities", selectedCities.map((c) => c.id).join(",")],
    queryFn: async () => {
      if (selectedCities.length === 0) return [];
      const validCities = selectedCities.filter((c) => c.id && !c.id.startsWith("temp-"));
      if (validCities.length === 0) return [];
      const promises = validCities.map((c) => citiesApi.getActivities(c.id, 4));
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: selectedCities.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  // Handle selecting a city from autocomplete
  const handleSelectCity = (city: City) => {
    // Prevent duplicate city selection
    const isAlreadySelected = selectedCities.some(
      (c) => c.name.toLowerCase() === city.name.toLowerCase() || (c.id && c.id === city.id)
    );

    if (isAlreadySelected) {
      toast.error(`${city.name} is already in your destination sequence.`);
      setCityInputText("");
      inputRef.current?.focus();
      return;
    }

    const updated = [...selectedCities, city];
    setSelectedCities(updated);
    updateTripNameFromCities(updated);
    setCityInputText("");
    setIsCityDropdownOpen(false);

    setErrors((prev) => {
      const next = { ...prev };
      delete next.cities;
      return next;
    });

    inputRef.current?.focus();
  };

  // Handle removing a city
  const handleRemoveCity = (cityToRemove: City, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = selectedCities.filter(
      (c) => c.name.toLowerCase() !== cityToRemove.name.toLowerCase()
    );
    setSelectedCities(updated);
    updateTripNameFromCities(updated);
    inputRef.current?.focus();
  };

  // Handle keyboard interaction (Backspace to remove last city)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && cityInputText === "" && selectedCities.length > 0) {
      handleRemoveCity(selectedCities[selectedCities.length - 1]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!tripName.trim()) {
      newErrors.tripName = "Trip name is required.";
    }

    if (selectedCities.length === 0) {
      newErrors.cities = "Please select at least 1 destination city.";
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

    if (!budget || isNaN(Number(budget)) || Number(budget) <= 0) {
      newErrors.budget = "Target budget is required and must be greater than ₹0.";
    }

    if (!notes.trim()) {
      newErrors.notes = "Expedition notes / objectives are required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || selectedCities.length === 0) {
      toast.error("Please fill in all mandatory fields before saving.");
      return;
    }

    setIsSubmitting(true);

    try {
      const cityListPayload = selectedCities.map((c) => ({
        cityId: c.id && !c.id.startsWith("temp-") ? c.id : undefined,
        cityName: c.name,
        country: c.country,
      }));

      const payload = {
        name: tripName.trim(),
        startDate,
        endDate,
        cities: cityListPayload,
        cityId: cityListPayload[0].cityId,
        cityName: cityListPayload[0].cityName,
        country: cityListPayload[0].country,
        sectionBudget: parseFloat(budget),
        notes: notes.trim(),
      };

      const createdTrip = await tripsApi.createTrip(payload);
      toast.success(
        `Expedition created with ${selectedCities.length} destination leg${
          selectedCities.length === 1 ? "" : "s"
        }!`,
        { duration: 2500 }
      );

      // Redirect to itinerary builder
      router.push(`/trips/${createdTrip.id}/itinerary`);
    } catch (err: any) {
      const msg = err?.message || "Failed to create trip. Please check your details.";
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter activities shown on right sidebar
  const displayedActivities = React.useMemo(() => {
    if (activeSuggestionCityId === "all") {
      return multiCityActivities.slice(0, 6);
    }
    return multiCityActivities
      .filter((a) => a.cityId === activeSuggestionCityId)
      .slice(0, 6);
  }, [multiCityActivities, activeSuggestionCityId]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Breadcrumb Navigation */}
      <nav
        aria-label="Breadcrumb"
        className="flex items-center gap-2 text-xs font-mono text-muted-foreground"
      >
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
          <span>Itinerary Initiation · Multi-City Route</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Chart a New Voyage
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-2xl">
          Set your journey timeline, choose the places you&apos;re visiting in sequence, and
          preview handpicked local activities for your multi-city itinerary.
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
                placeholder="e.g. Ahmedabad, Mumbai & Goa Expedition"
                value={tripName}
                onChange={(e) => {
                  isTripNameCustomized.current = true;
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

            {/* SINGLE MULTI-CITY INPUT: Places You're Visiting */}
            <div className="space-y-1.5 relative" ref={dropdownRef}>
              <Label required htmlFor="places-visiting-input">
                Places You&apos;re Visiting
              </Label>

              {/* Single Combined Multi-City Input Container */}
              <div
                onClick={() => inputRef.current?.focus()}
                className={`min-h-[46px] w-full p-2 pl-3.5 rounded-[8px] bg-input-bg border transition-colors flex flex-wrap items-center gap-1.5 cursor-text ${
                  errors.cities
                    ? "border-destructive focus-within:ring-2 focus-within:ring-destructive/20"
                    : isCityDropdownOpen
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-input-border hover:border-border"
                }`}
              >
                <MapPin className="w-4 h-4 text-primary shrink-0 mr-1" />

                {/* Selected Cities Displayed as Comma-Separated / Sequential Tags */}
                {selectedCities.map((city, idx) => (
                  <span
                    key={`${city.name}-${idx}`}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-primary/10 border border-primary/25 text-primary text-xs font-semibold select-none animate-in fade-in zoom-in-95 duration-150"
                  >
                    <span>{city.name}</span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      ({city.country})
                    </span>
                    {idx < selectedCities.length - 1 && (
                      <span className="text-muted-foreground/60 font-bold ml-0.5">,</span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCity(city, e)}
                      aria-label={`Remove ${city.name}`}
                      className="p-0.5 rounded hover:bg-primary/20 text-primary transition-colors cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                {/* Inline '+' Button when 1+ cities selected */}
                {selectedCities.length > 0 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsCityDropdownOpen(true);
                      inputRef.current?.focus();
                    }}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-[6px] bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 text-xs font-semibold transition-colors cursor-pointer select-none"
                    title="Add another city"
                    aria-label="Add another destination"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span className="text-[11px] font-mono">Add</span>
                  </button>
                )}

                {/* Integrated Typeahead Input for Continual Searching */}
                <input
                  ref={inputRef}
                  id="places-visiting-input"
                  type="text"
                  value={cityInputText}
                  onFocus={() => setIsCityDropdownOpen(true)}
                  onChange={(e) => {
                    setCityInputText(e.target.value);
                    setIsCityDropdownOpen(true);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedCities.length === 0
                      ? "Search cities (e.g. Ahmedabad, Mumbai, Goa, Tokyo)..."
                      : ""
                  }
                  disabled={isSubmitting}
                  className={`bg-transparent border-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none py-1 px-1.5 ${
                    selectedCities.length === 0 ? "flex-1 min-w-[200px]" : "w-24 focus:w-44 transition-all"
                  }`}
                />
              </div>

              {errors.cities && (
                <p
                  className="text-xs text-destructive flex items-center gap-1 mt-1"
                  role="alert"
                >
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.cities}</span>
                </p>
              )}

              {/* Autocomplete Dropdown List */}
              {isCityDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-[10px] bg-surface border border-border shadow-xl z-50 divide-y divide-border/60">
                  {isSearchLoading ? (
                    <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span>Searching destinations...</span>
                    </div>
                  ) : cityInputText.trim().length > 0 ? (
                    searchResults.length > 0 ? (
                      searchResults.map((city) => {
                        const isSelected = selectedCities.some(
                          (c) =>
                            c.name.toLowerCase() === city.name.toLowerCase() ||
                            (c.id && c.id === city.id)
                        );

                        return (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => handleSelectCity(city)}
                            className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 opacity-70"
                                : "hover:bg-surface-hover"
                            }`}
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
                            {isSelected ? (
                              <span className="text-[10px] font-mono text-primary font-semibold px-2 py-0.5 rounded bg-primary/15">
                                Added
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-muted-foreground">
                                + Add to Route
                              </span>
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="p-4 text-center text-xs text-muted-foreground">
                        No destinations found matching &quot;{cityInputText}&quot;.
                      </div>
                    )
                  ) : (
                    <div>
                      <div className="px-3.5 py-2 bg-surface-subtle/50 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                        Top Suggested Destinations
                      </div>
                      {topCities.map((city) => {
                        const isSelected = selectedCities.some(
                          (c) =>
                            c.name.toLowerCase() === city.name.toLowerCase() ||
                            (c.id && c.id === city.id)
                        );

                        return (
                          <button
                            key={city.id}
                            type="button"
                            onClick={() => handleSelectCity(city)}
                            className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-primary/10 opacity-70"
                                : "hover:bg-surface-hover"
                            }`}
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
                            {isSelected ? (
                              <span className="text-[10px] font-mono text-primary font-semibold px-2 py-0.5 rounded bg-primary/15">
                                Added
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-primary font-semibold">
                                + Add
                              </span>
                            )}
                          </button>
                        );
                      })}
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
                label="Target Budget (₹ INR)"
                placeholder="e.g. 25000"
                min={1}
                required
                value={budget}
                onChange={(e) => {
                  setBudget(e.target.value);
                  if (errors.budget) {
                    setErrors((prev) => {
                      const next = { ...prev };
                      delete next.budget;
                      return next;
                    });
                  }
                }}
                error={errors.budget}
                disabled={isSubmitting}
              />

              <div className="sm:col-span-2 space-y-1.5">
                <Label required htmlFor="expedition-notes">
                  Expedition Notes / Objectives
                </Label>
                <Textarea
                  id="expedition-notes"
                  placeholder="e.g. Focus on historic temple walks, culinary masterclasses, and coastal photography..."
                  maxLength={400}
                  required
                  value={notes}
                  onChange={(e) => {
                    setNotes(e.target.value);
                    if (errors.notes) {
                      setErrors((prev) => {
                        const next = { ...prev };
                        delete next.notes;
                        return next;
                      });
                    }
                  }}
                  error={errors.notes}
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
                <span>
                  Save Trip & Build Itinerary (
                  {selectedCities.length || 1} {selectedCities.length === 1 ? "Leg" : "Legs"})
                </span>
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

        {/* RIGHT COLUMN: Activity Suggestions for Selected Multi-City Itinerary */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex flex-col gap-2.5 border-b border-border pb-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <h2 className="text-lg font-bold text-foreground">
                  Route Suggestions
                </h2>
              </div>
              <span className="text-xs font-mono text-primary font-medium">
                {selectedCities.length}{" "}
                {selectedCities.length === 1 ? "Destination" : "Destinations"}
              </span>
            </div>

            {/* Switcher tabs across selected cities if multiple cities selected */}
            {selectedCities.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                <button
                  type="button"
                  onClick={() => setActiveSuggestionCityId("all")}
                  className={`px-2.5 py-1 rounded-[6px] transition-colors whitespace-nowrap font-medium cursor-pointer ${
                    activeSuggestionCityId === "all"
                      ? "bg-primary text-primary-foreground font-semibold"
                      : "bg-surface-subtle text-muted-foreground hover:text-foreground"
                  }`}
                >
                  All Places
                </button>
                {selectedCities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setActiveSuggestionCityId(c.id)}
                    className={`px-2.5 py-1 rounded-[6px] transition-colors whitespace-nowrap font-medium cursor-pointer ${
                      activeSuggestionCityId === c.id
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "bg-surface-subtle text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedCities.length === 0 ? (
            /* Empty State before City Selection */
            <Card className="border-border bg-surface text-center p-8">
              <CardContent className="space-y-3 p-0 flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-surface-subtle border border-border flex items-center justify-center text-muted-foreground">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  No destinations selected
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
                  Type and select multiple destinations in the &quot;Places You&apos;re
                  Visiting&quot; field on the left to reveal curated highlights for your
                  itinerary.
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
          ) : displayedActivities.length === 0 ? (
            <Card className="border-border bg-surface text-center p-6">
              <p className="text-xs text-muted-foreground">
                No predefined activity cards available for the selected destinations yet. You can add
                custom activities in the Itinerary Builder.
              </p>
            </Card>
          ) : (
            /* Curated Suggestions Grid */
            <MotionStaggerContainer staggerDelay={0.05} className="space-y-3">
              {displayedActivities.map((act) => (
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
                          {act.cost === 0 ? "Free" : `₹${act.cost}`}
                        </span>
                        {act.durationMinutes && (
                          <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5 justify-end mt-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {Math.floor(act.durationMinutes / 60)}h{" "}
                            {act.durationMinutes % 60
                              ? `${act.durationMinutes % 60}m`
                              : ""}
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
        <div className="max-w-6xl mx-auto p-8 space-y-4">
          <div className="h-10 w-1/3 bg-surface-elevated rounded animate-pulse" />
          <div className="h-64 bg-surface rounded-[16px] animate-pulse" />
        </div>
      }
    >
      <CreateTripForm />
    </React.Suspense>
  );
}
