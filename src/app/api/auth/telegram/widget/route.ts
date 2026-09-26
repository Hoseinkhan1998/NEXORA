import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { verifyTelegramWidgetData } from "@/features/telegram/lib/verify-init-data";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const widgetData = body?.widgetData;
    const returnTo = body?.returnTo;

    if (!widgetData) {
      return NextResponse.json({ error: "Missing widgetData payload." }, { status: 400 });
    }

    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!botToken) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN is not configured on server." },
        { status: 500 }
      );
    }

    const verification = verifyTelegramWidgetData(widgetData, botToken);
    if (!verification.isValid || !verification.data) {
      return NextResponse.json(
        { error: verification.error || "Invalid Telegram signature." },
        { status: 401 }
      );
    }

    const tgUser = verification.data;
    const email = `tg_${tgUser.id}@telegram.nexora.app`;

    // Derive deterministic secure password known only to our server
    const deterministicPassword = crypto
      .createHmac("sha256", botToken)
      .update(`tma_user_${tgUser.id}`)
      .digest("hex");

    const supabase = await createClient();

    // 1. Attempt to sign in directly
    const signInResult = await supabase.auth.signInWithPassword({
      email,
      password: deterministicPassword,
    });

    // 2. If user doesn't exist, create an account
    if (signInResult.error) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password: deterministicPassword,
        options: {
          data: {
            full_name: fullName,
            avatar_url: tgUser.photo_url || null,
            telegram_id: tgUser.id,
            telegram_username: tgUser.username || null,
          },
        },
      });

      if (signUpError) {
        return NextResponse.json({ error: signUpError.message }, { status: 400 });
      }

      // If email confirmation is required and service role key is available, auto-confirm
      if (!signUpData.session && signUpData.user) {
        const serviceRoleKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (serviceRoleKey && supabaseUrl) {
          try {
            const { createClient: createAdmin } = await import("@supabase/supabase-js");
            const admin = createAdmin(supabaseUrl, serviceRoleKey);
            await admin.auth.admin.updateUserById(signUpData.user.id, {
              email_confirm: true,
            });
          } catch (adminErr) {
            console.warn("[TelegramWidgetAuth] Admin confirm warning:", adminErr);
          }
        }

        // Retry sign in after auto-confirm
        await supabase.auth.signInWithPassword({
          email,
          password: deterministicPassword,
        });
      }
    }

    // 3. Upsert profile with telegram_id and info
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (currentUser) {
      const fullName = [tgUser.first_name, tgUser.last_name].filter(Boolean).join(" ");
      try {
        await supabase.from("profiles").upsert(
          {
            id: currentUser.id,
            email: currentUser.email || email,
            full_name: fullName || null,
            avatar_url: tgUser.photo_url || null,
            telegram_id: tgUser.id,
            telegram_username: tgUser.username || null,
          },
          { onConflict: "id" }
        );
      } catch (upsertErr) {
        console.warn("[TelegramWidgetAuth] Profile upsert warning:", upsertErr);
      }
    }

    const safeDestination =
      returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/app";

    return NextResponse.json({
      success: true,
      user: currentUser,
      redirect: safeDestination,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
