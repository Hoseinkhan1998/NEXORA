import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app";
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  if (errorParam || errorDescription) {
    console.error("[auth/callback] Provider error:", errorParam, errorDescription);
    const message = encodeURIComponent(errorDescription || errorParam || "Authentication failed");
    return NextResponse.redirect(`${origin}/login?error=${message}`);
  }

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Sync Google or OAuth user metadata (full name, avatar) into public.profiles
      try {
        const metadata = data.user.user_metadata || {};
        const fullName =
          metadata.full_name || metadata.name || data.user.email?.split("@")[0] || null;
        const avatarUrl = metadata.avatar_url || metadata.picture || null;

        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: data.user.email || "",
            full_name: fullName,
            avatar_url: avatarUrl,
          },
          { onConflict: "id" }
        );
      } catch (profileErr) {
        console.warn("[auth/callback] Profile initialization error:", profileErr);
      }

      // Check cookies for pending destinations
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const cookieNext = cookieStore.get("nexora_oauth_next")?.value;
      const pendingInvite = cookieStore.get("nexora_pending_invite_token")?.value;

      let destination = next;
      if (destination === "/app" && cookieNext) {
        destination = decodeURIComponent(cookieNext);
      } else if (destination === "/app" && pendingInvite) {
        destination = `/invite/${pendingInvite}`;
      }

      // Ensure destination is relative
      const safeDestination = destination.startsWith("/") && !destination.startsWith("//") ? destination : "/app";
      const response = NextResponse.redirect(`${origin}${safeDestination}`);
      response.cookies.delete("nexora_oauth_next");
      return response;
    } else if (error) {
      console.error("[auth/callback] exchangeCodeForSession error:", error.message);
      const message = encodeURIComponent(error.message || "Failed to exchange session");
      return NextResponse.redirect(`${origin}/login?error=${message}`);
    }

  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
