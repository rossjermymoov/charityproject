"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, Edit2, Trash2, Download } from "lucide-react";
import Link from "next/link";
import type { SavedSegmentResponse, SegmentPreviewResponse } from "@/types/segment";

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  city?: string;
  postcode?: string;
}

export default function SegmentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [segment, setSegment] = useState<SavedSegmentResponse | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSegment = async () => {
      try {
        const response = await fetch(`/api/crm/segments/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch segment");
        }
        const data = await response.json();
        setSegment(data);
        setContacts(data.contacts || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load segment");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSegment();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this segment? This cannot be undone.")) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/crm/segments/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete segment");
      }

      router.push("/crm/segments");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
      setIsDeleting(false);
    }
  };

  const handleExport = () => {
    if (contacts.length === 0) return;

    const csv = [
      ["First Name", "Last Name", "Email", "City", "Postcode"].join(","),
      ...contacts.map((c) =>
        [c.firstName, c.lastName, c.email || "", c.city || "", c.postcode || ""].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `segment-${segment?.name || "export"}-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error || !segment) {
    return (
      <div className="space-y-4">
        <Link href="/crm/segments">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Segments
          </Button>
        </Link>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-700">{error || "Segment not found"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/crm/segments">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{segment.name}</h1>
            {segment.description && (
              <p className="text-gray-600 mt-1">{segment.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={contacts.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Link href={`/crm/segments/${id}/edit`}>
            <Button variant="outline" size="sm">
              <Edit2 className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-gray-900">{contacts.length}</p>
            <p className="text-sm text-gray-600 mt-1">Matching Contacts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-3xl font-bold text-gray-900">
              {segment.filters.filters.length}
            </p>
            <p className="text-sm text-gray-600 mt-1">Active Filters</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-gray-900">Match Type</p>
            <Badge className="mt-2">
              {segment.filters.matchType === "all" ? "Match All" : "Match Any"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Contacts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Matching Contacts</CardTitle>
          <CardDescription>
            {contacts.length} {contacts.length === 1 ? "contact" : "contacts"} match this segment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No contacts match this segment</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-medium text-gray-900">Name</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">Email</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">City</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">Postcode</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-900">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{contact.email || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{contact.city || "-"}</td>
                      <td className="px-4 py-3 text-gray-600">{contact.postcode || "-"}</td>
                      <td className="px-4 py-3">
                        <Link href={`/crm/contacts/${contact.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Segment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Segment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-gray-900">Filters Applied</p>
            <div className="mt-2 space-y-2">
              {segment.filters.filters.map((filter, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="font-medium text-gray-900 capitalize text-sm">
                    {filter.type === "tag" && "Tags"}
                    {filter.type === "donation" && "Donation Amount"}
                    {filter.type === "location" && "Location"}
                    {filter.type === "event" && "Event Attendance"}
                    {filter.type === "membership" && "Membership"}
                    {filter.type === "communication" && "Communication"}
                  </p>
                </div>
              ))}
            </div>
          </div>
          <div className="pt-4 border-t">
            <p className="text-xs text-gray-500">
              Created: {new Date(segment.createdAt).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Updated: {new Date(segment.updatedAt).toLocaleString()}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
