/**
 * GlobeTrotter API Client & Token Management
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone: string | null;
  photoUrl: string | null;
  city: string | null;
  country: string | null;
  additionalInfo: string | null;
  role: "USER" | "ADMIN";
  createdAt: string;
}

export interface City {
  id: string;
  name: string;
  country: string;
  costIndex?: number;
  popularityScore?: number;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
}

export interface Activity {
  id: string;
  cityId: string;
  name: string;
  category?: string;
  cost?: number;
  durationMinutes?: number;
  description?: string;
  imageUrl?: string;
  rating?: number;
}

export interface ItineraryItem {
  id?: string;
  activityId?: string;
  activityName?: string;
  dayNumber: number;
  startTime?: string;
  orderIndex: number;
  costOverride?: number;
}

export interface Stop {
  id?: string;
  _id?: string;
  cityId?: string;
  cityName: string;
  country: string;
  orderIndex: number;
  startDate?: string;
  endDate?: string;
  sectionBudget?: number;
  notes?: string;
  itineraryItems: ItineraryItem[];
}

export interface Trip {
  id: string;
  userId: string;
  name: string;
  description?: string;
  coverPhotoUrl?: string;
  startDate?: string;
  endDate?: string;
  status: string;
  visibility: string;
  totalBudgetEstimate?: number;
  shareToken?: string;
  stops: Stop[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTripInput {
  name: string;
  startDate: string;
  endDate: string;
  cities?: Array<{
    cityId?: string;
    cityName: string;
    country: string;
    sectionBudget?: number;
    notes?: string;
    places?: Array<{
      activityId?: string;
      activityName: string;
      cityId?: string;
      cityName?: string;
      costOverride?: number;
    }>;
  }>;
  places?: Array<{
    activityId?: string;
    activityName: string;
    cityId?: string;
    cityName?: string;
    costOverride?: number;
  }>;
  cityId?: string;
  cityName?: string;
  country?: string;
  sectionBudget?: number;
  notes?: string;
  description?: string;
  coverPhotoUrl?: string;
}

export interface AddStopInput {
  cityId?: string;
  cityName: string;
  country: string;
  startDate?: string;
  endDate?: string;
  sectionBudget?: number;
  notes?: string;
  itineraryItems?: Array<{
    id?: string;
    activityId?: string;
    activityName: string;
    dayNumber?: number;
    orderIndex?: number;
    costOverride?: number;
  }>;
}

export interface UpdateStopInput {
  cityId?: string;
  cityName?: string;
  country?: string;
  startDate?: string;
  endDate?: string;
  sectionBudget?: number;
  notes?: string;
  itineraryItems?: Array<{
    id?: string;
    activityId?: string;
    activityName: string;
    dayNumber?: number;
    orderIndex?: number;
    costOverride?: number;
  }>;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

// Token helper methods
export const tokenStorage = {
  getToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("gt_access_token");
  },
  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("gt_refresh_token");
  },
  setTokens: (token: string, refreshToken: string) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("gt_access_token", token);
    localStorage.setItem("gt_refresh_token", refreshToken);
    // Set cookie for Next.js edge middleware
    document.cookie = `gt_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax`;
  },
  clearTokens: () => {
    if (typeof window === "undefined") return;
    localStorage.removeItem("gt_access_token");
    localStorage.removeItem("gt_refresh_token");
    document.cookie = "gt_token=; path=/; max-age=0; SameSite=Lax";
  },
};

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = tokenStorage.getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Session Expiration & Refresh Flow
    if (response.status === 401 && !endpoint.includes("/auth/login") && !endpoint.includes("/auth/refresh")) {
      const refreshToken = tokenStorage.getRefreshToken();
      if (!refreshToken) {
        tokenStorage.clearTokens();
        throw new Error("Session expired. Please log in again.");
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((newToken) => {
          headers.set("Authorization", `Bearer ${newToken}`);
          return fetch(url, { ...options, headers }).then((res) => res.json());
        });
      }

      isRefreshing = true;

      try {
        const refreshRes = await fetch(`${API_BASE}/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!refreshRes.ok) {
          throw new Error("Refresh token expired.");
        }

        const data: { token: string; refreshToken: string } = await refreshRes.json();
        tokenStorage.setTokens(data.token, data.refreshToken);
        processQueue(null, data.token);

        // Retry original request
        headers.set("Authorization", `Bearer ${data.token}`);
        const retryResponse = await fetch(url, {
          ...options,
          headers,
        });
        return retryResponse.json();
      } catch (refreshErr) {
        processQueue(refreshErr as Error, null);
        tokenStorage.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = `/login?returnTo=${encodeURIComponent(window.location.pathname)}`;
        }
        throw new Error("Session expired. Please log in again.");
      } finally {
        isRefreshing = false;
      }
    }

    if (!response.ok) {
      let errorMessage = `Request failed with status ${response.status}`;
      try {
        const errorData: ApiErrorResponse = await response.json();
        if (Array.isArray(errorData.message)) {
          errorMessage = errorData.message.join(". ");
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        errorMessage = response.statusText || errorMessage;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (err: any) {
    throw err;
  }
}

export const authApi = {
  register: (data: any) =>
    apiFetch<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  login: (data: { identifier: string; password: string }) =>
    apiFetch<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  logout: () =>
    apiFetch<{ message: string }>("/auth/logout", {
      method: "POST",
    }),

  getMe: () => apiFetch<User>("/users/me"),

  uploadAvatar: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await apiFetch<{ url: string }>("/uploads/avatar", {
      method: "POST",
      body: formData,
    });

    return res.url;
  },
};

export const citiesApi = {
  getCountries: () => apiFetch<string[]>("/cities/countries"),
  getTop: (limit = 5, country?: string) =>
    apiFetch<City[]>(
      `/cities/top?limit=${limit}${country ? `&country=${encodeURIComponent(country)}` : ""}`
    ),
  search: (query: string, limit = 10, country?: string) =>
    apiFetch<City[]>(
      `/cities/search?q=${encodeURIComponent(query)}&limit=${limit}${
        country ? `&country=${encodeURIComponent(country)}` : ""
      }`
    ),
  searchExternal: (country: string, query: string, limit = 15) =>
    apiFetch<string[]>(
      `/cities/external-search?country=${encodeURIComponent(country)}&q=${encodeURIComponent(query)}&limit=${limit}`
    ),
  getById: (id: string) => apiFetch<City>(`/cities/${id}`),
  getActivities: (
    cityId: string,
    topOrOptions?:
      | number
      | {
          top?: number;
          q?: string;
          category?: string;
          maxCost?: number;
          cityName?: string;
        }
  ) => {
    const params = new URLSearchParams();
    if (typeof topOrOptions === "number") {
      params.set("top", String(topOrOptions));
    } else if (topOrOptions) {
      if (topOrOptions.top) params.set("top", String(topOrOptions.top));
      if (topOrOptions.q) params.set("q", topOrOptions.q);
      if (topOrOptions.category && topOrOptions.category !== "all")
        params.set("category", topOrOptions.category);
      if (topOrOptions.maxCost !== undefined)
        params.set("maxCost", String(topOrOptions.maxCost));
      if (topOrOptions.cityName) params.set("cityName", topOrOptions.cityName);
    }

    const qs = params.toString();
    return apiFetch<Activity[]>(`/cities/${cityId || "query"}/activities${qs ? `?${qs}` : ""}`);
  },
};

export const tripsApi = {
  getUserTrips: (limit = 10, sort = "recent") =>
    apiFetch<Trip[]>(`/trips?limit=${limit}&sort=${sort}`),
  getCalendarTrips: (month?: number, year?: number) =>
    apiFetch<Trip[]>(
      `/trips?limit=100&sort=start_date${month ? `&month=${month}` : ""}${
        year ? `&year=${year}` : ""
      }`
    ),
  getById: (id: string) => apiFetch<Trip>(`/trips/${id}`),
  shareTrip: (tripId: string) =>
    apiFetch<{ shareToken: string; shareUrl: string; trip: Trip }>(
      `/trips/${tripId}/share`,
      { method: "POST" }
    ),
  getPublicTrip: (token: string) =>
    apiFetch<
      Trip & {
        userId?: {
          firstName?: string;
          lastName?: string;
          username?: string;
          photoUrl?: string;
        };
      }
    >(`/trips/share/${token}`),
  copyPublicTrip: (token: string) =>
    apiFetch<Trip>(`/trips/share/${token}/copy`, {
      method: "POST",
    }),
  createTrip: (data: CreateTripInput) =>
    apiFetch<Trip>("/trips", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  addStop: (tripId: string, data: AddStopInput) =>
    apiFetch<Trip>(`/trips/${tripId}/stops`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateStop: (tripId: string, stopId: string, data: UpdateStopInput) =>
    apiFetch<Trip>(`/trips/${tripId}/stops/${stopId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteStop: (tripId: string, stopId: string) =>
    apiFetch<Trip>(`/trips/${tripId}/stops/${stopId}`, {
      method: "DELETE",
    }),
  reorderStops: (tripId: string, stopIds: string[]) =>
    apiFetch<Trip>(`/trips/${tripId}/stops/reorder`, {
      method: "PATCH",
      body: JSON.stringify({ stopIds }),
    }),
};

export const stopsApi = {
  update: (stopId: string, data: UpdateStopInput) =>
    apiFetch<Trip>(`/stops/${stopId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (stopId: string) =>
    apiFetch<Trip>(`/stops/${stopId}`, {
      method: "DELETE",
    }),
};

export interface CreateItineraryItemInput {
  stopId: string;
  activityId?: string;
  activityName: string;
  dayNumber?: number;
  startTime?: string;
  orderIndex?: number;
  costOverride?: number;
}

export interface UpdateItineraryItemInput {
  activityName?: string;
  dayNumber?: number;
  startTime?: string;
  orderIndex?: number;
  costOverride?: number;
}

export const itineraryItemsApi = {
  create: (data: CreateItineraryItemInput) =>
    apiFetch<Trip>("/itinerary-items", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (itemId: string, data: UpdateItineraryItemInput) =>
    apiFetch<Trip>(`/itinerary-items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (itemId: string) =>
    apiFetch<Trip>(`/itinerary-items/${itemId}`, {
      method: "DELETE",
    }),
  reorder: (stopId: string, itemIds: string[]) =>
    apiFetch<Trip>("/itinerary-items/reorder", {
      method: "PATCH",
      body: JSON.stringify({ stopId, itemIds }),
    }),
};

export type ExpenseCategory = "TRANSPORT" | "STAY" | "ACTIVITY" | "MEAL" | "OTHER";

export interface Expense {
  id: string;
  tripId: string;
  stopId?: string;
  dayNumber?: number;
  category: ExpenseCategory;
  amount: number;
  currency: string;
  date?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateExpenseInput {
  tripId?: string;
  stopId?: string;
  dayNumber?: number;
  category: ExpenseCategory;
  amount: number;
  currency?: string;
  date?: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  category?: ExpenseCategory;
  amount?: number;
  currency?: string;
  date?: string;
  dayNumber?: number;
  stopId?: string;
  notes?: string;
}

export const expensesApi = {
  getTripExpenses: (tripId: string) =>
    apiFetch<Expense[]>(`/trips/${tripId}/expenses`),
  create: (tripId: string, data: CreateExpenseInput) =>
    apiFetch<Expense>(`/trips/${tripId}/expenses`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  update: (expenseId: string, data: UpdateExpenseInput) =>
    apiFetch<Expense>(`/expenses/${expenseId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  delete: (expenseId: string) =>
    apiFetch<{ success: boolean; id: string }>(`/expenses/${expenseId}`, {
      method: "DELETE",
    }),
};

/* ==========================================================================
   Admin Analytics API Interfaces & Client
   ========================================================================== */

