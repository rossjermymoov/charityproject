import { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className }: StatCardProps) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <p className={cn("text-sm mt-1", trendUp ? "text-green-600" : "text-red-600")}>
              {trend}
            </p>
          )}
        </div>
        <div className="rounded-full bg-indigo-50 p-3">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
      </div>
    </Card>
  );
}
