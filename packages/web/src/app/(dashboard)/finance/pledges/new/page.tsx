"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NewPledgePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactOptions, setContactOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [campaignOptions, setCampaignOptions] = useState<
    { value: string; label: string }[]
  >([]);

  const [formData, setFormData] = useState({
    contactId: "",
    campaignId: "",
    amount: "",
    currency: "GBP",
    frequency: "ONE_TIME",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    reminderFrequency: "",
    notes: "",
  });

  // Fetch contacts for autocomplete
  const handleContactSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setContactOptions([]);
      return;
    }

    try {
      const res = await fetch(`/api/contacts/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      setContactOptions(
        (data.contacts || []).map((contact: any) => ({
          value: contact.id,
          label: `${contact.firstName} ${contact.lastName}${
            contact.email ? ` (${contact.email})` : ""
          }`,
        }))
      );
    } catch (err) {
      console.error("Contact search error:", err);
    }
  };

  // Fetch campaigns for autocomplete
  const handleCampaignSearch = async (query: string) => {
    if (!query || query.length < 2) {
      setCampaignOptions([]);
      return;
    }

    try {
      const res = await fetch(`/api/campaigns/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      setCampaignOptions(
        (data.campaigns || []).map((campaign: any) => ({
          value: campaign.id,
          label: campaign.name,
        }))
      );
    } catch (err) {
      console.error("Campaign search error:", err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/pledges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: formData.contactId,
          campaignId: formData.campaignId || undefined,
          amount: formData.amount,
          currency: formData.currency,
          frequency: formData.frequency,
          startDate: formData.startDate,
          endDate: formData.endDate || undefined,
          reminderFrequency: formData.reminderFrequency || undefined,
          notes: formData.notes || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create pledge");
      }

      const pledge = await res.json();
      router.push(`/finance/pledges/${pledge.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New Pledge</h1>
        <p className="text-gray-500 mt-1">Create a new pledge commitment</p>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Contact *
              </label>
              <input
                type="text"
                placeholder="Search for a contact..."
                onChange={(e) => {
                  handleContactSearch(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              {contactOptions.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {contactOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          contactId: option.value,
                        }));
                        setContactOptions([]);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {formData.contactId && (
                <p className="text-sm text-gray-500 mt-1">
                  ✓ Contact selected
                </p>
              )}
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount *
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                  className="flex-1"
                />
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      currency: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="GBP">£ GBP</option>
                  <option value="USD">$ USD</option>
                  <option value="EUR">€ EUR</option>
                </select>
              </div>
            </div>

            {/* Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Frequency *
              </label>
              <select
                value={formData.frequency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    frequency: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="ONE_TIME">One-time</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="ANNUALLY">Annually</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Date *
              </label>
              <Input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Date
              </label>
              <Input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>

            {/* Reminder Frequency */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reminder Frequency
              </label>
              <select
                value={formData.reminderFrequency}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    reminderFrequency: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">No Reminders</option>
                <option value="WEEKLY">Weekly</option>
                <option value="MONTHLY">Monthly</option>
                <option value="QUARTERLY">Quarterly</option>
              </select>
            </div>

            {/* Campaign */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Campaign
              </label>
              <input
                type="text"
                placeholder="Search for a campaign..."
                onChange={(e) => {
                  handleCampaignSearch(e.target.value);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {campaignOptions.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg max-h-48 overflow-y-auto">
                  {campaignOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          campaignId: option.value,
                        }));
                        setCampaignOptions([]);
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              {formData.campaignId && (
                <p className="text-sm text-gray-500 mt-1">
                  ✓ Campaign selected
                </p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Add any additional notes..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading || !formData.contactId || !formData.amount}>
              {loading ? "Creating..." : "Create Pledge"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
