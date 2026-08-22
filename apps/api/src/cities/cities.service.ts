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

  async getTopCities(limit = 5): Promise<City[]> {
    return this.cityModel
      .find()
      .sort({ popularityScore: -1 })
      .limit(limit)
      .exec();
  }

  async searchCities(query: string, limit = 10): Promise<City[]> {
    if (!query || query.trim().length === 0) {
      return this.cityModel.find().limit(limit).exec();
    }

    const cleanQuery = query.trim();
    const regex = new RegExp(cleanQuery, "i");

    return this.cityModel
      .find({
        $or: [{ name: regex }, { country: regex }],
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
