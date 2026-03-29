import { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  className?: string;
  href?: string;
}

export function StatCard({ title, value, icon: Icon, trend, trendUp, className, href }: StatCardProps) {
  const content = (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {trend && (
          <p className={cn("text-sm mt-1", trendUp ? "text-green-600" : trendUp === false ? "text-red-600" : "text-gray-500")}>
            {trend}
          </p>
        )}
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="rounded-full bg-indigo-50 p-3">
          <Icon className="h-6 w-6 text-indigo-600" />
        </div>
        {href && (
          <ArrowUpRight className="h-3 w-3 text-gray-400" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card className={cn("p-6 transition-colors hover:bg-gray-50 hover:border-indigo-200 cursor-pointer", className)}>
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card className={cn("p-6", className)}>
      {content}
    </Card>
  );
}
