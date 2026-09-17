"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Plus, AlertCircle, Check } from "lucide-react";
import { createProjectAction } from "../actions/create-project";
import { createProjectSchema, PROJECT_COLOR_PALETTE } from "../schemas/project";
import { generateProjectSlug } from "../lib/slug";

interface CreateProjectDialogProps {
  workspaceId: string;
  workspaceSlug: string;
  trigger?: React.ReactNode;
}

export function CreateProjectDialog({
  workspaceId,
  workspaceSlug,
  trigger,
}: CreateProjectDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [color, setColor] = React.useState<string>(PROJECT_COLOR_PALETTE[0] || "#3B82F6");
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [generalError, setGeneralError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const slugPreview = React.useMemo(() => {
    if (!name.trim()) return "new-project";
    return generateProjectSlug(name);
  }, [name]);

  function resetForm() {
    setName("");
    setDescription("");
    setColor(PROJECT_COLOR_PALETTE[0] || "#3B82F6");
    setErrors({});
    setGeneralError(null);
    setIsPending(false);
  }

  function handleOpenChange(newOpen: boolean) {
    if (!newOpen) {
      resetForm();
    }
    setOpen(newOpen);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setGeneralError(null);
    setErrors({});

    const validation = createProjectSchema.safeParse({
      name,
      description: description || undefined,
      color,
    });

    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      const flattened = validation.error.flatten().fieldErrors;
      for (const [key, msgs] of Object.entries(flattened)) {
        if (msgs?.[0]) fieldErrors[key] = msgs[0];
      }
      setErrors(fieldErrors);
      return;
    }

    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set("name", name);
      if (description) formData.set("description", description);
      formData.set("color", color);

      const result = await createProjectAction(workspaceId, workspaceSlug, null, formData);

      if (!result.success) {
        if (result.fieldErrors) {
          const fieldErrors: Record<string, string> = {};
          for (const [key, msgs] of Object.entries(result.fieldErrors)) {
            if (msgs?.[0]) fieldErrors[key] = msgs[0];
          }
          setErrors(fieldErrors);
        }
        setGeneralError(result.error || "Unable to create project.");
        setIsPending(false);
        return;
      }

      setOpen(false);
      resetForm();

      if (result.project) {
        router.push(`/app/${workspaceSlug}/projects/${result.project.id}`);
        router.refresh();
      }
    } catch {
      setGeneralError("An unexpected connection error occurred. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="gap-2 shadow-xs">
            <Plus className="h-4 w-4" />
            <span>Create Project</span>
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create Project</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Add a new project to this workspace. It will be immediately available to your team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {generalError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Creation Failed</AlertTitle>
              <AlertDescription>{generalError}</AlertDescription>
            </Alert>
          )}

          {/* Project Name */}
          <div className="space-y-1.5">
            <Label htmlFor="project-name" className="text-xs font-semibold">
              Project Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="project-name"
              placeholder="e.g. Mobile Application, Q4 Marketing"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              disabled={isPending}
              variant={errors.name ? "error" : "default"}
              autoFocus
            />
            {errors.name ? (
              <p className="text-xs text-destructive">{errors.name}</p>
            ) : (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 font-mono">
                <span>Slug:</span>
                <span className="text-foreground bg-muted/60 px-1 py-0.2 rounded">
                  /{slugPreview}
                </span>
              </p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="project-desc" className="text-xs font-semibold">
              Description <span className="text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Textarea
              id="project-desc"
              placeholder="Summarize the core goals and deliverables..."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) {
                  setErrors((prev) => {
                    const next = { ...prev };
                    delete next.description;
                    return next;
                  });
                }
              }}
              disabled={isPending}
              className="resize-none min-h-[70px]"
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          {/* Color Palette Picker */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Color Accent</Label>
            <div
              className="flex items-center gap-2 pt-1 flex-wrap"
              role="radiogroup"
              aria-label="Project accent color"
            >
              {PROJECT_COLOR_PALETTE.map((c) => {
                const isSelected = color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    aria-label={`Color ${c}`}
                    onClick={() => setColor(c)}
                    className={`h-7 w-7 rounded-full flex items-center justify-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                      isSelected ? "scale-110 ring-2 ring-primary ring-offset-2" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c }}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5 text-white drop-shadow-xs" />}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending} disabled={!name.trim() || isPending}>
              Create Project
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
