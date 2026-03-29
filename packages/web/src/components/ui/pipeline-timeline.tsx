"use client";

/**
 * Visual pipeline timeline with an animated icon that slides along milestones.
 * Used for Grants (pot of gold) and Legacies (dove).
 */

import type { TimelineStep } from "./pipeline-steps";

interface PipelineTimelineProps {
  steps: TimelineStep[];
  currentStepKey: string;
  variant: "grant" | "legacy";
  /** compact = inline in table rows, full = detail page */
  size?: "compact" | "full";
}

// SVG icons as inline components so we don't need lucide for these custom ones
function PotOfGold({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      {/* Pot */}
      <ellipse cx="16" cy="22" rx="10" ry="3" fill="#92400E" />
      <path d="M6 22v4c0 1.66 4.48 3 10 3s10-1.34 10-3v-4" fill="#78350F" />
      <path d="M8 14h16l2 8H6l2-8z" fill="#92400E" />
      {/* Gold coins */}
      <circle cx="12" cy="13" r="3" fill="#FCD34D" />
      <circle cx="18" cy="12" r="3" fill="#FBBF24" />
      <circle cx="15" cy="10" r="3" fill="#FDE68A" />
      <circle cx="16" cy="14" r="2.5" fill="#F59E0B" />
      {/* Rainbow arc */}
      <path d="M4 16C4 8 10 3 16 3s12 5 12 13" stroke="#EF4444" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M5 16C5 9 10.5 4.5 16 4.5S27 9 27 16" stroke="#F59E0B" strokeWidth="1.2" fill="none" opacity="0.6" />
      <path d="M6 16C6 10 11 6 16 6s10 4 10 10" stroke="#22C55E" strokeWidth="1.2" fill="none" opacity="0.6" />
    </svg>
  );
}

function Dove({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none">
      {/* Body */}
      <ellipse cx="16" cy="18" rx="7" ry="5" fill="#E0E7FF" />
      {/* Wing */}
      <path d="M10 16C6 12 4 8 6 6c2-2 6 1 8 4" fill="#C7D2FE" />
      <path d="M12 14C9 10 8 7 9 6c1.5-1.5 4 0 6 3" fill="#DDD6FE" />
      {/* Head */}
      <circle cx="21" cy="14" r="3" fill="#E0E7FF" />
      {/* Eye */}
      <circle cx="22" cy="13.5" r="0.8" fill="#1E1B4B" />
      {/* Beak */}
      <path d="M24 14l3-0.5-3 1.5z" fill="#F59E0B" />
      {/* Tail */}
      <path d="M9 18c-3 1-5 3-4 4s3-1 5-2" fill="#C7D2FE" />
      {/* Olive branch */}
      <path d="M24 15c2 2 3 4 2 5" stroke="#16A34A" strokeWidth="0.8" />
      <ellipse cx="25" cy="18" rx="1.5" ry="0.8" fill="#22C55E" transform="rotate(-20 25 18)" />
      <ellipse cx="24" cy="19.5" rx="1.5" ry="0.8" fill="#22C55E" transform="rotate(10 24 19.5)" />
    </svg>
  );
}

