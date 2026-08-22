"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Compass,
  Mail,
  User as UserIcon,
  Phone,
  MapPin,
  Globe,
  KeyRound,
  FileText,
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  AvatarUpload,
  MotionStaggerContainer,
  MotionFadeRise,
  ErrorShake,
  RouteThreadDecoration,
} from "@globetrotter/ui";
import { registerSchema, RegisterFormData } from "@/lib/schemas";
import { useAuth } from "@/lib/auth-context";
import { authApi } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [photoUrl, setPhotoUrl] = React.useState<string>("");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      additionalInfo: "",
      password: "",
      confirmPassword: "",
      photoUrl: "",
    },
  });

  const firstName = watch("firstName");
  const lastName = watch("lastName");

  const handleAvatarUpload = async (file: File): Promise<string> => {
    try {
      const url = await authApi.uploadAvatar(file);
      setPhotoUrl(url);
      setValue("photoUrl", url);
      toast.success("Profile photo uploaded.");
      return url;
    } catch {
      toast.error("Avatar upload failed. Using default avatar.");
      throw new Error("Upload failed");
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      await registerUser({
        ...data,
        photoUrl: photoUrl || data.photoUrl,
      });
      toast.success("Welcome aboard, explorer! Account created.", {
        duration: 2500,
      });
      router.push("/dashboard");
    } catch (err: any) {
      const msg =
        err?.message ||
        "Registration failed. Please check your details and try again.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ErrorShake trigger={!!serverError}>
      <Card className="border border-slate-500/20 bg-ink-900 shadow-2xl">
        <CardHeader className="space-y-2 pb-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-brass-500/10 border border-brass-500/30 flex items-center justify-center text-brass-400 mb-1">
            <Compass className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-serif tracking-tight text-parchment-50">
            Begin Your Voyage
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm max-w-sm mx-auto">
            Create your explorer profile to plan, customize, and share
            multi-city journeys across the globe.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            {/* Server Error Notice */}
            {serverError && (
              <div
                className="p-3 rounded-[8px] bg-coral-500/10 border border-coral-500/40 text-coral-500 text-xs leading-relaxed"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <MotionStaggerContainer staggerDelay={0.06}>
              {/* Photo Upload */}
              <MotionFadeRise className="flex justify-center mb-6">
                <AvatarUpload
                  value={photoUrl}
                  firstName={firstName}
                  lastName={lastName}
                  onFileSelect={handleAvatarUpload}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Names row */}
              <MotionFadeRise className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <Input
                  {...register("firstName")}
                  label="First Name"
                  placeholder="e.g. Priya"
                  required
                  error={errors.firstName?.message}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
                <Input
                  {...register("lastName")}
                  label="Last Name"
                  placeholder="e.g. Sharma"
                  required
                  error={errors.lastName?.message}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Username & Email */}
              <MotionFadeRise className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <Input
                  {...register("username")}
                  label="Username"
                  placeholder="e.g. wanderlust"
                  required
                  error={errors.username?.message}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
                <Input
                  {...register("email")}
                  type="email"
                  label="Email Address"
                  placeholder="priya@globetrotter.io"
                  required
                  error={errors.email?.message}
                  leftIcon={<Mail className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Phone */}
              <MotionFadeRise className="mb-3">
                <Input
                  {...register("phone")}
                  type="tel"
                  label="Phone Number"
                  placeholder="+91 98765 43210 (optional)"
                  error={errors.phone?.message}
                  leftIcon={<Phone className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* City & Country */}
              <MotionFadeRise className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                <Input
                  {...register("city")}
                  label="City"
                  placeholder="e.g. Ahmedabad"
                  error={errors.city?.message}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
                <Input
                  {...register("country")}
                  label="Country"
                  placeholder="e.g. India"
                  error={errors.country?.message}
                  leftIcon={<Globe className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Additional Information / Bio */}
              <MotionFadeRise className="mb-3">
                <Textarea
                  {...register("additionalInfo")}
                  label="Additional Information / Travel Style"
                  placeholder="Tell us about your travel pace, favorite destinations, or food preferences..."
                  maxLength={500}
                  error={errors.additionalInfo?.message}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Password & Confirm Password */}
              <MotionFadeRise className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                <Input
                  {...register("password")}
                  type="password"
                  label="Password"
                  placeholder="At least 8 characters"
                  isPassword
                  required
                  error={errors.password?.message}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
                <Input
                  {...register("confirmPassword")}
                  type="password"
                  label="Confirm Password"
                  placeholder="Re-enter password"
                  isPassword
                  required
                  error={errors.confirmPassword?.message}
                  leftIcon={<KeyRound className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Route Thread Divider */}
              <MotionFadeRise className="my-2">
                <RouteThreadDecoration />
              </MotionFadeRise>

              {/* Submit Button */}
              <MotionFadeRise className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  className="w-full"
                  isLoading={isSubmitting}
                >
                  Create account
                </Button>
              </MotionFadeRise>
            </MotionStaggerContainer>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0 pb-6 text-center border-t border-slate-500/10 mt-2">
            <p className="text-xs text-slate-400 mt-4">
              Already have an account?{" "}
              <Link
                href="/login"
                className="font-medium text-brass-400 hover:text-brass-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass-500 rounded"
              >
                Log in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </ErrorShake>
  );
}
