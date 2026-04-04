import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, ShoppingCart, Zap, TrendingUp } from "lucide-react";

export default async function EcommercePage() {
  await requireAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href="/settings" className="hover:text-gray-700">
            Settings
          </Link>
          <span>/</span>
          <Link href="/settings/integrations" className="hover:text-gray-700">
            Integrations
          </Link>
          <span>/</span>
          <span>E-commerce</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              E-commerce Integration
            </h1>
            <p className="text-gray-500 mt-1">
              Connect WooCommerce or Shopify to track product sales and donations
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-gray-200">
        <button className="px-4 py-2 font-medium text-gray-900 border-b-2 border-indigo-600 relative -mb-[1px]">
          WooCommerce
        </button>
        <button className="px-4 py-2 font-medium text-gray-500 hover:text-gray-900">
          Shopify
        </button>
      </div>

      {/* WooCommerce Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" rx="10" fill="#96588A" />
              <path d="M14 20c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="#fff" />
              <path d="M30 20c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4z" fill="#fff" />
              <path d="M16 30c0 2 1 4 2.5 4.5M30 30c0 2-1 4-2.5 4.5" stroke="#fff" strokeWidth="1.5" fill="none" />
            </svg>
            <h3 className="font-semibold text-gray-900">WooCommerce</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Store URL
            </label>
            <Input
              placeholder="https://your-store.com"
              defaultValue=""
            />
            <p className="text-xs text-gray-500 mt-1">
              Your WooCommerce store base URL
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Consumer Key
            </label>
            <Input type="password" placeholder="ck_xxxxxxxxxxxx" defaultValue="" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 mb-1">
              Consumer Secret
            </label>
            <Input type="password" placeholder="cs_xxxxxxxxxxxx" defaultValue="" />
            <p className="text-xs text-gray-500 mt-1">
              Generate these in WooCommerce Settings &gt; Advanced &gt; REST API
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline">Test Connection</Button>
            <Button className="bg-purple-600 hover:bg-purple-700">
              Connect WooCommerce
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shopify Section (Placeholder) */}
      <Card className="opacity-50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <svg
              className="h-8 w-8"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="48" height="48" rx="10" fill="#96bf48" />
              <path
                d="M28 12c-1 0-2 1-2 2 0 2-4 4-4 4s-3-2-4-4c0-1-1-2-2-2-2 0-3 1-3 3v18c0 2 1 3 3 3h14c2 0 3-1 3-3V15c0-2-1-3-3-3z"
                fill="#fff"
              />
            </svg>
            <h3 className="font-semibold text-gray-900">Shopify</h3>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-500 text-sm">
            Switch to the WooCommerce tab to configure your integration
          </p>
        </CardContent>
      </Card>

      {/* Sync Settings */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Sync Settings</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              defaultChecked
              className="mt-1 h-4 w-4 text-indigo-600"
            />
            <div>
              <p className="font-medium text-gray-900">
                Auto-import Orders as Donations
              </p>
              <p className="text-sm text-gray-500">
                Automatically record store purchases as donations with customer
                details
              </p>
            </div>
          </label>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Sync Frequency
            </label>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg">
              <option>Real-time (Webhook)</option>
              <option>Every 30 minutes</option>
              <option>Every hour</option>
              <option>Every 4 hours</option>
              <option>Daily</option>
            </select>
          </div>

          <div className="border-t pt-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 text-indigo-600"
              />
              <div>
                <p className="font-medium text-gray-900">
                  Product-to-Campaign Mapping
                </p>
                <p className="text-sm text-gray-500">
                  Assign products to campaigns to track fundraising by product
                </p>
              </div>
            </label>
          </div>

          <div className="border-t pt-4 flex justify-end">
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <ShoppingCart className="h-6 w-6 text-purple-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">Order Import</h4>
          <p className="text-xs text-gray-500 mt-1">
            Automatically sync online store orders and record them as donations
          </p>
        </Card>
        <Card className="p-5">
          <TrendingUp className="h-6 w-6 text-green-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">
            Sales Reporting
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Track store sales performance and identify top-selling fundraising
            products
          </p>
        </Card>
        <Card className="p-5">
          <Zap className="h-6 w-6 text-yellow-500 mb-2" />
          <h4 className="font-semibold text-gray-900 text-sm">
            Real-time Sync
          </h4>
          <p className="text-xs text-gray-500 mt-1">
            Receive instant updates for new orders with customer contact
            information
          </p>
        </Card>
      </div>
    </div>
  );
}
