import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { TripsService } from "./trips.service";
import { CreateTripDto } from "./dto/create-trip.dto";
import { AddStopDto, UpdateStopDto, ReorderStopsDto } from "./dto/add-stop.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { Public } from "../auth/decorators/public.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("trips")
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Public()
  @Get("community/feed")
  async getCommunityFeed(
    @Query("sort") sort?: string,
    @Query("limit") limit?: string,
    @CurrentUser("id") currentUserId?: string
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 20;
    return this.tripsService.getCommunityFeed(sort || "newest", numLimit, currentUserId);
  }

  @Post(":id/like")
  async toggleLike(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string
  ) {
    return this.tripsService.toggleLike(tripId, userId);
  }

  @Public()
  @Get("share/:token")
  async getPublicTrip(@Param("token") token: string) {
    return this.tripsService.getPublicTripByToken(token);
  }

  @Post("share/:token/copy")
  async copyPublicTrip(
    @CurrentUser("id") userId: string,
    @Param("token") token: string
  ) {
    return this.tripsService.copyPublicTrip(userId, token);
  }

  @Post(":id/share")
  async shareTrip(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string
  ) {
    return this.tripsService.generateShareToken(userId, tripId);
  }

  @Post(":id/publish")
  async publishTripToCommunity(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string
  ) {
    return this.tripsService.publishTripToCommunity(userId, tripId);
  }

  @Post(":id/unpublish")
  async unpublishTripFromCommunity(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string
  ) {
    return this.tripsService.unpublishTripFromCommunity(userId, tripId);
  }

  @Get()
  async getUserTrips(
    @CurrentUser("id") userId: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: string,
    @Query("month") month?: string,
    @Query("year") year?: string
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 50;
    const numMonth = month ? parseInt(month, 10) : undefined;
    const numYear = year ? parseInt(year, 10) : undefined;
    return this.tripsService.getUserTrips(userId, numLimit, sort || "recent", numMonth, numYear);
  }

  @Post()
  async createTrip(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateTripDto
  ) {
    return this.tripsService.createTrip(userId, dto);
  }

  @Get(":id")
  async getTripById(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string
  ) {
    return this.tripsService.getTripById(tripId, userId);
  }

  @Delete(":id")
  async deleteTrip(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string
  ) {
    return this.tripsService.deleteTrip(userId, tripId);
  }

  @Post(":id/stops")
  async addStop(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string,
    @Body() dto: AddStopDto
  ) {
    return this.tripsService.addStop(tripId, userId, dto);
  }

  @Put(":id/stops/reorder")
  async reorderStopsPut(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string,
    @Body() dto: ReorderStopsDto
  ) {
    return this.tripsService.reorderStops(tripId, userId, dto.stopIds);
  }

  @Patch(":id/stops/reorder")
  async reorderStopsPatch(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string,
    @Body() dto: ReorderStopsDto
  ) {
    return this.tripsService.reorderStops(tripId, userId, dto.stopIds);
  }

  @Patch(":id/stops/:stopId")
  async updateStop(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string,
    @Param("stopId") stopId: string,
    @Body() dto: UpdateStopDto
  ) {
    return this.tripsService.updateStop(tripId, stopId, userId, dto);
  }

  @Delete(":id/stops/:stopId")
  async deleteStop(
    @CurrentUser("id") userId: string,
    @Param("id") tripId: string,
    @Param("stopId") stopId: string
  ) {
    return this.tripsService.deleteStop(tripId, stopId, userId);
  }
}
