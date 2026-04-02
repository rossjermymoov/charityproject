import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Route, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { updateCollectionMode } from "./actions";

export default async function CollectionTinsSettingsPage() {
  const settings = await prisma.systemSettings.findUnique({
    where: { id: "default" },
    select: { collectionMode: true },
  });
  const mode = settings?.collectionMode || "SUGGESTED_ROUTES";

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Settings
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Collection Tins</h1>
          <p className="text-gray-500 mt-1">Choose how your charity manages tin collection routes</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Suggested Routes option */}
        <form action={updateCollectionMode}>
          <input type="hidden" name="collectionMode" value="SUGGESTED_ROUTES" />
          <button type="submit" className="w-full text-left">
            <Card className={`p-6 transition-all cursor-pointer hover:shadow-md ${mode === "SUGGESTED_ROUTES" ? "border-2 border-amber-400 bg-amber-50" : "border border-gray-200 hover:border-gray-300"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${mode === "SUGGESTED_ROUTES" ? "bg-amber-200" : "bg-gray-100"}`}>
                  <Sparkles className={`h-6 w-6 ${mode === "SUGGESTED_ROUTES" ? "text-amber-700" : "text-gray-400"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">Suggested Routes</h3>
                    {mode === "SUGGESTED_ROUTES" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-200 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Best for smaller charities. The system suggests optimised routes based on tin locations,
                    distance from your starting point, and how long since each tin was last collected.
                    Routes are generated on-the-fly and aren't saved — each collection is ad-hoc.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">AI-optimised</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">No setup needed</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Dynamic</span>
                  </div>
                </div>
              </div>
            </Card>
          </button>
        </form>

        {/* My Routes option */}
        <form action={updateCollectionMode}>
          <input type="hidden" name="collectionMode" value="MY_ROUTES" />
          <button type="submit" className="w-full text-left">
            <Card className={`p-6 transition-all cursor-pointer hover:shadow-md ${mode === "MY_ROUTES" ? "border-2 border-indigo-400 bg-indigo-50" : "border border-gray-200 hover:border-gray-300"}`}>
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${mode === "MY_ROUTES" ? "bg-indigo-200" : "bg-gray-100"}`}>
                  <Route className={`h-6 w-6 ${mode === "MY_ROUTES" ? "text-indigo-700" : "text-gray-400"}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">My Routes</h3>
                    {mode === "MY_ROUTES" && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 bg-indigo-200 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" /> Active
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    Best for larger charities with regular volunteers. Create predefined routes with fixed stops,
                    assign them to volunteers, and schedule runs on specific dates. Tracks which tins are allocated
                    to which route and flags unallocated tins.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Predefined routes</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Volunteer assignments</span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">Tin allocation tracking</span>
                  </div>
                </div>
              </div>
            </Card>
          </button>
        </form>
      </div>
    </div>
  );
}
