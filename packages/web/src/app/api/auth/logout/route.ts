import { destroySession, getSession } from "@/lib/session";
import { logAudit } from "@/lib/audit";
import { redirect } from "next/navigation";

export async function POST() {
  const session = await getSession();
  if (session) {
    await logAudit({ userId: session.id, action: "LOGOUT", entityType: "User", entityId: session.id });
  }
  await destroySession();
  redirect("/login");
}
