import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  IsArray,
  Min,
} from "class-validator";

export class AddStopDto {
  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsNotEmpty({ message: "Destination city name is required." })
  cityName: string;

  @IsString()
  @IsNotEmpty({ message: "Country is required." })
  country: string;

  @IsDateString({}, { message: "Valid start date is required." })
  @IsNotEmpty({ message: "Start date is required." })
  startDate: string;

  @IsDateString({}, { message: "Valid end date is required." })
  @IsNotEmpty({ message: "End date is required." })
  endDate: string;

  @IsNumber({}, { message: "Section budget must be a number." })
  @IsNotEmpty({ message: "Section budget is required." })
  @Min(1, { message: "Section budget must be greater than 0." })
  sectionBudget: number;

  @IsString()
  @IsNotEmpty({ message: "Section notes and itinerary goals are required." })
  notes: string;
}

export class UpdateStopDto {
  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsOptional()
  cityName?: string;

  @IsString()
  @IsOptional()
  country?: string;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  sectionBudget?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ReorderStopsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  stopIds: string[];
}
