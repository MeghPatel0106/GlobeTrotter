"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Camera,
  Edit3,
  Save,
  X,
  Compass,
  CheckCircle2,
  LogOut,
  AlertCircle,
  Loader2,
  ArrowRight,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  ThemeToggle,
  MotionFadeRise,
} from "@globetrotter/ui";
import { useAuth } from "@/lib/auth-context";
import { usersApi, tripsApi, Trip } from "@/lib/api";
import { profileUpdateSchema, ProfileUpdateFormData } from "@/lib/schemas";

export default function ProfilePage() {
  const router = useRouter();
  const { user, updateUser, logout, isLoading: isAuthLoading } = useAuth();

  const [isEditing, setIsEditing] = React.useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [serverError, setServerError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 1. Fetch User Trips for Planned & Completed sections
  const {
    data: trips = [],
    isLoading: isTripsLoading,
  } = useQuery<Trip[]>({
    queryKey: ["trips", "user-profile"],
    queryFn: () => tripsApi.getUserTrips(50),
    enabled: !!user,
  });

  // Separate trips into Planned (Draft, Planned, Ongoing) and Completed
  const plannedTrips = React.useMemo(() => {
    return trips
      .filter((t) => t.status !== "COMPLETED")
      .slice(0, 3);
  }, [trips]);

  const completedTrips = React.useMemo(() => {
    return trips
      .filter((t) => t.status === "COMPLETED")
      .slice(0, 3);
  }, [trips]);

  // 2. Form Setup
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      username: "",
      email: "",
      phone: "",
      city: "",
      country: "",
      photoUrl: "",
      additionalInfo: "",
    },
  });

  // Sync form values whenever user data changes
  React.useEffect(() => {
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        photoUrl: user.photoUrl || "",
        additionalInfo: user.additionalInfo || "",
      });
    }
  }, [user, reset]);

  // Handle Cancel Edit
  const handleCancelEdit = () => {
    setIsEditing(false);
    setServerError(null);
    if (user) {
      reset({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        username: user.username || "",
        email: user.email || "",
        phone: user.phone || "",
        city: user.city || "",
        country: user.country || "",
        photoUrl: user.photoUrl || "",
        additionalInfo: user.additionalInfo || "",
      });
    }
  };

  // Handle Form Submit
  const onSaveProfile = async (formData: ProfileUpdateFormData) => {
    setServerError(null);
    setIsSaving(true);

    try {
      const updated = await usersApi.updateMe({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone || null,
        city: formData.city || null,
        country: formData.country || null,
        photoUrl: formData.photoUrl || null,
        additionalInfo: formData.additionalInfo || null,
      });

      updateUser(updated);
      setIsEditing(false);
      toast.success("Profile updated.");
    } catch (err: any) {
      const message =
        err?.message || "Failed to update profile. Please verify your details and try again.";
      setServerError(message);
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Profile Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Client-side file size check (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo size exceeds 5MB limit. Please select a smaller image.");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const uploadedUrl = await usersApi.uploadAvatar(file);
      // Persist photo directly
      const updated = await usersApi.updateMe({ photoUrl: uploadedUrl });
      updateUser(updated);
      toast.success("Profile photo updated.");
    } catch (err: any) {
      const msg = err?.message || "Failed to upload photo. Please try again.";
      toast.error(msg);
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isAuthLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto animate-pulse">
        <div className="h-44 w-full bg-surface-elevated rounded-[16px]" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-80 bg-surface-elevated rounded-[16px]" />
          <div className="h-80 bg-surface-elevated rounded-[16px]" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const userInitials =
    (user.firstName?.[0] || "") + (user.lastName?.[0] || "") ||
    user.username?.[0]?.toUpperCase() ||
    "E";

  return (
    <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* 1. Profile Identity Header Banner */}
      <Card className="border border-border bg-surface shadow-xs rounded-[16px] overflow-hidden">
        <div className="h-24 sm:h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-surface-subtle border-b border-border/50 relative">
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              onClick={logout}
              className="text-xs gap-1.5 border-border hover:border-destructive/40 hover:text-destructive min-h-[36px] cursor-pointer"
              aria-label="Log out of session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Log out</span>
            </Button>
          </div>
        </div>

        <CardContent className="px-5 sm:px-8 pb-6 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-16">
            {/* Avatar with Camera Trigger */}
            <div className="flex items-end gap-4">
              <div className="relative group">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-surface bg-surface-elevated flex items-center justify-center text-primary font-bold text-2xl sm:text-3xl shadow-md shrink-0">
                  {user.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.photoUrl}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>{userInitials}</span>
                  )}
                </div>

                {/* Upload Action Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:bg-primary-hover transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  title="Upload profile photo"
                  aria-label="Upload profile photo"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>

              <div className="space-y-0.5 mb-1">
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                    {user.firstName} {user.lastName}
                  </h1>
                  {user.role === "ADMIN" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary border border-primary/30 text-[10px] font-mono font-bold uppercase">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Admin</span>
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm font-mono text-muted-foreground">
                  @{user.username}
                </p>
              </div>
            </div>

            {/* Edit Profile CTA */}
            {!isEditing && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="text-xs gap-1.5 min-h-[40px] cursor-pointer shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </Button>
            )}
          </div>

          {/* User Bio / Location Badges */}
          <div className="mt-5 pt-4 border-t border-border/60 flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-primary" />
              <span>{user.email}</span>
            </span>

            {user.phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-primary" />
                <span>{user.phone}</span>
              </span>
            )}

            {(user.city || user.country) && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>
                  {[user.city, user.country].filter(Boolean).join(", ")}
                </span>
              </span>
            )}
          </div>

          {user.additionalInfo && !isEditing && (
            <p className="mt-3 text-xs text-foreground/90 leading-relaxed bg-surface-subtle p-3 rounded-[10px] border border-border/50">
              {user.additionalInfo}
            </p>
          )}
        </CardContent>
      </Card>

      {/* 2. In-Place Expanding Edit Profile Form */}
      {isEditing && (
        <MotionFadeRise>
          <Card className="border-2 border-primary/40 bg-surface rounded-[16px] shadow-md">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-primary" />
                <span>Edit Profile Details</span>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Update your identity, contact information, and travel biography in MongoDB.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit(onSaveProfile)} noValidate>
              <CardContent className="p-5 sm:p-6 space-y-4">
                {serverError && (
                  <div
                    className="p-3 rounded-[8px] bg-destructive/10 border border-destructive/40 text-destructive text-xs leading-relaxed flex items-center gap-2"
                    role="alert"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{serverError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* First Name */}
                  <Input
                    label="First Name"
                    required
                    placeholder="e.g. Maya"
                    error={errors.firstName?.message}
                    {...register("firstName")}
                  />

                  {/* Last Name */}
                  <Input
                    label="Last Name"
                    required
                    placeholder="e.g. Patel"
                    error={errors.lastName?.message}
                    {...register("lastName")}
                  />

                  {/* Username */}
                  <Input
                    label="Username"
                    required
                    placeholder="e.g. mayatravels"
                    error={errors.username?.message}
                    {...register("username")}
                  />

                  {/* Email */}
                  <Input
                    label="Email Address"
                    required
                    type="email"
                    placeholder="e.g. maya@example.com"
                    error={errors.email?.message}
                    {...register("email")}
                  />

                  {/* Phone */}
                  <Input
                    label="Phone Number (Optional)"
                    placeholder="e.g. +91 98765 43210"
                    error={errors.phone?.message}
                    {...register("phone")}
                  />

                  {/* City */}
                  <Input
                    label="City"
                    placeholder="e.g. Mumbai"
                    error={errors.city?.message}
                    {...register("city")}
                  />

                  {/* Country */}
                  <div className="sm:col-span-2">
                    <Input
                      label="Country"
                      placeholder="e.g. India"
                      error={errors.country?.message}
                      {...register("country")}
                    />
                  </div>

                  {/* Additional Info / Bio */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground">
                      Additional Information / Bio
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share your travel interests, favorite destinations, and dream trips..."
                      className="w-full text-xs rounded-[8px] bg-input-bg border border-input-border text-foreground placeholder:text-muted-foreground p-3 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none"
                      {...register("additionalInfo")}
                    />
                    {errors.additionalInfo && (
                      <p className="text-[11px] text-destructive">
                        {errors.additionalInfo.message}
                      </p>
                    )}
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="text-xs min-h-[38px] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    <span>Cancel</span>
                  </Button>

                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={isSaving}
                    className="text-xs gap-1.5 min-h-[38px] cursor-pointer shadow-xs"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </MotionFadeRise>
      )}

      {/* 3. Trips Sections: Planned & Previous Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Preplanned Trips Section */}
        <Card className="border border-border bg-surface rounded-[16px] shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <Compass className="w-4 h-4 text-primary" />
                  <span>Planned Trips</span>
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Active & upcoming trips
                </CardDescription>
              </div>
              <Link href="/trips/create">
                <Button variant="ghost" size="sm" className="text-xs gap-1 h-8">
                  <Plus className="w-3 h-3" />
                  <span>New</span>
                </Button>
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
            {isTripsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-surface-elevated rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : plannedTrips.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <Compass className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  No planned trips yet — start planning your next journey.
                </p>
                <Link href="/trips/create">
                  <Button variant="secondary" size="sm" className="text-xs mt-2">
                    Plan a Trip
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {plannedTrips.map((t) => {
                  const mainStop = t.stops?.[0];
                  const mainCity = mainStop ? `${mainStop.cityName}, ${mainStop.country}` : "Multi-city Route";
                  const startDateStr = t.startDate
                    ? new Date(t.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "TBD";
                  const endDateStr = t.endDate
                    ? new Date(t.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD";

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-[12px] bg-surface-subtle border border-border flex items-center justify-between gap-3 hover:border-primary/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {t.name}
                          </h4>
                          <span className="px-2 py-0.2 rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-mono uppercase font-bold shrink-0">
                            {t.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-primary shrink-0" />
                            <span className="truncate">{mainCity}</span>
                          </span>
                          <span className="shrink-0">
                            {startDateStr} – {endDateStr}
                          </span>
                        </div>
                      </div>

                      <Link href={`/trips/${t.id}/itinerary`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs gap-1 min-h-[34px] shrink-0 cursor-pointer"
                          aria-label={`View itinerary for ${t.name}`}
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Previous Trips Section */}
        <Card className="border border-border bg-surface rounded-[16px] shadow-xs flex flex-col justify-between">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>Previous Trips</span>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Completed trips and travel history
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 flex-1 flex flex-col justify-center">
            {isTripsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-surface-elevated rounded-[10px] animate-pulse" />
                ))}
              </div>
            ) : completedTrips.length === 0 ? (
              <div className="text-center py-6 space-y-2">
                <CheckCircle2 className="w-8 h-8 text-muted-foreground/60 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  No completed trips yet.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedTrips.map((t) => {
                  const mainStop = t.stops?.[0];
                  const mainCity = mainStop ? `${mainStop.cityName}, ${mainStop.country}` : "Completed Route";
                  const startDateStr = t.startDate
                    ? new Date(t.startDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : "TBD";
                  const endDateStr = t.endDate
                    ? new Date(t.endDate).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "TBD";

                  return (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-[12px] bg-surface-subtle border border-border flex items-center justify-between gap-3 hover:border-success/40 transition-colors"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-foreground truncate">
                            {t.name}
                          </h4>
                          <span className="px-2 py-0.2 rounded-full bg-success/10 text-success border border-success/20 text-[9px] font-mono uppercase font-bold shrink-0">
                            Completed
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-success shrink-0" />
                            <span className="truncate">{mainCity}</span>
                          </span>
                          <span className="shrink-0">
                            {startDateStr} – {endDateStr}
                          </span>
                        </div>
                      </div>

                      <Link href={`/trips/${t.id}/itinerary`}>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="text-xs gap-1 min-h-[34px] shrink-0 cursor-pointer"
                          aria-label={`View itinerary for ${t.name}`}
                        >
                          <span>View</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
