"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Eye, Save, Image } from "lucide-react";

const CATEGORIES = [
  { value: "THANK_YOU", label: "Thank You" },
  { value: "WELCOME", label: "Welcome" },
  { value: "RECEIPT", label: "Receipt" },
  { value: "RENEWAL", label: "Renewal" },
  { value: "EVENT", label: "Event" },
  { value: "VOLUNTEER", label: "Volunteer" },
  { value: "MEMBERSHIP", label: "Membership" },
  { value: "GENERAL", label: "General" },
  { value: "CUSTOM", label: "Custom" },
];

const AVAILABLE_VARIABLES = [
  { key: "contactFirstName", label: "First Name" },
  { key: "contactLastName", label: "Last Name" },
  { key: "contactEmail", label: "Email" },
  { key: "donorName", label: "Donor Name" },
  { key: "amount", label: "Amount" },
  { key: "donationType", label: "Donation Type" },
  { key: "eventName", label: "Event Name" },
  { key: "eventDate", label: "Event Date" },
  { key: "date", label: "Date" },
  { key: "orgName", label: "Organisation" },
];

interface TemplateEditorProps {
  mode: "create" | "edit";
  templateId?: string;
  initial?: {
    name: string;
    subject: string;
    bodyHtml: string;
    bodyText: string;
    logoUrl: string;
    category: string;
    isActive: boolean;
  };
}

export default function TemplateEditor({ mode, templateId, initial }: TemplateEditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const [name, setName] = useState(initial?.name || "");
  const [subject, setSubject] = useState(initial?.subject || "");
  const [bodyHtml, setBodyHtml] = useState(initial?.bodyHtml || "");
  const [bodyText, setBodyText] = useState(initial?.bodyText || "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl || "");
  const [category, setCategory] = useState(initial?.category || "CUSTOM");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const insertVariable = (variable: string, target: "subject" | "html") => {
    const tag = `{{${variable}}}`;
    if (target === "subject") {
      setSubject((prev) => prev + tag);
    } else {
      setBodyHtml((prev) => prev + tag);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        name,
        subject,
        bodyHtml,
        bodyText,
        logoUrl,
        category,
        isActive,
        variables: AVAILABLE_VARIABLES.map((v) => `{{${v.key}}}`),
      };

      const url = mode === "edit" ? `/api/email-templates/${templateId}` : "/api/email-templates";
      const method = mode === "edit" ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error("Failed to save template");

      router.push("/settings/email-templates");
      router.refresh();
    } catch {
      alert("Error saving email template");
    } finally {
      setLoading(false);
    }
  };

  // Build a preview of the email with logo
  const buildPreviewHtml = () => {
    let preview = bodyHtml;
    // Replace variables with sample data
    const sampleData: Record<string, string> = {
      contactFirstName: "Jane",
      contactLastName: "Smith",
      contactEmail: "jane@example.com",
      donorName: "Jane Smith",
      amount: "£50.00",
      donationType: "One-off",
      eventName: "Annual Charity Gala",
      eventDate: "15-06-2026",
      date: "05-04-2026",
      orgName: "DeepCharity",
    };
    for (const [key, value] of Object.entries(sampleData)) {
      preview = preview.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
    }
    return preview;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/settings/email-templates" className="text-gray-400 hover:text-gray-600">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">
            {mode === "edit" ? "Edit Template" : "Create Email Template"}
          </h1>
        </div>
        <Button variant="outline" onClick={() => setShowPreview(!showPreview)} className="flex items-center gap-2">
          <Eye className="h-4 w-4" /> {showPreview ? "Hide Preview" : "Preview"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main editor */}
        <div className={showPreview ? "lg:col-span-2" : "lg:col-span-2"}>
          <Card>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Template Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Donation Thank You" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <Select value={category} onChange={(e) => setCategory(e.target.value)} options={CATEGORIES} />
                  </div>
                </div>

                {/* Logo URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <Image className="h-4 w-4" /> Logo URL
                  </label>
                  <Input
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://yoursite.com/logo.png or /uploads/logo.png"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Paste an image URL for the email header logo. Leave blank to use the organisation logo from branding settings.
                  </p>
                  {logoUrl && (
                    <div className="mt-2 p-3 bg-gray-50 rounded-lg border">
                      <img src={logoUrl} alt="Logo preview" className="max-h-16 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                    </div>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Email Subject</label>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {["contactFirstName", "eventName", "date"].map((v) => (
                        <button key={v} type="button" onClick={() => insertVariable(v, "subject")}
                          className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Thank you for your donation, {{contactFirstName}}" required />
                </div>

                {/* Body HTML */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-sm font-medium text-gray-700">Email Body (HTML)</label>
                    <div className="flex gap-1 flex-wrap justify-end">
                      {["contactFirstName", "amount", "orgName", "eventName"].map((v) => (
                        <button key={v} type="button" onClick={() => insertVariable(v, "html")}
                          className="text-[11px] bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded font-medium">
                          +{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={bodyHtml}
                    onChange={(e) => setBodyHtml(e.target.value)}
                    placeholder="Write your email template HTML here. Use variables like {{contactFirstName}} for personalisation."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    rows={14}
                    required
                  />
                </div>

                {/* Body plain text */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Plain Text Version (optional)</label>
                  <textarea
                    value={bodyText}
                    onChange={(e) => setBodyText(e.target.value)}
                    placeholder="Plain text fallback for email clients that don't support HTML"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
                    rows={5}
                  />
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <input type="checkbox" id="isActive" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-gray-300" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Template is active</label>
                </div>

                <div className="flex justify-end gap-3 pt-2 border-t">
                  <Link href="/settings/email-templates">
                    <Button variant="outline" type="button">Cancel</Button>
                  </Link>
                  <Button type="submit" disabled={loading} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    {loading ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Template"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — variables + preview */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Variables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {AVAILABLE_VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key, "html")}
                  className="w-full text-left p-2 bg-gray-50 hover:bg-indigo-50 rounded text-sm transition-colors group"
                >
                  <span className="font-mono text-xs text-indigo-600 group-hover:text-indigo-800">{`{{${v.key}}}`}</span>
                  <span className="text-gray-500 text-xs ml-2">{v.label}</span>
                </button>
              ))}
            </CardContent>
          </Card>

          {showPreview && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white">
                  {/* Email header with logo */}
                  <div className="bg-gray-50 border-b p-4 text-center">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="max-h-12 mx-auto object-contain" />
                    ) : (
                      <div className="text-sm text-gray-400 italic">No logo set</div>
                    )}
                  </div>
                  {/* Subject line */}
                  <div className="px-4 py-2 border-b bg-gray-50">
                    <p className="text-xs text-gray-500">Subject</p>
                    <p className="text-sm font-semibold text-gray-900">{subject || "No subject"}</p>
                  </div>
                  {/* Body */}
                  <div className="p-4 text-sm" dangerouslySetInnerHTML={{ __html: buildPreviewHtml() || "<p class='text-gray-400 italic'>No content yet</p>" }} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
