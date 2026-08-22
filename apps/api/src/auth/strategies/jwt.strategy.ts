import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { InjectModel } from "@nestjs/mongoose";
import { Model, isValidObjectId } from "mongoose";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User, UserDocument } from "../../schemas/user.schema";

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET") || "globetrotter_atlas_ink_secret_jwt_access_2026_x89",
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload.sub || !isValidObjectId(payload.sub)) {
      throw new UnauthorizedException("Invalid token identifier.");
    }

    const user = await this.userModel.findById(payload.sub).exec();

    if (!user) {
      throw new UnauthorizedException("User session is invalid or user no longer exists.");
    }

    return user.toJSON();
  }
}
