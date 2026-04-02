"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

const STAGES = [
  { id: "IDENTIFICATION", label: "Identification" },
  { id: "QUALIFICATION", label: "Qualification" },
  { id: "CULTIVATION", label: "Cultivation" },
  { id: "SOLICITATION", label: "Solicitation" },
  { id: "NEGOTIATION", label: "Negotiation" },
  { id: "CLOSED_WON", label: "Closed Won" },
  { id: "CLOSED_LOST", label: "Closed Lost" },
];

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
}

interface Campaign {
  id: string;
  name: string;
}

interface User {
  id: string;
  name: string;
  email: string;
}

interface OpportunityFormProps {
  contacts: Contact[];
  campaigns: Campaign[];
  users: User[];
  initialData?: any;
}

export function OpportunityForm({
  contacts,
  campaigns,
  users,
  initialData,
}: OpportunityFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    contactId: initialData?.contactId || "",
    name: initialData?.name || "",
    description: initialData?.description || "",
    stage: initialData?.stage || "IDENTIFICATION",
    amount: initialData?.amount || "",
    probability: initialData?.probability || 10,
    expectedCloseDate: initialData?.expectedCloseDate?.split("T")[0] || "",
    campaignId: initialData?.campaignId || "",
    assignedToId: initialData?.assignedToId || "",
    notes: initialData?.notes || "",
  });

  const [filteredContacts, setFilteredContacts] = useState<Contact[]>(contacts);
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleContactSearch = (value: string) => {
    setSearchTerm(value);
    if (value.trim() === "") {
      setFilteredContacts(contacts);
    } else {
      const filtered = contacts.filter(
        (c) =>
          c.firstName.toLowerCase().includes(value.toLowerCase()) ||
          c.lastName.toLowerCase().includes(value.toLowerCase()) ||
          c.email?.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredContacts(filtered);
    }
  };

  const handleContactSelect = (contact: Contact) => {
    setFormData({ ...formData, contactId: contact.id });
    setShowContactDropdown(false);
    setSearchTerm("");
    setFilteredContacts(contacts);
  };

  const selectedContact = contacts.find((c) => c.id === formData.contactId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        contactId: formData.contactId,
        name: formData.name,
        description: formData.description || null,
        stage: formData.stage,
        amount: parseFloat(formData.amount || "0"),
        probability: parseInt(formData.probability),
        expectedCloseDate: formData.expectedCloseDate || null,
        campaignId: formData.campaignId || null,
        assignedToId: formData.assignedToId || null,
        notes: formData.notes || null,
      };

      const url = initialData
        ? `/api/opportunities/${initialData.id}`
        : "/api/opportunities";
      const method = initialData ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save opportunity");
      }

      const saved = await response.json();
      router.push(`/finance/pipeline/${saved.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-red-900">Error</p>
            <p className="text-sm text-red-800 mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Contact <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={selectedContact ? `${selectedContact.firstName} ${selectedContact.lastName}` : searchTerm}
              onChange={(e) => {
                handleContactSearch(e.target.value);
                setShowContactDropdown(true);
              }}
              onFocus={() => setShowContactDropdown(true)}
              placeholder="Search and select a contact..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {showContactDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-64 overflow-y-auto">
                {filteredContacts.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No contacts found</div>
                ) : (
                  filteredContacts.map((contact) => (
                    <button
                      key={contact.id}
                      type="button"
                      onClick={() => handleContactSelect(contact)}
                      className="w-full text-left px-3 py-2 hover:bg-indigo-50 transition-colors"
                    >
                      <p className="font-medium text-gray-900">
                        {contact.firstName} {contact.lastName}
                      </p>
                      {contact.email && (
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Opportunity Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="e.g., Major gift for new facility"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Details about this opportunity..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (£) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Probability (%) <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            required
            min="0"
            max="100"
            value={formData.probability}
            onChange={(e) =>
              setFormData({
                ...formData,
                probability: parseInt(e.target.value) || 0,
              })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stage
          </label>
          <select
            value={formData.stage}
            onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {STAGES.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expected Close Date
          </label>
          <input
            type="date"
            value={formData.expectedCloseDate}
            onChange={(e) =>
              setFormData({ ...formData, expectedCloseDate: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Campaign
          </label>
          <select
            value={formData.campaignId}
            onChange={(e) =>
              setFormData({ ...formData, campaignId: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a campaign...</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Assigned To
        </label>
        <select
          value={formData.assignedToId}
          onChange={(e) =>
            setFormData({ ...formData, assignedToId: e.target.value })
          }
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Unassigned</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.name} ({user.email})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Internal notes about this opportunity..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading || !formData.contactId || !formData.name}>
          {loading ? "Saving..." : initialData ? "Update Opportunity" : "Create Opportunity"}
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
  );
}
