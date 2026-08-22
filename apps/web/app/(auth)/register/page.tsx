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
} from "lucide-react";
import {
  Button,
  Input,
  Textarea,
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
      const localUrl = URL.createObjectURL(file);
      setPhotoUrl(localUrl);
      setValue("photoUrl", localUrl);
      toast.success("Profile photo selected.");
      return localUrl;
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
        err?.message || "Registration failed. Please check your details and try again.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto py-4 sm:py-6">
      <ErrorShake trigger={!!serverError} className="w-full">
        {/* Page Header (No Card) */}
        <div className="text-center space-y-2 mb-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-2">
            <Compass className="w-6 h-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
            Begin Your Voyage
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Create your explorer profile to plan, customize, and share
            multi-city journeys across the globe.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
          {/* Server Error Notice */}
          {serverError && (
            <div
              className="p-3.5 rounded-[8px] bg-destructive/10 border border-destructive/40 text-destructive text-xs sm:text-sm leading-relaxed"
              role="alert"
            >
              {serverError}
            </div>
          )}

          <MotionStaggerContainer staggerDelay={0.04}>
            {/* Photo Upload Section */}
            <MotionFadeRise className="flex justify-center mb-8">
              <AvatarUpload
                value={photoUrl}
                firstName={firstName}
                lastName={lastName}
                onFileSelect={handleAvatarUpload}
                disabled={isSubmitting}
              />
            </MotionFadeRise>

            {/* Form Grid Sections */}
            <div className="space-y-4">
              {/* Row 1: First Name & Last Name */}
              <MotionFadeRise className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Row 2: Username & Email Address */}
              <MotionFadeRise className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              {/* Row 3: Phone Number & City */}
              <MotionFadeRise className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  {...register("phone")}
                  type="tel"
                  label="Phone Number"
                  placeholder="+91 98765 43210 (optional)"
                  error={errors.phone?.message}
                  leftIcon={<Phone className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
                <Input
                  {...register("city")}
                  label="City"
                  placeholder="e.g. Ahmedabad"
                  error={errors.city?.message}
                  leftIcon={<MapPin className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Row 4: Country */}
              <MotionFadeRise>
                <Input
                  {...register("country")}
                  label="Country"
                  placeholder="e.g. India"
                  error={errors.country?.message}
                  leftIcon={<Globe className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Row 5: Additional Information */}
              <MotionFadeRise>
                <Textarea
                  {...register("additionalInfo")}
                  label="Additional Information / Travel Style"
                  placeholder="Tell us about your travel pace, favorite destinations, or food preferences..."
                  maxLength={500}
                  error={errors.additionalInfo?.message}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Row 6: Password & Confirm Password */}
              <MotionFadeRise className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
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
            </div>

            {/* Route Thread Divider */}
            <MotionFadeRise className="my-6">
              <RouteThreadDecoration />
            </MotionFadeRise>

            {/* Submit Button & Login Link */}
            <MotionFadeRise className="space-y-4">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full h-12 text-base font-semibold"
                isLoading={isSubmitting}
              >
                Create account
              </Button>

              <p className="text-xs sm:text-sm text-muted-foreground text-center pt-2">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-medium text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
                >
                  Log in
                </Link>
              </p>
            </MotionFadeRise>
          </MotionStaggerContainer>
        </form>
      </ErrorShake>
    </div>
  );
}
