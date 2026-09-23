"use client";

import * as React from "react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ChevronDown, Users, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkspaceAssignee } from "@/features/tasks/types";

interface ProjectMembersSelectProps {
  workspaceMembers: WorkspaceAssignee[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

function getInitials(name?: string | null, email?: string): string {
  if (name && name.trim()) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
  if (email) {
    return email.slice(0, 2).toUpperCase();
  }
  return "U";
}

export function ProjectMembersSelect({
  workspaceMembers,
  selectedIds,
  onChange,
  disabled = false,
  placeholder = "Assign workspace members to project...",
  className,
}: ProjectMembersSelectProps) {
  const [search, setSearch] = React.useState("");

  const selectedMembers = React.useMemo(() => {
    return workspaceMembers.filter((m) => selectedIds.includes(m.userId));
  }, [workspaceMembers, selectedIds]);

  const filteredMembers = React.useMemo(() => {
    if (!search.trim()) return workspaceMembers;
    const query = search.toLowerCase();
    return workspaceMembers.filter(
      (m) =>
        (m.fullName && m.fullName.toLowerCase().includes(query)) ||
        m.email.toLowerCase().includes(query)
    );
  }, [workspaceMembers, search]);

  const handleToggle = (userId: string) => {
    if (selectedIds.includes(userId)) {
      onChange(selectedIds.filter((id) => id !== userId));
    } else {
      onChange([...selectedIds, userId]);
    }
  };

  const handleSelectAll = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const allIds = Array.from(new Set([...selectedIds, ...filteredMembers.map((m) => m.userId)]));
    onChange(allIds);
  };

  const handleClearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-between font-normal text-xs h-9 px-3 bg-background hover:bg-accent/50",
            disabled && "opacity-50 cursor-not-allowed",
            className
          )}
        >
          <div className="flex items-center gap-2 min-w-0 overflow-hidden">
            {selectedMembers.length === 0 && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-3.5 w-3.5 opacity-60 shrink-0" />
                <span className="truncate">{placeholder}</span>
              </div>
            )}

            {selectedMembers.length === 1 && (
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-4 w-4 text-[9px] shrink-0">
                  {selectedMembers[0]?.avatarUrl && (
                    <AvatarImage
                      src={selectedMembers[0].avatarUrl}
                      alt={selectedMembers[0].fullName || selectedMembers[0].email}
                    />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary font-bold">
                    {getInitials(selectedMembers[0]?.fullName, selectedMembers[0]?.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate text-foreground font-medium">
                  {selectedMembers[0]?.fullName || selectedMembers[0]?.email.split("@")[0]}
                </span>
              </div>
            )}

            {selectedMembers.length > 1 && (
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {selectedMembers.slice(0, 3).map((m) => (
                    <Avatar key={m.userId} className="h-4 w-4 text-[8px] ring-1 ring-background">
                      {m.avatarUrl && <AvatarImage src={m.avatarUrl} alt={m.fullName || m.email} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(m.fullName, m.email)}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="truncate text-foreground font-medium">
                  {selectedMembers.length} members selected
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-1 text-muted-foreground">
            {selectedMembers.length > 0 && (
              <span
                role="button"
                tabIndex={0}
                onClick={handleClearAll}
                onKeyDown={(e) =>
                  e.key === "Enter" && handleClearAll(e as unknown as React.MouseEvent)
                }
                className="hover:text-foreground p-0.5 rounded-sm"
                title="Clear all"
              >
                <X className="h-3 w-3" />
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="w-72 p-1" align="start">
        <DropdownMenuLabel className="font-normal px-2 py-1.5">
          <div className="relative">
            <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search workspace members..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-7 text-xs"
              autoFocus
              onKeyDown={(e) => e.stopPropagation()}
            />
          </div>
          <div className="flex items-center justify-between mt-2 pt-1 border-t border-border/50 text-[11px]">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-primary hover:underline font-medium"
            >
              Select All ({filteredMembers.length})
            </button>
            {selectedIds.length > 0 && (
              <button
                type="button"
                onClick={handleClearAll}
                className="text-muted-foreground hover:text-destructive"
              >
                Clear All
              </button>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-56 overflow-y-auto space-y-0.5">
          {filteredMembers.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">No members found</div>
          ) : (
            filteredMembers.map((member) => {
              const isChecked = selectedIds.includes(member.userId);
              const displayName = member.fullName || member.email.split("@")[0] || "User";
              const initials = getInitials(member.fullName, member.email);

              return (
                <DropdownMenuCheckboxItem
                  key={member.userId}
                  checked={isChecked}
                  onSelect={(e) => {
                    e.preventDefault();
                    handleToggle(member.userId);
                  }}
                  className="gap-2.5 py-1.5 cursor-pointer"
                >
                  <Avatar className="h-6 w-6 text-[10px] shrink-0">
                    {member.avatarUrl && <AvatarImage src={member.avatarUrl} alt={displayName} />}
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col min-w-0 flex-1 leading-none">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-medium text-foreground truncate">
                        {displayName}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1 py-0 h-3.5 uppercase font-mono"
                      >
                        {member.role}
                      </Badge>
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate font-mono mt-0.5">
                      {member.email}
                    </span>
                  </div>
                </DropdownMenuCheckboxItem>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
