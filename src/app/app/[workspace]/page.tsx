import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/features/workspaces";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, ShieldCheck, Calendar } from "lucide-react";

interface WorkspacePageProps {
  params: Promise<{ workspace: string }>;
}

export async function generateMetadata({ params }: WorkspacePageProps): Promise<Metadata> {
  const { workspace: slug } = await params;
  const ws = await getWorkspaceBySlug(slug);

  if (!ws) {
    return {
      title: "Workspace Not Found",
    };
  }

  return {
    title: `${ws.name} | NEXORA`,
    description: `Workspace overview for ${ws.name}`,
  };
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspace: slug } = await params;
  const workspace = await getWorkspaceBySlug(slug);

  if (!workspace) {
    notFound();
  }

  const formattedDate = new Date(workspace.created_at).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm shadow-xs">
              {workspace.name.charAt(0).toUpperCase()}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{workspace.name}</h1>
            <Badge variant="secondary" className="capitalize font-mono text-[10px]">
              {workspace.role}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Multi-tenant workspace active. All data and navigation are isolated to this
            organization.
          </p>
        </div>
      </div>

      {/* Workspace Stats / Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tenant Identifier
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-sm font-semibold truncate">{workspace.slug}</div>
            <p className="text-[11px] text-muted-foreground mt-1">URL slug for scoped navigation</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Membership Role
            </CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold capitalize">{workspace.role}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Verified by PostgreSQL RLS</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Created Date
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold">{formattedDate}</div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Workspace initialization timestamp
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Multi-Tenancy Architecture Card */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">
              Multi-Tenancy Foundation Status
            </CardTitle>
            <Badge
              variant="outline"
              className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            >
              TASK 005 Active
            </Badge>
          </div>
          <CardDescription>
            Row Level Security (RLS) and membership isolation are active for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Workspace ID</span>
            <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[280px]">
              {workspace.id}
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Tenant Isolation</span>
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Row Level Security Enforced
            </span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-xs">
            <span className="text-muted-foreground">Scoped Routing</span>
            <span className="font-mono text-[11px] text-foreground bg-muted/60 px-1.5 py-0.5 rounded">
              /app/{workspace.slug}
              {"/*"}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
