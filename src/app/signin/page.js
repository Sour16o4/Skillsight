import { Suspense } from "react";
import SiteHeader from "@/components/SiteHeader";
import UserSignIn from "@/components/UserSignIn";
import Footer from "@/components/Footer";
import { getSession } from "@/lib/require-admin";

export const metadata = { title: "Sign in — Skillsight" };

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

export default async function SignInPage() {
  const session = await getSession();

  return (
    <>
      <SiteHeader session={session} />
      <main className="flex flex-1 flex-col">
        <Suspense>
          <UserSignIn googleEnabled={googleEnabled} />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
