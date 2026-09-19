import { headers } from "next/headers";

export async function getAppOrigin(): Promise<string> {
  // 1. If explicit environment variable is set, prioritize it
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }

  // 2. Derive dynamically from incoming request headers (Vercel / reverse proxy)
  try {
    const headersList = await headers();
    const host = headersList.get("x-forwarded-host") || headersList.get("host");
    const proto =
      headersList.get("x-forwarded-proto") || (host?.includes("localhost") ? "http" : "https");

    if (host) {
      return `${proto}://${host}`;
    }
  } catch {
    // Fallback if headers() cannot be called
  }

  return "http://localhost:3000";
}
