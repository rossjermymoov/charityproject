import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, DollarSign, RefreshCw, TrendingUp } from "lucide-react";

export default async function CurrencySettingsPage() {
  await requireAuth();

  const currencies = [
    { code: "GBP", name: "British Pound", symbol: "£", default: true },
    { code: "EUR", name: "Euro", symbol: "€", default: false },
    { code: "USD", name: "US Dollar", symbol: "$", default: false },
    { code: "AUD", name: "Australian Dollar", symbol: "A$", default: false },
    { code: "CAD", name: "Canadian Dollar", symbol: "C$", default: false },
  ];

  const exchangeRates = [
    { from: "GBP", to: "EUR", rate: 1.17, lastUpdated: "2024-04-04" },
    { from: "GBP", to: "USD", rate: 1.27, lastUpdated: "2024-04-04" },
    { from: "GBP", to: "AUD", rate: 1.95, lastUpdated: "2024-04-04" },
    { from: "GBP", to: "CAD", rate: 1.72, lastUpdated: "2024-04-04" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">
            Settings
          </Link>
          <span>/</span>
          <Link href="/settings/preferences" className="hover:text-gray-700">
            Preferences
          </Link>
          <span>/</span>
          <span>Currency Settings</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/preferences"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Currency Settings
            </h1>
            <p className="text-gray-500 mt-1">
              Configure base currency and exchange rates
            </p>
          </div>
        </div>
      </div>

      {/* Base Currency */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Base Currency</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Default Currency for All Transactions
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg font-medium">
              {currencies.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.symbol} {curr.code} - {curr.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-2">
              This currency will be used for all financial reports and display
              throughout the system
            </p>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked
                className="mt-1 h-4 w-4 text-indigo-600"
              />
              <div>
                <p className="font-medium text-gray-900">
                  Show Currency Symbol
                </p>
                <p className="text-sm text-gray-500">
                  Display currency symbol (e.g., £) in addition to amounts
                </p>
              </div>
            </label>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Save Base Currency
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Display Format */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Display Format</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Number Separator
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="separator"
                  defaultChecked
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="text-sm">Comma (1,234.56)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="separator"
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="text-sm">Period (1.234,56)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="separator"
                  className="h-4 w-4 text-indigo-600"
                />
                <span className="text-sm">Space (1 234,56)</span>
              </label>
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Decimal Places
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>2 decimal places (standard)</option>
              <option>0 decimal places</option>
              <option>3 decimal places</option>
            </select>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Save Display Format
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Exchange Rates */}
      <Card>
        <CardHeader className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Exchange Rates</h3>
          <Button variant="outline" className="gap-2 text-sm">
            <RefreshCw className="h-4 w-4" />
            Sync ECB
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              defaultChecked
              className="mt-1 h-4 w-4 text-indigo-600"
            />
            <div>
              <p className="font-medium text-gray-900">
                Auto-fetch Exchange Rates
              </p>
              <p className="text-sm text-gray-500">
                Automatically update rates daily from European Central Bank (ECB)
                or Bank of England (BoE)
              </p>
            </div>
          </label>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-900 mb-3">
              Rate Source
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>European Central Bank (ECB) - Daily</option>
              <option>Bank of England (BoE) - Daily</option>
              <option>OpenExchangeRates - Real-time</option>
              <option>Manual Entry Only</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Current Rates (1 GBP = ...)
            </h4>
            <div className="space-y-3">
              {exchangeRates.map((rate) => (
                <div key={`${rate.from}-${rate.to}`} className="flex items-end gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-600 mb-1">
                      {rate.to}
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      defaultValue={rate.rate}
                      className="w-full"
                    />
                  </div>
                  <p className="text-xs text-gray-500 pb-2">
                    {rate.lastUpdated}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Save Exchange Rates
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Multi-Currency Support Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <DollarSign className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">
                Multi-Currency Features
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>
                  Record donations in multiple currencies and convert to base
                </li>
                <li>
                  Automatic exchange rate conversion for reports and analytics
                </li>
                <li>
                  Historical rate tracking for accurate financial reporting
                </li>
                <li>Manual rate overrides for special circumstances</li>
                <li>
                  Real-time exchange rate updates from trusted financial sources
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
