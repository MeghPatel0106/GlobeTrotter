import {
  Controller,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { TripsService } from "./trips.service";
import {
  CreateItineraryItemDto,
  UpdateItineraryItemDto,
  ReorderItineraryItemsDto,
} from "./dto/itinerary-item.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("itinerary-items")
export class ItineraryItemsController {
  constructor(private readonly tripsService: TripsService) {}

  @Post()
  async createItem(
    @CurrentUser("id") userId: string,
    @Body() dto: CreateItineraryItemDto
  ) {
    return this.tripsService.addItineraryItem(userId, dto);
  }

  @Patch("reorder")
  async reorderItems(
    @CurrentUser("id") userId: string,
    @Body() dto: ReorderItineraryItemsDto
  ) {
    return this.tripsService.reorderItineraryItems(userId, dto.stopId, dto.itemIds);
  }

  @Patch(":id")
  async updateItem(
    @CurrentUser("id") userId: string,
    @Param("id") itemId: string,
    @Body() dto: UpdateItineraryItemDto
  ) {
    return this.tripsService.updateItineraryItem(userId, itemId, dto);
  }

  @Delete(":id")
  async deleteItem(
    @CurrentUser("id") userId: string,
    @Param("id") itemId: string
  ) {
    return this.tripsService.deleteItineraryItem(userId, itemId);
  }
}
