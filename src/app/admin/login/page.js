import AdminLogin from "@/components/AdminLogin";
import SiteHeader from "@/components/SiteHeader";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/require-admin";

export const metadata = { title: "Admin sign in — Skillsight" };

export default async function AdminLoginPage() {
  const session = await getSession();

  return (
    <>
      <SiteHeader session={session} />
      <main className="flex flex-1 flex-col">
        <AdminLogin />
      </main>
      <Footer />
    </>
  );
}
