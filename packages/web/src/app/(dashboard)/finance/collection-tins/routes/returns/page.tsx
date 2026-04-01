import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, ScanBarcode, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatCurrency } from "@/lib/utils";
import { processReturn } from "../actions";

export default async function ReturnsPage() {
  // Recent returns
  const recentReturns = await prisma.tinReturn.findMany({
    include: {
      tin: true,
      route: true,
      countedBy: true,
    },
    orderBy: { returnedAt: "desc" },
    take: 20,
  });

  const todayTotal = recentReturns
    .filter(r => {
      const today = new Date();
      return r.returnedAt.toDateString() === today.toDateString();
    })
    .reduce((sum, r) => sum + r.amount, 0);

  const todayCount = recentReturns.filter(r => {
    const today = new Date();
    return r.returnedAt.toDateString() === today.toDateString();
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/finance/collection-tins/routes">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Routes
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Process Returns</h1>
          <p className="text-gray-500 mt-1">Scan or enter tin numbers to process returned tins</p>
        </div>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-2 gap-4 max-w-md">
        <Card className="p-4">
          <p className="text-sm text-gray-500">Today&apos;s Returns</p>
          <p className="text-2xl font-bold">{todayCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-500">Today&apos;s Total</p>
          <p className="text-2xl font-bold text-green-600">£{todayTotal.toFixed(2)}</p>
        </Card>
      </div>

      {/* Scan/Entry form */}
      <Card className="p-6 max-w-lg">
        <div className="flex items-center gap-2 mb-4">
          <ScanBarcode className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold">Scan or Enter Tin</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Use a barcode scanner or type the tin number. The cursor will auto-focus here.
        </p>
        <form action={processReturn} className="space-y-4">
          <div>
            <Input
              label="Tin Number"
              name="tinNumber"
              required
              placeholder="Scan barcode or type tin number..."
              autoFocus
            />
          </div>
          <div>
            <Input
              label="Amount (£)"
              name="amount"
              type="number"
              step="0.01"
              min="0"
              required
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
            <textarea
              name="notes"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              placeholder="Any notes about condition, discrepancies..."
            />
          </div>
          <Button type="submit" className="w-full">
            <Package className="h-4 w-4 mr-2" />
            Process Return
          </Button>
        </form>
      </Card>

      {/* Recent returns */}
      {recentReturns.length > 0 && (
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Returns</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-2">Tin</th>
                <th className="pb-2">Route</th>
                <th className="pb-2">Amount</th>
                <th className="pb-2">Counted By</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {recentReturns.map(ret => (
                <tr key={ret.id} className="border-b last:border-0">
                  <td className="py-2">
                    <Link href={`/finance/collection-tins/${ret.tin.id}`} className="font-mono text-indigo-600 hover:underline">
                      {ret.tin.tinNumber}
                    </Link>
                  </td>
                  <td className="py-2">
                    {ret.route ? (
                      <Link href={`/finance/collection-tins/routes/${ret.route.id}`} className="text-indigo-600 hover:underline">
                        {ret.route.name}
                      </Link>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="py-2 font-medium text-green-600">£{ret.amount.toFixed(2)}</td>
                  <td className="py-2">{ret.countedBy.name}</td>
                  <td className="py-2 text-gray-500">{formatDate(ret.returnedAt)}</td>
                  <td className="py-2 text-gray-500 max-w-[200px] truncate">{ret.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
