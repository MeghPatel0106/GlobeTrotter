"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Compass, KeyRound, User as UserIcon } from "lucide-react";
import {
  Button,
  Input,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  MotionStaggerContainer,
  MotionFadeRise,
  ErrorShake,
  RouteThreadDecoration,
} from "@globetrotter/ui";
import { loginSchema, LoginFormData } from "@/lib/schemas";
import { useAuth } from "@/lib/auth-context";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const { login, user: currentUser, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // If already authenticated, redirect appropriately
  React.useEffect(() => {
    if (!isAuthLoading && isAuthenticated && currentUser) {
      if (currentUser.role === "ADMIN") {
        router.replace(returnTo && returnTo !== "/dashboard" ? returnTo : "/admin");
      } else {
        router.replace(returnTo || "/dashboard");
      }
    }
  }, [isAuthLoading, isAuthenticated, currentUser, returnTo, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const loggedUser = await login(data);
      if (loggedUser?.role === "ADMIN") {
        toast.success("Welcome back, Administrator! Opening Admin Center...", {
          duration: 2000,
        });
        router.push(returnTo && returnTo !== "/dashboard" ? returnTo : "/admin");
      } else {
        toast.success("Welcome back! Loading your travel logs...", {
          duration: 2000,
        });
        router.push(returnTo || "/dashboard");
      }
    } catch (err: any) {
      const msg =
        err?.message || "Invalid email/username or password. Please try again.";
      setServerError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    toast.info("Password Recovery", {
      description:
        "For security in this demo, please register a new account or sign in with your known credentials.",
    });
  };

  return (
    <ErrorShake trigger={!!serverError} className="w-full max-w-[480px]">
      <Card className="border border-border bg-surface shadow-xl w-full">
        <CardHeader className="space-y-2 pb-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-primary mb-1">
            <Compass className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Open Your Journal
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm max-w-sm mx-auto">
            Log in to continue building your personalized multi-city itineraries
            and route plans.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <CardContent className="space-y-4">
            <MotionStaggerContainer staggerDelay={0.08}>
              {/* Server-level error banner if present */}
              {serverError && (
                <MotionFadeRise className="mb-3">
                  <div
                    className="p-3 rounded-[8px] bg-destructive/10 border border-destructive/40 text-destructive text-xs leading-relaxed"
                    role="alert"
                  >
                    {serverError}
                  </div>
                </MotionFadeRise>
              )}

              {/* Identifier Field (Email or Username) */}
              <MotionFadeRise className="mb-4">
                <Input
                  {...register("identifier")}
                  label="Email or Username"
                  placeholder="e.g. explorer@world.com or wanderlust"
                  autoComplete="username"
                  required
                  error={errors.identifier?.message}
                  leftIcon={<UserIcon className="w-4 h-4" />}
                  disabled={isSubmitting}
                />
              </MotionFadeRise>

              {/* Password Field */}
              <MotionFadeRise className="mb-4">
                <div className="space-y-1">
                  <Input
                    {...register("password")}
                    type="password"
                    label="Password"
                    placeholder="Enter your account password"
                    autoComplete="current-password"
                    isPassword
                    required
                    error={errors.password?.message}
                    leftIcon={<KeyRound className="w-4 h-4" />}
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-primary hover:underline transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded py-1 px-1.5 cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>
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
                  Log in
                </Button>
              </MotionFadeRise>
            </MotionStaggerContainer>
          </CardContent>

          <CardFooter className="flex flex-col gap-2 pt-0 pb-6 text-center border-t border-border mt-2">
            <p className="text-xs text-muted-foreground mt-4">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/register"
                className="font-medium text-primary hover:underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary rounded"
              >
                Create account
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </ErrorShake>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
          <Compass className="w-8 h-8 text-primary animate-spin mb-2" />
          <span className="text-xs font-mono">Opening travel journal...</span>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
