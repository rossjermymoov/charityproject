import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { hashPassword } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCog, Plus, Search } from "lucide-react";
import Link from "next/link";
import { logAudit } from "@/lib/audit";
import { ConfirmButton } from "@/components/ui/confirm-button";

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; role?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/");

  const params = await searchParams;
  const search = params.search || "";
  const roleFilter = params.role || "";

  const users = await prisma.user.findMany({
    where: {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" } },
                { email: { contains: search, mode: "insensitive" } },
              ],
            }
          : {},
        roleFilter ? { role: roleFilter } : {},
        { isArchived: false },
      ],
    },
    include: {
      linkedContact: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const contacts = await prisma.contact.findMany({
    where: { status: "ACTIVE" },
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: { id: true, firstName: true, lastName: true, email: true },
  });

  async function createUser(formData: FormData) {
    "use server";
    const s = await getSession();
    if (!s || s.role !== "ADMIN") redirect("/");

    const email = (formData.get("email") as string).trim();
    const name = (formData.get("name") as string).trim();
    const role = formData.get("role") as string;
    const password = (formData.get("password") as string).trim();
    const contactId = (formData.get("contactId") as string) || null;

    if (!email || !name || !password) return;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return;

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        name,
        role,
        passwordHash,
        contactId: contactId || null,
      },
    });

    await logAudit({
      userId: s.id,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      details: { email, role, name },
    });

    revalidatePath("/settings/users");
  }

  async function updateRole(formData: FormData) {
    "use server";
    const s = await getSession();
    if (!s || s.role !== "ADMIN") redirect("/");

    const userId = formData.get("userId") as string;
    const newRole = formData.get("role") as string;

    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole },
    });

    await logAudit({
      userId: s.id,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      details: { role: newRole },
    });

    revalidatePath("/settings/users");
  }

  async function archiveUser(formData: FormData) {
    "use server";
    const s = await getSession();
    if (!s || s.role !== "ADMIN") redirect("/");

    const userId = formData.get("userId") as string;
    if (userId === s.id) return; // can't archive yourself

    await prisma.user.update({
      where: { id: userId },
      data: { isArchived: true, archivedAt: new Date() },
    });

    await logAudit({
      userId: s.id,
      action: "UPDATE",
      entityType: "User",
      entityId: userId,
      details: { archived: true },
    });

    revalidatePath("/settings/users");
  }

  async function linkContact(formData: FormData) {
    "use server";
    const s = await getSession();
    if (!s || s.role !== "ADMIN") redirect("/");

    const userId = formData.get("userId") as string;
    const contactId = (formData.get("contactId") as string) || null;

    await prisma.user.update({
      where: { id: userId },
      data: { contactId: contactId || null },
    });

    revalidatePath("/settings/users");
  }

  const roleColors: Record<string, string> = {
    ADMIN: "bg-red-100 text-red-800",
    STAFF: "bg-blue-100 text-blue-800",
    VOLUNTEER: "bg-green-100 text-green-800",
    DONOR: "bg-amber-100 text-amber-800",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage user accounts and roles</p>
        </div>
      </div>

      {/* Search & Filter */}
      <Card className="p-4">
        <form className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1">
            <Search className="h-5 w-5 text-gray-400" />
            <input
              name="search"
              type="text"
              defaultValue={search}
              placeholder="Search by name or email..."
              className="flex-1 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
            />
          </div>
          <select
            name="role"
            defaultValue={roleFilter}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">All Roles</option>
            <option value="ADMIN">Admin</option>
            <option value="STAFF">Staff</option>
            <option value="VOLUNTEER">Volunteer</option>
            <option value="DONOR">Donor</option>
          </select>
          <Button type="submit" variant="outline" size="sm">Filter</Button>
        </form>
      </Card>

      {/* Create New User */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create User
          </h2>
        </CardHeader>
        <CardContent>
          <form action={createUser} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
              <Input name="name" required placeholder="Full name" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <Input name="email" type="email" required placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
              <Input name="password" type="password" required placeholder="Initial password" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select name="role" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="STAFF">Staff</option>
                <option value="ADMIN">Admin</option>
                <option value="VOLUNTEER">Volunteer</option>
                <option value="DONOR">Donor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Link to Contact</label>
              <select name="contactId" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                <option value="">None (Staff only)</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* User List */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Users ({users.length})
          </h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Linked Contact</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{user.email}</td>
                    <td className="px-4 py-3">
                      <form action={updateRole} className="flex items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={user.role}
                          className="rounded border border-gray-300 px-2 py-1 text-xs"
                        >
                          <option value="ADMIN">Admin</option>
                          <option value="STAFF">Staff</option>
                          <option value="VOLUNTEER">Volunteer</option>
                          <option value="DONOR">Donor</option>
                        </select>
                        <button type="submit" className="text-xs text-indigo-600 hover:text-indigo-800">
                          Save
                        </button>
                      </form>
                    </td>
                    <td className="px-4 py-3">
                      {user.linkedContact ? (
                        <Link
                          href={`/crm/contacts/${user.linkedContact.id}`}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {user.linkedContact.firstName} {user.linkedContact.lastName}
                        </Link>
                      ) : (
                        <form action={linkContact} className="flex items-center gap-2">
                          <input type="hidden" name="userId" value={user.id} />
                          <select name="contactId" className="rounded border border-gray-300 px-2 py-1 text-xs max-w-[150px]">
                            <option value="">None</option>
                            {contacts.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.firstName} {c.lastName}
                              </option>
                            ))}
                          </select>
                          <button type="submit" className="text-xs text-indigo-600 hover:text-indigo-800">
                            Link
                          </button>
                        </form>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {user.id !== session.id && (
                        <form action={archiveUser}>
                          <input type="hidden" name="userId" value={user.id} />
                          <ConfirmButton
                            message={`Archive ${user.name}? They will no longer be able to log in.`}
                            variant="destructive"
                            size="sm"
                          >
                            Archive
                          </ConfirmButton>
                        </form>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
