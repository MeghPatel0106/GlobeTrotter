import { IsString, IsOptional, IsNumber, IsNotEmpty } from "class-validator";

export class CreateItineraryItemDto {
  @IsString()
  @IsNotEmpty({ message: "Stop ID is required" })
  stopId: string;

  @IsString()
  @IsOptional()
  activityId?: string;

  @IsString()
  @IsNotEmpty({ message: "Activity name is required" })
  activityName: string;

  @IsNumber()
  @IsOptional()
  dayNumber?: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsNumber()
  @IsOptional()
  costOverride?: number;
}

export class UpdateItineraryItemDto {
  @IsString()
  @IsOptional()
  activityName?: string;

  @IsNumber()
  @IsOptional()
  dayNumber?: number;

  @IsString()
  @IsOptional()
  startTime?: string;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsNumber()
  @IsOptional()
  costOverride?: number;
}

export class ReorderItineraryItemsDto {
  @IsString()
  @IsNotEmpty()
  stopId: string;

  @IsString({ each: true })
  @IsNotEmpty()
  itemIds: string[];
}
