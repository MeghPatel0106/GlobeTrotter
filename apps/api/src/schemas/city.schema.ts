import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type CityDocument = City & Document;

@Schema({
  timestamps: true,
  collection: "cities",
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
export class City {
  id?: string;

  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, trim: true, index: true })
  country: string;

  @Prop({ required: false, default: null })
  costIndex?: number;

  @Prop({ required: false, default: null })
  popularityScore?: number;

  @Prop({ required: false, default: null })
  imageUrl?: string;

  @Prop({ required: false, default: null })
  description?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CitySchema = SchemaFactory.createForClass(City);

CitySchema.index({ name: 1, country: 1 });
