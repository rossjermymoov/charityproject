"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Edit2, Trash2 } from "lucide-react";

interface LedgerCode {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
}

interface LedgerCodeActionButtonProps {
  code: LedgerCode;
  updateLedgerCode: (formData: FormData) => Promise<void>;
  toggleLedgerCode: (formData: FormData) => Promise<void>;
  deleteLedgerCode: (formData: FormData) => Promise<void>;
}

export function LedgerCodeActionButton({
  code,
  updateLedgerCode,
  toggleLedgerCode,
  deleteLedgerCode,
}: LedgerCodeActionButtonProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <form
        action={async (formData) => {
          await updateLedgerCode(formData);
          setIsEditing(false);
        }}
        className="space-y-2 w-full"
      >
        <input type="hidden" name="id" value={code.id} />
        <div className="space-y-2">
          <Input
            name="code"
            placeholder="Code"
            defaultValue={code.code}
            required
            className="text-xs"
          />
          <Input
            name="name"
            placeholder="Name"
            defaultValue={code.name}
            required
            className="text-xs"
          />
          <Input
            name="description"
            placeholder="Description"
            defaultValue={code.description || ""}
            className="text-xs"
          />
        </div>
        <div className="flex gap-1">
          <Button type="submit" size="sm" className="text-xs">Save</Button>
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={() => setIsEditing(false)}>Cancel</Button>
        </div>
      </form>
    );
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => setIsEditing(true)}
        className="text-xs"
      >
        <Edit2 className="h-3 w-3 mr-1" />
        Edit
      </Button>
      <form action={toggleLedgerCode} className="inline">
        <input type="hidden" name="id" value={code.id} />
        <input type="hidden" name="isActive" value={code.isActive ? "true" : "false"} />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="text-xs"
        >
          {code.isActive ? "Deactivate" : "Activate"}
        </Button>
      </form>
      <form
        action={deleteLedgerCode}
        className="inline"
        onSubmit={(e) => {
          if (!confirm("Are you sure you want to delete this ledger code?")) {
            e.preventDefault();
          }
        }}
      >
        <input type="hidden" name="id" value={code.id} />
        <Button type="submit" size="sm" variant="ghost" className="text-red-600 hover:text-red-700 p-2">
          <Trash2 className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
