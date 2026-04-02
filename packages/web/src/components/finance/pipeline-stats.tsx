"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, Target, Award } from "lucide-react";

interface Stats {
  totalOpenPipeline: number;
  totalWeightedPipeline: number;
  countByStage: Record<string, number>;
  averageDealSize: number;
  conversionRate: string;
  topOpportunities: Array<{
    id: string;
    amount: number;
    stage: string;
  }>;
  statsPerStage: Record<
    string,
    {
      count: number;
      totalValue: number;
      weightedValue: number;
      avgDealSize: number;
    }
  >;
  totalOpportunities: number;
}

export function PipelineStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/opportunities/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-4 bg-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Pipeline Value",
      value: `£${stats.totalOpenPipeline.toFixed(0)}`,
      icon: Target,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Weighted Pipeline",
      value: `£${stats.totalWeightedPipeline.toFixed(0)}`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Average Deal Size",
      value: `£${stats.averageDealSize.toFixed(0)}`,
      icon: BarChart3,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: Award,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <Card key={idx} className={`p-4 ${stat.bg}`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {stat.value}
                </p>
              </div>
              <Icon className={`h-5 w-5 ${stat.color}`} />
            </div>
          </Card>
        );
      })}
    </div>
  );
}
