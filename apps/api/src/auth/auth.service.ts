import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";
import { Role } from "@prisma/client";

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
    createdAt: Date;
  };
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }

  private async generateTokens(user: {
    id: string;
    email: string;
    username: string;
    role: Role;
  }): Promise<{ token: string; refreshToken: string }> {
    const payload = {
      sub: user.id,
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

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return { token, refreshToken: rawRefreshToken };
  }

  async register(dto: RegisterDto): Promise<AuthResult> {
    const email = dto.email.toLowerCase().trim();
    const username = dto.username.trim();

    // Check for existing user by email
    const existingEmail = await this.prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      throw new ConflictException("An account with this email address already exists.");
    }

    // Check for existing user by username
    const existingUsername = await this.prisma.user.findUnique({
      where: { username },
    });
    if (existingUsername) {
      throw new ConflictException("This username is already taken. Please choose another.");
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);

    // Create user in database (always defaulting to USER role)
    const user = await this.prisma.user.create({
      data: {
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
      },
    });

    const tokens = await this.generateTokens(user);

    return {
      token: tokens.token,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    const identifier = dto.identifier.trim();
    const isEmail = identifier.includes("@");

    let user = await this.prisma.user.findFirst({
      where: isEmail
        ? { email: { equals: identifier, mode: "insensitive" } }
        : { username: { equals: identifier, mode: "insensitive" } },
    });

    // Fallback: try the other field if initial check didn't find anything
    if (!user) {
      user = await this.prisma.user.findFirst({
        where: isEmail
          ? { username: { equals: identifier, mode: "insensitive" } }
          : { email: { equals: identifier, mode: "insensitive" } },
      });
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
      user: this.sanitizeUser(user),
    };
  }

  async refreshToken(dto: RefreshTokenDto): Promise<{ token: string; refreshToken: string }> {
    const tokenHash = this.hashToken(dto.refreshToken);

    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: true,
      },
    });

    if (!storedToken || !storedToken.user) {
      throw new UnauthorizedException("Refresh token is invalid or has expired.");
    }

    // Revoke used token (token rotation)
    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new token pair
    return this.generateTokens(storedToken.user);
  }

  async logout(userId: string): Promise<{ message: string }> {
    if (!userId) {
      throw new BadRequestException("User ID is required to log out.");
    }

    // Revoke all active refresh tokens for the user
    await this.prisma.refreshToken.updateMany({
      where: {
        userId,
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });

    return { message: "Successfully logged out." };
  }
}
