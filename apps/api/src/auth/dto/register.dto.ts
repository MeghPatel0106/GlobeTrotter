import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from "class-validator";

export class RegisterDto {
  @IsNotEmpty({ message: "First name is required." })
  @IsString({ message: "First name must be a text value." })
  @MaxLength(60, { message: "First name cannot exceed 60 characters." })
  firstName!: string;

  @IsNotEmpty({ message: "Last name is required." })
  @IsString({ message: "Last name must be a text value." })
  @MaxLength(60, { message: "Last name cannot exceed 60 characters." })
  lastName!: string;

  @IsNotEmpty({ message: "Username is required." })
  @IsString({ message: "Username must be a text value." })
  @MinLength(3, { message: "Username must be at least 3 characters." })
  @MaxLength(30, { message: "Username cannot exceed 30 characters." })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: "Username can only contain letters, numbers, underscores, and hyphens.",
  })
  username!: string;

  @IsNotEmpty({ message: "Email is required." })
  @IsEmail({}, { message: "Enter a valid email address." })
  email!: string;

  @IsNotEmpty({ message: "Password is required." })
  @IsString({ message: "Password must be a string." })
  @MinLength(8, { message: "Password must be at least 8 characters long." })
  password!: string;

  @IsOptional()
  @IsString({ message: "Phone number must be a text value." })
  phone?: string;

  @IsOptional()
  @IsString({ message: "City must be a text value." })
  city?: string;

  @IsOptional()
  @IsString({ message: "Country must be a text value." })
  country?: string;

  @IsOptional()
  @IsString({ message: "Photo URL must be a valid string." })
  photoUrl?: string;

  @IsOptional()
  @IsString({ message: "Additional information must be a text value." })
  @MaxLength(500, { message: "Additional info cannot exceed 500 characters." })
  additionalInfo?: string;
}
