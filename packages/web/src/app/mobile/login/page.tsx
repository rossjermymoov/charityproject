import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { MobileLogin } from "./mobile-login";

export default async function MobileLoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/mobile");
  }

  return <MobileLogin />;
}
