"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

const CATEGORIES = [
  { value: "THANK_YOU", label: "Thank You" },
  { value: "WELCOME", label: "Welcome" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "RENEWAL", label: "Renewal" },
  { value: "CUSTOM", label: "Custom" },
];

const AVAILABLE_VARIABLES = [
  "{{donorName}}",
  "{{contactFirstName}}",
  "{{contactLastName}}",
  "{{contactEmail}}",
  "{{amount}}",
  "{{donationType}}",
  "{{campaignId}}",
  "{{date}}",
  "{{orgName}}",
];

export default function NewEmailTemplatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [bodyText, setBodyText] = useState("");
  const [category, setCategory] = useState("CUSTOM");
  const [isActive, setIsActive] = useState(true);

  const handleInsertVariable = (variable: string, field: "subject" | "html") => {
    if (field === "subject") {
      setSubject(subject + variable);
    } else {
      setBodyHtml(bodyHtml + variable);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          subject,
          bodyHtml,
          bodyText,
          category,
          isActive,
          variables: AVAILABLE_VARIABLES,
        }),
      });

      if (!response.ok) throw new Error("Failed to create template");

      router.push("/settings/email-templates");
      router.refresh();
    } catch (error) {
      alert("Error creating email template");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/email-templates" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create Email Template</h1>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Template Name
                  </label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Donation Thank You"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <Select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    options={CATEGORIES}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Subject
                    </label>
                    <div className="flex gap-1">
                      {["donorName", "date"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() =>
                            handleInsertVariable(`{{${v}}}`, "subject")
                          }
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                        >
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Thank you for your donation, {{donorName}}"
                    required
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Email Body (HTML)
                    </label>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {["donorName", "amount", "orgName"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => handleInsertVariable(`{{${v}}}`, "html")}
                          className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                        >
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="HTML email content. Use variables like {{donorName}}"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={12}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    You can use HTML tags and include CSS styles
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Body (Plain Text - Optional)
                  </label>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Plain text version of the email"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                    rows={6}
                  />
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Template is active
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <Link href="/settings/email-templates">
                    <Button variant="outline" type="button">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Creating..." : "Create Template"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Available Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {AVAILABLE_VARIABLES.map((variable) => (
                <div
                  key={variable}
                  className="p-2 bg-gray-50 rounded font-mono text-gray-700"
                >
                  {variable}
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-base">Template Tips</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2 text-gray-600">
              <p>
                • Use variables to personalize emails
              </p>
              <p>
                • Write professional HTML for better formatting
              </p>
              <p>
                • Always include plain text version for accessibility
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
