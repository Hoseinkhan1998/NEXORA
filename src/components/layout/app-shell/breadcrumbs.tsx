"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

import { useBreadcrumbs } from "./breadcrumb-context";

interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent: boolean;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function Breadcrumbs({ className }: { className?: string }) {
  const pathname = usePathname();
  const { customLabels } = useBreadcrumbs();

  const items: BreadcrumbItem[] = React.useMemo(() => {
    // Standardize root /app path
    if (!pathname || pathname === "/app") {
      return [{ label: "Overview", href: "/app", isCurrent: true }];
    }

    const segments = pathname.split("/").filter(Boolean);
    // segments e.g. ["app", "projects"] or ["app", "workspace-1", "projects"]
    const crumbs: BreadcrumbItem[] = [];

    // Always start with App / Overview root
    crumbs.push({
      label: "Overview",
      href: "/app",
      isCurrent: segments.length === 1 && segments[0] === "app",
    });

    let currentHref = "/app";
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i];
      if (!segment) continue;

      currentHref += `/${segment}`;
      const isCurrent = i === segments.length - 1;

      // Map common segment names or custom labels
      let label = segment;
      if (customLabels[segment]) {
        label = customLabels[segment];
      } else if (segment === "projects") {
        label = "Projects";
      } else if (segment === "analytics") {
        label = "Analytics";
      } else if (segment === "settings") {
        label = "Settings";
      } else if (UUID_REGEX.test(segment)) {
        label = "Project";
      } else {
        // Capitalize words
        label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
      }

      crumbs.push({
        label,
        href: currentHref,
        isCurrent,
      });
    }

    return crumbs;
  }, [pathname, customLabels]);

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center", className)}>
      <ol className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {items.map((item, index) => {
          const isFirst = index === 0;

          return (
            <React.Fragment key={item.href + index}>
              {!isFirst && (
                <ChevronRight
                  className="h-3 w-3 text-muted-foreground/60 shrink-0"
                  aria-hidden="true"
                />
              )}
              <li className="inline-flex items-center">
                {item.isCurrent ? (
                  <span
                    className="font-medium text-foreground truncate max-w-[160px]"
                    aria-current="page"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    prefetch={true}
                    className="hover:text-foreground transition-colors truncate max-w-[120px] flex items-center gap-1"
                  >
                    {isFirst && <Home className="h-3 w-3" aria-hidden="true" />}
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
