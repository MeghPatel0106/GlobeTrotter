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
  CheckCircle2,
  Globe2,
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
import { getCurrencyForCountry, getCurrencySymbol, formatMoney } from "@/lib/currency";

interface SelectedPlace {
  id: string;
  name: string;
  cityId?: string;
  cityName: string;
  country?: string;
  category?: string;
  rating?: number;
  cost?: number;
  durationMinutes?: number;
  isCustom?: boolean;
}

function CreateTripForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // Initial params if passed from Dashboard
  const initialCityId = searchParams.get("cityId") || "";
  const initialCityName = searchParams.get("cityName") || "";
  const initialCountry = searchParams.get("country") || "";

  // Country selection state (separate dropdown, chosen BEFORE cities)
  const [selectedCountry, setSelectedCountry] = React.useState<string>(initialCountry || "");
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = React.useState(false);
  const [countrySearchText, setCountrySearchText] = React.useState("");
  const countryDropdownRef = React.useRef<HTMLDivElement>(null);
  const countrySearchInputRef = React.useRef<HTMLInputElement>(null);

  // Multi-city destinations state
  const [selectedCities, setSelectedCities] = React.useState<City[]>([]);
  const [cityInputText, setCityInputText] = React.useState("");
  const [isCityDropdownOpen, setIsCityDropdownOpen] = React.useState(false);
  const [isAddingNextCity, setIsAddingNextCity] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Selected activities and custom places state
  const [selectedPlaces, setSelectedPlaces] = React.useState<SelectedPlace[]>([]);
  const [customPlaceText, setCustomPlaceText] = React.useState("");
  const [customPlaceTargetCity, setCustomPlaceTargetCity] = React.useState<string>("");
  const [suggestionFilterText, setSuggestionFilterText] = React.useState("");

  // Auto-fill initial city if coming from a "Plan Trip" link
  React.useEffect(() => {
    if (initialCityName && selectedCities.length === 0) {
      if (initialCountry) setSelectedCountry(initialCountry);
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

  // Click outside to close city dropdown or country dropdown
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCityDropdownOpen(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(e.target as Node)) {
        setIsCountryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch available countries from DB
  const { data: availableCountries = [] } = useQuery({
    queryKey: ["cities", "countries"],
    queryFn: () => citiesApi.getCountries(),
    staleTime: 10 * 60 * 1000,
  });

  // Filtered countries based on user search in the country tab
  const filteredCountries = React.useMemo(() => {
    if (!countrySearchText.trim()) return availableCountries;
    const q = countrySearchText.toLowerCase().trim();
    return availableCountries.filter((c) => c.toLowerCase().includes(q));
  }, [availableCountries, countrySearchText]);

  // Featured / popular countries shown initially
  const popularCountries = React.useMemo(() => {
    const topList = [
      "India",
      "USA",
      "France",
      "Italy",
      "Japan",
      "Spain",
      "United Arab Emirates",
      "Thailand",
      "Indonesia",
      "United Kingdom",
      "Germany",
      "Switzerland",
      "Egypt",
      "Mexico",
    ];
    return availableCountries.filter((c) => topList.includes(c));
  }, [availableCountries]);

  // Live search for cities from our DB (featured, with activities)
  const { data: searchResults = [], isLoading: isSearchLoading } = useQuery({
    queryKey: ["cities", "search", cityInputText, selectedCountry],
    queryFn: () =>
      citiesApi.search(cityInputText.trim(), 8, selectedCountry || undefined),
    enabled: !!selectedCountry && isCityDropdownOpen && cityInputText.trim().length > 0,
    staleTime: 30 * 1000,
  });

  // Live search for cities from external API (comprehensive — any real city in the country)
  const { data: externalCityNames = [], isLoading: isExternalLoading } = useQuery({
    queryKey: ["cities", "external-search", cityInputText, selectedCountry],
    queryFn: () =>
      citiesApi.searchExternal(selectedCountry!, cityInputText.trim(), 15),
    enabled: !!selectedCountry && isCityDropdownOpen && cityInputText.trim().length > 0,
    staleTime: 60 * 1000,
  });

  // Merge: DB cities first, then external cities not already in DB results
  const mergedExternalCities = React.useMemo(() => {
    const dbNames = new Set(searchResults.map((c) => c.name.toLowerCase()));
    const selectedNames = new Set(selectedCities.map((c) => c.name.toLowerCase()));
    return externalCityNames
      .filter((name) => !dbNames.has(name.toLowerCase()) && !selectedNames.has(name.toLowerCase()))
      .slice(0, 10);
  }, [searchResults, externalCityNames, selectedCities]);

  // Top suggestions when search is empty (filtered strictly by selectedCountry)
  const { data: topCities = [] } = useQuery({
    queryKey: ["cities", "top-gateway-suggestions", selectedCountry],
    queryFn: () => citiesApi.getTop(6, selectedCountry || undefined),
    enabled: !!selectedCountry && isCityDropdownOpen && cityInputText.trim().length === 0,
    staleTime: 5 * 60 * 1000,
  });

  // Curated activities for all selected cities (which belong to the same country)
  const { data: multiCityActivities = [], isLoading: isActivitiesLoading } = useQuery({
    queryKey: ["cities", "multi-activities", selectedCities.map((c) => c.id).join(",")],
    queryFn: async () => {
      if (selectedCities.length === 0) return [];
      const validCities = selectedCities.filter((c) => c.id && !c.id.startsWith("temp-"));
      if (validCities.length === 0) return [];
      const promises = validCities.map(async (c) => {
        const list = await citiesApi.getActivities(c.id, 8);
        return list.map((act) => ({
          ...act,
          cityName: c.name,
          country: c.country,
        }));
      });
      const results = await Promise.all(promises);
      return results.flat();
    },
    enabled: selectedCities.length > 0,
    staleTime: 5 * 60 * 1000,
  });

  const createTripCurrency = getCurrencyForCountry(selectedCountry || selectedCities[0]?.country || "India");
  const createTripCurrencySymbol = createTripCurrency.symbol;

  // Toggle country dropdown and auto-focus search input
  const toggleCountryDropdown = () => {
    const next = !isCountryDropdownOpen;
    setIsCountryDropdownOpen(next);
    if (next) {
      setTimeout(() => countrySearchInputRef.current?.focus(), 50);
    }
  };

  // Handle changing the country dropdown
  const handleCountryChange = (country: string) => {
    setCountrySearchText("");
    setIsCountryDropdownOpen(false);
    if (country === selectedCountry) return;
    // Reset cities and places when country changes
    setSelectedCities([]);
    setSelectedPlaces([]);
    setSelectedCountry(country);
    setCityInputText("");
    setIsAddingNextCity(false);
    isTripNameCustomized.current = false;
    setTripName("");
    toast.success(`Destination country set to ${country}`);
    setErrors((prev) => {
      const next = { ...prev };
      delete next.country;
      return next;
    });
  };

  // Handle selecting a city from autocomplete
  const handleSelectCity = (city: City) => {
    // Safety check — should never happen since dropdown is already filtered
    if (selectedCountry && city.country.toLowerCase() !== selectedCountry.toLowerCase()) {
      toast.error(
        `This trip is set to ${selectedCountry}. Choose a ${selectedCountry} city.`
      );
      setCityInputText("");
      return;
    }

    const isAlreadySelected = selectedCities.some(
      (c) => c.name.toLowerCase() === city.name.toLowerCase() || (c.id && c.id === city.id)
    );

    if (isAlreadySelected) {
      toast.error(`${city.name} is already in your destination sequence.`);
      setCityInputText("");
      return;
    }

    const updated = [...selectedCities, city];
    setSelectedCities(updated);
    updateTripNameFromCities(updated);
    setCityInputText("");
    setIsCityDropdownOpen(false);
    setIsAddingNextCity(false);

    setErrors((prev) => {
      const next = { ...prev };
      delete next.cities;
      return next;
    });
  };

  // Handle selecting an external city (just a name string from countriesnow API)
  const handleSelectExternalCity = (cityName: string) => {
    const isAlreadySelected = selectedCities.some(
      (c) => c.name.toLowerCase() === cityName.toLowerCase()
    );
    if (isAlreadySelected) {
      toast.error(`${cityName} is already in your destination sequence.`);
      setCityInputText("");
      return;
    }

    const externalCity: City = {
      id: `ext-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: cityName,
      country: selectedCountry || "",
      popularityScore: 0,
      costIndex: 2,
      description: "",
      region: "global",
    } as City;

    const updated = [...selectedCities, externalCity];
    setSelectedCities(updated);
    updateTripNameFromCities(updated);
    setCityInputText("");
    setIsCityDropdownOpen(false);
    setIsAddingNextCity(false);

    setErrors((prev) => {
      const next = { ...prev };
      delete next.cities;
      return next;
    });
  };

  // Handle removing a city (country stays — user changes country separately)
  const handleRemoveCity = (cityToRemove: City, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const updated = selectedCities.filter(
      (c) => c.name.toLowerCase() !== cityToRemove.name.toLowerCase()
    );
    setSelectedCities(updated);
    updateTripNameFromCities(updated);

    // Also remove places associated with this removed city
    setSelectedPlaces((prev) =>
      prev.filter((p) => p.cityName.toLowerCase() !== cityToRemove.name.toLowerCase())
    );
  };

  // Toggle selection of a suggested activity
  const handleTogglePlace = (
    act: Activity & { cityName?: string; country?: string },
    cityName: string,
    cityCountry: string,
    cityId?: string
  ) => {
    const isAlreadySelected = selectedPlaces.some(
      (p) =>
        p.name.toLowerCase() === act.name.toLowerCase() &&
        p.cityName.toLowerCase() === cityName.toLowerCase()
    );

    if (isAlreadySelected) {
      setSelectedPlaces((prev) =>
        prev.filter(
          (p) =>
            !(
              p.name.toLowerCase() === act.name.toLowerCase() &&
              p.cityName.toLowerCase() === cityName.toLowerCase()
            )
        )
      );
      toast.info(`Removed "${act.name}" from ${cityName}`);
    } else {
      const newPlace: SelectedPlace = {
        id: act.id,
        name: act.name,
        cityId: cityId || act.cityId,
        cityName,
        country: cityCountry,
        category: act.category,
        rating: act.rating,
        cost: act.cost,
        durationMinutes: act.durationMinutes,
        isCustom: false,
      };
      setSelectedPlaces((prev) => [...prev, newPlace]);
      toast.success(`Added "${act.name}" to ${cityName}!`);
    }
  };

  // Handle adding custom place (constrained to selected country's cities)
  const handleAddCustomPlace = (customName?: string) => {
    const nameToAdd = (customName || customPlaceText).trim();
    if (!nameToAdd) return;

    if (selectedCities.length === 0) {
      toast.error("Please select at least 1 destination city first.");
      return;
    }

    const targetCity =
      selectedCities.find(
        (c) => c.name === customPlaceTargetCity || c.id === customPlaceTargetCity
      ) ||
      (activeSuggestionCityId !== "all"
        ? selectedCities.find((c) => c.id === activeSuggestionCityId)
        : null) ||
      selectedCities[0];

    const isAlreadySelected = selectedPlaces.some(
      (p) =>
        p.name.toLowerCase() === nameToAdd.toLowerCase() &&
        p.cityName.toLowerCase() === targetCity.name.toLowerCase()
    );

    if (isAlreadySelected) {
      toast.error(`"${nameToAdd}" is already in ${targetCity.name}'s places.`);
      return;
    }

    const newCustomPlace: SelectedPlace = {
      id: `custom-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: nameToAdd,
      cityId:
        targetCity.id && !targetCity.id.startsWith("temp-") ? targetCity.id : undefined,
      cityName: targetCity.name,
      country: targetCity.country,
      category: "Custom Place",
      isCustom: true,
    };

    setSelectedPlaces((prev) => [...prev, newCustomPlace]);
    setCustomPlaceText("");
    setSuggestionFilterText("");
    toast.success(`Added "${nameToAdd}" to ${targetCity.name}!`);
  };

  // Handle removing a selected place
  const handleRemovePlace = (placeId: string) => {
    setSelectedPlaces((prev) => prev.filter((p) => p.id !== placeId));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!tripName.trim()) {
      newErrors.tripName = "Trip name is required.";
    }

    if (!selectedCountry) {
      newErrors.country = "Please select a destination country first.";
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
      newErrors.budget = `Target budget is required and must be greater than ${createTripCurrencySymbol}0.`;
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
      const placesPayload = selectedPlaces.map((p, idx) => ({
        activityId: p.isCustom ? undefined : p.id,
        activityName: p.name,
        cityId: p.cityId && !p.cityId.startsWith("temp-") ? p.cityId : undefined,
        cityName: p.cityName,
        costOverride: p.cost,
        orderIndex: idx,
      }));

      const cityListPayload = selectedCities.map((c) => ({
        cityId: c.id && !c.id.startsWith("temp-") ? c.id : undefined,
        cityName: c.name,
        country: c.country,
        places: placesPayload.filter(
          (p) =>
            (p.cityId && c.id && p.cityId === c.id) ||
            p.cityName.toLowerCase() === c.name.toLowerCase()
        ),
      }));

      const payload = {
        name: tripName.trim(),
        startDate,
        endDate,
        cities: cityListPayload,
        places: placesPayload,
        cityId: cityListPayload[0]?.cityId,
        cityName: cityListPayload[0]?.cityName,
        country: cityListPayload[0]?.country,
        sectionBudget: parseFloat(budget),
        notes: notes.trim(),
      };

      const createdTrip = await tripsApi.createTrip(payload);
      toast.success(
        `Expedition created with ${selectedCities.length} leg${
          selectedCities.length === 1 ? "" : "s"
        } in ${selectedCountry}!`,
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
    let list = multiCityActivities;
    if (activeSuggestionCityId !== "all") {
      list = list.filter((a) => a.cityId === activeSuggestionCityId);
    }
    if (suggestionFilterText.trim()) {
      const q = suggestionFilterText.toLowerCase();
      list = list.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          (a.description && a.description.toLowerCase().includes(q)) ||
          (a.category && a.category.toLowerCase().includes(q))
      );
    }
    return list;
  }, [multiCityActivities, activeSuggestionCityId, suggestionFilterText]);

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
          <span>Itinerary Initiation · Select Country → Multi-City Route</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
          Chart a New Voyage
        </h1>
        <p className="text-muted-foreground text-sm sm:text-base mt-1 max-w-2xl">
          Set your journey timeline, choose the destinations for your expedition in sequence, and
          curate places tailored to your destination country.
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
                placeholder="e.g. Grand Tour of Western India or California Roadtrip"
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

            {/* STEP 1: SELECT COUNTRY (separate dropdown with search filter) */}
            <div className="space-y-2 relative" ref={countryDropdownRef}>
              <Label required htmlFor="country-select">
                Destination Country
              </Label>

              <div className="relative">
                <button
                  type="button"
                  id="country-select"
                  onClick={toggleCountryDropdown}
                  disabled={isSubmitting}
                  className={`w-full h-11 px-3.5 rounded-[10px] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                    selectedCountry
                      ? "bg-surface border-primary/40 text-foreground"
                      : "bg-input-bg border-input-border text-muted-foreground"
                  } ${errors.country ? "border-destructive" : ""} hover:border-primary/60`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Globe2 className={`w-4 h-4 shrink-0 ${selectedCountry ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-sm truncate ${selectedCountry ? "font-semibold text-foreground" : ""}`}>
                      {selectedCountry || "Select a country to explore..."}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedCountry && (
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        Selected
                      </span>
                    )}
                    <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform duration-150 ${isCountryDropdownOpen ? "rotate-90" : ""}`} />
                  </div>
                </button>

                {/* Country Dropdown List with Search Bar */}
                {isCountryDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 max-h-80 overflow-hidden flex flex-col rounded-[10px] bg-surface border border-border shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    {/* Search Input Header */}
                    <div className="p-2.5 border-b border-border bg-surface-subtle/70 sticky top-0 z-10">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                        <input
                          ref={countrySearchInputRef}
                          type="text"
                          value={countrySearchText}
                          onChange={(e) => setCountrySearchText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              if (filteredCountries.length > 0) {
                                handleCountryChange(filteredCountries[0]);
                              }
                            } else if (e.key === "Escape") {
                              setIsCountryDropdownOpen(false);
                            }
                          }}
                          placeholder="Search destination country (e.g. India, USA, France, Japan)..."
                          className="w-full h-9 pl-9 pr-8 text-xs rounded-[7px] bg-surface border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                        />
                        {countrySearchText && (
                          <button
                            type="button"
                            onClick={() => {
                              setCountrySearchText("");
                              countrySearchInputRef.current?.focus();
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Scrollable list of countries */}
                    <div className="overflow-y-auto max-h-64 divide-y divide-border/60">
                      {availableCountries.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          <span>Loading countries...</span>
                        </div>
                      ) : countrySearchText.trim().length > 0 ? (
                        filteredCountries.length > 0 ? (
                          <div>
                            <div className="px-3.5 py-1.5 bg-surface-subtle/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                              <span>Matching Countries ({filteredCountries.length})</span>
                              <span className="text-[9px] text-primary">Press Enter to select</span>
                            </div>
                            {filteredCountries.map((country) => {
                              const isActive = selectedCountry === country;
                              return (
                                <button
                                  key={country}
                                  type="button"
                                  onClick={() => handleCountryChange(country)}
                                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                                    isActive ? "bg-primary/10 font-semibold" : "hover:bg-surface-hover"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Globe2 className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                    <span className={`text-sm ${isActive ? "font-bold text-primary" : "font-medium text-foreground"}`}>
                                      {country}
                                    </span>
                                  </div>
                                  {isActive && <Check className="w-4 h-4 text-primary" />}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-5 text-center text-xs text-muted-foreground">
                            <p>No countries found matching &quot;{countrySearchText}&quot;.</p>
                            <p className="text-[11px] text-muted-foreground/70 mt-1">Try searching by full country name.</p>
                          </div>
                        )
                      ) : (
                        <div>
                          {/* Popular countries quick list */}
                          {popularCountries.length > 0 && (
                            <div>
                              <div className="px-3.5 py-1.5 bg-surface-subtle/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                                Popular Destinations
                              </div>
                              {popularCountries.map((country) => {
                                const isActive = selectedCountry === country;
                                return (
                                  <button
                                    key={`pop-${country}`}
                                    type="button"
                                    onClick={() => handleCountryChange(country)}
                                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                                      isActive ? "bg-primary/10 font-semibold" : "hover:bg-surface-hover"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <Globe2 className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                      <span className={`text-sm ${isActive ? "font-bold text-primary" : "font-medium text-foreground"}`}>
                                        {country}
                                      </span>
                                    </div>
                                    {isActive && <Check className="w-4 h-4 text-primary" />}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* All countries section */}
                          <div>
                            <div className="px-3.5 py-1.5 bg-surface-subtle/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                              All Countries ({availableCountries.length})
                            </div>
                            {availableCountries.map((country) => {
                              const isActive = selectedCountry === country;
                              return (
                                <button
                                  key={country}
                                  type="button"
                                  onClick={() => handleCountryChange(country)}
                                  className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                                    isActive ? "bg-primary/10 font-semibold" : "hover:bg-surface-hover"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <Globe2 className={`w-4 h-4 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                                    <span className={`text-sm ${isActive ? "font-bold text-primary" : "font-medium text-foreground"}`}>
                                      {country}
                                    </span>
                                  </div>
                                  {isActive && <Check className="w-4 h-4 text-primary" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {errors.country && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.country}</span>
                </p>
              )}
            </div>

            {/* STEP 2: MULTI-CITY DESTINATION SELECTION (only visible after country is selected) */}
            {selectedCountry && (
            <div className="space-y-2 relative" ref={dropdownRef}>
              <Label required htmlFor="places-visiting-input">
                Places You&apos;re Visiting in {selectedCountry}
              </Label>

              {/* City search input (always visible once country is selected) */}
              {(selectedCities.length === 0 || isAddingNextCity) && (
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id="places-visiting-input"
                    autoFocus={isAddingNextCity}
                    type="text"
                    value={cityInputText}
                    onFocus={() => setIsCityDropdownOpen(true)}
                    onChange={(e) => {
                      setCityInputText(e.target.value);
                      setIsCityDropdownOpen(true);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (searchResults.length > 0) {
                          handleSelectCity(searchResults[0]);
                        } else if (mergedExternalCities.length > 0) {
                          handleSelectExternalCity(mergedExternalCities[0]);
                        } else if (cityInputText.trim().length > 0) {
                          handleSelectExternalCity(cityInputText.trim());
                        }
                      }
                    }}
                    placeholder={`Search ${selectedCountry} cities (e.g. ${selectedCountry === "India" ? "Ahmedabad, Mumbai, Jaipur" : selectedCountry === "USA" ? "New York, Chicago, LA" : "type a city name"})...`}
                    leftIcon={<MapPin className="w-4 h-4 text-primary" />}
                    error={errors.cities}
                    disabled={isSubmitting}
                  />

                  {/* Autocomplete Dropdown */}
                  {isCityDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1.5 max-h-72 overflow-y-auto rounded-[10px] bg-surface border border-border shadow-xl z-50 divide-y divide-border/60">
                      {(isSearchLoading || isExternalLoading) && searchResults.length === 0 && mergedExternalCities.length === 0 ? (
                        <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                          <span>Searching {selectedCountry} destinations...</span>
                        </div>
                      ) : cityInputText.trim().length > 0 ? (
                        <>
                          {/* DB results (featured cities with curated activities) */}
                          {searchResults.length > 0 && (
                            <div>
                              <div className="px-3.5 py-1.5 bg-surface-subtle/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                                Featured Destinations
                              </div>
                              {searchResults.map((city) => {
                                const isAlready = selectedCities.some(
                                  (c) => c.name.toLowerCase() === city.name.toLowerCase() || (c.id && c.id === city.id)
                                );
                                return (
                                  <button
                                    key={city.id}
                                    type="button"
                                    onClick={() => handleSelectCity(city)}
                                    className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                                      isAlready ? "bg-primary/10 opacity-70" : "hover:bg-surface-hover"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2.5">
                                      <MapPin className="w-4 h-4 text-primary shrink-0" />
                                      <div>
                                        <span className="font-semibold text-sm text-foreground block">{city.name}</span>
                                        <span className="text-xs text-muted-foreground block">{city.country} · Curated</span>
                                      </div>
                                    </div>
                                    {isAlready ? (
                                      <span className="text-[10px] font-mono text-primary font-semibold px-2 py-0.5 rounded bg-primary/15">Added</span>
                                    ) : (
                                      <span className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1">
                                        <Plus className="w-3 h-3" /><span>Select</span>
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {/* External API results (comprehensive city list) */}
                          {mergedExternalCities.length > 0 && (
                            <div>
                              <div className="px-3.5 py-1.5 bg-surface-subtle/50 text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                                More {selectedCountry} Cities
                              </div>
                              {mergedExternalCities.map((cityName) => (
                                <button
                                  key={cityName}
                                  type="button"
                                  onClick={() => handleSelectExternalCity(cityName)}
                                  className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-surface-hover transition-colors cursor-pointer"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                                    <div>
                                      <span className="font-medium text-sm text-foreground block">{cityName}</span>
                                      <span className="text-xs text-muted-foreground block">{selectedCountry}</span>
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1">
                                    <Plus className="w-3 h-3" /><span>Add</span>
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Loading indicator for external results */}
                          {isExternalLoading && searchResults.length > 0 && (
                            <div className="px-4 py-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                              <Loader2 className="w-3 h-3 animate-spin text-primary" />
                              <span>Loading more cities...</span>
                            </div>
                          )}

                          {/* No results at all — offer to add as custom city */}
                          {searchResults.length === 0 && mergedExternalCities.length === 0 && !isSearchLoading && !isExternalLoading && (
                            <div className="p-3">
                              <p className="text-xs text-muted-foreground text-center mb-2">
                                No cities found matching &quot;{cityInputText}&quot; in {selectedCountry}.
                              </p>
                              <button
                                type="button"
                                onClick={() => handleSelectExternalCity(cityInputText.trim())}
                                className="w-full px-3 py-2 text-left flex items-center gap-2.5 rounded-[8px] border border-dashed border-primary/40 hover:bg-primary/5 transition-colors cursor-pointer"
                              >
                                <Plus className="w-4 h-4 text-primary shrink-0" />
                                <div>
                                  <span className="font-semibold text-sm text-primary block">
                                    Add &quot;{cityInputText.trim()}&quot; as a custom city
                                  </span>
                                  <span className="text-xs text-muted-foreground block">in {selectedCountry}</span>
                                </div>
                              </button>
                            </div>
                          )}

                          {/* Always show custom city option at the bottom when there ARE results */}
                          {(searchResults.length > 0 || mergedExternalCities.length > 0) &&
                            cityInputText.trim().length > 1 &&
                            !selectedCities.some((c) => c.name.toLowerCase() === cityInputText.trim().toLowerCase()) &&
                            !searchResults.some((c) => c.name.toLowerCase() === cityInputText.trim().toLowerCase()) &&
                            !mergedExternalCities.some((n) => n.toLowerCase() === cityInputText.trim().toLowerCase()) && (
                            <button
                              type="button"
                              onClick={() => handleSelectExternalCity(cityInputText.trim())}
                              className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 hover:bg-surface-hover transition-colors cursor-pointer"
                            >
                              <Plus className="w-4 h-4 text-primary shrink-0" />
                              <span className="text-sm text-primary font-medium">
                                Add &quot;{cityInputText.trim()}&quot; as custom city in {selectedCountry}
                              </span>
                            </button>
                          )}
                        </>
                      ) : (
                        <div>
                          <div className="px-3.5 py-2 bg-surface-subtle/50 text-[11px] font-mono text-muted-foreground uppercase tracking-wider">
                            Popular {selectedCountry} Destinations
                          </div>
                          {topCities.map((city) => {
                            const isAlready = selectedCities.some(
                              (c) => c.name.toLowerCase() === city.name.toLowerCase() || (c.id && c.id === city.id)
                            );
                            return (
                              <button
                                key={city.id}
                                type="button"
                                onClick={() => handleSelectCity(city)}
                                className={`w-full px-4 py-2.5 text-left flex items-center justify-between transition-colors cursor-pointer ${
                                  isAlready ? "bg-primary/10 opacity-70" : "hover:bg-surface-hover"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                                  <div>
                                    <span className="font-semibold text-sm text-foreground block">{city.name}</span>
                                    <span className="text-xs text-muted-foreground block">{city.country}</span>
                                  </div>
                                </div>
                                {isAlready ? (
                                  <span className="text-[10px] font-mono text-primary font-semibold px-2 py-0.5 rounded bg-primary/15">Added</span>
                                ) : (
                                  <span className="text-[11px] font-mono text-primary font-semibold flex items-center gap-1">
                                    <Plus className="w-3 h-3" /><span>Select</span>
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cancel button when adding next city */}
                  {isAddingNextCity && selectedCities.length > 0 && (
                    <div className="flex justify-end pt-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingNextCity(false);
                          setCityInputText("");
                          setIsCityDropdownOpen(false);
                        }}
                        className="h-7 px-2.5 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Selected city chips + Add City button */}
              {selectedCities.length > 0 && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {selectedCities.map((city, idx) => (
                    <span
                      key={`${city.name}-${idx}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-surface-elevated border border-primary/30 text-foreground text-xs font-medium shadow-xs animate-in fade-in zoom-in-95 duration-150 select-none"
                    >
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-primary/15 text-primary text-[10px] font-mono font-bold">
                        Leg #{idx + 1}
                      </span>
                      <span className="font-semibold text-foreground">{city.name}</span>
                      <button
                        type="button"
                        onClick={(e) => handleRemoveCity(city, e)}
                        aria-label={`Remove ${city.name}`}
                        className="p-0.5 rounded hover:bg-destructive/15 hover:text-destructive text-muted-foreground transition-colors cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}

                  {!isAddingNextCity && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setIsAddingNextCity(true);
                        setCityInputText("");
                        setIsCityDropdownOpen(true);
                        setTimeout(() => inputRef.current?.focus(), 50);
                      }}
                      className="h-8 px-3 text-xs gap-1.5 border-dashed border-primary/50 text-primary hover:bg-primary/10 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add City</span>
                    </Button>
                  )}
                </div>
              )}

              {errors.cities && (
                <p className="text-xs text-destructive flex items-center gap-1 mt-1" role="alert">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{errors.cities}</span>
                </p>
              )}
            </div>
            )}

            {/* SELECTED PLACES / ACTIVITIES LIST (Attached to Itinerary) */}
            {selectedPlaces.length > 0 && (
              <div className="space-y-2 p-3.5 rounded-[10px] bg-surface-subtle border border-primary/25 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span>
                      Selected Places & Activities ({selectedPlaces.length})
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    Attached to itinerary
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {selectedPlaces.map((place) => (
                    <span
                      key={place.id}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-surface border border-primary/30 text-foreground text-xs shadow-2xs animate-in fade-in"
                    >
                      <Check className="w-3 h-3 text-primary shrink-0" />
                      <span className="font-medium">{place.name}</span>
                      <span className="text-[10px] font-mono text-primary font-semibold px-1 rounded bg-primary/10">
                        {place.cityName}
                      </span>
                      {place.cost !== undefined && place.cost > 0 && (
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {getCurrencySymbol(selectedCountry)}{place.cost}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemovePlace(place.id)}
                        aria-label={`Remove ${place.name}`}
                        className="p-0.5 rounded hover:bg-destructive/15 hover:text-destructive text-muted-foreground transition-colors cursor-pointer ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

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
                label={`Target Budget (${createTripCurrencySymbol} ${createTripCurrency.code})`}
                placeholder={`e.g. 25000 in ${createTripCurrency.code}`}
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
                  {selectedCities.length || 1} {selectedCities.length === 1 ? "Leg" : "Legs"}
                  {selectedPlaces.length > 0 ? ` · ${selectedPlaces.length} Places` : ""})
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

        {/* RIGHT COLUMN: Route Suggestions & Custom Place Entry */}
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
                  Search and select destinations in &quot;Places You&apos;re Visiting&quot; on
                  the left to reveal selectable curated places and add custom sights.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3.5">
              {/* Search / Filter & Custom Place Entry Box */}
              <div className="p-3 rounded-[10px] bg-surface border border-border space-y-2.5">
                <div className="relative">
                  <Input
                    type="text"
                    value={suggestionFilterText}
                    onChange={(e) => setSuggestionFilterText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (suggestionFilterText.trim()) {
                          handleAddCustomPlace(suggestionFilterText.trim());
                        }
                      }
                    }}
                    placeholder={`Search places in ${selectedCountry || "destinations"}...`}
                    leftIcon={<Search className="w-3.5 h-3.5 text-muted-foreground" />}
                    className="text-xs h-9"
                  />
                </div>

                {/* Custom place addition row */}
                <div className="flex items-center gap-2 pt-0.5">
                  {selectedCities.length > 1 && (
                    <select
                      value={customPlaceTargetCity || (activeSuggestionCityId !== "all" ? activeSuggestionCityId : selectedCities[0]?.id)}
                      onChange={(e) => setCustomPlaceTargetCity(e.target.value)}
                      className="h-8 px-2 rounded-[6px] bg-surface-subtle border border-border text-[11px] text-foreground focus:outline-none focus:border-primary"
                    >
                      {selectedCities.map((c) => (
                        <option key={c.id} value={c.id}>
                          Add to {c.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => handleAddCustomPlace()}
                    disabled={!suggestionFilterText.trim() && !customPlaceText.trim()}
                    className="h-8 text-xs gap-1 flex-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5 text-primary" />
                    <span>
                      Add &quot;{suggestionFilterText.trim() || customPlaceText.trim() || "Place"}&quot; as Custom Sight
                    </span>
                  </Button>
                </div>
              </div>

              {/* Suggestions List */}
              {isActivitiesLoading ? (
                /* Loading State */
                <div className="space-y-2.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="h-20 rounded-[10px] bg-surface-subtle border border-border animate-pulse p-3 space-y-2"
                    >
                      <div className="h-3 w-1/3 bg-surface-elevated rounded" />
                      <div className="h-4 w-3/4 bg-surface-elevated rounded" />
                    </div>
                  ))}
                </div>
              ) : displayedActivities.length === 0 ? (
                <Card className="border-border bg-surface text-center p-6 space-y-3">
                  <p className="text-xs text-muted-foreground">
                    No suggestions matching &quot;{suggestionFilterText}&quot;.
                  </p>
                  {suggestionFilterText.trim() && (
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={() => handleAddCustomPlace(suggestionFilterText.trim())}
                      className="text-xs gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add &quot;{suggestionFilterText.trim()}&quot; to {selectedCities[0]?.name}</span>
                    </Button>
                  )}
                </Card>
              ) : (
                /* Curated Selectable Suggestions Grid */
                <MotionStaggerContainer staggerDelay={0.04} className="space-y-2.5">
                  {displayedActivities.map((act) => {
                    const cityName = act.cityName || selectedCities[0]?.name || "Destination";
                    const countryName = act.country || selectedCities[0]?.country || "India";
                    const isSelected = selectedPlaces.some(
                      (p) =>
                        p.name.toLowerCase() === act.name.toLowerCase() &&
                        p.cityName.toLowerCase() === cityName.toLowerCase()
                    );

                    return (
                      <MotionFadeRise key={act.id}>
                        <div
                          onClick={() =>
                            handleTogglePlace(act, cityName, countryName, act.cityId)
                          }
                          className={`p-3.5 rounded-[10px] border transition-all cursor-pointer flex flex-col justify-between gap-2 select-none group ${
                            isSelected
                              ? "bg-primary/10 border-primary shadow-xs ring-1 ring-primary/30"
                              : "bg-surface border-border hover:border-primary/40 hover:bg-surface-hover"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-border text-[10px] font-mono text-primary uppercase">
                                  {act.category || "Highlight"}
                                </span>
                                {selectedCities.length > 1 && (
                                  <span className="text-[10px] font-mono text-muted-foreground font-semibold">
                                    📍 {cityName}
                                  </span>
                                )}
                                {act.rating && (
                                  <span className="flex items-center gap-0.5 text-[11px] font-mono text-primary font-bold">
                                    <Star className="w-3 h-3 fill-primary text-primary" />
                                    {act.rating}
                                  </span>
                                )}
                              </div>
                              <h3
                                className={`font-semibold text-sm leading-snug line-clamp-1 transition-colors ${
                                  isSelected
                                    ? "text-primary"
                                    : "text-foreground group-hover:text-primary"
                                }`}
                              >
                                {act.name}
                              </h3>
                            </div>

                            <div className="text-right shrink-0 flex flex-col items-end gap-1">
                              <span className="text-xs font-mono font-bold text-foreground block">
                                {act.cost === 0
                                  ? "Free"
                                  : `${getCurrencySymbol((act as any).country || selectedCountry)}${act.cost}`}
                              </span>
                              {act.durationMinutes && (
                                <span className="text-[10px] font-mono text-muted-foreground flex items-center gap-0.5 justify-end">
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

                          {/* Selection indicator bar */}
                          <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-[11px]">
                            {isSelected ? (
                              <span className="font-semibold text-primary flex items-center gap-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>Selected for {cityName}</span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground group-hover:text-foreground transition-colors flex items-center gap-1">
                                <Plus className="w-3.5 h-3.5 text-primary" />
                                <span>Click to add to {cityName}</span>
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-muted-foreground">
                              {isSelected ? "Click to remove" : "+ Add Place"}
                            </span>
                          </div>
                        </div>
                      </MotionFadeRise>
                    );
                  })}
                </MotionStaggerContainer>
              )}
            </div>
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
