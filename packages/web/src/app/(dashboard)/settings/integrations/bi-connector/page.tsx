import { requireAuth } from "@/lib/session";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BarChart3, Copy, RefreshCw } from "lucide-react";

export default async function BIConnectorPage() {
  await requireAuth();

  const apiKeyExample = "odata_key_xxxxxxxxxxxxxxxxxxxxxxxx";
  const odataEndpoint = `${process.env.NEXT_PUBLIC_APP_URL || "https://example.com"}/api/odata`;

  const entities = [
    {
      name: "Contacts",
      path: "/contacts",
      description: "All contacts and their basic information",
    },
    {
      name: "Donations",
      path: "/donations",
      description: "All donations with amounts, dates, and donor information",
    },
    {
      name: "Events",
      path: "/events",
      description: "Event calendar with attendance and registrations",
    },
    {
      name: "Campaigns",
      path: "/campaigns",
      description: "Campaign data with progress and fundraising totals",
    },
    {
      name: "Volunteers",
      path: "/volunteers",
      description: "Volunteer records with hours and assignments",
    },
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
          <Link href="/settings/integrations" className="hover:text-gray-700">
            Integrations
          </Link>
          <span>/</span>
          <span>BI Connector</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/settings/integrations"
            className="text-gray-400 hover:text-gray-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">BI Connector</h1>
            <p className="text-gray-500 mt-1">
              OData API for Power BI, Tableau, and other analytics tools
            </p>
          </div>
        </div>
      </div>

      {/* OData Endpoint */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">OData API Endpoint</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">
              API URL
            </label>
            <div className="flex gap-2">
              <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs break-all font-mono">
                {odataEndpoint}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(odataEndpoint)}
                className="px-3 py-2 text-gray-600 hover:text-gray-900"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Management */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">API Key Management</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              API keys grant access to your data. Keep them secure and rotate
              regularly.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">
                  Active API Key
                </p>
                <code className="text-xs text-gray-500 font-mono">
                  {apiKeyExample}
                </code>
              </div>
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs text-gray-600 hover:text-gray-900">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Rotate Key
            </Button>
            <Button variant="outline">Generate New Key</Button>
          </div>
        </CardContent>
      </Card>

      {/* Available Entities */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Available Entities</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {entities.map((entity) => (
              <div
                key={entity.path}
                className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">
                      {entity.name}
                    </h4>
                    <p className="text-sm text-gray-500 mt-1">
                      {entity.description}
                    </p>
                    <code className="text-xs text-gray-600 font-mono mt-2 block">
                      GET {odataEndpoint}
                      {entity.path}
                    </code>
                  </div>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        `${odataEndpoint}${entity.path}`
                      )
                    }
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Power BI Instructions */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Power BI Connection</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">
                  In Power BI, click &quot;Get Data&quot;
                </p>
                <p className="text-sm text-gray-500">
                  Select &quot;OData Feed&quot; from the data sources
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Paste the API URL</p>
                <p className="text-sm text-gray-500">
                  Use the endpoint shown above for the connection
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">
                  Add API Key as HTTP header
                </p>
                <p className="text-sm text-gray-500">
                  Header: Authorization: Bearer {`<YOUR_API_KEY>`}
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                4
              </span>
              <div>
                <p className="font-medium text-gray-900">Load and Transform</p>
                <p className="text-sm text-gray-500">
                  Select the entities you want to analyze in Power BI
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Tableau Instructions */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold text-gray-900">Tableau Connection</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <ol className="space-y-3">
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                1
              </span>
              <div>
                <p className="font-medium text-gray-900">
                  Click &quot;Connect to Data&quot;
                </p>
                <p className="text-sm text-gray-500">
                  Search for and select OData feed connector
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                2
              </span>
              <div>
                <p className="font-medium text-gray-900">Enter OData URL</p>
                <p className="text-sm text-gray-500">
                  Use the base endpoint or entity-specific URLs
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-indigo-100 text-indigo-700 rounded-full text-sm font-semibold">
                3
              </span>
              <div>
                <p className="font-medium text-gray-900">Configure auth</p>
                <p className="text-sm text-gray-500">
                  Use Bearer token authentication with your API key
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
