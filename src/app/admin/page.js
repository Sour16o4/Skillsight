import AdminDashboard from "@/components/AdminDashboard";
import { requireAdmin } from "@/lib/require-admin";
import { getAllSites } from "@/lib/sites";
import { getAllUsers } from "@/lib/users";

export const metadata = { title: "Admin — Skillsight" };

export default async function AdminPage() {
  const session = await requireAdmin();
  const [sites, users] = await Promise.all([getAllSites(), getAllUsers()]);

  return (
    <AdminDashboard initialSites={sites} initialUsers={users} isSuperAdmin={session.user.isSuperAdmin} />
  );
}
