"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ComposeSmsPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"single" | "bulk">("single");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [to, setTo] = useState("");
  const [contactIds, setContactIds] = useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [contactSearch, setContactSearch] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{ id: string; firstName: string; lastName: string; phone?: string }>
  >([]);
  const [showContactDropdown, setShowContactDropdown] = useState(false);

  const characterCount = message.length;
  const smsCount = Math.ceil(characterCount / 160);

  async function handleSendSingle() {
    if (!to || !message) {
      alert("Please enter a phone number and message");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/sms/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to,
          body: message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send SMS");

      alert("SMS sent successfully!");
      setMessage("");
      setTo("");
      router.push("/communications/sms");
    } catch (error) {
      alert(`Error sending SMS: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleSendBulk() {
    if (contactIds.length === 0 || !message) {
      alert("Please select contacts and enter a message");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/sms/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds,
          body: message,
        }),
      });

      if (!response.ok) throw new Error("Failed to send bulk SMS");

      const data = await response.json();
      alert(
        `Sent to ${data.successCount} contacts. ${data.failureCount > 0 ? `Failed: ${data.failureCount}` : ""}`
      );
      setMessage("");
      setContactIds([]);
      setSelectedContacts([]);
      router.push("/communications/sms");
    } catch (error) {
      alert(`Error sending SMS: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  async function searchContacts(query: string) {
    if (!query) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/contacts?search=${query}`);
      if (!response.ok) return;
      const contacts = await response.json();
      setSearchResults(contacts.slice(0, 10));
    } catch (error) {
      console.error("Error searching contacts:", error);
    }
  }

  function addContact(contact: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const name = `${contact.firstName} ${contact.lastName}`;
    if (!contactIds.includes(contact.id)) {
      setContactIds([...contactIds, contact.id]);
      setSelectedContacts([...selectedContacts, { id: contact.id, name }]);
      setContactSearch("");
      setSearchResults([]);
    }
  }

  function removeContact(id: string) {
    setContactIds(contactIds.filter((cid) => cid !== id));
    setSelectedContacts(selectedContacts.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/communications/sms">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Compose SMS</h1>
          <p className="text-gray-500 mt-1">Send SMS to contacts</p>
        </div>
      </div>

      {/* Mode Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Send Mode</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <button
            onClick={() => setMode("single")}
            className={`px-4 py-2 rounded border ${
              mode === "single"
                ? "bg-blue-50 border-blue-300 text-blue-900"
                : "border-gray-300 text-gray-700"
            }`}
          >
            Single Message
          </button>
          <button
            onClick={() => setMode("bulk")}
            className={`px-4 py-2 rounded border ${
              mode === "bulk"
                ? "bg-blue-50 border-blue-300 text-blue-900"
                : "border-gray-300 text-gray-700"
            }`}
          >
            Bulk Send
          </button>
        </CardContent>
      </Card>

      {/* Compose Area */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === "single" ? "Phone Number" : "Select Contacts"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === "single" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recipient Phone (E.164 format: +1234567890)
              </label>
              <input
                type="text"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="+1234567890"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search & Add Contacts
              </label>
              <div className="relative mb-4">
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => {
                    setContactSearch(e.target.value);
                    searchContacts(e.target.value);
                    setShowContactDropdown(true);
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  placeholder="Search by name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                />
                {showContactDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 rounded-b-md shadow-sm z-10">
                    {searchResults.map((contact) => (
                      <button
                        key={contact.id}
                        onClick={() => addContact(contact)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-200 last:border-0"
                      >
                        <p className="text-sm font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                        {contact.phone && (
                          <p className="text-xs text-gray-500">{contact.phone}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Contacts */}
              {selectedContacts.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">
                    Selected: {selectedContacts.length}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selectedContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                      >
                        {contact.name}
                        <button
                          onClick={() => removeContact(contact.id)}
                          className="font-bold hover:text-blue-700"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Area */}
      <Card>
        <CardHeader>
          <CardTitle>Message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message Text
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
            />
            <div className="mt-2 flex justify-between text-xs text-gray-500">
              <span>{characterCount} characters</span>
              <span>{smsCount} SMS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Send Button */}
      <div className="flex justify-end">
        <Button
          onClick={mode === "single" ? handleSendSingle : handleSendBulk}
          disabled={loading || !message || (mode === "single" ? !to : contactIds.length === 0)}
          className="gap-2"
        >
          <Send className="h-4 w-4" />
          {loading ? "Sending..." : "Send SMS"}
        </Button>
      </div>
    </div>
  );
}
