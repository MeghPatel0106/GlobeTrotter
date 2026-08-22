import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import * as crypto from "crypto";
import { Trip, TripDocument } from "../schemas/trip.schema";
import { City, CityDocument } from "../schemas/city.schema";
import { Expense, ExpenseDocument } from "../schemas/expense.schema";
import { CreateTripDto } from "./dto/create-trip.dto";
import { AddStopDto, UpdateStopDto } from "./dto/add-stop.dto";
import {
  CreateItineraryItemDto,
  UpdateItineraryItemDto,
  ReorderItineraryItemsDto,
} from "./dto/itinerary-item.dto";
import { TripStatus, Visibility } from "../schemas/enums";

@Injectable()
export class TripsService {
  constructor(
    @InjectModel(Trip.name) private tripModel: Model<TripDocument>,
    @InjectModel(City.name) private cityModel: Model<CityDocument>,
    @InjectModel(Expense.name) private expenseModel: Model<ExpenseDocument>
  ) {}

  async getUserTrips(
    userId: string,
    limit = 50,
    sort = "recent",
    month?: number,
    year?: number
  ): Promise<Trip[]> {
    const query: any = { userId: new Types.ObjectId(userId) };

    if (year && month) {
      const startOfMonth = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endOfMonth = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

      query.$or = [
        {
          startDate: { $lte: endOfMonth },
          endDate: { $gte: startOfMonth },
        },
        {
          startDate: { $gte: startOfMonth, $lte: endOfMonth },
        },
        {
          "stops.startDate": { $lte: endOfMonth },
          "stops.endDate": { $gte: startOfMonth },
        },
      ];
    } else if (year) {
      const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
      const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      query.startDate = { $gte: startOfYear, $lte: endOfYear };
    }

    const sortOption: any = sort === "recent" ? { createdAt: -1 } : { startDate: 1 };

    return this.tripModel
      .find(query)
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

    // Enforce country constraint across all destination legs
    const targetCountry = cityList[0].country.trim().toLowerCase();
    for (let i = 1; i < cityList.length; i++) {
      if (cityList[i].country.trim().toLowerCase() !== targetCountry) {
        throw new BadRequestException(
          `This trip is currently set to ${cityList[0].country}. Choose another ${cityList[0].country} destination.`
        );
      }
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

      // Collect unique places/activities belonging to this stop
      const rawPlaces = (c.places || []).concat(
        (dto.places || []).filter(
          (p) =>
            (p.cityId && c.cityId && p.cityId === c.cityId) ||
            (p.cityName && p.cityName.toLowerCase() === c.cityName.toLowerCase())
        )
      );

      const seenPlaceNames = new Set<string>();
      const stopPlaces = rawPlaces.filter((p) => {
        const key = p.activityName.trim().toLowerCase();
        if (seenPlaceNames.has(key)) return false;
        seenPlaceNames.add(key);
        return true;
      });

      const standardSlots = ["08:30 AM", "11:30 AM", "02:30 PM", "05:30 PM", "07:30 PM"];

      const itineraryItems = stopPlaces.map((p, pIdx) => {
        let actObjectId: Types.ObjectId | undefined = undefined;
        if (p.activityId && Types.ObjectId.isValid(p.activityId)) {
          actObjectId = new Types.ObjectId(p.activityId);
        }

        return {
          activityId: actObjectId,
          activityName: p.activityName.trim(),
          startTime: p.startTime || standardSlots[pIdx % standardSlots.length],
          dayNumber: p.dayNumber || 1,
          orderIndex: p.orderIndex !== undefined ? p.orderIndex : pIdx,
          costOverride: p.costOverride !== undefined ? p.costOverride : null,
        };
      });

      return {
        cityId: cityObjectId,
        cityName: c.cityName.trim(),
        country: c.country.trim(),
        orderIndex: idx,
        startDate: stopStart,
        endDate: stopEnd,
        sectionBudget: c.sectionBudget || perStopBudget,
        notes: c.notes || dto.notes || `Destination leg for ${c.cityName}.`,
        itineraryItems,
      };
    });

