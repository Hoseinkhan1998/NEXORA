import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, FolderKanban, BarChart3, Settings, HelpCircle } from "lucide-react";

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: string;
  disabled?: boolean;
}

export const getPrimaryNavItems = (slug?: string): NavItem[] => {
  const prefix = slug ? `/app/${slug}` : "/app";
  return [
    {
      title: "Overview",
      href: prefix,
      icon: LayoutDashboard,
      exact: true,
    },
    {
      title: "Projects",
      href: `${prefix}/projects`,
      icon: FolderKanban,
    },
    {
      title: "Analytics",
      href: `${prefix}/analytics`,
      icon: BarChart3,
    },
  ];
};

export const getSecondaryNavItems = (slug?: string): NavItem[] => {
  const prefix = slug ? `/app/${slug}` : "/app";
  return [
    {
      title: "Settings",
      href: `${prefix}/settings`,
      icon: Settings,
    },
    {
      title: "Help & Docs",
      href: "#",
      icon: HelpCircle,
      disabled: true,
    },
  ];
};

export const primaryNavItems: NavItem[] = getPrimaryNavItems();
export const secondaryNavItems: NavItem[] = getSecondaryNavItems();
