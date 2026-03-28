import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function Home() {
  try {
    const session = await getSession();
    if (session) {
      redirect("/crm/contacts");
    }
  } catch (e) {
    // Database may not be ready yet — fall through to login
    console.error("Session check failed:", e);
  }
  redirect("/login");
}
