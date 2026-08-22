import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Role } from "./enums";

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  collection: "users",
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      delete ret.passwordHash;
      return ret;
    },
  },
  toObject: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  id?: string;

  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, trim: true })
  username: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false, default: null, trim: true })
  phone?: string;

  @Prop({ required: true })
  passwordHash: string;

  @Prop({ required: false, default: null, trim: true })
  photoUrl?: string;

  @Prop({ required: false, default: null, trim: true })
  city?: string;

  @Prop({ required: false, default: null, trim: true })
  country?: string;

  @Prop({ required: false, default: null, trim: true })
  additionalInfo?: string;

  @Prop({ type: String, enum: Role, default: Role.USER })
  role: Role;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
