import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { ExpenseCategory } from "./enums";

export type ExpenseDocument = Expense & Document;

@Schema({
  timestamps: true,
  collection: "expenses",
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
export class Expense {
  id?: string;

  @Prop({ type: Types.ObjectId, ref: "Trip", required: true, index: true })
  tripId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: false, default: null })
  stopId?: Types.ObjectId;

  @Prop({ type: String, enum: ExpenseCategory, default: ExpenseCategory.OTHER })
  category: ExpenseCategory;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, default: "USD" })
  currency: string;

  @Prop({ required: false, default: null })
  date?: Date;

  @Prop({ required: false, default: null })
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);

ExpenseSchema.index({ tripId: 1, date: -1 });
