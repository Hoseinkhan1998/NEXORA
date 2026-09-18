import { NextResponse, type NextRequest } from "next/server";
import { getUserNotifications } from "@/features/notifications/queries/get-user-notifications";
import { getUnreadNotificationCount } from "@/features/notifications/queries/get-unread-count";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`api:notifications:${ip}`, { limit: 30, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId") || undefined;

  try {
    const [notifications, unreadCount] = await Promise.all([
      getUserNotifications(workspaceId, 30),
      getUnreadNotificationCount(workspaceId),
    ]);

    return NextResponse.json(
      {
        notifications,
        unreadCount,
      },
      { headers: getRateLimitHeaders(rateLimit) }
    );
  } catch (error) {
    console.error("[GET /api/notifications] Error:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 }, { status: 500 });
  }
}
