export function mapAuthError(error: unknown): string {
  if (!error) {
    return "An unknown error occurred. Please try again.";
  }

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : typeof (error as { message?: string }).message === "string"
          ? (error as { message: string }).message
          : "";

  const lower = message.toLowerCase();

  if (
    lower.includes("invalid login credentials") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid_grant")
  ) {
    return "Invalid email or password. Please check your credentials and try again.";
  }

  if (
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("email already exists")
  ) {
    return "An account with this email address already exists. Please log in instead.";
  }

  if (lower.includes("email not confirmed")) {
    return "Your email address has not been confirmed. Please check your inbox for the confirmation link.";
  }

  if (lower.includes("password should be at least")) {
    return "Password is too weak. Please use at least 6 characters.";
  }

  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts. Please wait a few moments before trying again.";
  }

  if (lower.includes("signup disabled")) {
    return "Account registration is temporarily disabled. Please contact support.";
  }

  if (lower.includes("placeholder-project") || lower.includes("failed to fetch")) {
    return "Unable to connect to the authentication server. Please check your network or configuration.";
  }

  return message || "An unexpected error occurred during authentication. Please try again.";
}
