import { NextResponse } from "next/server";
import { getTaskComments } from "@/features/tasks/queries/get-task-comments";

export async function GET(
  req: Request,
  props: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await props.params;
    const { searchParams } = new URL(req.url);
    const cursor = searchParams.get("cursor");
    const limit = Math.min(Number(searchParams.get("limit") || "10"), 50);

    const result = await getTaskComments(taskId, {
      cursor,
      limit,
    });

    const response = NextResponse.json(result);
    response.headers.set(
      "Cache-Control",
      "private, max-age=15, stale-while-revalidate=60"
    );
    return response;
  } catch (err: unknown) {
    console.error("[api/tasks/comments] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