export interface AdminSummary {
  totalUsers: number;
  totalTrips: number;
  totalPublicTrips: number;
  totalActivitiesPlanned: number;
  totalExpensesRecorded: number;
}

export interface AdminUserItem {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  phone?: string | null;
  photoUrl?: string | null;
  role: "USER" | "ADMIN";
  tripsCount: number;
  createdAt: string;
}

export interface AdminCityStat {
  cityName: string;
  country: string;
  visitCount: number;
  totalBudgetPlanned: number;
}

export interface AdminActivityStat {
  activityName: string;
  category?: string;
  count: number;
  averageCost: number;
}

export interface AdminTrendPoint {
  period: string;
  usersCount: number;
  tripsCount: number;
}

export const adminApi = {
  getSummary: () => apiFetch<AdminSummary>("/admin/analytics/summary"),
  getUsers: () => apiFetch<AdminUserItem[]>("/admin/users"),
  getPopularCities: (limit = 10) =>
    apiFetch<AdminCityStat[]>(`/admin/analytics/cities?limit=${limit}`),
  getPopularActivities: (limit = 10) =>
    apiFetch<AdminActivityStat[]>(`/admin/analytics/activities?limit=${limit}`),
  getTrends: () => apiFetch<AdminTrendPoint[]>("/admin/analytics/trends"),
};

