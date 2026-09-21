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
import { AlertCircle, CheckCircle2, Mail, Eye, EyeOff } from "lucide-react";
import { signupAction } from "../actions/signup";
import { resendConfirmationAction } from "../actions/resend-confirmation";
import { signupSchema, type SignupInput } from "../schemas/auth";
import { GoogleSignInButton } from "./google-sign-in-button";
import { toast } from "sonner";

export function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = React.useState<SignupInput>({
    email: "",
    fullName: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isSuccessConfirmation, setIsSuccessConfirmation] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  async function handleResendConfirmation() {
    if (!formData.email) {
      toast.error("Please provide an email address.");
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
    const clientValidation = signupSchema.safeParse(formData);
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
      const result = await signupAction(clientValidation.data);

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
        setGeneralError(result.error || "Unable to create account. Please try again.");
        setIsLoading(false);
        return;
      }

      if (result.requiresConfirmation) {
        setIsSuccessConfirmation(true);
        setIsLoading(false);
        return;
      }

      const returnTo = searchParams.get("returnTo");
      const safeRedirect =
        returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//")
          ? returnTo
          : result.redirectTo || "/app";
      router.push(safeRedirect);
      router.refresh();
    } catch {
      setGeneralError("An unexpected connection error occurred. Please try again.");
      setIsLoading(false);
    }
  }

  if (isSuccessConfirmation) {
    return (
      <Card className="w-full max-w-md shadow-md text-center">
        <CardHeader className="space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <Mail className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Check your email</CardTitle>
          <CardDescription>
            We sent a verification link to{" "}
            <strong className="text-foreground">{formData.email}</strong>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Registration Successful</AlertTitle>
            <AlertDescription>
              Please verify your email address by clicking the link sent to your inbox before
              logging in to access your workspace.
            </AlertDescription>
          </Alert>

          <div className="pt-2 flex flex-col items-center gap-1.5 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              Didn&apos;t receive the email? Check your spam folder or
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-8 text-primary hover:text-primary/90"
              onClick={handleResendConfirmation}
              disabled={isResending}
            >
              {isResending ? "Sending..." : "Resend Verification Email"}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex justify-center pt-2">
          <Link href="/login">
            <Button variant="outline">Return to Sign in</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
        <CardDescription>
          Get started with NEXORA to manage intelligence and project velocity
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <GoogleSignInButton label="Sign up with Google" disabled={isLoading} />

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

          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Registration Failed</AlertTitle>
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="signup-name">Full name</Label>
            <Input
              id="signup-name"
              name="fullName"
              type="text"
              autoComplete="name"
              placeholder="Alex Morgan"
              value={formData.fullName}
              onChange={handleChange}
              disabled={isLoading}
              variant={errors.fullName ? "error" : "default"}
              aria-describedby={errors.fullName ? "signup-name-error" : undefined}
            />
            {errors.fullName && (
              <p id="signup-name-error" className="text-xs text-destructive">
                {errors.fullName}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-email">Email address</Label>
            <Input
              id="signup-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              variant={errors.email ? "error" : "default"}
              aria-describedby={errors.email ? "signup-email-error" : undefined}
            />
            {errors.email && (
              <p id="signup-email-error" className="text-xs text-destructive">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-password">Password</Label>
            <div className="relative">
              <Input
                id="signup-password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                variant={errors.password ? "error" : "default"}
                aria-describedby={errors.password ? "signup-password-error" : undefined}
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
              <p id="signup-password-error" className="text-xs text-destructive">
                {errors.password}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="signup-confirm-password">Confirm password</Label>
            <div className="relative">
              <Input
                id="signup-confirm-password"
                name="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                disabled={isLoading}
                variant={errors.confirmPassword ? "error" : "default"}
                aria-describedby={
                  errors.confirmPassword ? "signup-confirm-password-error" : undefined
                }
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded p-1"
                aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="signup-confirm-password-error" className="text-xs text-destructive">
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-4 pt-2">
          <Button type="submit" className="w-full" loading={isLoading}>
            Create account
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-medium text-primary underline underline-offset-4 hover:text-primary/90"
            >
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
