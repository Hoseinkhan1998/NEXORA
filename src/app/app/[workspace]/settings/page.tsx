import type { Metadata } from "next";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings } from "lucide-react";

interface SettingsPageProps {
  params: Promise<{ workspace: string }>;
}

export const metadata: Metadata = {
  title: "Settings | NEXORA",
  description: "Workspace configuration and preferences.",
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspace } = await params;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Workspace Settings</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configuration for workspace{" "}
          <span className="font-mono text-xs font-semibold text-foreground">/{workspace}</span>
        </p>
      </div>

      <Card className="shadow-xs max-w-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">Workspace Configuration</CardTitle>
            <Badge variant="outline" className="font-mono text-[10px]">
              Multi-Tenancy Active
            </Badge>
          </div>
          <CardDescription>Manage organization details, members, and roles.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center justify-between py-1.5 border-b border-border/40 text-xs">
            <span className="text-muted-foreground">Active Slug</span>
            <span className="font-mono font-medium">{workspace}</span>
          </div>
          <div className="flex items-center justify-between py-1.5 text-xs">
            <span className="text-muted-foreground">Tenant Access</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              Member Authenticated
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
