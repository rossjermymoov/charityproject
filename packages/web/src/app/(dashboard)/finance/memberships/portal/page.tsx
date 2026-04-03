"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PortalLink {
  id: string;
  contactId: string;
  token: string;
  portalUrl: string;
  expiresAt: string | null;
  createdAt: string;
  contactName?: string;
  contactEmail?: string;
}

interface ContactOption {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
}

export default function MemberPortalManagementPage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [selectedContactId, setSelectedContactId] = useState("");
  const [expiresInDays, setExpiresInDays] = useState<number | null>(null);
  const [portalLinks, setPortalLinks] = useState<PortalLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchPortalLinks();
  }, []);

  const fetchPortalLinks = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/member-portal/list");
      if (!response.ok) throw new Error("Failed to fetch portal links");
      const data = await response.json();
      setPortalLinks(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load portal links");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchContacts = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setContacts([]);
      return;
    }

    try {
      const response = await fetch(
        `/api/contacts/search?q=${encodeURIComponent(term)}`
      );
      if (!response.ok) throw new Error("Failed to search contacts");
      const data = await response.json();
      setContacts(data.slice(0, 10)); // Limit to 10 results
    } catch (err) {
      console.error(err);
      setError("Failed to search contacts");
    }
  };

  const handleGenerateLink = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedContactId) {
      setError("Please select a contact");
      return;
    }

    setGenerating(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/member-portal/generate-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: selectedContactId,
          expiresInDays: expiresInDays,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate portal link");
      }

      const newLink = await response.json();
      setPortalLinks([newLink, ...portalLinks]);
      setSelectedContactId("");
      setSearchTerm("");
      setExpiresInDays(null);
      setSuccessMessage("Portal link generated successfully!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate link");
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setSuccessMessage("Link copied to clipboard!");
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Member Portal Links
        </h1>
        <p className="text-gray-600 mt-1">
          Generate and manage self-service portal links for members
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          {successMessage}
        </div>
      )}

      {/* Generate Link Form */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Generate New Portal Link
        </h2>

        <form onSubmit={handleGenerateLink} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Contact
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearchContacts(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            {contacts.length > 0 && (
              <div className="mt-2 border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => {
                      setSelectedContactId(contact.id);
                      setSearchTerm(
                        `${contact.firstName} ${contact.lastName}`
                      );
                      setContacts([]);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-200 last:border-b-0"
                  >
                    <p className="font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{contact.email}</p>
                  </button>
                ))}
              </div>
            )}

            {selectedContactId && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Contact selected: {searchTerm}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiration (optional)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                value={expiresInDays || ""}
                onChange={(e) =>
                  setExpiresInDays(
                    e.target.value ? parseInt(e.target.value) : null
                  )
                }
                placeholder="Days until expiration"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-gray-600">days</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for no expiration
            </p>
          </div>

          <button
            type="submit"
            disabled={!selectedContactId || generating}
            className="w-full px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {generating ? "Generating..." : "Generate Portal Link"}
          </button>
        </form>
      </div>

      {/* Portal Links List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Portal Links
          </h2>
        </div>

        {loading ? (
          <div className="px-6 py-8 text-center text-gray-600">
            Loading portal links...
          </div>
        ) : portalLinks.length === 0 ? (
          <div className="px-6 py-8 text-center text-gray-600">
            No portal links generated yet
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Expires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Portal Link
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {portalLinks.map((link) => (
                  <tr key={link.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {link.contactName || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(link.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {link.expiresAt ? (
                        <span
                          className={
                            isExpired(link.expiresAt)
                              ? "text-red-600 font-medium"
                              : "text-gray-600"
                          }
                        >
                          {new Date(link.expiresAt).toLocaleDateString()}
                          {isExpired(link.expiresAt) && " (Expired)"}
                        </span>
                      ) : (
                        <span className="text-gray-600">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono text-gray-700 max-w-xs overflow-hidden text-ellipsis whitespace-nowrap">
                          {link.token}
                        </code>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleCopyLink(link.portalUrl)}
                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                      >
                        Copy Link
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
