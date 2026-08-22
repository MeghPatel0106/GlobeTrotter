import { z } from "zod";

export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, { message: "Enter your email or username." }),
  password: z
    .string()
    .min(1, { message: "Enter your password." }),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .trim()
      .min(1, { message: "Enter your first name." })
      .max(60, { message: "First name cannot exceed 60 characters." }),
    lastName: z
      .string()
      .trim()
      .min(1, { message: "Enter your last name." })
      .max(60, { message: "Last name cannot exceed 60 characters." }),
    username: z
      .string()
      .trim()
      .min(3, { message: "Username must be at least 3 characters." })
      .max(30, { message: "Username cannot exceed 30 characters." })
      .regex(/^[a-zA-Z0-9_-]+$/, {
        message: "Username can only contain letters, numbers, underscores, and hyphens.",
      }),
    email: z
      .string()
      .trim()
      .email({ message: "Enter a valid email address." }),
    phone: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
    city: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
    country: z
      .string()
      .trim()
      .optional()
      .or(z.literal("")),
    photoUrl: z
      .string()
      .optional()
      .or(z.literal("")),
    additionalInfo: z
      .string()
      .trim()
      .max(500, { message: "Bio cannot exceed 500 characters." })
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters long." }),
    confirmPassword: z
      .string()
      .min(1, { message: "Confirm your password." }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match. Please re-enter.",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const profileUpdateSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(1, { message: "First name is required." })
    .max(60, { message: "First name cannot exceed 60 characters." }),
  lastName: z
    .string()
    .trim()
    .min(1, { message: "Last name is required." })
    .max(60, { message: "Last name cannot exceed 60 characters." }),
  username: z
    .string()
    .trim()
    .min(3, { message: "Username must be at least 3 characters." })
    .max(30, { message: "Username cannot exceed 30 characters." })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message: "Username can only contain letters, numbers, underscores, and hyphens.",
    }),
  email: z
    .string()
    .trim()
    .min(1, { message: "Email is required." })
    .email({ message: "Enter a valid email address." }),
  phone: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .trim()
    .optional()
    .or(z.literal("")),
  photoUrl: z
    .string()
    .optional()
    .or(z.literal("")),
  additionalInfo: z
    .string()
    .trim()
    .max(500, { message: "Bio cannot exceed 500 characters." })
    .optional()
    .or(z.literal("")),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;
