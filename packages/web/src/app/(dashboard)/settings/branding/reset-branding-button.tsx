"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";

export function ResetBrandingButton({
  resetAction,
}: {
  resetAction: () => Promise<void>;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      "Reset branding to defaults? This will clear your organisation name, logo, and restore the default colours. This cannot be undone.",
    );
    if (!confirmed) return;
    startTransition(() => {
      resetAction();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
    >
      <RotateCcw className="h-4 w-4" />
      {isPending ? "Resetting…" : "Reset to defaults"}
    </button>
  );
}
