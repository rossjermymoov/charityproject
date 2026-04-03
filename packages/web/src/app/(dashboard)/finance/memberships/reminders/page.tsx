"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  Clock,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface ReminderStats {
  totalSent: number;
  byType: Record<string, number>;
  byDate: Array<{ date: string; count: number }>;
}

interface Reminder {
  id: string;
  membershipId: string;
  type: string;
  sentAt: string;
  createdAt: string;
  emailId: string | null;
  contact: {
    id: string;
    name: string;
    email: string | null;
  };
  membership: {
    memberNumber: string;
    status: string;
    endDate: string;
    membershipTypeName: string;
  };
}

interface ReminderHistoryResponse {
  success: boolean;
  data: Reminder[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const reminderTypeColors: Record<string, string> = {
  FIRST_REMINDER: "bg-blue-100 text-blue-800",
  SECOND_REMINDER: "bg-yellow-100 text-yellow-800",
  FINAL_REMINDER: "bg-orange-100 text-orange-800",
  EXPIRY_NOTICE: "bg-red-100 text-red-800",
  LAPSED_NOTICE: "bg-purple-100 text-purple-800",
};

const reminderTypeLabels: Record<string, string> = {
  FIRST_REMINDER: "First Reminder (30 days)",
  SECOND_REMINDER: "Second Reminder (14 days)",
  FINAL_REMINDER: "Final Reminder (7 days)",
  EXPIRY_NOTICE: "Expiry Notice (Today)",
  LAPSED_NOTICE: "Lapsed Notice (30 days after)",
};

export default function RemindersPage() {
  const [stats, setStats] = useState<ReminderStats | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [period, setPeriod] = useState<"today" | "week" | "month">("week");
  const [limit, setLimit] = useState(50);
  const [offset, setOffset] = useState(0);
  const [totalReminders, setTotalReminders] = useState(0);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  // Fetch stats
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(
          `/api/memberships/reminder-stats?period=${period}`
        );
        if (res.ok) {
          const data = await res.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    }

    fetchStats();
  }, [period]);

  // Fetch reminders
  useEffect(() => {
    async function fetchReminders() {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
        });

        if (selectedType) {
          params.append("type", selectedType);
        }

        const res = await fetch(
          `/api/memberships/reminder-history?${params.toString()}`
        );
        if (res.ok) {
          const data: ReminderHistoryResponse = await res.json();
          setReminders(data.data);
          setTotalReminders(data.pagination.total);
        }
      } catch (error) {
        console.error("Failed to fetch reminders:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchReminders();
  }, [limit, offset, selectedType]);

  const handleSendReminders = async () => {
    setSending(true);
    try {
      const res = await fetch("/api/memberships/send-reminders", {
        method: "POST",
      });

      if (res.ok) {
        const data = await res.json();
        alert(
          `Success! Sent ${data.data.totalSent} renewal reminders.`
        );

        // Refresh stats and reminders
        const statsRes = await fetch(
          `/api/memberships/reminder-stats?period=${period}`
        );
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        // Reset to first page of reminders
        setOffset(0);
        const remindersRes = await fetch(
          `/api/memberships/reminder-history?limit=${limit}&offset=0`
        );
        if (remindersRes.ok) {
          const remindersData: ReminderHistoryResponse = await remindersRes.json();
          setReminders(remindersData.data);
          setTotalReminders(remindersData.pagination.total);
        }
      } else {
        const error = await res.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error("Failed to send reminders:", error);
      alert("Failed to send reminders. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const hasMore = offset + limit < totalReminders;
  const hasPrevious = offset > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Membership Renewal Reminders
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and track automatic renewal reminder emails
          </p>
        </div>
        <Button
          onClick={handleSendReminders}
          disabled={sending}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Mail className="h-4 w-4 mr-2" />
          {sending ? "Sending..." : "Send Reminders"}
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Sent
                </p>
                <p className="text-3xl font-bold text-gray-900 mt-1">
                  {stats.totalSent}
                </p>
              </div>
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
          </Card>

          <Card className="p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  First Reminders
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-1">
                  {stats.byType.FIRST_REMINDER || 0}
                </p>
              </div>
              <Clock className="h-5 w-5 text-blue-400" />
            </div>
          </Card>

          <Card className="p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Final Reminders
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-1">
                  {stats.byType.FINAL_REMINDER || 0}
                </p>
              </div>
              <AlertCircle className="h-5 w-5 text-orange-400" />
            </div>
          </Card>

          <Card className="p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Notices
                </p>
                <p className="text-3xl font-bold text-red-600 mt-1">
                  {stats.byType.EXPIRY_NOTICE || 0}
                </p>
              </div>
              <CheckCircle className="h-5 w-5 text-red-400" />
            </div>
          </Card>

          <Card className="p-4 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lapsed Notices
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {stats.byType.LAPSED_NOTICE || 0}
                </p>
              </div>
              <RefreshCw className="h-5 w-5 text-purple-400" />
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              <Calendar className="h-4 w-4 inline mr-2" />
              Time Period
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as "today" | "week" | "month")}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-2">
              Filter by Type
            </label>
            <select
              value={selectedType || ""}
              onChange={(e) => {
                setSelectedType(e.target.value || null);
                setOffset(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="FIRST_REMINDER">First Reminder (30 days)</option>
              <option value="SECOND_REMINDER">Second Reminder (14 days)</option>
              <option value="FINAL_REMINDER">Final Reminder (7 days)</option>
              <option value="EXPIRY_NOTICE">Expiry Notice</option>
              <option value="LAPSED_NOTICE">Lapsed Notice</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reminders Table */}
      <Card className="rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member #
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Membership Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reminder Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sent Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {reminders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <p className="text-gray-500">No reminders sent yet.</p>
                  </td>
                </tr>
              ) : (
                reminders.map((reminder) => (
                  <tr
                    key={reminder.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link
                        href={`/finance/contacts/${reminder.contact.id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {reminder.contact.name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {reminder.contact.email || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <Link
                        href={`/finance/memberships/${reminder.membershipId}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {reminder.membership.memberNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {reminder.membership.membershipTypeName}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        className={`text-xs font-medium ${
                          reminderTypeColors[reminder.type] ||
                          "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {reminderTypeLabels[reminder.type] || reminder.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(new Date(reminder.sentAt))}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDate(new Date(reminder.membership.endDate))}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalReminders > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {offset + 1} to {Math.min(offset + limit, totalReminders)} of{" "}
              {totalReminders} reminders
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!hasPrevious || loading}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                Previous
              </Button>

              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore || loading}
                onClick={() => setOffset(offset + limit)}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Help Section */}
      <Card className="p-6 rounded-lg bg-blue-50 border border-blue-200">
        <div className="flex gap-4">
          <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">How Reminders Work</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>
                <strong>First Reminder (30 days):</strong> Sent 30 days before
                membership expiry
              </li>
              <li>
                <strong>Second Reminder (14 days):</strong> Sent 14 days before
                expiry
              </li>
              <li>
                <strong>Final Reminder (7 days):</strong> Sent 7 days before
                expiry
              </li>
              <li>
                <strong>Expiry Notice:</strong> Sent on the day the membership
                expires
              </li>
              <li>
                <strong>Lapsed Notice:</strong> Sent 30 days after membership
                has expired
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
