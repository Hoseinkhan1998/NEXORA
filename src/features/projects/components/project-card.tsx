"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, FolderKanban, Archive } from "lucide-react";
import type { ProjectWithCreator } from "../types";

interface ProjectCardProps {
  project: ProjectWithCreator;
  workspaceSlug: string;
}

export function ProjectCard({ project, workspaceSlug }: ProjectCardProps) {
  const isArchived = project.status === "archived";
  const projectColor = project.color || "#3B82F6";

  const formattedDate = new Date(project.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const creatorName =
    project.creator?.full_name || project.creator?.email?.split("@")[0] || "Team Member";

  return (
    <Link
      href={`/app/${workspaceSlug}/projects/${project.id}`}
      className="block h-full group/card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-xl transition-all"
    >
      <Card
        className={`h-full flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer border-border/80 group-hover/card:border-primary/40 ${
          isArchived ? "opacity-75 bg-muted/20" : "bg-card hover:bg-accent/10"
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full shadow-xs"
                style={{ backgroundColor: projectColor }}
                aria-hidden="true"
              />
              <CardTitle className="text-base font-semibold truncate leading-tight group-hover/card:text-primary transition-colors">
                {project.name}
              </CardTitle>
            </div>

          <Badge
            variant={isArchived ? "secondary" : "outline"}
            className="text-[10px] uppercase font-mono px-2 py-0.5 shrink-0"
          >
            {isArchived ? (
              <span className="flex items-center gap-1">
                <Archive className="h-3 w-3" />
                Archived
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Active
              </span>
            )}
          </Badge>
        </div>

        <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-2 min-h-[2rem]">
          {project.description || "No project description provided."}
        </CardDescription>
      </CardHeader>

      <CardContent className="pb-3 pt-0">
        <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground bg-muted/40 px-2 py-1 rounded w-fit max-w-full truncate">
          <FolderKanban className="h-3 w-3 shrink-0" />
          <span className="truncate">/{project.slug}</span>
        </div>
      </CardContent>

      <CardFooter className="pt-2 pb-3 border-t border-border/40 text-[11px] text-muted-foreground flex items-center justify-between">
        <div className="flex items-center gap-1.5 truncate max-w-[140px]" title={creatorName}>
          <User className="h-3 w-3 shrink-0 opacity-70" />
          <span className="truncate">{creatorName}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Calendar className="h-3 w-3 opacity-70" />
          <span>{formattedDate}</span>
        </div>
      </CardFooter>
    </Card>
  </Link>
  );
}
