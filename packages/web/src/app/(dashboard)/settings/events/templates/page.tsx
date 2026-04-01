import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileSpreadsheet, Trash2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { createTemplate, deleteTemplate } from "./actions";

export default async function FinancialTemplatesPage() {
  const templates = await prisma.financialTemplate.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/settings/events" className="text-gray-400 hover:text-gray-600">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Templates</h1>
          <p className="text-gray-500 mt-1">Reusable P&L structures for events</p>
        </div>
      </div>

      {/* Create template */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Create Template</h2>
        <form action={createTemplate} className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Template Name" name="name" required placeholder="e.g. Annual Fun Run" />
            <Input label="Description" name="description" placeholder="Optional description" />
          </div>
          <div className="flex justify-end">
            <Button type="submit" className="gap-1">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </div>
        </form>
      </Card>

      {/* Templates list */}
      <div className="space-y-3">
        {templates.length === 0 ? (
          <Card className="p-6">
            <div className="flex items-center gap-3 text-center justify-center py-8">
              <FileSpreadsheet className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-gray-500">No templates yet.</p>
                <p className="text-sm text-gray-500">Create one above or save from an event's finance page.</p>
              </div>
            </div>
          </Card>
        ) : (
          templates.map(template => {
            const incomeLines = template.incomeLines ? JSON.parse(template.incomeLines) : [];
            const costLines = template.costLines ? JSON.parse(template.costLines) : [];

            return (
              <Card key={template.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    {template.description && (
                      <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-2">
                      {incomeLines.length} income lines, {costLines.length} cost lines
                      {" • "}Created {formatDate(template.createdAt)}
                    </p>
                  </div>
                  <form action={deleteTemplate} className="ml-4 flex-shrink-0">
                    <input type="hidden" name="templateId" value={template.id} />
                    <button type="submit" className="text-gray-400 hover:text-red-600 p-2 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </form>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
