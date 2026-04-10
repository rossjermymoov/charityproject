import { redirect } from "next/navigation";
import { getSession, createSession } from "@/lib/session";
import { authenticate } from "@/lib/auth";
import { logAudit } from "@/lib/audit";
import { LoginForm } from "./login-form";

function getHomeForRole(role: string): string {
  switch (role) {
    case "DONOR":
      return "/my/donations";
    case "VOLUNTEER":
      return "/my/assignments";
    default:
      return "/";
  }
}

export default async function LoginPage() {
  const session = await getSession();
  if (session) redirect(getHomeForRole(session.role));

  async function loginAction(formData: FormData) {
    "use server";
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const user = await authenticate(email, password);
    if (!user) {
      return { error: "Invalid email or password" };
    }

    await createSession(user.id);
    await logAudit({ userId: user.id, action: "LOGIN", entityType: "User", entityId: user.id, details: { email } });
    redirect(getHomeForRole(user.role));
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 rounded-xl bg-indigo-600 items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">CO</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Parity CRM</h1>
          <p className="text-gray-500 mt-1">Sign in to your account</p>
        </div>
        <LoginForm action={loginAction} />
      </div>
    </div>
  );
}
