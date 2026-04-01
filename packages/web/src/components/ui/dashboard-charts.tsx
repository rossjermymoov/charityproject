"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
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

/**
 * Read the brand primary colour from the CSS custom property set by BrandingProvider.
 * Falls back to the default indigo-600 if not available.
 */
function useBrandColor(): string {
  const [color, setColor] = useState("#4f46e5");
  useEffect(() => {
    const el = document.querySelector("[style*='--brand-primary']") as HTMLElement | null;
    if (el) {
      const val = getComputedStyle(el).getPropertyValue("--brand-primary").trim();
      if (val) setColor(val);
    }
  }, []);
  return color;
}

/**
 * Mix a hex colour with white at a given ratio (0-1 where 1 = full colour).
 */
function mixWithWhite(hex: string, ratio: number): string {
  const h = hex.replace("#", "");
  const r = Math.round(parseInt(h.substring(0, 2), 16) * ratio + 255 * (1 - ratio));
  const g = Math.round(parseInt(h.substring(2, 4), 16) * ratio + 255 * (1 - ratio));
  const b = Math.round(parseInt(h.substring(4, 6), 16) * ratio + 255 * (1 - ratio));
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export function DonationsChart({ data }: { data: MonthlyDonation[] }) {
  const brand = useBrandColor();
  const secondary = "#d1d5db"; // gray-300 neutral

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
        <Legend
          verticalAlign="bottom"
          height={36}
          formatter={(value: any) => <span className="text-xs text-gray-600">{value}</span>}
        />
        <Bar dataKey="total" name="Donations" fill={brand} radius={[4, 4, 0, 0]} />
        <Bar dataKey="giftAid" name="Gift Aid" fill={secondary} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonationTypePie({ data }: { data: DonationTypeBreakdown[] }) {
  const brand = useBrandColor();

  if (data.every((d) => d.value === 0)) {
    return (
      <div className="flex items-center justify-center h-[250px] text-sm text-gray-500">
        No donation data yet
      </div>
    );
  }

  // Sort descending so largest value gets the primary colour
  const sorted = [...data].filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

  // Assign colours: primary for largest, progressively lighter/neutral for the rest
  const getBarColor = (index: number) => {
    if (index === 0) return brand;
    if (index === 1) return mixWithWhite(brand, 0.5);
    return "#d1d5db"; // neutral gray for tertiary+
  };

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart
        data={sorted}
        layout="vertical"
        margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `£${v}`} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
        <Tooltip formatter={(value: any) => `£${Number(value).toFixed(2)}`} />
        <Bar dataKey="value" name="Amount" radius={[0, 4, 4, 0]}>
          {sorted.map((_, index) => (
            <Cell key={`cell-${index}`} fill={getBarColor(index)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function VolunteerHoursChart({ data }: { data: VolunteerHoursMonthly[] }) {
  const brand = useBrandColor();

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: any) => [`${Number(value).toFixed(1)} hrs`, "Hours"]} />
        <Bar dataKey="hours" name="Hours" fill={brand} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
