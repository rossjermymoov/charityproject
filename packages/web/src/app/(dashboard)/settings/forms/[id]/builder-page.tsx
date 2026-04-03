"use client";

import { useState } from "react";
import { FormBuilder } from "@/components/forms/form-builder";
import { FormDefinition, FormField } from "@/components/forms/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { useRouter } from "next/navigation";

interface BuilderPageProps {
  formId: string;
  initialForm: {
    id: string;
    name: string;
    title: string;
    description: string | null;
    primaryColor: string;
    thankYouMessage: string;
    fields: Array<{
      id: string;
      label: string;
      type: string;
      placeholder: string | null;
      helpText: string | null;
      isRequired: boolean;
      options: string | null;
      sortOrder: number;
    }>;
  };
}

export default function BuilderPage({
  formId,
  initialForm,
}: BuilderPageProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Convert database format to FormDefinition
  const convertToFormDefinition = (form: BuilderPageProps["initialForm"]): FormDefinition => {
    return {
      id: form.id,
      name: form.name,
      title: form.title,
      description: form.description || undefined,
      fields: form.fields.map((f) => ({
        id: f.id,
        label: f.label,
        type: f.type as any,
        placeholder: f.placeholder || undefined,
        helpText: f.helpText || undefined,
        required: f.isRequired,
        options: f.options ? JSON.parse(f.options) : undefined,
        order: f.sortOrder,
      })),
      settings: {
        primaryColor: form.primaryColor,
        thankYouMessage: form.thankYouMessage,
      },
    };
  };

  const handleSave = async (form: FormDefinition) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/forms/${formId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          title: form.title,
          description: form.description,
          primaryColor: form.settings?.primaryColor,
          thankYouMessage: form.settings?.thankYouMessage,
          fields: form.fields.map((f) => ({
            id: f.id,
            label: f.label,
            type: f.type,
            placeholder: f.placeholder,
            helpText: f.helpText,
            required: f.required,
            options: f.options,
            order: f.order,
          })),
        }),
      });

      if (response.ok) {
        router.refresh();
        alert("Form saved successfully");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save form");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/settings/forms/${formId}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {initialForm.name}
            </h1>
            <p className="text-gray-500 mt-1">Enhanced Form Builder</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Builder */}
        <div className="lg:col-span-2">
          <FormBuilder
            form={convertToFormDefinition(initialForm)}
            onSave={handleSave}
          />
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Form Settings</h3>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Form Title
                </label>
                <p className="text-sm text-gray-900">{initialForm.title}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-200"
                    style={{ backgroundColor: initialForm.primaryColor }}
                  />
                  <code className="text-xs text-gray-600">
                    {initialForm.primaryColor}
                  </code>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Thank You Message
                </label>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {initialForm.thankYouMessage}
                </p>
              </div>
              <Link
                href={`/settings/forms/${formId}`}
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                Edit All Settings
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-sm font-semibold text-gray-900">Builder Tips</h3>
            </CardHeader>
            <CardContent className="text-xs space-y-2 text-gray-600">
              <p>
                <strong>Drag to Reorder:</strong> Use the grip icon to drag fields
              </p>
              <p>
                <strong>Edit Fields:</strong> Click settings icon to edit properties
              </p>
              <p>
                <strong>Field Types:</strong> Supports text, email, phone, numbers, dates,
                dropdowns, checkboxes, radio buttons, and file uploads
              </p>
              <p>
                <strong>Validation:</strong> Mark fields as required to enforce validation
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
