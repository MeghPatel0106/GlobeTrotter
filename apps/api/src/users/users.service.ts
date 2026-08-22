import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId, Types } from "mongoose";
import { User, UserDocument } from "../schemas/user.schema";

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  username?: string;
  email?: string;
  phone?: string | null;
  photoUrl?: string | null;
  city?: string | null;
  country?: string | null;
  additionalInfo?: string | null;
}

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

  async updateMe(userId: string, data: UpdateUserDto) {
    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException("Invalid user ID.");
    }

    const userObjectId = new Types.ObjectId(userId);
    const currentUser = await this.userModel.findById(userObjectId).exec();
    if (!currentUser) {
      throw new NotFoundException("User not found.");
    }

    const updatePayload: Record<string, any> = {};

    // 1. First Name & Last Name
    if (data.firstName !== undefined) {
      const trimmedFirst = data.firstName.trim();
      if (!trimmedFirst) {
        throw new BadRequestException("First name cannot be empty.");
      }
      updatePayload.firstName = trimmedFirst;
    }

    if (data.lastName !== undefined) {
      const trimmedLast = data.lastName.trim();
      if (!trimmedLast) {
        throw new BadRequestException("Last name cannot be empty.");
      }
      updatePayload.lastName = trimmedLast;
    }

    // 2. Username Uniqueness & Format Validation
    if (data.username !== undefined) {
      const trimmedUsername = data.username.trim().toLowerCase();
      if (trimmedUsername.length < 3 || trimmedUsername.length > 30) {
        throw new BadRequestException("Username must be between 3 and 30 characters.");
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
        throw new BadRequestException(
          "Username can only contain letters, numbers, underscores, and hyphens."
        );
      }

      if (trimmedUsername !== currentUser.username?.toLowerCase()) {
        const existingUser = await this.userModel
          .findOne({
            username: trimmedUsername,
            _id: { $ne: userObjectId },
          })
          .exec();

        if (existingUser) {
          throw new ConflictException("Username is already taken by another explorer.");
        }
        updatePayload.username = trimmedUsername;
      }
    }

    // 3. Email Uniqueness & Format Validation
    if (data.email !== undefined) {
      const trimmedEmail = data.email.trim().toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        throw new BadRequestException("Please enter a valid email address.");
      }

      if (trimmedEmail !== currentUser.email?.toLowerCase()) {
        const existingEmail = await this.userModel
          .findOne({
            email: trimmedEmail,
            _id: { $ne: userObjectId },
          })
          .exec();

        if (existingEmail) {
          throw new ConflictException("Email is already in use by another account.");
        }
        updatePayload.email = trimmedEmail;
      }
    }

    // 4. Optional Contact, Location & Profile Fields
    if (data.phone !== undefined) {
      updatePayload.phone = data.phone?.trim() || null;
    }

    if (data.photoUrl !== undefined) {
      updatePayload.photoUrl = data.photoUrl?.trim() || null;
    }

    if (data.city !== undefined) {
      updatePayload.city = data.city?.trim() || null;
    }

    if (data.country !== undefined) {
      updatePayload.country = data.country?.trim() || null;
    }

    if (data.additionalInfo !== undefined) {
      const trimmedBio = data.additionalInfo?.trim() || null;
      if (trimmedBio && trimmedBio.length > 500) {
        throw new BadRequestException("Additional info cannot exceed 500 characters.");
      }
      updatePayload.additionalInfo = trimmedBio;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(userObjectId, { $set: updatePayload }, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException("User not found.");
    }

    return updatedUser.toJSON();
  }
}
