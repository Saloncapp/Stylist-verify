import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardStats } from "@/types";
import { UserCheck, UserMinus, UserX, Users } from "lucide-react";

const statConfig = [
  {
    key: "total" as const,
    label: "Total Registered",
    icon: Users,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    key: "active" as const,
    label: "Active Stylists",
    icon: UserCheck,
    color: "text-success",
    bg: "bg-success/10",
  },
  {
    key: "relieved" as const,
    label: "Relieved Stylists",
    icon: UserMinus,
    color: "text-warning",
    bg: "bg-warning/10",
  },
  {
    key: "absconded" as const,
    label: "Absconded Stylists",
    icon: UserX,
    color: "text-danger",
    bg: "bg-danger/10",
  },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {statConfig.map((stat) => (
        <Card key={stat.key} className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </CardTitle>
            <div className={`flex size-9 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`size-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats[stat.key]}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
