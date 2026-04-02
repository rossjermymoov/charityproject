import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import ImportClient from "./import-client";

export default function ImportLocationsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/settings/collection-tins">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Import Locations</h1>
          <p className="text-gray-500 mt-1">
            Upload a CSV file and map your columns to location fields
          </p>
        </div>
      </div>

      <ImportClient />
    </div>
  );
}
