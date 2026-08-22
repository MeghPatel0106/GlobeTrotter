import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { User, UserDocument } from "../schemas/user.schema";

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {}

  async getMe(userId: string) {
    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException("Invalid user ID.");
    }

    const user = await this.userModel.findById(userId).exec();

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user.toJSON();
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
    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException("Invalid user ID.");
    }

    const updatePayload: Record<string, any> = {};
    if (data.firstName !== undefined) updatePayload.firstName = data.firstName.trim();
    if (data.lastName !== undefined) updatePayload.lastName = data.lastName.trim();
    if (data.phone !== undefined) updatePayload.phone = data.phone?.trim() || null;
    if (data.photoUrl !== undefined) updatePayload.photoUrl = data.photoUrl?.trim() || null;
    if (data.city !== undefined) updatePayload.city = data.city?.trim() || null;
    if (data.country !== undefined) updatePayload.country = data.country?.trim() || null;
    if (data.additionalInfo !== undefined) updatePayload.additionalInfo = data.additionalInfo?.trim() || null;

    const user = await this.userModel
      .findByIdAndUpdate(userId, { $set: updatePayload }, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException("User not found.");
    }

    return user.toJSON();
  }
}
