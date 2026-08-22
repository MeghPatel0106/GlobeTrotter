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
  const returnTo = searchParams.get("returnTo") || "/dashboard";

  const { login } = useAuth();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

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
      await login(data);
      toast.success("Welcome back! Loading your travel logs...", {
        duration: 2000,
      });
      router.push(returnTo);
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
    <ErrorShake trigger={!!serverError}>
      <Card className="border border-slate-500/20 bg-ink-900/95 shadow-2xl backdrop-blur-md">
        <CardHeader className="space-y-2 pb-4 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-brass-500/10 border border-brass-500/30 flex items-center justify-center text-brass-400 mb-1">
            <Compass className="w-6 h-6" />
          </div>
          <CardTitle className="text-2xl font-serif tracking-tight text-parchment-50">
            Open Your Journal
          </CardTitle>
          <CardDescription className="text-slate-400 text-sm max-w-sm mx-auto">
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
                    className="p-3 rounded-[8px] bg-coral-500/10 border border-coral-500/40 text-coral-500 text-xs leading-relaxed"
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
                  <div className="flex justify-end pt-0.5">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-brass-400 hover:text-brass-300 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass-500 rounded cursor-pointer"
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

          <CardFooter className="flex flex-col gap-2 pt-0 pb-6 text-center border-t border-slate-500/10 mt-2">
            <p className="text-xs text-slate-400 mt-4">
              Don&apos;t have an account yet?{" "}
              <Link
                href="/register"
                className="font-medium text-brass-400 hover:text-brass-300 underline underline-offset-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brass-500 rounded"
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
        <div className="flex flex-col items-center justify-center p-8 text-slate-400">
          <Compass className="w-8 h-8 text-brass-400 animate-spin mb-2" />
          <span className="text-xs font-mono">Opening travel journal...</span>
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
