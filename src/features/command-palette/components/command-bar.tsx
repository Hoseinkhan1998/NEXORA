"use client";

import dynamic from "next/dynamic";
import { CommandTrigger } from "./command-trigger";
import { useCommandPalette } from "../hooks/use-command-palette";
import type { CommandWorkspaceItem } from "../types";

const CommandPalette = dynamic(
  () => import("./command-palette").then((mod) => mod.CommandPalette),
  { ssr: false }
);

interface CommandBarProps {
  workspaceSlug: string;
  workspaceId?: string;
  workspaces?: CommandWorkspaceItem[];
}

export function CommandBar({ workspaceSlug, workspaceId, workspaces = [] }: CommandBarProps) {
  const { open, setOpen } = useCommandPalette();

  return (
    <>
      <CommandTrigger onClick={() => setOpen(true)} />
      {open && (
        <CommandPalette
          open={open}
          onOpenChange={setOpen}
          workspaceSlug={workspaceSlug}
          workspaceId={workspaceId}
          workspaces={workspaces}
        />
      )}
    </>
  );
}
