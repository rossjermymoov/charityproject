import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { ReconciliationClient } from "./reconciliation-client";

export default async function ReconciliationPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return <ReconciliationClient userId={session.id} />;
}
