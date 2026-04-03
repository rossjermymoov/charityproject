"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Send, MessageCircle, CheckCircle, AlertCircle, Clock } from "lucide-react";
import type { SmsMessage } from "@prisma/client";

interface SmsMessageWithContact extends SmsMessage {
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
}

const statusColors: Record<string, string> = {
  QUEUED: "bg-blue-100 text-blue-800",
  SENT: "bg-green-100 text-green-800",
  DELIVERED: "bg-blue-100 text-blue-800",
  FAILED: "bg-red-100 text-red-800",
};

const statusIcons: Record<string, React.ReactNode> = {
  QUEUED: <Clock className="h-4 w-4" />,
  SENT: <Send className="h-4 w-4" />,
  DELIVERED: <CheckCircle className="h-4 w-4" />,
  FAILED: <AlertCircle className="h-4 w-4" />,
};

export default function SmsDashboardPage() {
  const [messages, setMessages] = useState<SmsMessageWithContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    sent: 0,
    delivered: 0,
    failed: 0,
  });

  useEffect(() => {
    fetchMessages();
  }, []);

  async function fetchMessages() {
    try {
      setLoading(true);
      const response = await fetch("/api/sms/messages?limit=50");
      if (!response.ok) throw new Error("Failed to fetch messages");

      const data = await response.json();
      setMessages(data.messages);

      // Calculate stats
      const total = data.total;
      const sent = data.messages.filter(
        (m: SmsMessageWithContact) => m.status === "SENT"
      ).length;
      const delivered = data.messages.filter(
        (m: SmsMessageWithContact) => m.status === "DELIVERED"
      ).length;
      const failed = data.messages.filter(
        (m: SmsMessageWithContact) => m.status === "FAILED"
      ).length;

      setStats({ total, sent, delivered, failed });
    } catch (error) {
      console.error("Error fetching SMS messages:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">SMS Messaging</h1>
          <p className="text-gray-500 mt-1">Send and manage SMS communications</p>
        </div>
        <Link href="/communications/sms/compose">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Compose SMS
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-500">Total Messages</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-green-600">Sent</p>
            <p className="text-3xl font-bold text-green-900 mt-2">{stats.sent}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-blue-600">Delivered</p>
            <p className="text-3xl font-bold text-blue-900 mt-2">{stats.delivered}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-red-600">Failed</p>
            <p className="text-3xl font-bold text-red-900 mt-2">{stats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Messages Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Messages</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">No messages yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direction
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {messages.map((msg) => (
                    <tr key={msg.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {msg.contact ? (
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {msg.contact.firstName} {msg.contact.lastName}
                            </p>
                            <p className="text-xs text-gray-500">{msg.to}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-900">{msg.to}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-700 truncate max-w-xs">
                          {msg.body}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium gap-2 ${statusColors[msg.status]}`}
                        >
                          {statusIcons[msg.status]}
                          {msg.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {msg.direction}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(msg.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Templates Quick Access */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>SMS Templates</CardTitle>
          <Link href="/communications/sms/templates">
            <Button variant="outline" size="sm">
              Manage Templates
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">
            Create and manage reusable SMS templates with variable placeholders
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
