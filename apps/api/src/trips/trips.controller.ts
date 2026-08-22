import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
} from "@nestjs/common";
import { TripsService } from "./trips.service";
import { CreateTripDto } from "./dto/create-trip.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("trips")
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get()
  async getUserTrips(
    @CurrentUser("id") userId: string,
    @Query("limit") limit?: string,
    @Query("sort") sort?: string
  ) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.tripsService.getUserTrips(userId, numLimit, sort || "recent");
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
}
