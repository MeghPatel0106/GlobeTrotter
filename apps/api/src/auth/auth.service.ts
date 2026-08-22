import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types, isValidObjectId } from "mongoose";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { User, UserDocument } from "../schemas/user.schema";
import { RefreshToken, RefreshTokenDocument } from "../schemas/refresh-token.schema";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { Role } from "../schemas/enums";

export interface AuthResult {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    phone: string | null;
    photoUrl: string | null;
    city: string | null;
    country: string | null;
    additionalInfo: string | null;
    role: Role;
    createdAt?: Date;
    updatedAt?: Date;
  };
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private formatUser(userDoc: UserDocument): AuthResult["user"] {
    const raw = userDoc.toObject ? userDoc.toObject() : userDoc;
    return {
      id: userDoc._id ? userDoc._id.toString() : (raw.id || ""),
      firstName: raw.firstName,
      lastName: raw.lastName,
      username: raw.username,
      email: raw.email,
      phone: raw.phone || null,
      photoUrl: raw.photoUrl || null,
      city: raw.city || null,
      country: raw.country || null,
      additionalInfo: raw.additionalInfo || null,
      role: raw.role || Role.USER,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  private async generateTokens(user: {
    id?: string;
    _id?: Types.ObjectId | string;
    email: string;
    username: string;
    role: Role;
  }): Promise<{ token: string; refreshToken: string }> {
    const userId = user.id || user._id?.toString() || "";

    const payload = {
      sub: userId,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    const token = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>("JWT_SECRET") ||
        "globetrotter_atlas_ink_secret_jwt_access_2026_x89",
      expiresIn: "15m",
    });

    const rawRefreshToken = crypto.randomBytes(40).toString("hex");
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.refreshTokenModel.create({
      userId: new Types.ObjectId(userId),
      tokenHash,
      expiresAt,
      revoked: false,
    });

    return { token, refreshToken: rawRefreshToken };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.trim();

    // Check for existing user by email
    const existingEmail = await this.userModel.findOne({ email }).exec();
    if (existingEmail) {
      throw new ConflictException("An account with this email address already exists.");
    }

    // Check for existing user by username
    const existingUsername = await this.userModel
      .findOne({ username: new RegExp(`^${username}$`, "i") })
      .exec();
    if (existingUsername) {
      throw new ConflictException("This username is already taken. Please choose another.");
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    // Create user document in MongoDB
    const userDoc = await this.userModel.create({
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      username,
      email,
      phone: dto.phone?.trim() || null,
      passwordHash,
      photoUrl: dto.photoUrl?.trim() || null,
      city: dto.city?.trim() || null,
      country: dto.country?.trim() || null,
      additionalInfo: dto.additionalInfo?.trim() || null,
      role: Role.USER,
    });

    const tokens = await this.generateTokens(userDoc);

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: this.formatUser(userDoc),
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes("@");
    const escaped = identifier.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&");
    const regex = new RegExp(`^${escaped}$`, "i");

    let user = await this.userModel
      .findOne(isEmail ? { email: regex } : { username: regex })
      .exec();

    // Fallback: try the other field if initial check didn't find anything
    if (!user) {
      user = await this.userModel
        .findOne(isEmail ? { username: regex } : { email: regex })
        .exec();
    }

    if (!user) {
      throw new UnauthorizedException("Invalid email/username or password.");
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid email/username or password.");
    }

    const tokens = await this.generateTokens(user);

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: this.formatUser(user),
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ token: string; refreshToken: string }> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.refreshTokenModel
      .findOne({
        tokenHash,
        revoked: false,
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!storedToken) {
      throw new UnauthorizedException("Refresh token is invalid or has expired.");
    }

    const user = await this.userModel.findById(storedToken.userId).exec();
    if (!user) {
      throw new UnauthorizedException("User associated with token no longer exists.");
    }

    // Revoke used token (token rotation)
    await this.refreshTokenModel.updateOne(
      { _id: storedToken._id },
      { $set: { revoked: true } }
    );

    // Generate new token pair
    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<{ message: string }> {
    if (!userId) {
      throw new BadRequestException("User ID is required to log out.");
    }

    if (isValidObjectId(userId)) {
      await this.refreshTokenModel.updateMany(
        {
          userId: new Types.ObjectId(userId),
          revoked: false,
        },
        { $set: { revoked: true } }
      );
    }

    return { message: "Successfully logged out." };
  }
}
