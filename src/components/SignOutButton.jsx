"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

export default function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="skeu-depth focus-ring tap-target whitespace-nowrap rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-text-muted hover:text-text"
    >
      Sign out
    </button>
  );
}
