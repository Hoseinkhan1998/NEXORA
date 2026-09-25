import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

// Max file size: 10MB
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const workspaceId = formData.get("workspaceId") as string | null;
    const taskId = (formData.get("taskId") as string | null) || "general";

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!workspaceId) {
      return NextResponse.json({ error: "Workspace ID is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds the 10MB limit." },
        { status: 400 }
      );
    }

    // Verify workspace membership (all roles including viewer can upload for comments/tasks)
    const { data: membership, error: memError } = await supabase
      .from("workspace_members")
      .select("role")
      .eq("workspace_id", workspaceId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memError || !membership) {
      return NextResponse.json(
        { error: "You are not a member of this workspace" },
        { status: 403 }
      );
    }

    // Storage client setup (service role fallback if needed for automatic bucket provisioning)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const serviceKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
    const storageClient = serviceKey
      ? createAdminClient(supabaseUrl, serviceKey)
      : supabase;

    // Ensure bucket exists
    try {
      const { data: buckets } = await storageClient.storage.listBuckets();
      const hasBucket = buckets?.some((b) => b.name === "task-attachments");
      if (!hasBucket && serviceKey) {
        await storageClient.storage.createBucket("task-attachments", {
          public: true,
          fileSizeLimit: MAX_FILE_SIZE_BYTES,
        });
      }
    } catch {
      // Ignore bucket check error and proceed with upload
    }

    const ext = file.name.split(".").pop() || "bin";
    const baseClean = sanitizeFilename(file.name.replace(/\.[^/.]+$/, ""));
    const uniqueId = crypto.randomUUID();
    const storagePath = `${workspaceId}/${taskId}/${Date.now()}-${uniqueId}-${baseClean}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await storageClient.storage
      .from("task-attachments")
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      console.error("[tasks/upload] Storage upload failed:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = storageClient.storage.from("task-attachments").getPublicUrl(storagePath);

    return NextResponse.json({
      success: true,
      file: {
        id: uniqueId,
        name: file.name,
        url: publicUrl,
        size: file.size,
        type: file.type || "application/octet-stream",
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
      },
    });
  } catch (err: unknown) {
    console.error("[tasks/upload] Unexpected error:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
