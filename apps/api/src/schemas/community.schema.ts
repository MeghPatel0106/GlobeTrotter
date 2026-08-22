import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type CommunityPostDocument = CommunityPost & Document;

@Schema({
  timestamps: true,
  collection: "community_posts",
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
export class CommunityPost {
  id?: string;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "Trip", required: false, default: null })
  tripId?: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: false, default: null })
  imageUrl?: string;

  @Prop({ default: 0 })
  likesCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CommunityPostSchema = SchemaFactory.createForClass(CommunityPost);

CommunityPostSchema.index({ userId: 1, createdAt: -1 });

export type CommentDocument = Comment & Document;

@Schema({
  timestamps: true,
  collection: "comments",
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
export class Comment {
  id?: string;

  @Prop({ type: Types.ObjectId, ref: "CommunityPost", required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

export type LikeDocument = Like & Document;

@Schema({
  timestamps: { createdAt: true, updatedAt: false },
  collection: "likes",
})
export class Like {
  @Prop({ type: Types.ObjectId, ref: "CommunityPost", required: true, index: true })
  postId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  createdAt?: Date;
}

export const LikeSchema = SchemaFactory.createForClass(Like);
LikeSchema.index({ postId: 1, userId: 1 }, { unique: true });

export type SharedItineraryDocument = SharedItinerary & Document;

@Schema({
  timestamps: true,
  collection: "shared_itineraries",
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
export class SharedItinerary {
  id?: string;

  @Prop({ type: Types.ObjectId, ref: "Trip", required: true, unique: true, index: true })
  tripId: Types.ObjectId;

  @Prop({ required: true, unique: true, index: true })
  shareToken: string;

  @Prop({ default: true })
  isPublic: boolean;

  @Prop({ default: 0 })
  viewCount: number;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SharedItinerarySchema = SchemaFactory.createForClass(SharedItinerary);

export type SavedDestinationDocument = SavedDestination & Document;

@Schema({
  timestamps: true,
  collection: "saved_destinations",
})
export class SavedDestination {
  @Prop({ type: Types.ObjectId, ref: "User", required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "City", required: true, index: true })
  cityId: Types.ObjectId;

  createdAt?: Date;
}

export const SavedDestinationSchema = SchemaFactory.createForClass(SavedDestination);
SavedDestinationSchema.index({ userId: 1, cityId: 1 }, { unique: true });
