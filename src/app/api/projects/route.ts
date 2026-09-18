import { NextResponse, type NextRequest } from "next/server";
import { getWorkspaceProjects } from "@/features/projects/queries/get-projects";
import { checkRateLimit, getClientIp, getRateLimitHeaders } from "@/lib/security/rate-limit";

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  const rateLimit = checkRateLimit(`api:projects:${ip}`, { limit: 30, windowMs: 60_000 });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: getRateLimitHeaders(rateLimit) }
    );
  }

  const { searchParams } = new URL(request.url);
  const workspaceId = searchParams.get("workspaceId");

  if (!workspaceId) {
    return NextResponse.json({ projects: [] }, { status: 400 });
  }

  try {
    const projects = await getWorkspaceProjects(workspaceId, "active");
    return NextResponse.json({ projects }, { headers: getRateLimitHeaders(rateLimit) });
  } catch (error) {
    console.error("[GET /api/projects] Error:", error);
    return NextResponse.json({ projects: [] }, { status: 500 });
  }
}
