import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { City, CityDocument } from "../schemas/city.schema";
import { Activity, ActivityDocument } from "../schemas/activity.schema";

@Injectable()
export class CitiesService {
  constructor(
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Activity.name) private activityModel: Model<ActivityDocument>
  ) {}

  async getDistinctCountries(): Promise<string[]> {
    const countries = await this.cityModel.distinct("country").exec();
    return (countries as string[]).sort();
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

  async getActivitiesForCity(cityId: string, top = 6): Promise<Activity[]> {
    if (!Types.ObjectId.isValid(cityId)) {
      throw new NotFoundException("Invalid city ID format.");
    }

    return this.activityModel
      .find({ cityId: new Types.ObjectId(cityId) })
      .sort({ rating: -1 })
      .limit(Number(top) || 6)
      .exec();
  }
}
