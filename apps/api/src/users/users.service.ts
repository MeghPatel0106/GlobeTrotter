import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        photoUrl: true,
        city: true,
        country: true,
        additionalInfo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user;
  }

  async updateMe(
    userId: string,
    data: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      photoUrl?: string;
      city?: string;
      country?: string;
      additionalInfo?: string;
    }
  ) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.firstName && { firstName: data.firstName.trim() }),
        ...(data.lastName && { lastName: data.lastName.trim() }),
        ...(data.phone !== undefined && { phone: data.phone?.trim() || null }),
        ...(data.photoUrl !== undefined && { photoUrl: data.photoUrl?.trim() || null }),
        ...(data.city !== undefined && { city: data.city?.trim() || null }),
        ...(data.country !== undefined && { country: data.country?.trim() || null }),
        ...(data.additionalInfo !== undefined && { additionalInfo: data.additionalInfo?.trim() || null }),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        email: true,
        phone: true,
        photoUrl: true,
        city: true,
        country: true,
        additionalInfo: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }
}
