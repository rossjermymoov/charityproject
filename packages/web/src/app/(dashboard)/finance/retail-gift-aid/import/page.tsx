import { requireAuth } from "@/lib/session";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { CsvImportForm } from "./csv-import-form";

export default async function RetailGiftAidImportPage() {
  await requireAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/finance/retail-gift-aid"
          className="text-gray-400 hover:text-gray-600"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Import Retail Donations
          </h1>
          <p className="text-gray-600 mt-1">
            Upload a CSV file from your EPOS system to import retail gift aid donations
          </p>
        </div>
      </div>

      <CsvImportForm />
    </div>
  );
}
