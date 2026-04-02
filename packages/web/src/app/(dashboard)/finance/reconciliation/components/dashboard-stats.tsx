'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, AlertCircle, Eye, TrendingUp } from 'lucide-react';

interface DashboardStatsProps {
  stats: {
    totalTransactions: number;
    matchedCount: number;
    unmatchedCount: number;
    excludedCount: number;
    matchRate: number;
  };
  sessionId: string;
  onStatsUpdate: (stats: any) => void;
}

export function DashboardStats({
  stats,
  sessionId,
  onStatsUpdate,
}: DashboardStatsProps) {
  const [detailedStats, setDetailedStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch(`/api/reconciliation/stats?sessionId=${sessionId}`);
        const data = await response.json();
        setDetailedStats(data.stats);
        onStatsUpdate(data.stats);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [sessionId, onStatsUpdate]);

  if (loading) {
    return null;
  }

  const statCards = [
    {
      label: 'Total Transactions',
      value: detailedStats?.totalTransactions || 0,
      icon: Eye,
      color: 'bg-blue-50 text-blue-600',
    },
    {
      label: 'Matched',
      value: detailedStats?.matchedCount || 0,
      icon: CheckCircle2,
      color: 'bg-green-50 text-green-600',
      subtext: `£${(detailedStats?.matchedAmount || 0).toFixed(2)}`,
    },
    {
      label: 'Unmatched',
      value: detailedStats?.unmatchedCount || 0,
      icon: AlertCircle,
      color: 'bg-amber-50 text-amber-600',
      subtext: `£${(detailedStats?.unmatchedAmount || 0).toFixed(2)}`,
    },
    {
      label: 'Match Rate',
      value: `${detailedStats?.matchRate || 0}%`,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {card.value}
                  </p>
                  {card.subtext && (
                    <p className="text-xs text-gray-500 mt-1">{card.subtext}</p>
                  )}
                </div>
                <div className={`${card.color} p-2 rounded-lg`}>
                  <Icon className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
