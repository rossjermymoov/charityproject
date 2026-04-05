"use client";

import { formatDate, formatShortDate } from '@/lib/utils';

import { useRef } from "react";
import {
  MapPin,
  Coins,
  Clock,
  TrendingUp,
  Award,
  BarChart3,
  User,
  Calendar,
  Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type RouteStats = {
  routeName: string;
  routeDescription: string | null;
  completedDate: string | null;
  startedDate: string | null;
  volunteer: string | null;
  totalStops: number;
  completedStops: number;
  skippedStops: number;
  totalTinsCounted: number;
  totalCollected: number;
  avgPerTin: number;
  highestAmount: number;
  highestTinNumber: string;
  lowestAmount: number;
  lowestTinNumber: string;
  durationHours: number | null;
  typeBreakdown: {
    type: string;
    count: number;
    total: number;
    avg: number;
  }[];
  distribution: {
    stopNumber: number;
    amount: number;
    tinNumber: string;
    location: string;
  }[];
  topEarners: {
    tinNumber: string;
    amount: number;
    location: string;
    type: string;
  }[];
};

const typeEmojis: Record<string, string> = {
  PUB: "🍺",
  RESTAURANT: "🍽️",
  SHOP: "🛍️",
  CHURCH: "⛪",
  OFFICE: "🏢",
  OTHER: "📍",
};

const typeColors: Record<string, string> = {
  PUB: "#f59e0b",
  RESTAURANT: "#ef4444",
  SHOP: "#3b82f6",
  CHURCH: "#8b5cf6",
  OFFICE: "#6b7280",
  OTHER: "#10b981",
};

export function RouteInfographic({ stats }: { stats: RouteStats }) {
  const infographicRef = useRef<HTMLDivElement>(null);
  const maxAmount = Math.max(...stats.distribution.map((d) => d.amount), 1);

  const completionRate =
    stats.totalStops > 0
      ? Math.round((stats.completedStops / stats.totalStops) * 100)
      : 0;

  const totalTypeAmount = stats.typeBreakdown.reduce(
    (sum, t) => sum + t.total,
    0
  );

  const formattedDate = stats.completedDate
    ? formatDate(stats.completedDate)
    : "—";

  return (
    <div className="space-y-4">
      {/* Print button */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => window.print()}
        >
          <Download className="h-4 w-4 mr-2" />
          Print / Save PDF
        </Button>
      </div>

      <div
        ref={infographicRef}
        className="bg-white rounded-2xl border overflow-hidden print:border-0"
      >
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-indigo-200 text-sm font-medium uppercase tracking-wider">
                Route Collection Report
              </p>
              <h2 className="text-3xl font-bold mt-1">{stats.routeName}</h2>
              {stats.routeDescription && (
                <p className="text-indigo-100 mt-1 text-sm max-w-lg">
                  {stats.routeDescription}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-indigo-100">
                {stats.volunteer && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {stats.volunteer}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formattedDate}
                </span>
                {stats.durationHours && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {stats.durationHours}h on road
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-5xl font-bold">
                £{stats.totalCollected.toFixed(2)}
              </p>
              <p className="text-indigo-200 text-sm mt-1">Total Collected</p>
            </div>
          </div>
        </div>

        {/* Key metrics */}
        <div className="grid grid-cols-5 divide-x border-b">
          {[
            {
              icon: <MapPin className="h-5 w-5 text-indigo-500" />,
              value: `${stats.completedStops}/${stats.totalStops}`,
              label: "Stops Completed",
              sub: `${completionRate}% rate`,
            },
            {
              icon: <Coins className="h-5 w-5 text-amber-500" />,
              value: stats.totalTinsCounted.toString(),
              label: "Tins Counted",
              sub: `${stats.skippedStops} skipped`,
            },
            {
              icon: <TrendingUp className="h-5 w-5 text-green-500" />,
              value: `£${stats.avgPerTin.toFixed(2)}`,
              label: "Avg Per Tin",
              sub: "across all locations",
            },
            {
              icon: <Award className="h-5 w-5 text-yellow-500" />,
              value: `£${stats.highestAmount.toFixed(2)}`,
              label: "Highest Tin",
              sub: stats.highestTinNumber,
            },
            {
              icon: <BarChart3 className="h-5 w-5 text-red-500" />,
              value: `£${stats.lowestAmount.toFixed(2)}`,
              label: "Lowest Tin",
              sub: stats.lowestTinNumber,
            },
          ].map((metric, i) => (
            <div key={i} className="p-5 text-center">
              <div className="flex justify-center mb-2">{metric.icon}</div>
              <p className="text-2xl font-bold text-gray-900">{metric.value}</p>
              <p className="text-sm text-gray-600">{metric.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{metric.sub}</p>
            </div>
          ))}
        </div>

        {/* Charts section */}
        <div className="grid grid-cols-2 divide-x border-b">
          {/* Amount per tin bar chart */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-500" />
              Collection by Tin
            </h3>
            <div className="space-y-1.5">
              {stats.distribution.slice(0, 15).map((d) => (
                <div key={d.stopNumber} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-14 truncate font-mono">
                    {d.tinNumber}
                  </span>
                  <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 transition-all"
                      style={{
                        width: `${(d.amount / maxAmount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-14 text-right">
                    £{d.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              {stats.distribution.length > 15 && (
                <p className="text-xs text-gray-400 text-center pt-1">
                  +{stats.distribution.length - 15} more tins
                </p>
              )}
            </div>
          </div>

          {/* Type breakdown */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Coins className="h-4 w-4 text-amber-500" />
              Collection by Location Type
            </h3>
            {/* Donut-style visual */}
            <div className="flex items-center gap-6">
              <div className="w-32 h-32 relative flex-shrink-0">
                <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
                  {(() => {
                    let offset = 0;
                    return stats.typeBreakdown.map((tb) => {
                      const pct =
                        totalTypeAmount > 0
                          ? (tb.total / totalTypeAmount) * 100
                          : 0;
                      const el = (
                        <circle
                          key={tb.type}
                          cx="18"
                          cy="18"
                          r="14"
                          fill="none"
                          stroke={typeColors[tb.type] || "#94a3b8"}
                          strokeWidth="4"
                          strokeDasharray={`${pct} ${100 - pct}`}
                          strokeDashoffset={-offset}
                        />
                      );
                      offset += pct;
                      return el;
                    });
                  })()}
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-lg font-bold text-gray-900">
                      {stats.typeBreakdown.length}
                    </p>
                    <p className="text-xs text-gray-500">types</p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 flex-1">
                {stats.typeBreakdown
                  .sort((a, b) => b.total - a.total)
                  .map((tb) => (
                    <div key={tb.type} className="flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            typeColors[tb.type] || "#94a3b8",
                        }}
                      />
                      <span className="text-sm flex-1">
                        {typeEmojis[tb.type] || "📍"} {tb.type}
                      </span>
                      <span className="text-sm font-medium">
                        £{tb.total.toFixed(2)}
                      </span>
                      <span className="text-xs text-gray-400">
                        ({tb.count} tins, avg £{tb.avg.toFixed(2)})
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top earners */}
        {stats.topEarners.length > 0 && (
          <div className="p-6 border-b">
            <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-yellow-500" />
              Top 5 Earning Locations
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {stats.topEarners.map((earner, i) => (
                <div
                  key={earner.tinNumber}
                  className={`text-center p-4 rounded-xl ${
                    i === 0
                      ? "bg-gradient-to-b from-yellow-50 to-yellow-100 border-2 border-yellow-300"
                      : i === 1
                        ? "bg-gradient-to-b from-gray-50 to-gray-100 border border-gray-300"
                        : i === 2
                          ? "bg-gradient-to-b from-amber-50 to-amber-100 border border-amber-300"
                          : "bg-gray-50 border border-gray-200"
                  }`}
                >
                  <div className="text-2xl mb-1">
                    {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    £{earner.amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-600 truncate mt-1">
                    {earner.location}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">
                    {earner.tinNumber}
                  </p>
                  <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-white text-gray-600">
                    {typeEmojis[earner.type] || ""} {earner.type}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI insights */}
        <div className="p-6 bg-gradient-to-r from-indigo-50 to-purple-50">
          <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            ✨ Route Insights
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="font-medium text-gray-900 mb-1">💰 Revenue Efficiency</p>
              <p>
                {stats.durationHours
                  ? `This route generated £${(stats.totalCollected / stats.durationHours).toFixed(2)}/hour on the road.`
                  : `This route generated £${stats.totalCollected.toFixed(2)} across ${stats.totalTinsCounted} tins.`}
                {stats.avgPerTin > 15
                  ? " Above average — these are high-value locations worth prioritising."
                  : stats.avgPerTin > 5
                    ? " Decent returns — consider more frequent collection for the top performers."
                    : " Below average — some locations may need reassessing."}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="font-medium text-gray-900 mb-1">📊 Best Performers</p>
              <p>
                {stats.typeBreakdown.length > 0
                  ? `${
                      stats.typeBreakdown.sort((a, b) => b.avg - a.avg)[0]
                        ?.type || "Unknown"
                    } locations had the highest average at £${
                      stats.typeBreakdown.sort((a, b) => b.avg - a.avg)[0]
                        ?.avg.toFixed(2) || "0"
                    } per tin.`
                  : "No type data available."}{" "}
                {stats.highestAmount > stats.avgPerTin * 2
                  ? `Standout tin ${stats.highestTinNumber} collected ${(stats.highestAmount / stats.avgPerTin).toFixed(1)}x the average.`
                  : "Collections were fairly consistent across locations."}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="font-medium text-gray-900 mb-1">🎯 Completion Rate</p>
              <p>
                {completionRate === 100
                  ? "Perfect route — every stop was completed! Great work."
                  : completionRate >= 80
                    ? `Strong completion at ${completionRate}%. ${stats.skippedStops} stops were skipped — review access notes for next time.`
                    : `${completionRate}% completion rate. Consider adjusting the route — ${stats.skippedStops} stops couldn't be reached.`}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <p className="font-medium text-gray-900 mb-1">🔄 Recommendation</p>
              <p>
                {stats.avgPerTin > 10
                  ? "High-value route. Schedule for collection every 4-6 weeks to maximise returns."
                  : stats.avgPerTin > 5
                    ? "Moderate-value route. Monthly collection should work well. Consider adding nearby high-traffic locations."
                    : "Lower-yield route. Consider collecting every 6-8 weeks, or replacing underperforming locations with busier alternatives."}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 text-xs text-gray-400 flex items-center justify-between">
          <span>DeepCharity Route Report · Generated {formatDate(new Date())}</span>
          <span>
            {stats.totalTinsCounted} tins · £{stats.totalCollected.toFixed(2)} ·{" "}
            {completionRate}% completion
          </span>
        </div>
      </div>
    </div>
  );
}
