"use client";

import { useState, useCallback, useMemo } from "react";
import { FormDefinition, FormSubmissionData, ConditionalLogic } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface FormRendererProps {
  form: FormDefinition;
  onSubmit?: (data: FormSubmissionData) => void | Promise<void>;
}

export function FormRenderer({ form, onSubmit }: FormRendererProps) {
  const [data, setData] = useState<FormSubmissionData>({});
  const [submitting, setSubmitting] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Set<string>>(
    new Set(form.fields.map((f) => f.id))
  );

  // Evaluate conditional logic
  const shouldShowField = useCallback(
    (logic?: ConditionalLogic[]): boolean => {
      if (!logic || logic.length === 0) return true;

      return logic.every((condition) => {
        const fieldValue = data[condition.fieldId];

        switch (condition.operator) {
          case "equals":
            return fieldValue === condition.value;
          case "notEquals":
            return fieldValue !== condition.value;
          case "contains":
            return String(fieldValue).includes(String(condition.value));
          case "greaterThan":
            return Number(fieldValue) > Number(condition.value);
          case "lessThan":
            return Number(fieldValue) < Number(condition.value);
          default:
            return true;
        }
      });
    },
    [data]
  );

  // Update visible fields based on conditional logic
  useMemo(() => {
    const visible = new Set<string>();
    form.fields.forEach((field) => {
      if (shouldShowField(field.conditionalLogic)) {
        visible.add(field.id);
      }
    });
    setVisibleFields(visible);
  }, [form.fields, shouldShowField]);

  const handleInputChange = (fieldId: string, value: any) => {
    setData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of form.fields) {
      if (field.required && visibleFields.has(field.id)) {
        if (!data[field.id] || data[field.id] === "") {
          alert(`${field.label} is required`);
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      if (onSubmit) {
        await onSubmit(data);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <h2 className="text-2xl font-bold text-gray-900">{form.title}</h2>
        {form.description && (
          <p className="text-gray-600 mt-2">{form.description}</p>
        )}
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {form.fields.map((field) => {
            if (!visibleFields.has(field.id)) return null;

            return (
              <div key={field.id} className="space-y-2">
                <label className="block text-sm font-medium text-gray-900">
                  {field.label}
                  {field.required && <span className="text-red-500 ml-1">*</span>}
                </label>

                {field.helpText && (
                  <p className="text-sm text-gray-500">{field.helpText}</p>
                )}

                {/* TEXT, EMAIL, PHONE, NUMBER, DATE, FILE, HIDDEN */}
                {[
                  "TEXT",
                  "EMAIL",
                  "PHONE",
                  "NUMBER",
                  "DATE",
                  "FILE",
                  "HIDDEN",
                ].includes(field.type) && (
                  <input
                    type={
                      field.type === "HIDDEN"
                        ? "hidden"
                        : field.type.toLowerCase() === "text"
                          ? "text"
                          : field.type.toLowerCase()
                    }
                    placeholder={field.placeholder}
                    value={
                      String(data[field.id] ?? "")
                    }
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                    className={`w-full px-3 py-2 border rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                      field.type === "HIDDEN" ? "hidden" : ""
                    }`}
                  />
                )}

                {/* TEXTAREA */}
                {field.type === "TEXTAREA" && (
                  <textarea
                    placeholder={field.placeholder}
                    value={String(data[field.id] ?? "")}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  />
                )}

                {/* SELECT */}
                {field.type === "SELECT" && (
                  <select
                    value={String(data[field.id] ?? "")}
                    onChange={(e) => handleInputChange(field.id, e.target.value)}
                    required={field.required}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:border-indigo-500 focus:ring-indigo-500"
                  >
                    <option value="">
                      {field.placeholder || "Select an option"}
                    </option>
                    {(field.options || []).map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* RADIO */}
                {field.type === "RADIO" && (
                  <div className="space-y-2">
                    {(field.options || []).map((option) => (
                      <label
                        key={option.value}
                        className="flex items-center gap-3 cursor-pointer"
                      >
                        <input
                          type="radio"
                          name={field.id}
                          value={option.value}
                          checked={data[field.id] === option.value}
                          onChange={(e) =>
                            handleInputChange(field.id, e.target.value)
                          }
                          required={field.required}
                          className="rounded-full border-gray-300 text-indigo-600"
                        />
                        <span className="text-sm text-gray-700">
                          {option.label}
                        </span>
                      </label>
                    ))}
                  </div>
                )}

                {/* CHECKBOX */}
                {field.type === "CHECKBOX" && (
                  <div className="space-y-2">
                    {(field.options || []).map((option) => {
                      const selectedValues = Array.isArray(data[field.id])
                        ? (data[field.id] as string[])
                        : [];
                      return (
                        <label
                          key={option.value}
                          className="flex items-center gap-3 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            value={option.value}
                            checked={selectedValues.includes(option.value)}
                            onChange={(e) => {
                              const current = selectedValues;
                              if (e.target.checked) {
                                handleInputChange(field.id, [
                                  ...current,
                                  option.value,
                                ]);
                              } else {
                                handleInputChange(
                                  field.id,
                                  current.filter((v) => v !== option.value)
                                );
                              }
                            }}
                            className="rounded border-gray-300 text-indigo-600"
                          />
                          <span className="text-sm text-gray-700">
                            {option.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
            style={{
              backgroundColor: form.settings?.primaryColor || "#4F46E5",
            }}
          >
            {submitting ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
