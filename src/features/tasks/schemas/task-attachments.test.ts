import { describe, it, expect } from "vitest";
import { createTaskSchema, updateTaskSchema, taskAttachmentSchema } from "./task";
import { formatBytes, isImageAttachment } from "../components/task-attachments";

describe("Task Attachments & Schemas", () => {
  it("validates a correct task attachment object", () => {
    const validAtt = {
      id: "att-123",
      name: "design_spec.pdf",
      url: "https://storage.supabase.co/task-attachments/spec.pdf",
      size: 1048576,
      type: "application/pdf",
      uploaded_at: new Date().toISOString(),
      uploaded_by: "usr-456",
    };

    const parsed = taskAttachmentSchema.safeParse(validAtt);
    expect(parsed.success).toBe(true);
  });

  it("rejects attachments with negative size", () => {
    const invalidAtt = {
      id: "att-123",
      name: "design_spec.pdf",
      url: "https://storage.supabase.co/task-attachments/spec.pdf",
      size: -10,
      type: "application/pdf",
      uploaded_at: new Date().toISOString(),
    };

    const parsed = taskAttachmentSchema.safeParse(invalidAtt);
    expect(parsed.success).toBe(false);
  });

  it("allows creating tasks with multiple attachments", () => {
    const input = {
      title: "Task with files",
      attachments: [
        {
          id: "1",
          name: "screenshot.png",
          url: "https://example.com/screenshot.png",
          size: 2048,
          type: "image/png",
          uploaded_at: "2026-09-25T10:00:00Z",
        },
      ],
    };

    const result = createTaskSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.attachments).toHaveLength(1);
      expect(result.data.attachments?.[0]?.name).toBe("screenshot.png");
    }
  });

  it("formats file bytes correctly", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1 KB");
    expect(formatBytes(1048576)).toBe("1 MB");
    expect(formatBytes(2621440, 1)).toBe("2.5 MB");
  });

  it("accurately detects image attachments by mime type or extension", () => {
    expect(
      isImageAttachment({
        id: "1",
        name: "photo.jpg",
        url: "",
        size: 100,
        type: "image/jpeg",
        uploaded_at: "",
      })
    ).toBe(true);

    expect(
      isImageAttachment({
        id: "2",
        name: "document.pdf",
        url: "",
        size: 100,
        type: "application/pdf",
        uploaded_at: "",
      })
    ).toBe(false);

    expect(
      isImageAttachment({
        id: "3",
        name: "snapshot.webp",
        url: "",
        size: 100,
        type: "application/octet-stream",
        uploaded_at: "",
      })
    ).toBe(true);
  });
});
