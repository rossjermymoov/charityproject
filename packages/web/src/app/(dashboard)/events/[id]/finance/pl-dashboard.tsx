"use client";

interface Props {
  totalIncome: number;
  totalCosts: number;
  profit: number;
  incomeTarget: number;
  costTarget: number;
  profitTarget: number;
  estimatedCosts: number;
  finalTakings: number | null;
  isCompleted: boolean;
}

function GaugeDial({
  value,
  target,
  label,
  colour,
  prefix = "£",
}: {
  value: number;
  target: number;
  label: string;
  colour: string;
  prefix?: string;
}) {
  const pct = target > 0 ? Math.min((value / target) * 100, 100) : 0;
  const strokeDasharray = `${(pct / 100) * 251.2} 251.2`;
  const overTarget = target > 0 && value > target;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="10"
          />
          <circle
            cx="50" cy="50" r="40"
            fill="none"
            stroke={overTarget ? "#ef4444" : colour}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900">
            {target > 0 ? `${Math.round(pct)}%` : "—"}
          </span>
        </div>
      </div>
      <p className="text-sm font-semibold text-gray-700 mt-2">{label}</p>
      <p className="text-xs text-gray-500">
        {prefix}{value.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
        {target > 0 && (
          <span> / {prefix}{target.toLocaleString("en-GB", { minimumFractionDigits: 2 })}</span>
        )}
      </p>
    </div>
  );
}

function BarRow({
  label,
  estimated,
  actual,
  colour,
}: {
  label: string;
  estimated: number;
  actual: number;
  colour: string;
}) {
  const max = Math.max(estimated, actual, 1);
  const estPct = (estimated / max) * 100;
  const actPct = (actual / max) * 100;

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="text-gray-500">
          £{actual.toLocaleString("en-GB", { minimumFractionDigits: 2 })} actual
          {estimated > 0 && ` / £${estimated.toLocaleString("en-GB", { minimumFractionDigits: 2 })} est.`}
        </span>
      </div>
      <div className="relative h-5 bg-gray-100 rounded-full overflow-hidden">
        {estimated > 0 && (
          <div
            className="absolute inset-y-0 left-0 rounded-full opacity-30"
            style={{ width: `${estPct}%`, backgroundColor: colour }}
          />
        )}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{ width: `${actPct}%`, backgroundColor: colour }}
        />
      </div>
    </div>
  );
}

export function PLDashboard({
  totalIncome,
  totalCosts,
  profit,
  incomeTarget,
  costTarget,
  profitTarget,
  estimatedCosts,
  finalTakings,
  isCompleted,
}: Props) {
  const margin = totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 rounded-xl p-4 border border-green-200">
          <p className="text-xs font-medium text-green-700 uppercase">Total Income</p>
          <p className="text-2xl font-bold text-green-800 mt-1">
            £{totalIncome.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-red-50 rounded-xl p-4 border border-red-200">
          <p className="text-xs font-medium text-red-700 uppercase">Total Costs</p>
          <p className="text-2xl font-bold text-red-800 mt-1">
            £{totalCosts.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
          </p>
          {estimatedCosts > 0 && (
            <p className="text-xs text-red-600 mt-0.5">
              Est. £{estimatedCosts.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>
        <div className={`rounded-xl p-4 border ${profit >= 0 ? "bg-blue-50 border-blue-200" : "bg-amber-50 border-amber-200"}`}>
          <p className={`text-xs font-medium uppercase ${profit >= 0 ? "text-blue-700" : "text-amber-700"}`}>Profit / Loss</p>
          <p className={`text-2xl font-bold mt-1 ${profit >= 0 ? "text-blue-800" : "text-amber-800"}`}>
            £{profit.toLocaleString("en-GB", { minimumFractionDigits: 2 })}
          </p>
          <p className={`text-xs mt-0.5 ${profit >= 0 ? "text-blue-600" : "text-amber-600"}`}>
            {margin}% margin
          </p>
        </div>
        {isCompleted ? (
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
            <p className="text-xs font-medium text-purple-700 uppercase">Status</p>
            <p className="text-lg font-bold text-purple-800 mt-1">Completed</p>
            {finalTakings != null && finalTakings > 0 && (
              <p className="text-xs text-purple-600 mt-0.5">+£{finalTakings.toLocaleString("en-GB", { minimumFractionDigits: 2 })} additional</p>
            )}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <p className="text-xs font-medium text-gray-600 uppercase">Status</p>
            <p className="text-lg font-bold text-gray-800 mt-1">In Progress</p>
            <p className="text-xs text-gray-500 mt-0.5">Awaiting completion</p>
          </div>
        )}
      </div>

      {/* Gauge Dials */}
      {(incomeTarget > 0 || costTarget > 0 || profitTarget > 0) && (
        <div className="flex justify-center gap-10 py-4">
          <GaugeDial value={totalIncome} target={incomeTarget} label="Income" colour="#16a34a" />
          <GaugeDial value={totalCosts} target={costTarget} label="Costs" colour="#dc2626" />
          <GaugeDial value={profit} target={profitTarget} label="Profit" colour="#2563eb" />
        </div>
      )}

      {/* Stacked Bars — Costs */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Cost Breakdown</h4>
        <BarRow label="Total Costs" estimated={estimatedCosts} actual={totalCosts} colour="#dc2626" />
      </div>
    </div>
  );
}
