"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface CopyLinkButtonProps {
  token: string;
}

export function CopyLinkButton({ token }: CopyLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    const url = `${window.location.origin}/declare/${token}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 p-2 rounded-lg hover:bg-gray-200 transition text-gray-500 hover:text-gray-700"
      title="Copy link"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}
