import { redirect } from "next/navigation";

export default function EmailProvidersRedirect() {
  redirect("/settings/integrations");
}