    const citySummary = cityList.map((c) => c.cityName.trim()).join(" → ");
    const defaultDescription =
      cityList.length > 1
        ? `Multi-city trip across ${citySummary}.`
        : `Trip to ${cityList[0].cityName}, ${cityList[0].country}.`;

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

    // Enforce country consistency with first stop if present
    if (trip.stops && trip.stops.length > 0) {
      const tripCountry = trip.stops[0].country.trim().toLowerCase();
      const stopCountry = dto.country.trim().toLowerCase();
      if (stopCountry !== tripCountry) {
        throw new BadRequestException(
          `This trip is currently set to ${trip.stops[0].country}. Choose another ${trip.stops[0].country} destination.`
        );
      }
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

    let itineraryItems: any[] = [];
    if (dto.itineraryItems && Array.isArray(dto.itineraryItems)) {
      itineraryItems = dto.itineraryItems.map((item, idx) => {
        let actObjectId: Types.ObjectId | undefined = undefined;
        if (item.activityId && Types.ObjectId.isValid(item.activityId)) {
          actObjectId = new Types.ObjectId(item.activityId);
        }
        return {
          activityId: actObjectId,
          activityName: item.activityName.trim(),
          startTime: item.startTime || null,
          dayNumber: item.dayNumber || 1,
          orderIndex: item.orderIndex !== undefined ? item.orderIndex : idx,
          costOverride: item.costOverride !== undefined ? item.costOverride : null,
        };
      });
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
      itineraryItems,
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

    // Adapt overall trip date range if stop dates extend it
    const allStarts = trip.stops.map((s) => s.startDate).filter(Boolean).map((d) => new Date(d).getTime());
    const allEnds = trip.stops.map((s) => s.endDate).filter(Boolean).map((d) => new Date(d).getTime());
    if (allStarts.length > 0) {
      const minStart = new Date(Math.min(...allStarts));
      if (!trip.startDate || minStart < trip.startDate) {
        trip.startDate = minStart;
      }
    }
    if (allEnds.length > 0) {
      const maxEnd = new Date(Math.max(...allEnds));
      if (!trip.endDate || maxEnd > trip.endDate) {
        trip.endDate = maxEnd;
      }
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
      throw new NotFoundException(`Stop with ID ${stopId} not found.`);
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

    if (dto.itineraryItems !== undefined) {
      stop.itineraryItems = dto.itineraryItems.map((item, idx) => {
        let actObjectId: Types.ObjectId | undefined = undefined;
        if (item.activityId && Types.ObjectId.isValid(item.activityId)) {
          actObjectId = new Types.ObjectId(item.activityId);
        }
        return {
          activityId: actObjectId,
          activityName: item.activityName.trim(),
          startTime: item.startTime || null,
          dayNumber: item.dayNumber || 1,
          orderIndex: item.orderIndex !== undefined ? item.orderIndex : idx,
          costOverride: item.costOverride !== undefined ? item.costOverride : null,
        };
      }) as any;
      trip.markModified("stops");
    }

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

    // Adapt overall trip date range if stop dates extend it
    const allStarts = trip.stops.map((s) => s.startDate).filter(Boolean).map((d) => new Date(d).getTime());
    const allEnds = trip.stops.map((s) => s.endDate).filter(Boolean).map((d) => new Date(d).getTime());
    if (allStarts.length > 0) {
      const minStart = new Date(Math.min(...allStarts));
      if (!trip.startDate || minStart < trip.startDate) {
        trip.startDate = minStart;
      }
    }
    if (allEnds.length > 0) {
      const maxEnd = new Date(Math.max(...allEnds));
      if (!trip.endDate || maxEnd > trip.endDate) {
        trip.endDate = maxEnd;
      }
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

  async addItineraryItem(
    userId: string,
    dto: CreateItineraryItemDto
  ): Promise<Trip> {
    const stopObjectId = Types.ObjectId.isValid(dto.stopId)
      ? new Types.ObjectId(dto.stopId)
      : null;

    const trip = await this.tripModel.findOne({
      $or: [
        { "stops._id": stopObjectId },
        { "stops.id": dto.stopId },
      ],
    }).exec();

    if (!trip) {
      throw new NotFoundException(`Stop with ID ${dto.stopId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    const stop = trip.stops.find(
      (s: any) =>
        (s._id && s._id.toString() === dto.stopId) ||
        s.id === dto.stopId ||
        (stopObjectId && s._id && s._id.equals(stopObjectId))
    );

    if (!stop) {
      throw new NotFoundException(`Stop with ID ${dto.stopId} not found.`);
    }

    const existingItems = stop.itineraryItems || [];

    // Duplicate check
    const isDuplicate = existingItems.some(
      (item) =>
        (item.activityName &&
          item.activityName.trim().toLowerCase() === dto.activityName.trim().toLowerCase()) ||
        (dto.activityId &&
          item.activityId &&
          item.activityId.toString() === dto.activityId)
    );

    if (isDuplicate) {
      throw new ConflictException(
        `Activity "${dto.activityName}" is already added to this destination.`
      );
    }

    let actObjectId: Types.ObjectId | undefined = undefined;
    if (dto.activityId && Types.ObjectId.isValid(dto.activityId)) {
      actObjectId = new Types.ObjectId(dto.activityId);
    }

    const newItem = {
      _id: new Types.ObjectId(),
      activityId: actObjectId,
      activityName: dto.activityName.trim(),
      dayNumber: dto.dayNumber || 1,
      startTime: dto.startTime || "08:30 AM",
      orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : existingItems.length,
      costOverride: dto.costOverride !== undefined ? dto.costOverride : null,
    };

    stop.itineraryItems.push(newItem as any);
    trip.markModified("stops");
    const saved = await trip.save();
    return saved;
  }

  async updateItineraryItem(
    userId: string,
    itemId: string,
    dto: UpdateItineraryItemDto
  ): Promise<Trip> {
    const itemObjectId = Types.ObjectId.isValid(itemId)
      ? new Types.ObjectId(itemId)
      : null;

    const trip = await this.tripModel.findOne({
      $or: [
        { "stops.itineraryItems._id": itemObjectId },
        { "stops.itineraryItems.id": itemId },
      ],
    }).exec();

    if (!trip) {
      throw new NotFoundException(`Itinerary item with ID ${itemId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    let foundItem: any = null;
    for (const stop of trip.stops) {
      if (stop.itineraryItems) {
        foundItem = stop.itineraryItems.find(
          (item: any) =>
            (item._id && item._id.toString() === itemId) ||
            item.id === itemId ||
            (itemObjectId && item._id && item._id.equals(itemObjectId))
        );
        if (foundItem) break;
      }
    }

    if (!foundItem) {
      throw new NotFoundException(`Itinerary item with ID ${itemId} not found.`);
    }

    if (dto.activityName !== undefined) foundItem.activityName = dto.activityName.trim();
    if (dto.dayNumber !== undefined) foundItem.dayNumber = dto.dayNumber;
    if (dto.startTime !== undefined) foundItem.startTime = dto.startTime;
    if (dto.orderIndex !== undefined) foundItem.orderIndex = dto.orderIndex;
    if (dto.costOverride !== undefined) foundItem.costOverride = dto.costOverride;

    trip.markModified("stops");
    const saved = await trip.save();
    return saved;
  }

  async deleteItineraryItem(
    userId: string,
    itemId: string
  ): Promise<Trip> {
    const itemObjectId = Types.ObjectId.isValid(itemId)
      ? new Types.ObjectId(itemId)
      : null;

    const trip = await this.tripModel.findOne({
      $or: [
        { "stops.itineraryItems._id": itemObjectId },
        { "stops.itineraryItems.id": itemId },
      ],
    }).exec();

    if (!trip) {
      throw new NotFoundException(`Itinerary item with ID ${itemId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    let removed = false;
    for (const stop of trip.stops) {
      if (stop.itineraryItems) {
        const initialLen = stop.itineraryItems.length;
        stop.itineraryItems = stop.itineraryItems.filter(
          (item: any) =>
            item._id?.toString() !== itemId &&
            item.id !== itemId &&
            (!itemObjectId || !item._id || !item._id.equals(itemObjectId))
        ) as any;
        if (stop.itineraryItems.length < initialLen) {
          removed = true;
          // Re-index remaining items
          stop.itineraryItems.forEach((it: any, idx: number) => {
            it.orderIndex = idx;
          });
          break;
        }
      }
    }

    if (!removed) {
      throw new NotFoundException(`Itinerary item with ID ${itemId} not found.`);
    }

    trip.markModified("stops");
    const saved = await trip.save();
    return saved;
  }

  async reorderItineraryItems(
    userId: string,
    stopId: string,
    itemIds: string[]
  ): Promise<Trip> {
    const stopObjectId = Types.ObjectId.isValid(stopId)
      ? new Types.ObjectId(stopId)
      : null;

    const trip = await this.tripModel.findOne({
      $or: [
        { "stops._id": stopObjectId },
        { "stops.id": stopId },
      ],
    }).exec();

    if (!trip) {
      throw new NotFoundException(`Stop with ID ${stopId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    const stop = trip.stops.find(
      (s: any) =>
        (s._id && s._id.toString() === stopId) ||
        s.id === stopId ||
        (stopObjectId && s._id && s._id.equals(stopObjectId))
    );

    if (!stop || !stop.itineraryItems) {
      throw new NotFoundException(`Stop with ID ${stopId} not found.`);
    }

    const itemMap = new Map<string, any>();
    stop.itineraryItems.forEach((it: any) => {
      const key = it._id?.toString() || it.id;
      if (key) itemMap.set(key, it);
    });

    const reordered: any[] = [];
    itemIds.forEach((id, idx) => {
      const item = itemMap.get(id);
      if (item) {
        item.orderIndex = idx;
        reordered.push(item);
        itemMap.delete(id);
      }
    });

    // Append any remainder
    itemMap.forEach((item) => {
      item.orderIndex = reordered.length;
      reordered.push(item);
    });

    stop.itineraryItems = reordered as any;
    trip.markModified("stops");
    const saved = await trip.save();
    return saved;
  }

  async generateShareToken(
    userId: string,
    tripId: string
  ): Promise<{ shareToken: string; shareUrl: string; trip: Trip }> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new BadRequestException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to share this trip.");
    }

    if (!trip.shareToken) {
      // Generate clean 24-char hex opaque token
      const token = crypto.randomBytes(12).toString("hex");
      trip.shareToken = token;
    }

    trip.visibility = Visibility.PUBLIC;
    trip.publishedAt = new Date();
    await trip.save();

    return {
      shareToken: trip.shareToken,
      shareUrl: `/share/${trip.shareToken}`,
      trip,
    };
  }

  async publishTripToCommunity(
    userId: string,
    tripId: string
  ): Promise<{ shareToken: string; shareUrl: string; trip: Trip }> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new BadRequestException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to publish this trip.");
    }

    if (!trip.shareToken) {
      trip.shareToken = crypto.randomBytes(12).toString("hex");
    }

    trip.visibility = Visibility.PUBLIC;
    trip.publishedAt = new Date();
    await trip.save();

    return {
      shareToken: trip.shareToken,
      shareUrl: `/share/${trip.shareToken}`,
      trip,
    };
  }

  async unpublishTripFromCommunity(
    userId: string,
    tripId: string
  ): Promise<{ trip: Trip }> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new BadRequestException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to modify this trip.");
    }

    trip.visibility = Visibility.PRIVATE;
    await trip.save();

    return { trip };
  }

  async getPublicTripByToken(shareToken: string): Promise<any> {
    if (!shareToken || shareToken.trim() === "") {
      throw new NotFoundException("This itinerary is no longer available.");
    }

    const trip = await this.tripModel
      .findOne({ shareToken: shareToken.trim(), visibility: Visibility.PUBLIC })
      .populate("userId", "firstName lastName username photoUrl")
      .exec();

    if (!trip) {
      throw new NotFoundException("This itinerary is no longer available.");
    }

    return trip;
  }

  async copyPublicTrip(userId: string, shareToken: string): Promise<Trip> {
    if (!shareToken || shareToken.trim() === "") {
      throw new NotFoundException("This itinerary is no longer available.");
    }

    const sourceTrip = await this.tripModel
      .findOne({ shareToken: shareToken.trim(), visibility: Visibility.PUBLIC })
      .exec();

    if (!sourceTrip) {
      throw new NotFoundException("This itinerary is no longer available.");
    }

    // Clone stops and itinerary items with new ObjectIds
    const clonedStops = (sourceTrip.stops || []).map((stop, sIdx) => ({
      cityId: stop.cityId,
      cityName: stop.cityName,
      country: stop.country,
      orderIndex: stop.orderIndex ?? sIdx,
      startDate: stop.startDate,
      endDate: stop.endDate,
      sectionBudget: stop.sectionBudget,
      notes: stop.notes,
      itineraryItems: (stop.itineraryItems || []).map((item, iIdx) => ({
        activityId: item.activityId,
        activityName: item.activityName,
        dayNumber: item.dayNumber || 1,
        startTime: item.startTime,
        orderIndex: item.orderIndex ?? iIdx,
        costOverride: item.costOverride,
      })),
    }));

    const newTrip = new this.tripModel({
      userId: new Types.ObjectId(userId),
      name: `${sourceTrip.name} (Copy)`,
      description: sourceTrip.description,
      coverPhotoUrl: sourceTrip.coverPhotoUrl,
      startDate: sourceTrip.startDate,
      endDate: sourceTrip.endDate,
      status: TripStatus.PLANNED,
      visibility: Visibility.PRIVATE,
      totalBudgetEstimate: sourceTrip.totalBudgetEstimate,
      stops: clonedStops,
    });

    const saved = await newTrip.save();
    return saved;
  }

  async getCommunityFeed(
    sort: string = "newest",
    limit: number = 20,
    currentUserId?: string
  ): Promise<any[]> {
    const numLimit = Math.max(1, Math.min(limit, 50));
    const sortOption: any =
      sort === "most_liked"
        ? { likesCount: -1, publishedAt: -1, createdAt: -1 }
        : { publishedAt: -1, createdAt: -1 };

    const trips = await this.tripModel
      .find({
        visibility: Visibility.PUBLIC,
        shareToken: { $exists: true, $ne: null },
      })
      .sort(sortOption)
      .limit(numLimit)
      .populate("userId", "firstName lastName username photoUrl")
      .exec();

    return trips.map((trip: any) => {
      const isLiked =
        currentUserId && Array.isArray(trip.likedBy)
          ? trip.likedBy.some((id: any) => id.toString() === currentUserId)
          : false;

      return {
        ...trip.toJSON(),
        userId: trip.userId,
        likesCount: trip.likesCount || 0,
        isLiked: Boolean(isLiked),
      };
    });
  }

  async toggleLike(
    tripId: string,
    userId: string
  ): Promise<{ id: string; likesCount: number; isLiked: boolean }> {
    if (!Types.ObjectId.isValid(tripId) || !Types.ObjectId.isValid(userId)) {
      throw new BadRequestException("Invalid trip or user ID.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    const userObjId = new Types.ObjectId(userId);
    const likedBy = trip.likedBy || [];
    const alreadyLiked = likedBy.some((id) => id.toString() === userId);

    let isLiked = false;
    if (alreadyLiked) {
      trip.likedBy = likedBy.filter((id) => id.toString() !== userId);
      trip.likesCount = Math.max(0, (trip.likesCount || 1) - 1);
      isLiked = false;
    } else {
      trip.likedBy.push(userObjId);
      trip.likesCount = (trip.likesCount || 0) + 1;
      isLiked = true;
    }

    await trip.save();

    return {
      id: tripId,
      likesCount: trip.likesCount || 0,
      isLiked,
    };
  }

  async deleteTrip(
    userId: string,
    tripId: string
  ): Promise<{ success: boolean; message: string; id: string }> {
    if (!Types.ObjectId.isValid(tripId)) {
      throw new BadRequestException("Invalid trip ID format.");
    }

    const trip = await this.tripModel.findById(tripId).exec();
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${tripId} not found.`);
    }

    if (trip.userId.toString() !== userId) {
      throw new ForbiddenException("You do not have permission to delete this trip.");
    }

    // 1. Delete trip from MongoDB
    await this.tripModel.findByIdAndDelete(tripId).exec();

    // 2. Cascade delete all expenses recorded under this trip
    await this.expenseModel.deleteMany({ tripId: new Types.ObjectId(tripId) }).exec();

    return {
      success: true,
      message: "Trip cancelled and permanently deleted from database.",
      id: tripId,
    };
  }
}
