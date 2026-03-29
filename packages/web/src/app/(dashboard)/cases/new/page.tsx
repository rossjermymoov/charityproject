"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewCasePage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData(e.currentTarget);
      const response = await fetch("/api/cases", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create case");
      }

      const data = await response.json();
      router.push(`/cases/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/cases">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Case</h1>
          <p className="text-gray-500 mt-1">Open a new case for a beneficiary</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Case Details</h2>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Case Title *
              </label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="e.g., Emergency Housing Assistance"
                required
                className="rounded-lg"
              />
            </div>

            {/* Contact Email */}
            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Contact Email *
              </label>
              <Input
                id="contactEmail"
                name="contactEmail"
                type="email"
                placeholder="beneficiary@example.com"
                required
                className="rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                The contact will be linked or created from this email address
              </p>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <Input
                id="category"
                name="category"
                type="text"
                placeholder="e.g., Housing, Health, Financial"
                required
                className="rounded-lg"
              />
            </div>

            {/* Priority */}
            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
                Priority *
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue="MEDIUM"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="URGENT">Urgent</option>
              </select>
            </div>

            {/* Assign To */}
            <div>
              <label htmlFor="assignedToEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Assign To (optional)
              </label>
              <Input
                id="assignedToEmail"
                name="assignedToEmail"
                type="email"
                placeholder="staff@example.com"
                className="rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave blank to assign later
              </p>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <Textarea
                id="description"
                name="description"
                placeholder="Provide details about the case..."
                rows={5}
                className="rounded-lg"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Case"
                )}
              </Button>
              <Link href="/cases" className="flex-1">
                <Button type="button" variant="outline" className="w-full">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
