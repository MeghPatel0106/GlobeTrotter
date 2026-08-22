import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class LoginDto {
  @IsNotEmpty({ message: "Enter your email or username." })
  @IsString({ message: "Identifier must be a string." })
  identifier!: string;

  @IsNotEmpty({ message: "Password is required." })
  @IsString({ message: "Password must be a string." })
  @MinLength(1, { message: "Password cannot be empty." })
  password!: string;
}
