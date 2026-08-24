import {
  Bell,
  Briefcase,
  ClipboardList,
  History,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";

export interface StylistNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  /** Show pending salon interest badge */
  showInterestBadge?: boolean;
}

/** Stylist dashboard sidebar — mirrors salon shell hierarchy. */
export const STYLIST_NAV_ITEMS: StylistNavItem[] = [
  {
    href: "/stylist",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/stylist",
  },
  {
    href: "/stylist/jobs",
    label: "Jobs",
    icon: Briefcase,
    match: (p) => p.startsWith("/stylist/jobs"),
  },
  {
    href: "/stylist/interests",
    label: "Interests",
    icon: Bell,
    match: (p) => p.startsWith("/stylist/interests"),
    showInterestBadge: true,
  },
  {
    href: "/stylist/applications",
    label: "Applications",
    icon: ClipboardList,
    match: (p) => p.startsWith("/stylist/applications"),
  },
  {
    href: "/stylist/employment",
    label: "Employment",
    icon: History,
    match: (p) => p.startsWith("/stylist/employment"),
  },
];
