"use client";

import { useState, useRef } from "react";
import { FormField, FormDefinition, FieldType } from "./types";
import { FieldEditor } from "./field-editor";
import { FormRenderer } from "./form-renderer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Plus,
  Trash2,
  GripVertical,
  Eye,
  Code,
  Settings,
} from "lucide-react";

interface FormBuilderProps {
  form: FormDefinition;
  onSave: (form: FormDefinition) => void;
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

export function FormBuilder({ form: initialForm, onSave }: FormBuilderProps) {
  const [form, setForm] = useState<FormDefinition>(initialForm);
  const [showPreview, setShowPreview] = useState(false);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);

  const handleAddField = (type: FieldType) => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      label: "",
      type,
      required: false,
      order: form.fields.length,
      placeholder: "",
      helpText: "",
      options: type === "SELECT" || type === "RADIO" ? [] : undefined,
    };
    setForm({ ...form, fields: [...form.fields, newField] });
  };

  const handleDeleteField = (fieldId: string) => {
    setForm({
      ...form,
      fields: form.fields
        .filter((f) => f.id !== fieldId)
        .map((f, idx) => ({ ...f, order: idx })),
    });
  };

  const handleEditField = (field: FormField) => {
    setEditingField(field);
  };

  const handleSaveField = (updatedField: FormField) => {
    setForm({
      ...form,
      fields: form.fields.map((f) =>
        f.id === updatedField.id ? updatedField : f
      ),
    });
    setEditingField(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, fieldId: string) => {
    setDraggedField(fieldId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragLeave = () => {
    dragOverIndexRef.current = null;
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedField) return;

    const sourceIndex = form.fields.findIndex((f) => f.id === draggedField);
    if (sourceIndex === -1) return;

    const newFields = [...form.fields];
    const [movedField] = newFields.splice(sourceIndex, 1);
    newFields.splice(targetIndex, 0, movedField);

    // Update order for all fields
    const reorderedFields = newFields.map((f, idx) => ({ ...f, order: idx }));
    setForm({ ...form, fields: reorderedFields });
    setDraggedField(null);
    dragOverIndexRef.current = null;
  };

  const handleDragEnd = () => {
    setDraggedField(null);
    dragOverIndexRef.current = null;
  };

  if (showPreview) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Form Preview</h2>
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
            className="gap-2"
          >
            <Code className="h-4 w-4" />
            Back to Editor
          </Button>
        </div>
        <FormRenderer form={form} onSubmit={() => {}} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Form Fields</h2>
          <p className="text-sm text-gray-500 mt-1">
            Drag to reorder, click to edit
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowPreview(true)}
          className="gap-2"
        >
          <Eye className="h-4 w-4" />
          Preview
        </Button>
      </div>

      {/* Fields List */}
      <Card>
        <CardContent className="pt-6">
          {form.fields.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No fields yet. Add one below.</p>
            </div>
          ) : (
            <div className="space-y-2 mb-6">
              {form.fields.map((field, index) => (
                <div
                  key={field.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, field.id)}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-move transition-colors ${
                    draggedField === field.id
                      ? "opacity-50 bg-gray-50 border-dashed border-gray-400"
                      : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <GripVertical className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {field.label || "(Untitled)"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {FIELD_TYPES.find((t) => t.value === field.type)?.label ||
                        field.type}
                      {field.required && " • Required"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleEditField(field)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit field"
                    >
                      <Settings className="h-4 w-4 text-gray-500" />
                    </button>
                    <button
                      onClick={() => handleDeleteField(field.id)}
                      className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete field"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add Field Section */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Add Field</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
              {FIELD_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => handleAddField(type.value)}
                  className="p-2 text-xs font-medium text-center rounded-lg border border-gray-300 hover:border-indigo-500 hover:bg-indigo-50 transition-colors"
                >
                  <Plus className="h-3 w-3 mx-auto mb-1" />
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Editor Modal */}
      {editingField && (
        <FieldEditor
          field={editingField}
          isOpen={Boolean(editingField)}
          onClose={() => setEditingField(null)}
          onSave={handleSaveField}
        />
      )}

      {/* Save Actions */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          onClick={() => setForm(initialForm)}
          disabled={JSON.stringify(form) === JSON.stringify(initialForm)}
        >
          Discard Changes
        </Button>
        <Button
          onClick={() => onSave(form)}
          disabled={JSON.stringify(form) === JSON.stringify(initialForm)}
        >
          Save Changes
        </Button>
      </div>
    </div>
  );
}
