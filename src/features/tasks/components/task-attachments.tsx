"use client";

import * as React from "react";
import {
  FileText,
  Image as ImageIcon,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File as FileGeneric,
  Download,
  Trash2,
  Paperclip,
  UploadCloud,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { TaskAttachment } from "../types";

export interface TaskAttachmentsProps {
  attachments: TaskAttachment[];
  onChange?: (attachments: TaskAttachment[]) => void;
  workspaceId: string;
  taskId?: string;
  isEditable?: boolean;
}

export function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

export function getFileIcon(type: string, name: string) {
  const ext = name.split(".").pop()?.toLowerCase() || "";

  if (type.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
    return <ImageIcon className="h-4 w-4 text-emerald-500" />;
  }
  if (type === "application/pdf" || ext === "pdf") {
    return <FileText className="h-4 w-4 text-rose-500" />;
  }
  if (
    type.includes("word") ||
    type.includes("document") ||
    ["doc", "docx", "txt", "rtf", "md"].includes(ext)
  ) {
    return <FileText className="h-4 w-4 text-blue-500" />;
  }
  if (
    type.includes("sheet") ||
    type.includes("excel") ||
    type.includes("csv") ||
    ["xls", "xlsx", "csv"].includes(ext)
  ) {
    return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <FileArchive className="h-4 w-4 text-amber-500" />;
  }
  if (["js", "ts", "tsx", "jsx", "html", "css", "json", "py"].includes(ext)) {
    return <FileCode className="h-4 w-4 text-indigo-500" />;
  }
  return <FileGeneric className="h-4 w-4 text-muted-foreground" />;
}

export function isImageAttachment(att: TaskAttachment): boolean {
  if (att.type?.startsWith("image/")) return true;
  const ext = att.name.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
}

export function TaskAttachments({
  attachments = [],
  onChange,
  workspaceId,
  taskId,
  isEditable = false,
}: TaskAttachmentsProps) {
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);

  // Lightbox state for image preview
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [lightboxName, setLightboxName] = React.useState<string>("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      const newAttachments: TaskAttachment[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (!file) continue;

        if (file.size > 10 * 1024 * 1024) {
          throw new Error(`File "${file.name}" exceeds the 10MB limit.`);
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("workspaceId", workspaceId);
        if (taskId) formData.append("taskId", taskId);

        const res = await fetch("/api/tasks/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || `Failed to upload ${file.name}`);
        }

        newAttachments.push(data.file);
      }

      if (onChange && newAttachments.length > 0) {
        onChange([...attachments, ...newAttachments]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to upload file";
      setUploadError(msg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = (id: string) => {
    if (onChange) {
      onChange(attachments.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-muted-foreground font-medium text-xs">
          <Paperclip className="h-3.5 w-3.5" />
          <span>Attachments ({attachments.length})</span>
        </div>

        {isEditable && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="h-7 text-xs gap-1.5 border-dashed hover:border-primary/50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-3 w-3" />
                  <span>Add Attachment</span>
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {uploadError && (
        <p className="text-[11px] text-destructive font-medium bg-destructive/10 p-1.5 rounded">
          {uploadError}
        </p>
      )}

      {attachments.length === 0 ? (
        <div className="rounded-md border border-dashed border-border/60 p-3 text-center text-xs text-muted-foreground/70">
          No file is attached to this task.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((att) => {
            const isImg = isImageAttachment(att);
            return (
              <div
                key={att.id}
                className="group relative flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 hover:bg-muted/40 transition-colors"
              >
                <div
                  className="flex items-center gap-2 min-w-0 flex-1 cursor-pointer"
                  onClick={() => {
                    if (isImg) {
                      setLightboxUrl(att.url);
                      setLightboxName(att.name);
                    } else {
                      window.open(att.url, "_blank");
                    }
                  }}
                >
                  {isImg ? (
                    <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded border border-border/50 bg-black/10">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={att.url}
                        alt={att.name}
                        className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ) : (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-border/50 bg-muted/40">
                      {getFileIcon(att.type, att.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-foreground truncate" title={att.name}>
                      {att.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{formatBytes(att.size)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={att.url}
                    download={att.name}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
                    title="Download file"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </a>

                  {isEditable && (
                    <button
                      type="button"
                      onClick={() => handleRemove(att.id)}
                      className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      <ImageLightbox
        isOpen={Boolean(lightboxUrl)}
        onClose={() => setLightboxUrl(null)}
        imageUrl={lightboxUrl}
        fileName={lightboxName}
      />
    </div>
  );
}
