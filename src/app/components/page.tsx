"use client";

import * as React from "react";
import {
  Button,
  Input,
  Textarea,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Separator,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  Checkbox,
  Switch,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Skeleton,
  Alert,
  AlertTitle,
  AlertDescription,
  toast,
} from "@/components/ui";
import { ThemeToggle } from "@/components/shared";
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Mail,
  User,
  Settings,
  LogOut,
  FolderKanban,
} from "lucide-react";

export default function ComponentsShowcasePage() {
  const [switchState, setSwitchState] = React.useState(false);
  const [checkboxState, setCheckboxState] = React.useState<boolean | "indeterminate">(true);
  const [dialogOpen, setDialogOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-background/95 backdrop-blur-xs">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-lg">NEXORA</span>
              <Badge variant="outline" className="text-[10px] font-mono">
                TASK 002
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Core Design System & UI Primitive Showcase
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:inline">Theme:</span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-12 px-6 pt-8">
        {/* Typography Scale */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">1. Typography Scale</h2>
            <p className="text-xs text-muted-foreground">
              Standardized hierarchy for SaaS interfaces
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 space-y-4">
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-1">display (36px, bold)</p>
              <h1 className="text-4xl font-bold tracking-tight">Project Intelligence Engine</h1>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-1">
                page-title (30px, semibold)
              </p>
              <h2 className="text-3xl font-semibold tracking-tight">Workspace Overview</h2>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-1">
                section-title (24px, semibold)
              </p>
              <h3 className="text-2xl font-semibold tracking-tight">Active Sprints & Velocity</h3>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-1">heading (18px, medium)</p>
              <h4 className="text-lg font-medium text-foreground">Task Backlog Prioritization</h4>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-1">body (14px, regular)</p>
              <p className="text-sm text-foreground">
                NEXORA tracks real-time progress across team milestones and provides predictive
                analytics.
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-1">
                body-small (12px, regular)
              </p>
              <p className="text-xs text-muted-foreground">
                Updated 3 minutes ago by system scheduler.
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-mono text-muted-foreground mb-1">
                caption & label (11px / 14px uppercase/medium)
              </p>
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                AUDIT LOG ENTRY
              </span>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">2. Buttons</h2>
            <p className="text-xs text-muted-foreground">Variants, sizes, and states</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 space-y-6">
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Variants
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="default">Default</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="link">Link</Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Sizes & Icon
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small (sm)</Button>
                <Button size="default">Default</Button>
                <Button size="lg">Large (lg)</Button>
                <Button size="icon" aria-label="Folder action">
                  <FolderKanban className="h-4 w-4" />
                </Button>
                <Button>
                  <Mail className="h-4 w-4" />
                  With Icon
                </Button>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                States
              </h4>
              <div className="flex flex-wrap items-center gap-3">
                <Button loading>Loading State</Button>
                <Button disabled>Disabled Button</Button>
                <Button variant="outline" disabled>
                  Disabled Outline
                </Button>
                <Button variant="destructive" loading>
                  Deleting...
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Form Controls */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">3. Form Controls</h2>
            <p className="text-xs text-muted-foreground">
              Input, Textarea, Label, Select, Checkbox, Switch
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Inputs */}
              <div className="space-y-2">
                <Label htmlFor="default-input">Default Input</Label>
                <Input id="default-input" placeholder="e.g. project-apollo" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="disabled-input">Disabled Input</Label>
                <Input id="disabled-input" disabled value="Read-only workspace value" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="error-input" className="text-destructive">
                  Error State Input
                </Label>
                <Input
                  id="error-input"
                  variant="error"
                  defaultValue="invalid_workspace_slug!"
                  aria-describedby="error-desc"
                />
                <p id="error-desc" className="text-xs text-destructive">
                  Only lowercase alphanumeric characters and hyphens allowed.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="success-input" className="text-emerald-600 dark:text-emerald-400">
                  Success State Input
                </Label>
                <Input
                  id="success-input"
                  variant="success"
                  defaultValue="nexora-enterprise"
                  aria-describedby="success-desc"
                />
                <p id="success-desc" className="text-xs text-emerald-600 dark:text-emerald-400">
                  Workspace domain is available.
                </p>
              </div>
            </div>

            <Separator />

            {/* Select & Textarea */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="role-select">Select</Label>
                <Select defaultValue="member">
                  <SelectTrigger id="role-select" className="w-full">
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Permissions</SelectLabel>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer (Read-only)</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="project-desc">Textarea</Label>
                <Textarea
                  id="project-desc"
                  placeholder="Describe the project scope and key deliverables..."
                />
              </div>
            </div>

            <Separator />

            {/* Toggles: Checkbox & Switch */}
            <div className="flex flex-wrap gap-8 items-center">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="terms"
                  checked={checkboxState === true}
                  onCheckedChange={(checked) => setCheckboxState(checked)}
                />
                <Label htmlFor="terms" className="cursor-pointer">
                  Auto-assign sprint tickets ({checkboxState ? "Checked" : "Unchecked"})
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox id="terms-disabled" disabled checked />
                <Label htmlFor="terms-disabled" className="opacity-70">
                  Disabled Checkbox
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="notifications" checked={switchState} onCheckedChange={setSwitchState} />
                <Label htmlFor="notifications" className="cursor-pointer">
                  Real-time alerts ({switchState ? "ON" : "OFF"})
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="notifications-disabled" disabled />
                <Label htmlFor="notifications-disabled" className="opacity-70">
                  Disabled Switch
                </Label>
              </div>
            </div>
          </div>
        </section>

        {/* Feedback & Badges */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">4. Feedback, Alerts & Badges</h2>
            <p className="text-xs text-muted-foreground">Alerts, Badges, and Sonner Toasts</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 space-y-6">
            {/* Badges */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Badges
              </h4>
              <div className="flex flex-wrap gap-3">
                <Badge variant="default">Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
                <Badge variant="destructive">Destructive</Badge>
              </div>
            </div>

            <Separator />

            {/* Alerts */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Alerts
              </h4>
              <Alert variant="info">
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  Your workspace is currently synced with the latest sprint metrics.
                </AlertDescription>
              </Alert>

              <Alert variant="success">
                <CheckCircle2 className="h-4 w-4" />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>
                  Production build verified successfully without hydration errors.
                </AlertDescription>
              </Alert>

              <Alert variant="warning">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Sprint deadline approaches in 48 hours. 3 blocker tasks require attention.
                </AlertDescription>
              </Alert>

              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Critical Error</AlertTitle>
                <AlertDescription>
                  Unable to connect to external webhook endpoint. Verification halted.
                </AlertDescription>
              </Alert>
            </div>

            <Separator />

            {/* Toasts */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Toasts (Sonner)
              </h4>
              <div className="flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast("Default notification event")}
                >
                  Trigger Default
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.success("Changes saved successfully", {
                      description: "Workspace configuration updated.",
                    })
                  }
                >
                  Trigger Success
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.warning("Warning", {
                      description: "Approaching resource threshold.",
                    })
                  }
                >
                  Trigger Warning
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    toast.error("Operation failed", {
                      description: "Network timeout while saving settings.",
                    })
                  }
                >
                  Trigger Error
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Overlays & Menus */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">5. Overlays, Dialogs & Menus</h2>
            <p className="text-xs text-muted-foreground">Dialog, Dropdown Menu, and Tooltips</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-6 space-y-6">
            <div className="flex flex-wrap items-center gap-6">
              {/* Dialog */}
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="default">Open Modal Dialog</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm Project Deployment</DialogTitle>
                    <DialogDescription>
                      This action will promote your project pipeline to the production cluster.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-2 text-sm text-muted-foreground">
                    Ensure all team members have completed their code reviews before confirming.
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button
                      variant="default"
                      onClick={() => {
                        setDialogOpen(false);
                        toast.success("Deployment initiated successfully");
                      }}
                    >
                      Confirm Deployment
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Options Dropdown</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="start">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                    <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                    <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled>
                    <Mail className="mr-2 h-4 w-4" />
                    <span>API Keys (Disabled)</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Tooltip */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="secondary">Hover or Focus for Tooltip</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Keyboard accessible tooltip info</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </section>

        {/* Layout & Surfaces */}
        <section className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">
              6. Surfaces, Tabs & Placeholders
            </h2>
            <p className="text-xs text-muted-foreground">Card, Tabs, Avatar, and Skeletons</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Card & Avatar */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src="" alt="User avatar" />
                      <AvatarFallback>NX</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">Workspace Team</CardTitle>
                      <CardDescription>Core Platform Engineers</CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary">8 Members</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  The core team is responsible for infrastructure, design system primitives, and
                  developer productivity tooling.
                </p>
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">HK</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">AI</AvatarFallback>
                  </Avatar>
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px]">+6</AvatarFallback>
                  </Avatar>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t border-border pt-4">
                <span className="text-xs text-muted-foreground">Active Sprint: 2026.1</span>
                <Button size="sm" variant="outline">
                  Manage
                </Button>
              </CardFooter>
            </Card>

            {/* Tabs & Skeletons */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Tabs & Skeleton States</CardTitle>
                <CardDescription>Simulated view switching and loading placeholders</CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="active" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="active">Active View</TabsTrigger>
                    <TabsTrigger value="loading">Loading Skeleton</TabsTrigger>
                  </TabsList>
                  <TabsContent value="active" className="space-y-3 pt-2">
                    <div className="flex items-center justify-between rounded-md border border-border p-3">
                      <div>
                        <p className="text-sm font-medium">Sprint Analytics Module</p>
                        <p className="text-xs text-muted-foreground">Ready for production build</p>
                      </div>
                      <Badge variant="default">Online</Badge>
                    </div>
                  </TabsContent>
                  <TabsContent value="loading" className="space-y-3 pt-2">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-[80%]" />
                        <Skeleton className="h-3 w-[50%]" />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}
