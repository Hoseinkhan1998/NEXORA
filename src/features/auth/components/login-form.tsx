"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Eye, EyeOff, Clock, Mail } from "lucide-react";
import { loginAction } from "../actions/login";
import { resendConfirmationAction } from "../actions/resend-confirmation";
import { loginSchema, type LoginInput } from "../schemas/auth";
import { GoogleSignInButton } from "./google-sign-in-button";
import { toast } from "sonner";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get("reason");
  const urlError = searchParams.get("error");

  const [formData, setFormData] = React.useState<LoginInput>({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(
    urlError ? decodeURIComponent(urlError) : null
  );
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  async function handleResendConfirmation() {
    if (!formData.email) {
      toast.error("Please enter your email address first.");
      return;
    }
    setIsResending(true);
    try {
      const res = await resendConfirmationAction(formData.email);
      if (res.success) {
        toast.success("Verification Email Sent", {
          description: res.message || "Please check your inbox.",
        });
      } else {
        toast.error("Could not resend email", {
          description: res.error,
        });
      }
    } catch {
      toast.error("Failed to resend confirmation email.");
    } finally {
      setIsResending(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear specific field error on change
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
    if (generalError) {
      setGeneralError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);

    // Client-side Zod validation
    const clientValidation = loginSchema.safeParse(formData);
    if (!clientValidation.success) {
      const fieldErrors: Record<string, string> = {};
      const flattened = clientValidation.error.flatten().fieldErrors;
      for (const [key, messages] of Object.entries(flattened)) {
        if (messages && messages[0]) {
          fieldErrors[key] = messages[0];
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const result = await loginAction(clientValidation.data);

      if (!result.success) {
        if (result.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            if (messages && messages[0]) {
              fieldErrors[key] = messages[0];
            }
          }
          setErrors(fieldErrors);
        }
        setGeneralError(result.error || "Unable to sign in. Please try again.");
        setIsLoading(false);
        return;
      }

      const returnTo = searchParams.get("returnTo");
      const safeRedirect = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : (result.redirectTo || "/app");
      router.push(safeRedirect);
      router.refresh();
    } catch {
      setGeneralError("An unexpected connection error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
        <CardDescription>
          Enter your email and password to access your NEXORA workspace
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <GoogleSignInButton label="Continue with Google" disabled={isLoading} />

          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border/80" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground tracking-wider">
                Or continue with email
              </span>
            </div>
          </div>

          {reason === "inactivity" && !generalError && (
            <Alert
              variant="default"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
            >
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              <AlertTitle>Session Expired</AlertTitle>
              <AlertDescription className="text-xs">
                You have been logged out due to 2 hours of inactivity. Please sign in again.
              </AlertDescription>
            </Alert>
          )}

          {reason === "deleted" && !generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Profile Inactive</AlertTitle>
              <AlertDescription className="text-xs">
                Your profile was removed or is no longer valid. Please sign in or register a new
                account.
              </AlertDescription>
            </Alert>
          )}

          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Authentication Failed</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>{generalError}</p>
                {(generalError.toLowerCase().includes("confirm") ||
                  generalError.toLowerCase().includes("verif")) && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs h-8 bg-background/80 border-destructive/40 hover:bg-destructive/10 text-destructive-foreground flex items-center gap-1.5"
                    onClick={handleResendConfirmation}
                    disabled={isResending}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    {isResending ? "Sending..." : "Resend Verification Email"}
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="login-email">Email address</Label>
            <Input
              id="login-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              variant={errors.email ? "error" : "default"}
              aria-describedby={errors.email ? "login-email-error" : undefined}
            />
            {errors.email && (
              <p id="login-email-error" className="text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="login-password">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="login-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                variant={errors.password ? "error" : "default"}
                aria-describedby={errors.password ? "login-password-error" : undefined}
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded p-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p id="login-password-error" className="text-xs text-destructive">
                {errors.password}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button type="submit" className="w-full" loading={isLoading}>
            Sign in
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link
              href="/signup"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
