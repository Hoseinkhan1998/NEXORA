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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Building2, Sparkles, ArrowRight } from "lucide-react";
import { createWorkspaceAction } from "../actions/create-workspace";
import { createWorkspaceSchema } from "../schemas/workspace";
import { generateSlug } from "../utils/slug";

interface OnboardingFormProps {
  title?: string;
  description?: string;
}

export function OnboardingForm({
  title = "Create your workspace",
  description = "A workspace is your organization's home for projects, teams, and collaboration.",
}: OnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [fieldError, setFieldError] = React.useState<string | null>(null);
  const [isPending, setIsPending] = React.useState(false);

  const slugPreview = React.useMemo(() => {
    if (!name.trim()) return "your-workspace";
    return generateSlug(name);
  }, [name]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setName(e.target.value);
    if (fieldError) setFieldError(null);
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setFieldError(null);

    const validation = createWorkspaceSchema.safeParse({ name });
    if (!validation.success) {
      const flattened = validation.error.flatten().fieldErrors;
      if (flattened.name?.[0]) {
        setFieldError(flattened.name[0]);
      }
      return;
    }

    setIsPending(true);

    try {
      const formData = new FormData();
      formData.set("name", name);

      const result = await createWorkspaceAction(null, formData);

      if (!result.success) {
        if (result.fieldErrors?.name?.[0]) {
          setFieldError(result.fieldErrors.name[0]);
        }
        setError(result.error || "Failed to create workspace. Please try again.");
        setIsPending(false);
        return;
      }

      if (result.workspace?.slug) {
        router.push(`/app/${result.workspace.slug}`);
        router.refresh();
      } else {
        router.push("/app");
        router.refresh();
      }
    } catch {
      setError("An unexpected network error occurred. Please try again.");
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full max-w-lg shadow-lg border-border/80 bg-card">
      <CardHeader className="space-y-2 text-center pb-6">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-2">
          <Building2 className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">{title}</CardTitle>
        <CardDescription className="text-sm text-muted-foreground max-w-sm mx-auto">
          {description}
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Creation Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="workspace-name" className="text-sm font-medium">
              Workspace Name
            </Label>
            <Input
              id="workspace-name"
              name="name"
              type="text"
              placeholder="e.g. Acme Studio, Nova Labs"
              value={name}
              onChange={handleChange}
              disabled={isPending}
              variant={fieldError ? "error" : "default"}
              aria-describedby={fieldError ? "workspace-name-error" : "slug-preview-text"}
              autoFocus
            />
            {fieldError ? (
              <p id="workspace-name-error" className="text-xs text-destructive">
                {fieldError}
              </p>
            ) : (
              <p
                id="slug-preview-text"
                className="text-xs text-muted-foreground flex items-center gap-1"
              >
                <span>URL:</span>
                <span className="font-mono text-[11px] text-foreground/80 bg-muted/60 px-1.5 py-0.5 rounded">
                  /app/{slugPreview}
                </span>
              </p>
            )}
          </div>

          <div className="rounded-lg bg-muted/30 border border-border/50 p-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium text-foreground text-[11px]">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span>Multi-Tenant Workspace</span>
            </div>
            <p>
              You will be assigned the <span className="font-semibold text-foreground">Owner</span>{" "}
              role. You can invite team members and configure settings after creation.
            </p>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3 pt-2">
          <Button
            type="submit"
            className="w-full gap-2 font-medium"
            loading={isPending}
            disabled={!name.trim() || isPending}
          >
            <span>Create Workspace</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
