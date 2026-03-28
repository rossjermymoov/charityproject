import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export default async function Home() {
  try {
    const session = await getSession();
    if (session) {
      redirect("/crm/contacts");
    }
  } catch (e) {
    // Re-throw Next.js redirect errors — they're not real errors
    if (isRedirectError(e)) throw e;
    // Database may not be ready yet — fall through to login
    console.error("Session check failed:", e);
  }
  redirect("/login");
}
