"use client";

import * as React from "react";
import {
  Send,
  Paperclip,
  Loader2,
  Trash2,
  Download,
  MessageSquare,
  Sparkles,
  X,
  Radio,
  ChevronUp,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useTaskComments } from "../hooks/use-task-comments";
import { createCommentAction } from "../actions/create-comment";
import { deleteCommentAction } from "../actions/delete-comment";
import { formatBytes, getFileIcon } from "./task-attachments";
import type { TaskComment } from "../types/comment";
import type { WorkspaceRole } from "@/features/workspaces/types";

export interface TaskChatSectionProps {
  taskId: string;
  workspaceId: string;
  currentUserId?: string;
  currentUserRole?: WorkspaceRole;
}

function formatCommentDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    const time = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    if (isToday) {
      return `${time} (Today)`;
    }

    return `${time} - ${d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })}`;
  } catch {
    return dateStr;
  }
}

function isImageFile(type: string | null, name: string | null): boolean {
  if (type && type.startsWith("image/")) return true;
  if (!name) return false;
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext);
}

export function TaskChatSection({
  taskId,
  workspaceId,
  currentUserId,
  currentUserRole,
}: TaskChatSectionProps) {
  const {
    comments,
    isLoadingInitial,
    isLoadingMore,
    hasMore,
    loadOlderComments,
    addCommentLocally,
    removeCommentLocally,
  } = useTaskComments({
    taskId,
    workspaceId,
  });

  const [message, setMessage] = React.useState("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = React.useRef<HTMLDivElement | null>(null);

  // Lightbox modal state
  const [lightboxUrl, setLightboxUrl] = React.useState<string | null>(null);
  const [lightboxName, setLightboxName] = React.useState<string>("");

  const scrollToBottom = React.useCallback((behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior, block: "nearest" });
  }, []);

  // Auto scroll to bottom when initial comments arrive or new comment added
  React.useEffect(() => {
    if (!isLoadingInitial && comments.length > 0) {
      scrollToBottom("auto");
    }
  }, [isLoadingInitial, comments.length, scrollToBottom]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setSubmitError("Maximum allowed file size is 10MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setSubmitError(null);
    setSelectedFile(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isSubmitting) return;

    const trimmed = message.trim();
    if (!trimmed && !selectedFile) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      let uploadedFile: {
        url: string;
        name: string;
        type: string;
        size: number;
      } | null = null;

      // 1. Upload file if attached
      if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("workspaceId", workspaceId);
        formData.append("taskId", taskId);

        const uploadRes = await fetch("/api/tasks/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok || !uploadData.success) {
          throw new Error(uploadData.error || "File upload failed.");
        }

        uploadedFile = uploadData.file;
      }

      // 2. Create comment record
      const result = await createCommentAction({
        taskId,
        workspaceId,
        content: trimmed,
        fileUrl: uploadedFile?.url,
        fileName: uploadedFile?.name,
        fileType: uploadedFile?.type,
        fileSize: uploadedFile?.size,
      });

      if (!result.success || !result.comment) {
        throw new Error(result.error || "Failed to send message.");
      }

      // Add to local state & scroll
      addCommentLocally(result.comment);
      setMessage("");
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setTimeout(() => scrollToBottom("smooth"), 100);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      setSubmitError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      removeCommentLocally(commentId);
      const res = await deleteCommentAction(commentId, workspaceId);
      if (!res.success) {
        console.warn("[handleDeleteComment] Failed to delete:", res.error);
      }
    } catch (err) {
      console.error("[handleDeleteComment] Error:", err);
    }
  };

  return (
    <div className="flex flex-col rounded-xl border border-border/70 bg-card/60 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-muted/30 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 text-primary">
            <MessageSquare className="h-3.5 w-3.5" />
          </div>
          <span className="text-xs font-semibold text-foreground">Task Discussion</span>
          <span className="text-[11px] px-1.5 py-0.2 rounded-full bg-muted font-medium text-muted-foreground">
            {comments.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Real-time</span>
        </div>
      </div>

      {/* Messages Feed Container with fixed height */}
      <div
        ref={scrollContainerRef}
        className="h-72 overflow-y-auto p-3.5 space-y-3 flex flex-col justify-start custom-scrollbar"
      >
        {/* Load older messages button */}
        {hasMore && !isLoadingInitial && (
          <div className="flex justify-center pb-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={loadOlderComments}
              disabled={isLoadingMore}
              className="h-6 text-[10px] gap-1 px-2.5 rounded-full border-border/60 hover:bg-muted/70"
            >
              {isLoadingMore ? (
                <Loader2 className="h-2.5 w-2.5 animate-spin" />
              ) : (
                <ChevronUp className="h-2.5 w-2.5" />
              )}
              <span>Load older messages (10 previous)</span>
            </Button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoadingInitial ? (
          <div className="space-y-3 pt-2">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className={`flex gap-2.5 items-start ${n % 2 === 0 ? "flex-row-reverse" : ""}`}
              >
                <div className="h-7 w-7 rounded-full bg-muted/60 animate-pulse shrink-0" />
                <div className={`space-y-1.5 max-w-[75%] ${n % 2 === 0 ? "items-end" : ""}`}>
                  <div className="h-3 w-24 bg-muted/60 rounded animate-pulse" />
                  <div className="h-10 w-48 bg-muted/40 rounded-xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          /* Empty State */
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-muted-foreground/80 space-y-1.5">
            <div className="p-2.5 rounded-full bg-muted/30">
              <Sparkles className="h-5 w-5 text-primary/60" />
            </div>
            <p className="text-xs font-medium text-foreground">
              No message has been recorded for this task yet.
            </p>
            <p className="text-[11px] text-muted-foreground">
              All team members (even Viewers) can leave comments or upload files here.
            </p>
          </div>
        ) : (
          /* Render Comments */
          comments.map((comment) => {
            const isMe = Boolean(currentUserId && comment.user_id === currentUserId);
            const canDelete = isMe || currentUserRole === "owner" || currentUserRole === "admin";
            const isImg = isImageFile(comment.file_type, comment.file_name);
            const authorName =
              comment.author.full_name || comment.author.email.split("@")[0] || "Team Member";
            const initials = authorName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <div
                key={comment.id}
                className={`group flex gap-2.5 items-start ${
                  isMe ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Author Avatar */}
                <Avatar className="h-7 w-7 shrink-0 text-[10px] mt-0.5 border border-border/50">
                  {comment.author.avatar_url && (
                    <AvatarImage src={comment.author.avatar_url} alt={authorName} />
                  )}
                  <AvatarFallback
                    className={
                      isMe
                        ? "bg-primary text-primary-foreground font-bold"
                        : "bg-muted font-bold text-muted-foreground"
                    }
                  >
                    {initials}
                  </AvatarFallback>
                </Avatar>

                {/* Message Bubble Content */}
                <div className={`flex flex-col max-w-[80%] ${isMe ? "items-end" : "items-start"}`}>
                  {/* Author meta row */}
                  <div className="flex items-center gap-1.5 mb-1 px-1 text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">
                      {isMe ? "You" : authorName}
                    </span>
                    <span className="text-[10px] text-muted-foreground/70">
                      • {formatCommentDate(comment.created_at)}
                    </span>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(comment.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-muted-foreground hover:text-destructive"
                        title="Delete message"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    )}
                  </div>

                  {/* Bubble body */}
                  <div
                    className={`rounded-2xl px-3 py-2 text-xs leading-relaxed border shadow-xs ${
                      isMe
                        ? "bg-primary/10 border-primary/25 text-foreground rounded-tr-xs"
                        : "bg-muted/40 border-border/60 text-foreground rounded-tl-xs"
                    }`}
                  >
                    {/* Text content */}
                    {comment.content && (
                      <p className="whitespace-pre-wrap break-words">{comment.content}</p>
                    )}

                    {/* File Attachment */}
                    {comment.file_url && (
                      <div className={comment.content ? "mt-2 pt-2 border-t border-border/30" : ""}>
                        {isImg ? (
                          /* Compact Image Preview with click to lightbox */
                          <div
                            className="relative max-w-[220px] max-h-[160px] overflow-hidden rounded-lg border border-border/60 cursor-pointer group/img bg-black/10"
                            onClick={() => {
                              setLightboxUrl(comment.file_url);
                              setLightboxName(comment.file_name || "Image");
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={comment.file_url}
                              alt={comment.file_name || "Image"}
                              className="w-full h-full object-cover transition-transform group-hover/img:scale-105"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-medium gap-1">
                              <span>Zoom</span>
                            </div>
                          </div>
                        ) : (
                          /* Document / File Card */
                          <a
                            href={comment.file_url}
                            download={comment.file_name || "file"}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-2 rounded-lg bg-background/80 hover:bg-background border border-border/70 transition-colors max-w-[260px]"
                          >
                            <div className="p-1 rounded bg-muted/60 shrink-0">
                              {getFileIcon(comment.file_type || "", comment.file_name || "")}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-[11px] text-foreground truncate">
                                {comment.file_name || "Download file"}
                              </p>
                              {comment.file_size && (
                                <p className="text-[10px] text-muted-foreground">
                                  {formatBytes(comment.file_size)}
                                </p>
                              )}
                            </div>
                            <Download className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected file preview chip above input */}
      {selectedFile && (
        <div className="flex items-center justify-between px-3 py-1.5 bg-muted/40 border-t border-border/40 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="font-medium text-foreground truncate max-w-[200px] sm:max-w-xs">
              {selectedFile.name}
            </span>
            <span className="text-[10px] text-muted-foreground">
              ({formatBytes(selectedFile.size)})
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1 text-muted-foreground hover:text-destructive rounded"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Error message */}
      {submitError && (
        <div className="px-3 py-1 bg-destructive/10 text-destructive text-[11px] font-medium border-t border-destructive/20">
          {submitError}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-2.5 bg-background border-t border-border/50 flex items-end gap-2"
      >
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting}
          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted"
          title="Attach file (max 10MB)"
        >
          <Paperclip className="h-4 w-4" />
        </Button>

        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isSubmitting}
          rows={1}
          className="min-h-[38px] max-h-24 resize-none text-xs py-2 px-3 flex-1 rounded-xl"
        />

        <Button
          type="submit"
          size="icon"
          disabled={isSubmitting || (!message.trim() && !selectedFile)}
          className="h-9 w-9 shrink-0 rounded-xl"
          title="Send message"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

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
