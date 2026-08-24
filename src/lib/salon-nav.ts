import {
  Briefcase,
  LayoutDashboard,
  Search,
  Users,
  UserRoundSearch,
  type LucideIcon,
} from "lucide-react";

export interface SalonNavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  match: (pathname: string) => boolean;
  /** Show Interested applications badge */
  showApplicantBadge?: boolean;
}

/** Salon dashboard sidebar — exact order required by product. */
export const SALON_NAV_ITEMS: SalonNavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    match: (p) => p === "/dashboard",
  },
  {
    href: "/dashboard/stylists",
    label: "Stylist",
    icon: Users,
    match: (p) => p.startsWith("/dashboard/stylists"),
  },
  {
    href: "/dashboard/verify",
    label: "Find Stylist",
    icon: Search,
    match: (p) => p.startsWith("/dashboard/verify"),
  },
  {
    href: "/dashboard/jobs",
    label: "Jobs",
    icon: Briefcase,
    match: (p) =>
      p.startsWith("/dashboard/jobs") || p.startsWith("/dashboard/hiring"),
  },
  {
    href: "/dashboard/applicants",
    label: "Applicant",
    icon: UserRoundSearch,
    match: (p) => p.startsWith("/dashboard/applicants"),
    showApplicantBadge: true,
  },
];
