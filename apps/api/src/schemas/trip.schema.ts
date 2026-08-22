import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { TripStatus, Visibility } from "./enums";

export type TripDocument = Trip & Document;

@Schema({ _id: true, timestamps: true })
export class ItineraryItem {
  id?: string;

  @Prop({ type: Types.ObjectId, ref: "Activity", required: false })
  activityId?: Types.ObjectId;

  @Prop({ required: false })
  activityName?: string;

  @Prop({ required: true, default: 1 })
  dayNumber: number;

  @Prop({ required: false, default: null })
  startTime?: string;

  @Prop({ required: true, default: 0 })
  orderIndex: number;

  @Prop({ required: false, default: null })
  costOverride?: number;
}

export const ItineraryItemSchema = SchemaFactory.createForClass(ItineraryItem);

@Schema({ _id: true, timestamps: true })
export class Stop {
  id?: string;

  @Prop({ type: Types.ObjectId, ref: "City", required: false })
  cityId?: Types.ObjectId;

  @Prop({ required: true })
  cityName: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true, default: 0 })
  orderIndex: number;

  @Prop({ required: false, default: null })
  startDate?: Date;

  @Prop({ required: false, default: null })
  endDate?: Date;

  @Prop({ required: false, default: null })
  sectionBudget?: number;

  @Prop({ required: false, default: null })
  notes?: string;

  @Prop({ type: [ItineraryItemSchema], default: [] })
  itineraryItems: ItineraryItem[];
}

export const StopSchema = SchemaFactory.createForClass(Stop);

@Schema({
  timestamps: true,
  collection: "trips",
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      ret.id = ret._id ? ret._id.toString() : ret.id;
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Trip {
  id?: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, default: null, trim: true })
  description?: string;

  @Prop({ required: false, default: null })
  coverPhotoUrl?: string;

  @Prop({ required: false, default: null })
  startDate?: Date;

  @Prop({ required: false, default: null })
  endDate?: Date;

  @Prop({ type: String, enum: TripStatus, default: TripStatus.DRAFT })
  status: TripStatus;

  @Prop({ type: String, enum: Visibility, default: Visibility.PRIVATE })
  visibility: Visibility;

  @Prop({ required: false, default: null })
  totalBudgetEstimate?: number;

  @Prop({ required: false, type: String })
  shareToken?: string;

  @Prop({ type: Number, default: 0, index: true })
  likesCount?: number;

  @Prop({ type: [{ type: Types.ObjectId, ref: "User" }], default: [] })
  likedBy?: Types.ObjectId[];

  @Prop({ type: [StopSchema], default: [] })
  stops: Stop[];

  @Prop({ required: false, default: null })
  publishedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const TripSchema = SchemaFactory.createForClass(Trip);

TripSchema.index({ userId: 1, createdAt: -1 });
TripSchema.index({ visibility: 1, status: 1 });
TripSchema.index({ visibility: 1, publishedAt: -1 });
TripSchema.index({ visibility: 1, createdAt: -1 });
TripSchema.index({ visibility: 1, likesCount: -1 });
TripSchema.index({ shareToken: 1 }, { unique: true, sparse: true });
