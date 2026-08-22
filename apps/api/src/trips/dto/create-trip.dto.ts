import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsNumber,
  Min,
} from "class-validator";

export class CreateTripDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsString()
  @IsOptional()
  cityId?: string;

  @IsString()
  @IsNotEmpty()
  cityName: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  sectionBudget?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  coverPhotoUrl?: string;
}
