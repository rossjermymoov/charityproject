"use client";

import { useState } from "react";
import { FormField, FieldType, FieldOption, ValidationRule } from "./types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { X, Plus, Trash2 } from "lucide-react";

interface FieldEditorProps {
  field: FormField;
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: FormField) => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: "TEXT", label: "Text" },
  { value: "EMAIL", label: "Email" },
  { value: "PHONE", label: "Phone" },
  { value: "NUMBER", label: "Number" },
  { value: "DATE", label: "Date" },
  { value: "TEXTAREA", label: "Long Text" },
  { value: "SELECT", label: "Dropdown" },
  { value: "CHECKBOX", label: "Checkbox" },
  { value: "RADIO", label: "Radio" },
  { value: "FILE", label: "File Upload" },
  { value: "HIDDEN", label: "Hidden" },
];

const FIELD_TYPES_WITH_OPTIONS = ["SELECT", "CHECKBOX", "RADIO"];

export function FieldEditor({
  field: initialField,
  isOpen,
  onClose,
  onSave,
}: FieldEditorProps) {
  const [field, setField] = useState<FormField>(initialField);
  const [newOption, setNewOption] = useState<FieldOption>({
    value: "",
    label: "",
  });

  if (!isOpen) return null;

  const hasOptions = FIELD_TYPES_WITH_OPTIONS.includes(field.type);

  const handleAddOption = () => {
    if (newOption.value && newOption.label) {
      const options = field.options || [];
      setField({
        ...field,
        options: [...options, newOption],
      });
      setNewOption({ value: "", label: "" });
    }
  };

  const handleRemoveOption = (index: number) => {
    const options = field.options || [];
    setField({
      ...field,
      options: options.filter((_, i) => i !== index),
    });
  };

  const handleSave = () => {
    onSave(field);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex items-center justify-between border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Edit Field</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </CardHeader>

        <CardContent className="space-y-6 pt-6">
          {/* Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={field.label}
              onChange={(e) => setField({ ...field, label: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g. Full Name"
            />
          </div>

          {/* Field Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Field Type
            </label>
            <select
              value={field.type}
              onChange={(e) =>
                setField({
                  ...field,
                  type: e.target.value as FieldType,
                  options: FIELD_TYPES_WITH_OPTIONS.includes(e.target.value)
                    ? field.options
                    : undefined,
                })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              {FIELD_TYPES.map((ft) => (
                <option key={ft.value} value={ft.value}>
                  {ft.label}
                </option>
              ))}
            </select>
          </div>

          {/* Placeholder */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Placeholder (optional)
            </label>
            <input
              type="text"
              value={field.placeholder || ""}
              onChange={(e) =>
                setField({ ...field, placeholder: e.target.value })
              }
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="e.g. Enter your full name"
            />
          </div>

          {/* Help Text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Help Text (optional)
            </label>
            <textarea
              value={field.helpText || ""}
              onChange={(e) =>
                setField({ ...field, helpText: e.target.value })
              }
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Additional help or instructions for this field"
            />
          </div>

          {/* Required */}
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={field.required}
              onChange={(e) => setField({ ...field, required: e.target.checked })}
              className="rounded border-gray-300 text-indigo-600"
            />
            <span className="text-sm text-gray-700">Mark as required</span>
          </label>

          {/* Options for SELECT, CHECKBOX, RADIO */}
          {hasOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Options
              </label>
              <div className="space-y-2 mb-4">
                {(field.options || []).map((option, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={option.value}
                        onChange={(e) => {
                          const options = field.options || [];
                          options[idx].value = e.target.value;
                          setField({ ...field, options: [...options] });
                        }}
                        placeholder="Value"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <input
                        type="text"
                        value={option.label}
                        onChange={(e) => {
                          const options = field.options || [];
                          options[idx].label = e.target.value;
                          setField({ ...field, options: [...options] });
                        }}
                        placeholder="Label"
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleRemoveOption(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <input
                  type="text"
                  value={newOption.value}
                  onChange={(e) =>
                    setNewOption({ ...newOption, value: e.target.value })
                  }
                  placeholder="Option value"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newOption.label}
                  onChange={(e) =>
                    setNewOption({ ...newOption, label: e.target.value })
                  }
                  placeholder="Option label"
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Field</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
