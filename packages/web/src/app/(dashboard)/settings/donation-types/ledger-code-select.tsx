"use client";

interface LedgerCodeSelectProps {
  typeId: string;
  currentValue: string;
  ledgerCodes: { id: string; code: string; name: string }[];
  updateAction: (formData: FormData) => Promise<void>;
}

export function LedgerCodeSelect({ typeId, currentValue, ledgerCodes, updateAction }: LedgerCodeSelectProps) {
  return (
    <form action={updateAction} className="inline shrink-0">
      <input type="hidden" name="id" value={typeId} />
      <select
        name="ledgerCodeId"
        defaultValue={currentValue}
        onChange={(e) => {
          const form = (e.target as HTMLSelectElement).form;
          if (form) form.requestSubmit();
        }}
        className="text-xs h-7 px-1.5 rounded border border-gray-200 bg-gray-50 text-gray-700 w-36"
      >
        <option value="">No ledger code</option>
        {ledgerCodes.map((lc) => (
          <option key={lc.id} value={lc.id}>{lc.code} - {lc.name}</option>
        ))}
      </select>
    </form>
  );
}
