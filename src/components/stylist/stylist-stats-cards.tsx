import { Briefcase, ClipboardList, History, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { StylistDashboardStats } from "@/types";

const statConfig = [
  {
    key: "openJobs" as const,
    label: "Open Jobs",
    icon: Briefcase,
    color: "text-[#2563EB]",
    bg: "bg-[#2563EB]/15",
    card: "border-l-4 border-l-[#2563EB] bg-[#2563EB]/5",
  },
  {
    key: "applications" as const,
    label: "Applications",
    icon: ClipboardList,
    color: "text-success",
    bg: "bg-success/15",
    card: "border-l-4 border-l-success bg-success/5",
  },
  {
    key: "interested" as const,
    label: "Interested",
    icon: Sparkles,
    color: "text-warning",
    bg: "bg-warning/15",
    card: "border-l-4 border-l-warning bg-warning/5",
  },
  {
    key: "employment" as const,
    label: "Employment Records",
    icon: History,
    color: "text-[#8B5CF6]",
    bg: "bg-[#8B5CF6]/15",
    card: "border-l-4 border-l-[#8B5CF6] bg-[#8B5CF6]/5",
  },
];

export function StylistStatsCards({ stats }: { stats: StylistDashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statConfig.map((stat) => (
        <Card key={stat.key} className={`shadow-sm ${stat.card}`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className={`text-sm font-medium ${stat.color}`}>
              {stat.label}
            </CardTitle>
            <div
              className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}
            >
              <stat.icon className={`size-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${stat.color}`}>
              {stats[stat.key]}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
