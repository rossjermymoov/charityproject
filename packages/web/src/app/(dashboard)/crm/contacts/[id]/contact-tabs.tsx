"use client";

import { useState, type ReactNode } from "react";
import { FileText, MessageSquare } from "lucide-react";

interface ContactTabsProps {
  overviewContent: ReactNode;
  activityContent: ReactNode;
  interactionCount: number;
  noteCount: number;
}

export function ContactTabs({
  overviewContent,
  activityContent,
  interactionCount,
  noteCount,
}: ContactTabsProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "activity">("overview");

  const totalActivity = interactionCount + noteCount;

  return (
    <div>
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex gap-8" aria-label="Contact tabs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`
              flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === "overview"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <FileText className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`
              flex items-center gap-2 py-3 px-1 text-sm font-medium border-b-2 transition-colors
              ${
                activeTab === "activity"
                  ? "border-teal-600 text-teal-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }
            `}
          >
            <MessageSquare className="h-4 w-4" />
            Activity
            {totalActivity > 0 && (
              <span
                className={`
                  ml-1 rounded-full px-2 py-0.5 text-xs font-medium
                  ${
                    activeTab === "activity"
                      ? "bg-teal-100 text-teal-700"
                      : "bg-gray-100 text-gray-600"
                  }
                `}
              >
                {totalActivity}
              </span>
            )}
          </button>
        </nav>
      </div>

      {/* Both tabs are rendered but only one is visible — preserves form state */}
      <div className={activeTab === "overview" ? "" : "hidden"}>
        {overviewContent}
      </div>
      <div className={activeTab === "activity" ? "" : "hidden"}>
        {activityContent}
      </div>
    </div>
  );
}
