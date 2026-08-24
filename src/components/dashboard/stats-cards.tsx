import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";
import { UserCheck, UserMinus, UserX, Users } from "lucide-react";

const statConfig = [
  {
    key: "total" as const,
    label: "Total Registered",
    icon: Users,
    color: "text-[#2563EB]",
    bg: "bg-[#2563EB]/10",
    card: "border-l-4 border-l-[#2563EB] bg-[#2563EB]/5",
  },
  {
    key: "active" as const,
    label: "Active Stylists",
    icon: UserCheck,
    color: "text-success",
    bg: "bg-success/15",
    card: "border-l-4 border-l-success bg-success/5",
  },
  {
    key: "relieved" as const,
    label: "Relieved Stylists",
    icon: UserMinus,
    color: "text-warning",
    bg: "bg-warning/15",
    card: "border-l-4 border-l-warning bg-warning/5",
  },
  {
    key: "absconded" as const,
    label: "Absconded Stylists",
    icon: UserX,
    color: "text-danger",
    bg: "bg-danger/15",
    card: "border-l-4 border-l-danger bg-danger/5",
  },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
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
