"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { AllFilters, SegmentFilters } from "@/types/segment";

interface SegmentFilterBuilderProps {
  onFiltersChange: (filters: SegmentFilters) => void;
  initialFilters?: SegmentFilters;
  tags: Array<{ id: string; name: string }>;
  events: Array<{ id: string; name: string }>;
  membershipTypes: Array<{ id: string; name: string }>;
}

export function SegmentFilterBuilder({
  onFiltersChange,
  initialFilters,
  tags,
  events,
  membershipTypes,
}: SegmentFilterBuilderProps) {
  const [filters, setFilters] = useState<AllFilters[]>(initialFilters?.filters || []);
  const [matchType, setMatchType] = useState<"all" | "any">(initialFilters?.matchType || "all");

  const handleAddFilter = () => {
    const newFilter: AllFilters = {
      type: "tag",
      tagIds: [],
    };
    const updated = [...filters, newFilter];
    setFilters(updated);
    onFiltersChange({ filters: updated, matchType });
  };

  const handleRemoveFilter = (index: number) => {
    const updated = filters.filter((_, i) => i !== index);
    setFilters(updated);
    onFiltersChange({ filters: updated, matchType });
  };

  const handleFilterChange = (index: number, updated: AllFilters) => {
    const newFilters = [...filters];
    newFilters[index] = updated;
    setFilters(newFilters);
    onFiltersChange({ filters: newFilters, matchType });
  };

  const handleMatchTypeChange = (value: string) => {
    const newMatchType = value as "all" | "any";
    setMatchType(newMatchType);
    onFiltersChange({ filters, matchType: newMatchType });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Filter Conditions</CardTitle>
        <CardDescription>
          Add filters to define which contacts are included in this segment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Match Type */}
        {filters.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Match Conditions
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleMatchTypeChange("all")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  matchType === "all"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Match All
              </button>
              <button
                onClick={() => handleMatchTypeChange("any")}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  matchType === "any"
                    ? "bg-indigo-500 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Match Any
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {matchType === "all"
                ? "Show only contacts that match ALL conditions"
                : "Show contacts that match ANY condition"}
            </p>
          </div>
        )}

        {/* Filters */}
        <div className="space-y-4">
          {filters.map((filter, index) => (
            <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <Select
                    label="Filter Type"
                    value={filter.type}
                    onChange={(e) => {
                      const type = e.target.value as AllFilters["type"];
                      let newFilter: AllFilters;
                      switch (type) {
                        case "donation":
                          newFilter = { type: "donation", minAmount: undefined, maxAmount: undefined };
                          break;
                        case "tag":
                          newFilter = { type: "tag", tagIds: [] };
                          break;
                        case "location":
                          newFilter = { type: "location", cities: [], postcodes: [] };
                          break;
                        case "event":
                          newFilter = { type: "event", eventIds: [], attended: true };
                          break;
                        case "membership":
                          newFilter = { type: "membership", membershipTypeIds: [] };
                          break;
                        case "communication":
                          newFilter = { type: "communication" };
                          break;
                        default:
                          newFilter = filter;
                      }
                      handleFilterChange(index, newFilter);
                    }}
                    options={[
                      { value: "tag", label: "Tags" },
                      { value: "donation", label: "Donation History" },
                      { value: "location", label: "Location" },
                      { value: "event", label: "Event Attendance" },
                      { value: "membership", label: "Membership Status" },
                      { value: "communication", label: "Communication Preferences" },
                    ]}
                  />
                </div>
                <button
                  onClick={() => handleRemoveFilter(index)}
                  className="ml-4 p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>

              {/* Filter-specific UI */}
              {filter.type === "tag" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Tags
                  </label>
                  <div className="space-y-2">
                    {tags.map((tag) => (
                      <label key={tag.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(filter as any).tagIds?.includes(tag.id) || false}
                          onChange={(e) => {
                            const tagIds = (filter as any).tagIds || [];
                            const updated = e.target.checked
                              ? [...tagIds, tag.id]
                              : tagIds.filter((id: string) => id !== tag.id);
                            handleFilterChange(index, { ...filter, tagIds: updated } as any);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{tag.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {filter.type === "donation" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Min Amount (£)"
                      type="number"
                      step="0.01"
                      value={(filter as any).minAmount || ""}
                      onChange={(e) => {
                        handleFilterChange(index, {
                          ...filter,
                          minAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                        } as any);
                      }}
                      placeholder="0.00"
                    />
                    <Input
                      label="Max Amount (£)"
                      type="number"
                      step="0.01"
                      value={(filter as any).maxAmount || ""}
                      onChange={(e) => {
                        handleFilterChange(index, {
                          ...filter,
                          maxAmount: e.target.value ? parseFloat(e.target.value) : undefined,
                        } as any);
                      }}
                      placeholder="10000.00"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="From Date"
                      type="date"
                      value={(filter as any).startDate || ""}
                      onChange={(e) => {
                        handleFilterChange(index, {
                          ...filter,
                          startDate: e.target.value || undefined,
                        } as any);
                      }}
                    />
                    <Input
                      label="To Date"
                      type="date"
                      value={(filter as any).endDate || ""}
                      onChange={(e) => {
                        handleFilterChange(index, {
                          ...filter,
                          endDate: e.target.value || undefined,
                        } as any);
                      }}
                    />
                  </div>
                </div>
              )}

              {filter.type === "location" && (
                <div className="space-y-3">
                  <Input
                    label="Cities (comma-separated)"
                    placeholder="e.g. London, Manchester, Bristol"
                    value={((filter as any).cities || []).join(", ")}
                    onChange={(e) => {
                      const cities = e.target.value
                        ? e.target.value.split(",").map((c) => c.trim())
                        : [];
                      handleFilterChange(index, {
                        ...filter,
                        cities: cities,
                      } as any);
                    }}
                  />
                  <Input
                    label="Postcodes (comma-separated)"
                    placeholder="e.g. SW1A, NW1, SE1"
                    value={((filter as any).postcodes || []).join(", ")}
                    onChange={(e) => {
                      const postcodes = e.target.value
                        ? e.target.value.split(",").map((p) => p.trim())
                        : [];
                      handleFilterChange(index, {
                        ...filter,
                        postcodes: postcodes,
                      } as any);
                    }}
                  />
                </div>
              )}

              {filter.type === "event" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Event Attendance
                  </label>
                  <div className="space-y-2">
                    {events.map((event) => (
                      <label key={event.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(filter as any).eventIds?.includes(event.id) || false}
                          onChange={(e) => {
                            const eventIds = (filter as any).eventIds || [];
                            const updated = e.target.checked
                              ? [...eventIds, event.id]
                              : eventIds.filter((id: string) => id !== event.id);
                            handleFilterChange(index, {
                              ...filter,
                              eventIds: updated,
                            } as any);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{event.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {filter.type === "membership" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Membership Types
                  </label>
                  <div className="space-y-2 mb-3">
                    {membershipTypes.map((type) => (
                      <label key={type.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={(filter as any).membershipTypeIds?.includes(type.id) || false}
                          onChange={(e) => {
                            const typeIds = (filter as any).membershipTypeIds || [];
                            const updated = e.target.checked
                              ? [...typeIds, type.id]
                              : typeIds.filter((id: string) => id !== type.id);
                            handleFilterChange(index, {
                              ...filter,
                              membershipTypeIds: updated,
                            } as any);
                          }}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{type.name}</span>
                      </label>
                    ))}
                  </div>
                  <Select
                    label="Status"
                    options={[
                      { value: "active", label: "Active Members" },
                      { value: "inactive", label: "Inactive/Expired" },
                      { value: "all", label: "All" },
                    ]}
                    value={
                      (filter as any).isActive === true
                        ? "active"
                        : (filter as any).isActive === false
                          ? "inactive"
                          : "all"
                    }
                    onChange={(e) => {
                      let isActive: boolean | undefined;
                      if (e.target.value === "active") isActive = true;
                      else if (e.target.value === "inactive") isActive = false;
                      else isActive = undefined;

                      handleFilterChange(index, {
                        ...filter,
                        isActive,
                      } as any);
                    }}
                  />
                </div>
              )}

              {filter.type === "communication" && (
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Communication Preferences
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(filter as any).consentEmail || false}
                      onChange={(e) => {
                        handleFilterChange(index, {
                          ...filter,
                          consentEmail: e.target.checked,
                        } as any);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Consented to Email</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(filter as any).consentPhone || false}
                      onChange={(e) => {
                        handleFilterChange(index, {
                          ...filter,
                          consentPhone: e.target.checked,
                        } as any);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Consented to Phone</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(filter as any).consentSms || false}
                      onChange={(e) => {
                        handleFilterChange(index, {
                          ...filter,
                          consentSms: e.target.checked,
                        } as any);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Consented to SMS</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(filter as any).consentPost || false}
                      onChange={(e) => {
                        handleFilterChange(index, {
                          ...filter,
                          consentPost: e.target.checked,
                        } as any);
                      }}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Consented to Post</span>
                  </label>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add Filter Button */}
        <Button onClick={handleAddFilter} variant="outline" className="w-full">
          <Plus className="h-4 w-4 mr-2" />
          Add Filter
        </Button>
      </CardContent>
    </Card>
  );
}
