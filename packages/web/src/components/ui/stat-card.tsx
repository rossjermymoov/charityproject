import { LucideIcon } from "lucide-react";
import { Card } from "./card";
import { cn } from "@/lib/utils";
import Link from "next/link";

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
      <div className="rounded-full bg-indigo-50 p-3">
        <Icon className="h-6 w-6 text-indigo-600" />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href}>
        <Card
          className={cn(
            "p-6 transition-all hover:bg-gray-50 cursor-pointer",
            "border border-indigo-100 shadow-[0_0_0_1px_rgba(79,70,229,0.08),0_1px_3px_rgba(79,70,229,0.06)]",
            "hover:shadow-[0_0_0_1px_rgba(79,70,229,0.15),0_4px_12px_rgba(79,70,229,0.1)]",
            "hover:border-indigo-200",
            className
          )}
          style={{
            borderColor: "color-mix(in srgb, var(--brand-primary, #4f46e5) 20%, #e5e7eb)",
            boxShadow: "0 0 0 1px color-mix(in srgb, var(--brand-primary, #4f46e5) 8%, transparent), 0 1px 3px color-mix(in srgb, var(--brand-primary, #4f46e5) 6%, transparent)",
          }}
        >
          {content}
        </Card>
      </Link>
    );
  }

  return (
    <Card
      className={cn("p-6", className)}
      style={{
        borderColor: "color-mix(in srgb, var(--brand-primary, #4f46e5) 20%, #e5e7eb)",
        boxShadow: "0 0 0 1px color-mix(in srgb, var(--brand-primary, #4f46e5) 8%, transparent), 0 1px 3px color-mix(in srgb, var(--brand-primary, #4f46e5) 6%, transparent)",
      }}
    >
      {content}
    </Card>
  );
}
