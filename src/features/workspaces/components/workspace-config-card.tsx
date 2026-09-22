"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Pencil, Building2, ShieldCheck } from "lucide-react";
import { updateWorkspaceAction } from "../actions/update-workspace";
import { toast } from "sonner";
import type { WorkspaceRole } from "../types";

interface WorkspaceConfigCardProps {
  workspaceId: string;
  workspaceName: string;
  workspaceSlug: string;
  currentUserRole: WorkspaceRole;
}

export function WorkspaceConfigCard({
  workspaceId,
  workspaceName: initialName,
  workspaceSlug,
  currentUserRole,
}: WorkspaceConfigCardProps) {
  const router = useRouter();
  const [currentName, setCurrentName] = React.useState(initialName);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [nameInput, setNameInput] = React.useState(initialName);
  const [isSaving, setIsSaving] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  const canEdit = currentUserRole === "owner" || currentUserRole === "admin";

  function handleOpenDialog() {
    setNameInput(currentName);
    setErrorMsg(null);
    setIsDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim() || nameInput.trim().length < 2) {
      setErrorMsg("Workspace name must be at least 2 characters.");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const result = await updateWorkspaceAction(workspaceId, workspaceSlug, nameInput.trim());

      if (result.success && result.name) {
        setCurrentName(result.name);
        setIsDialogOpen(false);
        toast.success("Workspace name updated successfully.");
        if (result.slug && result.slug !== workspaceSlug) {
          const currentPath = window.location.pathname;
          const newPath = currentPath.replace(`/app/${workspaceSlug}`, `/app/${result.slug}`);
          router.push(newPath);
        } else {
          router.refresh();
        }
      } else {
        setErrorMsg(result.error || "Failed to update workspace name.");
        toast.error(result.error || "Failed to update workspace name.");
      }
    } catch {
      setErrorMsg("An unexpected error occurred.");
      toast.error("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <>
      <Card className="shadow-xs h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              <span>Workspace Configuration</span>
            </CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              Multi-Tenancy Active
            </Badge>
          </div>
          <CardDescription>
            Workspace metadata, branding, and tenant isolation verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-2 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Workspace Name</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">{currentName}</span>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleOpenDialog}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                  title="Edit workspace name"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">Edit workspace name</span>
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Active Slug</span>
            <span className="font-mono font-medium text-foreground">/{workspaceSlug}</span>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Your Role</span>
            <Badge variant="secondary" className="capitalize text-[11px] font-medium">
              {currentUserRole}
            </Badge>
          </div>

          <div className="flex items-center justify-between py-2 text-xs">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span>Tenant Access</span>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Cryptographically Isolated
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Edit Workspace Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSave}>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>Edit Workspace Name</span>
              </DialogTitle>
              <DialogDescription>
                Update the display name of this workspace. The scoped URL slug will automatically update to match.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-2">
              <Label htmlFor="workspace-name-input">Workspace Name</Label>
              <Input
                id="workspace-name-input"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Acme Corp"
                maxLength={50}
                autoFocus
              />
              {nameInput.trim().length >= 2 && (
                <p className="text-[11px] text-muted-foreground font-mono">
                  New URL: /app/{nameInput.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")}
                </p>
              )}
              {errorMsg && (
                <p className="text-xs text-destructive font-medium">{errorMsg}</p>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSaving}>
                  Cancel
                </Button>
              </DialogClose>
              <Button type="submit" loading={isSaving} disabled={!nameInput.trim()}>
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
