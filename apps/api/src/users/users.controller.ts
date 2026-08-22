import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  async getMe(@CurrentUser("id") userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch("me")
  async updateMe(
    @CurrentUser("id") userId: string,
    @Body()
    body: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      photoUrl?: string;
      city?: string;
      country?: string;
      additionalInfo?: string;
    }
  ) {
    return this.usersService.updateMe(userId, body);
  }
}
