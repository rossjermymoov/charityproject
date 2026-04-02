"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import {
  AlertCircle,
  Merge2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  X,
  Radio,
} from "lucide-react";
import { MergeDialog } from "./merge-dialog";

interface DuplicateContact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  postcode: string | null;
  donationCount: number;
  lastDonationDate: string | null;
}

interface DuplicateGroup {
  confidence: "HIGH" | "MEDIUM" | "LOW";
  reason: string;
  contacts: DuplicateContact[];
}

interface ScanResult {
  duplicateGroups: DuplicateGroup[];
  totalContacts: number;
  potentialDuplicateCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function DuplicatesPage() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<ScanResult | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [merging, setMerging] = useState(false);
  const [mergeSuccess, setMergeSuccess] = useState(false);
  const [selectedMerge, setSelectedMerge] = useState<{
    groupIndex: number;
    primaryId: string;
    secondaryId: string;
  } | null>(null);

  const handleScan = async () => {
    setScanning(true);
    setResults(null);
    setMergeSuccess(false);
    try {
      const response = await fetch("/api/contacts/duplicates?page=1");
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error scanning for duplicates:", error);
      alert("Failed to scan for duplicates");
    } finally {
      setScanning(false);
    }
  };

  const toggleExpanded = (index: number) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedGroups(newExpanded);
  };

  const handleMergeComplete = () => {
    setMergeSuccess(true);
    setSelectedMerge(null);
    // Optionally refresh results
    setTimeout(() => {
      handleScan();
    }, 1500);
  };

  const confidenceColors = {
    HIGH: "bg-red-100 text-red-800",
    MEDIUM: "bg-yellow-100 text-yellow-800",
    LOW: "bg-blue-100 text-blue-800",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Duplicate Detection
          </h1>
          <p className="text-gray-500 mt-1">
            Find and merge duplicate contact records
          </p>
        </div>
      </div>

      {/* Stats */}
      {results && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600">Total Contacts</p>
              <p className="text-3xl font-bold text-gray-900">
                {results.totalContacts}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Potential Duplicates</p>
              <p className="text-3xl font-bold text-orange-600">
                {results.potentialDuplicateCount}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duplicate Pairs</p>
              <p className="text-3xl font-bold text-green-600">
                {results.duplicateGroups.length}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Scan Button */}
      {!results && (
        <Card className="p-8 text-center border-dashed">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No scan performed yet
          </h3>
          <p className="text-gray-500 mb-6">
            Click below to scan for potential duplicate contacts in your database
          </p>
          <Button
            onClick={handleScan}
            disabled={scanning}
            size="lg"
            className="gap-2"
          >
            {scanning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Scan for Duplicates
              </>
            )}
          </Button>
        </Card>
      )}

      {/* Rescan Button */}
      {results && (
        <Button
          onClick={handleScan}
          disabled={scanning}
          variant="outline"
          className="gap-2"
        >
          {scanning ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Rescan
            </>
          )}
        </Button>
      )}

      {/* Success Message */}
      {mergeSuccess && (
        <Card className="p-4 bg-green-50 border-green-200">
          <div className="flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5" />
            <span>Contacts merged successfully. Results updated.</span>
          </div>
        </Card>
      )}

      {/* Results */}
      {results && results.duplicateGroups.length === 0 && (
        <Card className="p-8 text-center">
          <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">
            No duplicates found
          </h3>
          <p className="text-gray-500 mt-2">
            Your contact database looks clean!
          </p>
        </Card>
      )}

      {/* Duplicate Groups */}
      {results && results.duplicateGroups.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Potential Duplicates
          </h2>
          {results.duplicateGroups.map((group, groupIndex) => {
            const isExpanded = expandedGroups.has(groupIndex);
            return (
              <Card key={groupIndex} className="overflow-hidden">
                {/* Group Header */}
                <button
                  onClick={() => toggleExpanded(groupIndex)}
                  className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 text-left">
                    <div className="flex gap-2 items-center flex-1">
                      <Badge className={confidenceColors[group.confidence]}>
                        {group.confidence}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {group.contacts
                          .map((c) => `${c.firstName} ${c.lastName}`)
                          .join(" ↔ ")}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {group.reason}
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>

                {/* Group Details */}
                {isExpanded && (
                  <>
                    <div className="border-t border-gray-100 p-4 bg-gray-50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {group.contacts.map((contact, idx) => (
                          <div
                            key={contact.id}
                            className="p-4 border border-gray-200 rounded-lg bg-white"
                          >
                            <div className="flex items-start gap-3 mb-4">
                              <Avatar
                                firstName={contact.firstName}
                                lastName={contact.lastName}
                                size="md"
                              />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {contact.firstName} {contact.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {contact.id.slice(0, 8)}
                                </p>
                              </div>
                            </div>

                            <div className="space-y-2 text-sm">
                              {contact.email && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Email:</span>
                                  <span className="text-gray-900 font-mono text-xs">
                                    {contact.email}
                                  </span>
                                </div>
                              )}
                              {contact.phone && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Phone:</span>
                                  <span className="text-gray-900">
                                    {contact.phone}
                                  </span>
                                </div>
                              )}
                              {contact.postcode && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600">
                                    Postcode:
                                  </span>
                                  <span className="text-gray-900">
                                    {contact.postcode}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between pt-2 border-t border-gray-100">
                                <span className="text-gray-600">Donations:</span>
                                <span className="text-gray-900 font-medium">
                                  {contact.donationCount}
                                </span>
                              </div>
                              {contact.lastDonationDate && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-gray-500">
                                    Last donation:
                                  </span>
                                  <span className="text-gray-600">
                                    {contact.lastDonationDate}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Merge Options */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          Choose which contact to keep:
                        </p>
                        <div className="space-y-2">
                          {group.contacts.map((contact, idx) => (
                            <button
                              key={contact.id}
                              onClick={() => {
                                const other = group.contacts[1 - idx];
                                setSelectedMerge({
                                  groupIndex,
                                  primaryId: contact.id,
                                  secondaryId: other.id,
                                });
                              }}
                              className="w-full flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 transition-colors text-left"
                            >
                              <Radio className="h-4 w-4 text-indigo-600" />
                              <div>
                                <p className="font-medium text-gray-900">
                                  Keep {contact.firstName} {contact.lastName}
                                </p>
                                <p className="text-xs text-gray-500">
                                  Merge {group.contacts[1 - idx].firstName}{" "}
                                  {group.contacts[1 - idx].lastName} into this
                                  contact
                                </p>
                              </div>
                              <Merge2 className="h-4 w-4 text-gray-400 ml-auto" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Merge Dialog */}
      {selectedMerge && (
        <MergeDialog
          groupIndex={selectedMerge.groupIndex}
          primaryId={selectedMerge.primaryId}
          secondaryId={selectedMerge.secondaryId}
          group={
            results?.duplicateGroups[selectedMerge.groupIndex] ||
            ({} as DuplicateGroup)
          }
          onClose={() => setSelectedMerge(null)}
          onMergeComplete={handleMergeComplete}
        />
      )}
    </div>
  );
}
