import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type ActivityDocument = Activity & Document;

@Schema({
  timestamps: true,
  collection: "activities",
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
export class Activity {
  id?: string;

  @Prop({ type: Types.ObjectId, ref: "City", required: true, index: true })
  cityId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: false, default: null, trim: true })
  category?: string;

  @Prop({ required: false, default: null })
  cost?: number;

  @Prop({ required: false, default: null })
  durationMinutes?: number;

  @Prop({ required: false, default: null })
  description?: string;

  @Prop({ required: false, default: null })
  imageUrl?: string;

  @Prop({ required: false, default: null })
  rating?: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

ActivitySchema.index({ cityId: 1, name: 1 });
