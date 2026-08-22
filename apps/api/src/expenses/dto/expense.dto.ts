import { IsEnum, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ExpenseCategory } from "../../schemas/enums";

export class CreateExpenseDto {
  @IsString()
  @IsOptional()
  tripId?: string;

  @IsString()
  @IsOptional()
  stopId?: string;

  @IsNumber()
  @IsOptional()
  dayNumber?: number;

  @IsEnum(ExpenseCategory, { message: "Invalid expense category" })
  category: ExpenseCategory;

  @IsNumber()
  @Min(0.01, { message: "Amount must be a positive number" })
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateExpenseDto {
  @IsEnum(ExpenseCategory, { message: "Invalid expense category" })
  @IsOptional()
  category?: ExpenseCategory;

  @IsNumber()
  @Min(0.01, { message: "Amount must be a positive number" })
  @IsOptional()
  amount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @IsOptional()
  dayNumber?: number;

  @IsString()
  @IsOptional()
  stopId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
