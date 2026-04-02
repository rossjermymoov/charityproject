"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import {
  AlertCircle,
  Loader2,
  Check,
  ChevronRight,
  X,
  Info,
} from "lucide-react";

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

interface MergeDialogProps {
  groupIndex: number;
  primaryId: string;
  secondaryId: string;
  group: DuplicateGroup;
  onClose: () => void;
  onMergeComplete: () => void;
}

type FieldChoice = "primary" | "secondary" | "blank";

interface FieldChoices {
  [key: string]: FieldChoice;
}

export function MergeDialog({
  primaryId,
  secondaryId,
  group,
  onClose,
  onMergeComplete,
}: MergeDialogProps) {
  const [step, setStep] = useState<"review" | "confirm" | "merging" | "success">(
    "review"
  );
  const [fieldChoices, setFieldChoices] = useState<FieldChoices>({});
  const [error, setError] = useState<string | null>(null);

  const primaryContact = group.contacts.find((c) => c.id === primaryId);
  const secondaryContact = group.contacts.find((c) => c.id === secondaryId);

  if (!primaryContact || !secondaryContact) {
    return null;
  }

  const fieldsToReview = [
    { key: "firstName", label: "First Name" },
    { key: "lastName", label: "Last Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "postcode", label: "Postcode" },
  ];

  const handleFieldChoice = (field: string, choice: FieldChoice) => {
    setFieldChoices((prev) => ({
      ...prev,
      [field]: choice,
    }));
  };

  const handleMerge = async () => {
    setStep("merging");
    setError(null);
    try {
      const response = await fetch("/api/contacts/merge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryId,
          secondaryId,
          fieldChoices: Object.keys(fieldChoices).length > 0 ? fieldChoices : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to merge contacts");
      }

      setStep("success");
      setTimeout(() => {
        onMergeComplete();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setStep("review");
    }
  };

  if (step === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Check className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Merge Complete
            </h2>
            <p className="text-gray-600">
              Contacts have been merged successfully. The duplicate contact has
              been archived.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  if (step === "merging") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <Card className="w-full max-w-md p-6">
          <div className="text-center">
            <Loader2 className="h-12 w-12 text-indigo-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Merging Contacts...
            </h2>
            <p className="text-gray-600">
              Please wait while we merge the contact records and transfer all
              related data.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">Review Merge</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Info */}
          <div className="flex gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">
                Keep {primaryContact.firstName} {primaryContact.lastName}
              </p>
              <p>
                {secondaryContact.firstName} {secondaryContact.lastName} will
                be archived. All their donations, notes, and other records will
                be transferred.
              </p>
            </div>
          </div>

          {/* Field Comparison */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Review Fields</h3>

            {fieldsToReview.map((field) => {
              const primaryValue =
                (primaryContact as any)[field.key] || "(empty)";
              const secondaryValue =
                (secondaryContact as any)[field.key] || "(empty)";
              const isDifferent = primaryValue !== secondaryValue;

              return (
                <div
                  key={field.key}
                  className="p-4 border border-gray-200 rounded-lg space-y-3"
                >
                  <p className="font-medium text-gray-900">{field.label}</p>

                  {isDifferent ? (
                    <>
                      <div className="grid grid-cols-3 gap-3 items-center">
                        {/* Primary */}
                        <button
                          onClick={() =>
                            handleFieldChoice(field.key, "primary")
                          }
                          className={`p-3 border rounded-lg text-left transition-all ${
                            fieldChoices[field.key] === "primary"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="text-xs text-gray-500 mb-1">
                            Keep (Primary)
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {primaryValue}
                          </p>
                        </button>

                        {/* Arrow */}
                        <div className="flex justify-center">
                          <ChevronRight className="h-5 w-5 text-gray-400" />
                        </div>

                        {/* Secondary */}
                        <button
                          onClick={() =>
                            handleFieldChoice(field.key, "secondary")
                          }
                          className={`p-3 border rounded-lg text-left transition-all ${
                            fieldChoices[field.key] === "secondary"
                              ? "border-indigo-500 bg-indigo-50"
                              : "border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <p className="text-xs text-gray-500 mb-1">
                            Use Secondary
                          </p>
                          <p className="text-sm font-medium text-gray-900">
                            {secondaryValue}
                          </p>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                      <p className="text-sm text-gray-600">{primaryValue}</p>
                      <p className="text-xs text-gray-400 mt-1">(both same)</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Impact Summary */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h4 className="font-medium text-amber-900 mb-2">What will happen:</h4>
            <ul className="text-sm text-amber-800 space-y-1">
              <li>
                • All donations ({secondaryContact.donationCount}) transferred
              </li>
              <li>• All notes and interactions transferred</li>
              <li>• Gift Aid records transferred</li>
              <li>• All tags merged (no duplicates)</li>
              <li>
                • Secondary contact archived with merge audit trail
              </li>
            </ul>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-100 p-6 flex gap-3 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => setStep("confirm")}>
            Continue to Confirm
          </Button>
        </div>
      </Card>

      {/* Confirmation Modal */}
      {step === "confirm" && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Confirm Merge?
            </h3>
            <p className="text-gray-600 mb-6">
              This action will merge {secondaryContact.firstName}{" "}
              {secondaryContact.lastName} into{" "}
              {primaryContact.firstName} {primaryContact.lastName}. The
              secondary contact will be archived and cannot be undone easily.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setStep("review")}
              >
                Back
              </Button>
              <Button
                onClick={handleMerge}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Yes, Merge Contacts
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