export function PipelineTimeline({ steps, currentStepKey, variant, size = "full" }: PipelineTimelineProps) {
  const currentIdx = steps.findIndex((s) => s.key === currentStepKey);
  const isCompact = size === "compact";

  // Calculate icon position as a percentage along the track
  const progressPercent = steps.length > 1
    ? (currentIdx / (steps.length - 1)) * 100
    : 0;

  const Icon = variant === "grant" ? PotOfGold : Dove;

  if (isCompact) {
    // Compact inline version for table rows
    return (
      <div className="flex items-center gap-1 min-w-[180px]">
        <div className="relative flex-1 h-6">
          {/* Track */}
          <div className="absolute top-[11px] left-0 right-0 h-[2px] bg-gray-200 rounded-full" />
          {/* Filled portion */}
          <div
            className="absolute top-[11px] left-0 h-[2px] rounded-full transition-all duration-700"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: variant === "grant" ? "#F59E0B" : "#818CF8",
            }}
          />
          {/* Dots */}
          {steps.map((step, i) => {
            const left = steps.length > 1 ? (i / (steps.length - 1)) * 100 : 0;
            const isCompleted = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div
                key={step.key}
                className="absolute top-[8px] -translate-x-1/2"
                style={{ left: `${left}%` }}
                title={step.label + (step.date ? ` (${step.date})` : "")}
              >
                <div
                  className={`w-[8px] h-[8px] rounded-full border-2 transition-all duration-500 ${
                    isCurrent
                      ? variant === "grant"
                        ? "border-amber-500 bg-amber-500 scale-125"
                        : "border-indigo-500 bg-indigo-500 scale-125"
                      : isCompleted
                        ? variant === "grant"
                          ? "border-amber-400 bg-amber-400"
                          : "border-indigo-400 bg-indigo-400"
                        : "border-gray-300 bg-white"
                  }`}
                />
              </div>
            );
          })}
          {/* Sliding icon */}
          <div
            className="absolute -top-[1px] -translate-x-1/2 transition-all duration-700 ease-out"
            style={{ left: `${progressPercent}%` }}
          >
            <Icon className="w-5 h-5 drop-shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  // Full-size version for detail pages
  return (
    <div className="relative py-4">
      {/* Track line */}
      <div className="absolute top-[42px] left-4 right-4 h-[3px] bg-gray-200 rounded-full" />
      {/* Filled track */}
      <div
        className="absolute top-[42px] left-4 h-[3px] rounded-full transition-all duration-1000 ease-out"
        style={{
          width: `calc(${progressPercent}% - 32px + ${progressPercent > 0 ? "32px" : "0px"})`,
          background: variant === "grant"
            ? "linear-gradient(90deg, #FDE68A, #F59E0B, #D97706)"
            : "linear-gradient(90deg, #C7D2FE, #818CF8, #6366F1)",
        }}
      />

      {/* Steps */}
      <div className="relative flex justify-between px-4">
        {steps.map((step, i) => {
          const isCompleted = i < currentIdx;
          const isCurrent = i === currentIdx;
          const isFuture = i > currentIdx;

          return (
            <div key={step.key} className="flex flex-col items-center" style={{ width: `${100 / steps.length}%` }}>
              {/* Node */}
              <div
                className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                  isCurrent
                    ? variant === "grant"
                      ? "bg-amber-500 text-white ring-4 ring-amber-200 scale-110"
                      : "bg-indigo-500 text-white ring-4 ring-indigo-200 scale-110"
                    : isCompleted
                      ? variant === "grant"
                        ? "bg-amber-400 text-white"
                        : "bg-indigo-400 text-white"
                      : "bg-white text-gray-400 border-2 border-gray-300"
                }`}
              >
                {isCompleted ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  i + 1
                )}
              </div>

              {/* Label */}
              <p className={`mt-2 text-xs text-center font-medium leading-tight ${
                isCurrent
                  ? "text-gray-900"
                  : isCompleted
                    ? "text-gray-700"
                    : "text-gray-400"
              }`}>
                {step.label}
              </p>

              {/* Date */}
              {step.date && (
                <p className={`text-[10px] mt-0.5 ${
                  isCurrent ? "text-gray-600" : "text-gray-400"
                }`}>
                  {step.date}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating icon above current step */}
      <div
        className="absolute -top-2 transition-all duration-1000 ease-out -translate-x-1/2"
        style={{ left: `calc(${progressPercent}% * (1 - 64px / 100%) + 16px)` }}
      >
        <div className="animate-bounce">
          <Icon className="w-10 h-10 drop-shadow-md" />
        </div>
      </div>
    </div>
  );
}

