"use client";

interface AutoSubmitSelectProps {
  name: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  className?: string;
}

export function AutoSubmitSelect({ name, defaultValue, options, className }: AutoSubmitSelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={(e) => e.currentTarget.form?.requestSubmit()}
      className={className || "text-sm font-medium rounded-full px-3 py-1 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  );
}
