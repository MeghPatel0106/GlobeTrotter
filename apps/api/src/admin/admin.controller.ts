import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminService } from "./admin.service";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { Role } from "../schemas/enums";

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get("users")
  async getUsers() {
    return this.adminService.getUsers();
  }

  @Get("analytics/summary")
  async getSummary() {
    return this.adminService.getSummary();
  }

  @Get("analytics/cities")
  async getPopularCities(@Query("limit") limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getPopularCities(numLimit);
  }

  @Get("analytics/activities")
  async getPopularActivities(@Query("limit") limit?: string) {
    const numLimit = limit ? parseInt(limit, 10) : 10;
    return this.adminService.getPopularActivities(numLimit);
  }

  @Get("analytics/trends")
  async getTrends() {
    return this.adminService.getTrends();
  }
}
