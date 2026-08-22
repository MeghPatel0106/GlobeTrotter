import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import { Trip, TripDocument } from "../schemas/trip.schema";
import { City, CityDocument } from "../schemas/city.schema";
import { CreateTripDto } from "./dto/create-trip.dto";
import { AddStopDto, UpdateStopDto } from "./dto/add-stop.dto";
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
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException("Invalid startDate or endDate format.");
    }

    if (endDate < startDate) {
      throw new BadRequestException("End date cannot be earlier than start date.");
    }

    let coverPhoto = dto.coverPhotoUrl;

    const cityList =
      dto.cities && dto.cities.length > 0
        ? dto.cities
        : dto.cityName && dto.country
        ? [{ cityId: dto.cityId, cityName: dto.cityName, country: dto.country }]
        : [];

    if (cityList.length === 0) {
      throw new BadRequestException("At least one destination city is required.");
    }

    // Try finding cover photo from the first city
    const firstCityId = cityList[0].cityId;
    if (firstCityId && Types.ObjectId.isValid(firstCityId) && !coverPhoto) {
      const city = await this.cityModel.findById(firstCityId).exec();
      if (city?.imageUrl) {
        coverPhoto = city.imageUrl;
      }
    }

    const totalDays = Math.max(
      1,
      Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    );
    const numStops = cityList.length;
    const perStopBudget = Math.round(dto.sectionBudget / numStops);

    const stops = cityList.map((c, idx) => {
      let cityObjectId: Types.ObjectId | undefined = undefined;
      if (c.cityId && Types.ObjectId.isValid(c.cityId)) {
        cityObjectId = new Types.ObjectId(c.cityId);
      }

      // Distribute date ranges evenly across legs
      const startDayOffset = Math.floor((idx * totalDays) / numStops);
      const endDayOffset = Math.min(
        totalDays,
        Math.floor(((idx + 1) * totalDays) / numStops)
      );

      const stopStart = new Date(startDate.getTime() + startDayOffset * 86400000);
      const stopEnd = new Date(startDate.getTime() + Math.max(startDayOffset, endDayOffset) * 86400000);

      return {
        cityId: cityObjectId,
        cityName: c.cityName.trim(),
        country: c.country.trim(),
        orderIndex: idx,
        startDate: stopStart,
        endDate: stopEnd,
        sectionBudget: c.sectionBudget || perStopBudget,
        notes: c.notes || dto.notes || `Destination leg for ${c.cityName}.`,
        itineraryItems: [],
      };
    });

    const citySummary = cityList.map((c) => c.cityName.trim()).join(" → ");
    const defaultDescription =
      cityList.length > 1
        ? `Multi-city expedition across ${citySummary}.`
        : `Expedition to ${cityList[0].cityName}, ${cityList[0].country}.`;

    const newTrip = new this.tripModel({
      userId: new Types.ObjectId(userId),
      name: dto.name.trim(),
      description: dto.description || defaultDescription,
      coverPhotoUrl: coverPhoto || null,
      startDate,
      endDate,
      status: TripStatus.DRAFT,
      visibility: Visibility.PRIVATE,
      totalBudgetEstimate: dto.sectionBudget,
      stops,
    });

    const saved = await newTrip.save();
    return saved;
  }

  async addStop(tripId: string, userId: string, dto: AddStopDto): Promise<Trip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new NotFoundException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    let cityObjectId: Types.ObjectId | undefined = undefined;
    if (dto.cityId && Types.ObjectId.isValid(dto.cityId)) {
      cityObjectId = new Types.ObjectId(dto.cityId);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    const endDate = dto.endDate ? new Date(dto.endDate) : undefined;

    if (startDate && endDate && endDate < startDate) {
      throw new BadRequestException("Section end date cannot be earlier than start date.");
    }

    const nextOrder = trip.stops?.length || 0;

    const newStop = {
      cityId: cityObjectId,
      cityName: dto.cityName.trim(),
      country: dto.country.trim(),
      orderIndex: nextOrder,
      startDate: startDate || trip.startDate,
      endDate: endDate || trip.endDate,
      sectionBudget: dto.sectionBudget ?? null,
      notes: dto.notes || null,
      itineraryItems: [],
    };

    trip.stops.push(newStop as any);

    // Recalculate total budget
    const totalBudget = trip.stops.reduce(
      (sum, s) => sum + (s.sectionBudget || 0),
      0
    );
    if (totalBudget > 0) {
      trip.totalBudgetEstimate = totalBudget;
    }

    const saved = await trip.save();
    return saved;
  }

  async updateStop(
    tripId: string,
    stopId: string,
    userId: string,
    dto: UpdateStopDto
  ): Promise<Trip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new NotFoundException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    const stop =
      (typeof (trip.stops as any).id === "function" ? (trip.stops as any).id(stopId) : null) ||
      trip.stops.find(
        (s: any) => s._id?.toString() === stopId || s.id === stopId
      );
    if (!stop) {
      throw new NotFoundException(`Stop with ID ${stopId} not found in this trip.`);
    }

    if (dto.cityName) stop.cityName = dto.cityName.trim();
    if (dto.country) stop.country = dto.country.trim();
    if (dto.cityId && Types.ObjectId.isValid(dto.cityId)) {
      stop.cityId = new Types.ObjectId(dto.cityId);
    }
    if (dto.startDate) stop.startDate = new Date(dto.startDate);
    if (dto.endDate) stop.endDate = new Date(dto.endDate);
    if (dto.sectionBudget !== undefined) stop.sectionBudget = dto.sectionBudget;
    if (dto.notes !== undefined) stop.notes = dto.notes;

    if (stop.startDate && stop.endDate && stop.endDate < stop.startDate) {
      throw new BadRequestException("Section end date cannot be earlier than start date.");
    }

    // Recalculate total budget
    const totalBudget = trip.stops.reduce(
      (sum, s) => sum + (s.sectionBudget || 0),
      0
    );
    if (totalBudget > 0) {
      trip.totalBudgetEstimate = totalBudget;
    }

    const saved = await trip.save();
    return saved;
  }

  async deleteStop(
    tripId: string,
    stopId: string,
    userId: string
  ): Promise<Trip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new NotFoundException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    const stopIndex = trip.stops.findIndex(
      (s: any) => s._id?.toString() === stopId || s.id === stopId
    );

    if (stopIndex === -1) {
      throw new NotFoundException(`Stop with ID ${stopId} not found.`);
    }

    trip.stops.splice(stopIndex, 1);

    // Re-index remaining stops
    trip.stops.forEach((s, idx) => {
      s.orderIndex = idx;
    });

    // Recalculate total budget
    const totalBudget = trip.stops.reduce(
      (sum, s) => sum + (s.sectionBudget || 0),
      0
    );
    trip.totalBudgetEstimate = totalBudget > 0 ? totalBudget : null;

    const saved = await trip.save();
    return saved;
  }

  async reorderStops(
    tripId: string,
    userId: string,
    stopIds: string[]
  ): Promise<Trip> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new NotFoundException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    const stopMap = new Map<string, any>();
    trip.stops.forEach((s: any) => {
      const id = s._id?.toString() || s.id;
      stopMap.set(id, s);
    });

    const reorderedStops: any[] = [];
    stopIds.forEach((id, index) => {
      const stop = stopMap.get(id);
      if (stop) {
        stop.orderIndex = index;
        reorderedStops.push(stop);
        stopMap.delete(id);
      }
    });

    // Append any remaining stops
    stopMap.forEach((stop) => {
      stop.orderIndex = reorderedStops.length;
      reorderedStops.push(stop);
    });

    trip.stops = reorderedStops as any;
    trip.markModified("stops");
    const saved = await trip.save();
    return saved;
  }

  async updateStopDirect(
    stopId: string,
    userId: string,
    dto: UpdateStopDto
  ): Promise<Trip> {
    const trip = await this.tripModel.findOne({
      $or: [
        { "stops._id": Types.ObjectId.isValid(stopId) ? new Types.ObjectId(stopId) : null },
        { "stops.id": stopId },
      ],
    }).exec();

    if (!trip) {
      throw new NotFoundException(`Stop with ID ${stopId} not found.`);
    }

    return this.updateStop(trip._id.toString(), stopId, userId, dto);
  }

  async deleteStopDirect(stopId: string, userId: string): Promise<Trip> {
    const trip = await this.tripModel.findOne({
      $or: [
        { "stops._id": Types.ObjectId.isValid(stopId) ? new Types.ObjectId(stopId) : null },
        { "stops.id": stopId },
      ],
    }).exec();

    if (!trip) {
      throw new NotFoundException(`Stop with ID ${stopId} not found.`);
    }

    return this.deleteStop(trip._id.toString(), stopId, userId);
  }
}
