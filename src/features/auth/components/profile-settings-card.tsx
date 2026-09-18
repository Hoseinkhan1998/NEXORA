"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Camera, Trash2, CheckCircle2, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { updateProfileAction } from "../actions/update-profile";
import type { UserProfile } from "../types";

// Curated high-resolution avatar presets for quick 1-click selection
const AVATAR_PRESETS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=256&h=256&fit=crop&crop=faces",
];

interface ProfileSettingsCardProps {
  initialProfile: UserProfile | null;
}

export function ProfileSettingsCard({ initialProfile }: ProfileSettingsCardProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = React.useState(initialProfile?.fullName || "");
  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(
    initialProfile?.avatarUrl || null
  );
  const [isSaving, setIsSaving] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [feedback, setFeedback] = React.useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Compute fallback initials
  const initials = React.useMemo(() => {
    if (fullName) {
      const parts = fullName.trim().split(" ");
      if (parts.length >= 2 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return fullName.slice(0, 2).toUpperCase();
    }
    return "NX";
  }, [fullName]);

  // Handle local file selection with client-side canvas optimization
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFeedback({
        type: "error",
        message: "Please select an image file (JPEG, PNG, WebP).",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFeedback({
        type: "error",
        message: "Image must be smaller than 5MB.",
      });
      return;
    }

    setIsUploading(true);
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Optimize to square 160x160 avatar image for fast load and optimal storage
        const canvas = document.createElement("canvas");
        const maxDim = 160;
        canvas.width = maxDim;
        canvas.height = maxDim;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          const minSide = Math.min(img.width, img.height);
          const startX = (img.width - minSide) / 2;
          const startY = (img.height - minSide) / 2;

          ctx.drawImage(img, startX, startY, minSide, minSide, 0, 0, maxDim, maxDim);

          const optimizedDataUrl = canvas.toDataURL("image/webp", 0.8);
          setAvatarUrl(optimizedDataUrl);
          setIsUploading(false);
        } else {
          setAvatarUrl(event.target?.result as string);
          setIsUploading(false);
        }
      };
      img.onerror = () => {
        setIsUploading(false);
        setFeedback({ type: "error", message: "Failed to load selected image." });
      };
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      setIsUploading(false);
      setFeedback({ type: "error", message: "Failed to read image file." });
    };
    reader.readAsDataURL(file);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setIsSaving(true);

    try {
      const result = await updateProfileAction({
        fullName,
        avatarUrl,
      });

      if (!result.success) {
        setFeedback({
          type: "error",
          message: result.error || "Failed to update profile.",
        });
        setIsSaving(false);
        return;
      }

      setFeedback({
        type: "success",
        message: "Profile updated successfully.",
      });
      router.refresh();
    } catch {
      setFeedback({
        type: "error",
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Card className="shadow-xs max-w-xl">
      <form onSubmit={handleSave}>
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-semibold">Profile & Appearance</CardTitle>
          <CardDescription>
            Update your photo and personal information across NEXORA workspaces.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {feedback && (
            <Alert
              variant={feedback.type === "error" ? "destructive" : "success"}
              className="py-2.5"
            >
              {feedback.type === "error" ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              <AlertTitle className="text-xs font-semibold">
                {feedback.type === "error" ? "Update Failed" : "Changes Saved"}
              </AlertTitle>
              <AlertDescription className="text-xs">{feedback.message}</AlertDescription>
            </Alert>
          )}

          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2 border-b border-border/40">
            <div className="relative group">
              <Avatar className="h-16 w-16 border-2 border-border shadow-xs">
                {avatarUrl ? <AvatarImage src={avatarUrl} alt={fullName || "User avatar"} /> : null}
                <AvatarFallback className="text-base font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {isUploading && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading || isSaving}
                  className="gap-1.5 text-xs h-8"
                >
                  <Camera className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Upload photo</span>
                </Button>

                {avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setAvatarUrl(null)}
                    disabled={isUploading || isSaving}
                    className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Remove</span>
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">
                JPEG, PNG, or WebP. Max size 5MB. Automatically cropped to square.
              </p>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Or choose a quick preset</span>
            </div>
            <div className="flex items-center gap-2">
              {AVATAR_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setAvatarUrl(preset)}
                  className={`relative rounded-full transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary ${
                    avatarUrl === preset
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "opacity-80 hover:opacity-100"
                  }`}
                  aria-label={`Preset avatar ${idx + 1}`}
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={preset} alt={`Preset ${idx + 1}`} />
                  </Avatar>
                </button>
              ))}
            </div>
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="full-name" className="text-xs">
                Full Name
              </Label>
              <Input
                id="full-name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                disabled={isSaving}
                className="text-sm h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs">
                Email Address
              </Label>
              <Input
                id="email"
                value={initialProfile?.email || ""}
                disabled
                className="text-sm h-9 bg-muted/40 cursor-not-allowed opacity-80"
              />
              <p className="text-[11px] text-muted-foreground">
                Email is verified and linked to your authentication provider.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end pt-2 border-t border-border/40">
          <Button
            type="submit"
            size="sm"
            loading={isSaving}
            disabled={isSaving || isUploading}
            className="h-9 px-4 text-xs font-medium"
          >
            Save changes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
