"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Edit2, Trash2, ArrowLeft, Loader } from "lucide-react";
import type { SmsTemplate } from "@prisma/client";

export default function SmsTemplatesPage() {
  const [templates, setTemplates] = useState<SmsTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    body: "",
    variables: [] as string[],
  });
  const [variableInput, setVariableInput] = useState("");

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      setLoading(true);
      const response = await fetch("/api/sms/templates");
      if (!response.ok) throw new Error("Failed to fetch templates");

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error("Error fetching SMS templates:", error);
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setFormData({ name: "", body: "", variables: [] });
    setVariableInput("");
    setEditingId(null);
    setShowNewForm(false);
  }

  function addVariable() {
    if (variableInput.trim() && !formData.variables.includes(variableInput)) {
      setFormData({
        ...formData,
        variables: [...formData.variables, variableInput],
      });
      setVariableInput("");
    }
  }

  function removeVariable(variable: string) {
    setFormData({
      ...formData,
      variables: formData.variables.filter((v) => v !== variable),
    });
  }

  async function handleSave() {
    if (!formData.name || !formData.body) {
      alert("Please enter template name and body");
      return;
    }

    try {
      const url = editingId
        ? `/api/sms/templates/${editingId}`
        : "/api/sms/templates";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error("Failed to save template");

      await fetchTemplates();
      resetForm();
      alert(editingId ? "Template updated!" : "Template created!");
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this template?")) return;

    try {
      const response = await fetch(`/api/sms/templates/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete template");

      await fetchTemplates();
      alert("Template deleted!");
    } catch (error) {
      alert(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  function editTemplate(template: SmsTemplate) {
    setFormData({
      name: template.name,
      body: template.body,
      variables: (template.variables as string[]) || [],
    });
    setEditingId(template.id);
    setShowNewForm(true);
  }

  const openBracket = "{";
  const closeBracket = "}";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/communications/sms">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">SMS Templates</h1>
          <p className="text-gray-500 mt-1">Create and manage SMS templates</p>
        </div>
        {!showNewForm && (
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        )}
      </div>

      {/* Form */}
      {showNewForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Template" : "New Template"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="e.g., Weekly Update"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message Body (use{" "}
                <code className="bg-gray-100 px-1 rounded">
                  {openBracket}
                  {openBracket}variableName{closeBracket}
                  {closeBracket}
                </code>{" "}
                for placeholders)
              </label>
              <textarea
                value={formData.body}
                onChange={(e) =>
                  setFormData({ ...formData, body: e.target.value })
                }
                placeholder="Hello {{firstName}}, your event is on {{eventDate}}"
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Variables
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={variableInput}
                  onChange={(e) => setVariableInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addVariable()}
                  placeholder="e.g., firstName"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500"
                />
                <Button onClick={addVariable} variant="outline">
                  Add
                </Button>
              </div>

              {formData.variables.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.variables.map((variable) => (
                    <div
                      key={variable}
                      className="bg-blue-100 text-blue-900 px-3 py-1 rounded-full text-sm flex items-center gap-2"
                    >
                      {variable}
                      <button
                        onClick={() => removeVariable(variable)}
                        className="font-bold hover:text-blue-700"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={resetForm}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingId ? "Update" : "Create"} Template
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Templates List */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No templates yet</p>
              <Button onClick={() => setShowNewForm(true)}>
                Create Your First Template
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {template.body}
                      </p>
                      {(template.variables as string[]).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {(template.variables as string[]).map((v) => (
                            <span
                              key={v}
                              className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded"
                            >
                              {openBracket}
                              {openBracket}
                              {v}
                              {closeBracket}
                              {closeBracket}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => editTemplate(template)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
