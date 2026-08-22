import {
  Controller,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from "@nestjs/common";
import { TripsService } from "./trips.service";
import { UpdateStopDto } from "./dto/add-stop.dto";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("stops")
export class StopsController {
  constructor(private readonly tripsService: TripsService) {}

  @Patch(":id")
  async updateStop(
    @CurrentUser("id") userId: string,
    @Param("id") stopId: string,
    @Body() dto: UpdateStopDto
  ) {
    return this.tripsService.updateStopDirect(stopId, userId, dto);
  }

  @Delete(":id")
  async deleteStop(
    @CurrentUser("id") userId: string,
    @Param("id") stopId: string
  ) {
    return this.tripsService.deleteStopDirect(stopId, userId);
  }
}
