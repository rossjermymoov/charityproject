"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Play } from "lucide-react";


interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastTriggeredAt: string | null;
  failCount: number;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

const WEBHOOK_EVENTS = [
  { value: "CONTACT_CREATED", label: "Contact Created" },
  { value: "CONTACT_UPDATED", label: "Contact Updated" },
  { value: "DONATION_CREATED", label: "Donation Created" },
  { value: "MEMBERSHIP_CREATED", label: "Membership Created" },
  { value: "MEMBERSHIP_RENEWED", label: "Membership Renewed" },
  { value: "EVENT_REGISTERED", label: "Event Registered" },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    events: [] as string[],
    secret: "",
  });

  useEffect(() => {
    fetchWebhooks();
  }, []);

  const fetchWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks");
      if (!res.ok) throw new Error("Failed to fetch webhooks");
      const data = await res.json();
      setWebhooks(data);
    } catch (error) {
      console.error("Failed to load webhooks");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url || formData.events.length === 0) {
      console.error("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          events: formData.events,
        }),
      });

      if (!res.ok) throw new Error("Failed to create webhook");

      ;
      setFormData({ name: "", url: "", events: [], secret: "" });
      setShowForm(false);
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to create webhook");
      console.error(error);
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm("Are you sure you want to delete this webhook?")) return;

    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete webhook");

      ;
      fetchWebhooks();
    } catch (error) {
      console.error("Failed to delete webhook");
      console.error(error);
    }
  };

  const handleTestWebhook = async (id: string) => {
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        ;
      } else {
        console.error(data.message || "Failed to send test webhook");
      }
    } catch (error) {
      console.error("Failed to send test webhook");
      console.error(error);
    }
  };

  const toggleEventSelection = (event: string) => {
    setFormData((prev) => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter((e) => e !== event)
        : [...prev.events, event],
    }));
  };

  if (isLoading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Webhooks</h1>
          <p className="text-gray-600 mt-1">
            Send real-time notifications to external systems
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Webhook
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h2 className="text-lg font-semibold mb-4">Create Webhook</h2>
          <form onSubmit={handleCreateWebhook} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Slack Notifications"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
              />
            </div>

            <div>
              <Label htmlFor="url">Webhook URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/webhook"
                value={formData.url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, url: e.target.value }))
                }
              />
            </div>

            <div>
              <Label>Events to Subscribe to</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {WEBHOOK_EVENTS.map((event) => (
                  <label key={event.value} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.events.includes(event.value)}
                      onChange={() => toggleEventSelection(event.value)}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm">{event.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="secret">Secret (Optional)</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Leave empty to auto-generate"
                value={formData.secret}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, secret: e.target.value }))
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Used to sign webhook payloads with HMAC-SHA256
              </p>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowForm(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Create Webhook</Button>
            </div>
          </form>
        </div>
      )}

      {webhooks.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No webhooks configured yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map((webhook) => (
            <div
              key={webhook.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{webhook.name}</h3>
                  <p className="text-sm text-gray-600">{webhook.url}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTestWebhook(webhook.id)}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Test
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteWebhook(webhook.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Status</p>
                  <p className={webhook.isActive ? "text-green-600" : "text-red-600"}>
                    {webhook.isActive ? "Active" : "Inactive"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Events</p>
                  <p className="text-xs">
                    {webhook.events.length > 0
                      ? (webhook.events as string[]).join(", ")
                      : "No events"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Last Triggered</p>
                  <p>
                    {webhook.lastTriggeredAt
                      ? new Date(webhook.lastTriggeredAt).toLocaleDateString()
                      : "Never"}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Failed Deliveries</p>
                  <p>{webhook.failCount}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
