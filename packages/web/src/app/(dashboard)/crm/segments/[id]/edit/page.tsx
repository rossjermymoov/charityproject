"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SegmentFilterBuilder } from "@/components/crm/segment-filter-builder";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import type { SegmentFilters, SavedSegmentResponse } from "@/types/segment";

interface Tag {
  id: string;
  name: string;
}

interface Event {
  id: string;
  name: string;
}

interface MembershipType {
  id: string;
  name: string;
}

export default function EditSegmentPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [segment, setSegment] = useState<SavedSegmentResponse | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [filters, setFilters] = useState<SegmentFilters>({ filters: [], matchType: "all" });
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [membershipTypes, setMembershipTypes] = useState<MembershipType[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [segmentRes, tagsRes, eventsRes, typesRes] = await Promise.all([
          fetch(`/api/crm/segments/${id}`),
          fetch("/api/tags"),
          fetch("/api/events/list"),
          fetch("/api/membership-types"),
        ]);

        if (!segmentRes.ok) {
          throw new Error("Failed to fetch segment");
        }

        const segmentData = await segmentRes.json();
        setSegment(segmentData);
        setName(segmentData.name);
        setDescription(segmentData.description || "");
        setFilters(segmentData.filters);

        const [tagsData, eventsData, typesData] = await Promise.all([
          tagsRes.json(),
          eventsRes.json(),
          typesRes.json(),
        ]);

        setTags(tagsData || []);
        setEvents(eventsData || []);
        setMembershipTypes(typesData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load segment");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handlePreview = async () => {
    if (filters.filters.length === 0) {
      setError("Please add at least one filter");
      return;
    }

    setIsLoadingPreview(true);
    setError(null);

    try {
      const response = await fetch("/api/crm/segments/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filters }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to preview segment");
      }

      const data = await response.json();
      setPreviewCount(data.count);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Segment name is required");
      return;
    }

    if (filters.filters.length === 0) {
      setError("Please add at least one filter");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/crm/segments/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || undefined,
          filters,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to save segment");
      }

      router.push(`/crm/segments/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (error && !segment) {
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
            <p className="text-red-700">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/crm/segments/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Segment
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Edit Segment</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Segment Details</CardTitle>
              <CardDescription>Update the segment name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Segment Name *"
                placeholder="e.g. Major Donors 2024"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <div className="space-y-1">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  placeholder="Optional description of this segment"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex h-24 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </CardContent>
          </Card>

          {/* Filter Builder */}
          <SegmentFilterBuilder
            onFiltersChange={setFilters}
            initialFilters={filters}
            tags={tags}
            events={events}
            membershipTypes={membershipTypes}
          />
        </div>

        {/* Preview & Actions Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {previewCount !== null && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-2xl font-bold text-blue-900">{previewCount}</p>
                  <p className="text-sm text-blue-700">
                    {previewCount === 1 ? "contact matches" : "contacts match"}
                  </p>
                </div>
              )}

              <Button
                onClick={handlePreview}
                disabled={filters.filters.length === 0 || isLoadingPreview}
                variant="outline"
                className="w-full"
              >
                {isLoadingPreview && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isLoadingPreview ? "Previewing..." : "Preview Results"}
              </Button>

              <Button
                onClick={handleSave}
                disabled={isSaving || !name.trim() || filters.filters.length === 0}
                className="w-full"
              >
                {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>

          {/* Filter Summary */}
          {filters.filters.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Filter Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-gray-600 mb-3">
                  {filters.matchType === "all"
                    ? "Contacts must match ALL filters"
                    : "Contacts must match ANY filter"}
                </p>
                <div className="space-y-2">
                  {filters.filters.map((filter, index) => (
                    <div key={index} className="text-xs bg-gray-50 p-2 rounded">
                      <p className="font-medium text-gray-900 capitalize">
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
