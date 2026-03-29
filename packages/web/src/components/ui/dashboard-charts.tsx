"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";

interface MonthlyDonation {
  month: string;
  total: number;
  giftAid: number;
  count: number;
}

interface DonationTypeBreakdown {
  name: string;
  value: number;
}

interface VolunteerHoursMonthly {
  month: string;
  hours: number;
}

const COLORS = ["#6366F1", "#22C55E", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316"];

export function DonationsChart({ data }: { data: MonthlyDonation[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `£${v}`} />
        <Tooltip
          formatter={(value: any, name: any) => [
            `£${Number(value).toFixed(2)}`,
            name === "Donations" ? "Donations" : "Gift Aid",
          ]}
          labelStyle={{ fontWeight: 600 }}
        />
        <Bar dataKey="total" name="Donations" fill="#6366F1" radius={[4, 4, 0, 0]} />
        <Bar dataKey="giftAid" name="Gift Aid" fill="#22C55E" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonationTypePie({ data }: { data: DonationTypeBreakdown[] }) {
  if (data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-[250px] text-sm text-gray-500">
        No donation data yet
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie
          data={data.filter((d) => d.value > 0)}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={90}
          paddingAngle={3}
          dataKey="value"
        >
          {data
            .filter((d) => d.value > 0)
            .map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
        </Pie>
        <Tooltip formatter={(value: any) => `£${Number(value).toFixed(2)}`} />
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: any) => <span className="text-xs text-gray-600">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function VolunteerHoursChart({ data }: { data: VolunteerHoursMonthly[] }) {
  return (
    <ResponsiveContainer width="100%" height={250}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)} hrs`, "Hours"]} />
        <Area
          type="monotone"
          dataKey="hours"
          stroke="#8B5CF6"
          fill="#8B5CF6"
          fillOpacity={0.15}
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
