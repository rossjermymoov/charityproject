"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
}

interface RelationshipFormProps {
  contactId: string;
  allContacts: Contact[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const RELATIONSHIP_TYPES = [
  { value: "SPOUSE", label: "Spouse" },
  { value: "PARENT", label: "Parent" },
  { value: "CHILD", label: "Child" },
  { value: "SIBLING", label: "Sibling" },
  { value: "EMPLOYER", label: "Employer" },
  { value: "EMPLOYEE", label: "Employee" },
  { value: "FRIEND", label: "Friend" },
  { value: "GUARDIAN", label: "Guardian" },
  { value: "OTHER", label: "Other" },
];

export function RelationshipForm({
  contactId,
  allContacts,
  isOpen,
  onClose,
  onSuccess,
}: RelationshipFormProps) {
  const [toContactId, setToContactId] = useState<string>("");
  const [type, setType] = useState<string>("FRIEND");
  const [description, setDescription] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch("/api/crm/relationships", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fromContactId: contactId,
          toContactId,
          type,
          description: description || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create relationship");
      }

      // Reset form
      setToContactId("");
      setType("FRIEND");
      setDescription("");
      onClose();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Filter out the current contact from the list
  const availableContacts = allContacts.filter((c) => c.id !== contactId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Relationship</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Related Contact
          </label>
          <select
            value={toContactId}
            onChange={(e) => setToContactId(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="">Select a contact...</option>
            {availableContacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.firstName} {contact.lastName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Relationship Type
          </label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {RELATIONSHIP_TYPES.map((relType) => (
              <option key={relType.value} value={relType.value}>
                {relType.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g., College roommate, Close friend..."
          />
        </div>

        <div className="flex gap-3 justify-end pt-4">
          <Button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="bg-gray-200 text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={loading || !toContactId}
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            {loading ? "Adding..." : "Add Relationship"}
          </Button>
        </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
