import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { City, CityDocument } from "../schemas/city.schema";
import { Activity, ActivityDocument } from "../schemas/activity.schema";

@Injectable()
export class CitiesService {
  private readonly logger = new Logger(CitiesService.name);

  // In-memory cache for external city lists (country -> city names)
  private externalCityCache: Map<string, { cities: string[]; fetchedAt: number }> = new Map();
  private static readonly CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

  constructor(
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>
  ) {}

  async getDistinctCountries(): Promise<string[]> {
    // Merge DB countries with a well-known list to ensure broad coverage
    const dbCountries = await this.cityModel.distinct("country").exec();
    const dbSet = new Set((dbCountries as string[]).map((c) => c));

    // Try fetching from external API for a comprehensive list
    try {
      const res = await fetch(
        "https://countriesnow.space/api/v0.1/countries",
        { signal: AbortSignal.timeout(5000) }
      );
      const json = await res.json();
      if (!json.error && Array.isArray(json.data)) {
        for (const entry of json.data) {
          if (entry.country) dbSet.add(entry.country);
        }
      }
    } catch (e) {
      this.logger.warn("Failed to fetch external country list, using DB only");
    }

    return Array.from(dbSet).sort();
  }

  // Fetch all cities for a country from countriesnow.space (cached)
  private async fetchExternalCities(country: string): Promise<string[]> {
    // Map common abbreviations to full names used by countriesnow API
    const countryAliases: Record<string, string> = {
      usa: "United States",
      us: "United States",
      uk: "United Kingdom",
      uae: "United Arab Emirates",
      "south korea": "Korea South",
      "united arab emirates": "United Arab Emirates",
    };
    const apiCountry = countryAliases[country.toLowerCase()] || country;

    const cacheKey = apiCountry.toLowerCase();
    const cached = this.externalCityCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < CitiesService.CACHE_TTL_MS) {
      return cached.cities;
    }

    try {
      const res = await fetch(
        "https://countriesnow.space/api/v0.1/countries/cities",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ country: apiCountry }),
          signal: AbortSignal.timeout(8000),
        }
      );
      const json = await res.json();
      if (!json.error && Array.isArray(json.data)) {
        const cities = (json.data as string[]).sort();
        this.externalCityCache.set(cacheKey, {
          cities,
          fetchedAt: Date.now(),
        });
        return cities;
      }
    } catch (e) {
      this.logger.warn(`Failed to fetch external cities for ${apiCountry}: ${e}`);
    }
    return [];
  }

  // Search external cities for a country, returning names only
  async searchExternalCities(
    country: string,
    query: string,
    limit = 15
  ): Promise<string[]> {
    const allCities = await this.fetchExternalCities(country);
    if (!query || !query.trim()) {
      return allCities.slice(0, limit);
    }
    const q = query.toLowerCase().trim();
    // Prioritize starts-with matches, then includes matches
    const startsWith: string[] = [];
    const includes: string[] = [];
    for (const city of allCities) {
      const lower = city.toLowerCase();
      if (lower.startsWith(q)) {
        startsWith.push(city);
      } else if (lower.includes(q)) {
        includes.push(city);
      }
      if (startsWith.length + includes.length >= limit * 2) break;
    }
    return [...startsWith, ...includes].slice(0, limit);
  }

  async getTopCities(limit = 24, country?: string): Promise<City[]> {
    const filter = country?.trim()
      ? { country: new RegExp(`^${country.trim()}$`, "i") }
      : {};

    return this.cityModel
      .find(filter)
      .sort({ popularityScore: -1 })
      .limit(limit)
      .exec();
  }

  async searchCities(query: string, limit = 20, country?: string): Promise<City[]> {
    const countryFilter = country?.trim()
      ? { country: new RegExp(`^${country.trim()}$`, "i") }
      : {};

    if (!query || query.trim().length === 0) {
      return this.cityModel
        .find(countryFilter)
        .sort({ popularityScore: -1 })
        .limit(limit)
        .exec();
    }

    const cleanQuery = query.trim();
    const regex = new RegExp(cleanQuery, "i");

    // Common aliases & historical spelling variations
    const aliases: Record<string, string[]> = {
      bombay: ["mumbai"],
      calcutta: ["kolkata"],
      madras: ["chennai"],
      banaras: ["varanasi"],
      kashi: ["varanasi"],
      bangalore: ["bengaluru"],
      amdavad: ["ahmedabad"],
      cochin: ["kochi"],
      mysore: ["mysuru"],
      panjim: ["goa"],
      panaji: ["goa"],
      pondicherry: ["puducherry", "pondicherry"],
      puducherry: ["pondicherry", "puducherry"],
    };

    const lowerQuery = cleanQuery.toLowerCase();
    const aliasMatches = aliases[lowerQuery] || [];
    const aliasRegexes = aliasMatches.map((a) => new RegExp(a, "i"));

    return this.cityModel
      .find({
        ...countryFilter,
        $or: [
          { name: regex },
          { country: regex },
          { description: regex },
          ...aliasRegexes.map((r) => ({ name: r })),
        ],
      })
      .sort({ popularityScore: -1 })
      .limit(limit)
      .exec();
  }

  async getCityById(id: string): Promise<City> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException("Invalid city ID format.");
    }
    const city = await this.cityModel.findById(id).exec();
    if (!city) {
      throw new NotFoundException(`City with ID ${id} not found.`);
    }
    return city;
  }

  async getActivitiesForCity(
    cityId: string,
    top = 20,
    query?: string,
    category?: string,
    maxCost?: number,
    cityName?: string
  ): Promise<Activity[]> {
    let targetCityObjectId: Types.ObjectId | null = null;

    if (Types.ObjectId.isValid(cityId)) {
      targetCityObjectId = new Types.ObjectId(cityId);
    } else if (cityName || cityId) {
      const nameToFind = cityName || cityId;
      const foundCity = await this.cityModel
        .findOne({ name: new RegExp(`^${nameToFind.trim()}$`, "i") })
        .exec();
      if (foundCity) {
        targetCityObjectId = foundCity._id as Types.ObjectId;
      }
    }

    const filter: any = {};

    if (targetCityObjectId) {
      filter.cityId = targetCityObjectId;
    } else if (cityName) {
      // If no city found in DB, return empty array gracefully
      return [];
    }

    if (query && query.trim()) {
      const q = query.trim();
      const regex = new RegExp(q, "i");
      filter.$or = [{ name: regex }, { category: regex }, { description: regex }];
    }

    if (category && category.trim() && category.toLowerCase() !== "all") {
      filter.category = new RegExp(`^${category.trim()}$`, "i");
    }

    if (maxCost !== undefined && !isNaN(maxCost)) {
      filter.cost = { $lte: maxCost };
    }

    return this.activityModel
      .find(filter)
      .sort({ rating: -1 })
      .limit(Number(top) || 20)
      .exec();
  }
}
