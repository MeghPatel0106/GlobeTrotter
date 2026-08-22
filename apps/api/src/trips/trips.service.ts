import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Trip, TripDocument } from "../schemas/trip.schema";
import { City, CityDocument } from "../schemas/city.schema";
import { CreateTripDto } from "./dto/create-trip.dto";
import { TripStatus, Visibility } from "../schemas/enums";

@Injectable()
export class TripsService {
  constructor(
    @InjectModel(Trip.name) private tripModel: Model<TripDocument>,
    @InjectModel(City.name) private cityModel: Model<CityDocument>
  ) {}

  async getUserTrips(
    userId: string,
    limit = 10,
    sort = "recent"
  ): Promise<Trip[]> {
    const sortOption: any = sort === "recent" ? { createdAt: -1 } : { startDate: 1 };

    return this.tripModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort(sortOption)
      .limit(limit)
      .exec();
  }

  async getTripById(tripId: string, userId?: string): Promise<Trip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new NotFoundException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (
      trip.visibility === Visibility.PRIVATE &&
      userId &&
      trip.userId.toString() !== userId
    ) {
      throw new ForbiddenException("You do not have access to this private trip.");
    }

    return trip;
  }

  async createTrip(userId: string, dto: CreateTripDto): Promise<Trip> {
    let cityObjectId: Types.ObjectId | undefined = undefined;
    let coverPhoto = dto.coverPhotoUrl;

    if (dto.cityId && Types.ObjectId.isValid(dto.cityId)) {
      cityObjectId = new Types.ObjectId(dto.cityId);
      if (!coverPhoto) {
        const city = await this.cityModel.findById(dto.cityId).exec();
        if (city?.imageUrl) {
          coverPhoto = city.imageUrl;
        }
      }
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    const firstStop = {
      cityId: cityObjectId,
      cityName: dto.cityName.trim(),
      country: dto.country.trim(),
      orderIndex: 0,
      startDate,
      endDate,
      sectionBudget: dto.sectionBudget || null,
      notes: dto.notes || null,
      itineraryItems: [],
    };

    const newTrip = new this.tripModel({
      userId: new Types.ObjectId(userId),
      name: dto.name.trim(),
      description: dto.description || `Expedition to ${dto.cityName}, ${dto.country}`,
      coverPhotoUrl: coverPhoto || null,
      startDate,
      endDate,
      status: TripStatus.DRAFT,
      visibility: Visibility.PRIVATE,
      totalBudgetEstimate: dto.sectionBudget || null,
      stops: [firstStop],
    });

    const saved = await newTrip.save();
    return saved;
  }
}
