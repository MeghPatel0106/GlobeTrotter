import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  ValidateNested,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class TripItineraryItemDto {
  @IsString()
  @IsOptional()
  activityId?: string;

  @IsString()
  @IsNotEmpty({ message: "Place or activity name is required." })
  activityName: string;

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsNumber()
  @IsOptional()
  dayNumber?: number;

  @IsNumber()
  @IsOptional()
  orderIndex?: number;

  @IsNumber()
  @IsOptional()
  costOverride?: number;
}

export class TripCityItemDto {
  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsNotEmpty({ message: "City name is required." })
  cityName: string;

  @IsString()
  @IsNotEmpty({ message: "Country is required." })
  country: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sectionBudget?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripItineraryItemDto)
  @IsOptional()
  places?: TripItineraryItemDto[];
}

export class CreateTripDto {
  @IsString()
  @IsNotEmpty({ message: "Trip name is required." })
  name: string;

  @IsDateString({}, { message: "Valid start date is required." })
  @IsNotEmpty({ message: "Start date is required." })
  startDate: string;

  @IsDateString({}, { message: "Valid end date is required." })
  @IsNotEmpty({ message: "End date is required." })
  endDate: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripCityItemDto)
  @IsOptional()
  cities?: TripCityItemDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TripItineraryItemDto)
  @IsOptional()
  places?: TripItineraryItemDto[];

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsNumber({}, { message: "Budget must be a valid number." })
  @IsNotEmpty({ message: "Budget is required." })
  @Min(1, { message: "Budget must be greater than 0." })
  sectionBudget: number;

  @IsString()
  @IsNotEmpty({ message: "Expedition notes / objectives are required." })
  notes: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverPhotoUrl?: string;
}
