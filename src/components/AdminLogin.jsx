"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import SkillsightLogo from "./SkillsightLogo";
import PasswordField from "./PasswordField";
import { authClient } from "@/lib/auth-client";

export default function AdminLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const { data, error: signInError } = await authClient.signIn.email({ email, password });
    setSubmitting(false);

    if (signInError) {
      setError(signInError.message || "Incorrect email or password.");
      return;
    }

    if (data?.user?.role !== "admin") {
      setError("This account doesn't have admin access.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-8 flex justify-center">
        <SkillsightLogo tone="admin" className="text-3xl" />
      </div>

      <div className="skeu-panel rounded-2xl border border-admin-accent/40 p-6">
        <p className="mb-6 flex items-center gap-2 text-sm font-medium text-admin-accent">
          <span className="h-2 w-2 rounded-full bg-admin-accent" aria-hidden="true" />
          Admin sign in
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
            {error}
          </p>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="admin-email" className="text-sm font-medium text-text">
              Email
            </label>
            <input
              id="admin-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            />
          </div>
          <PasswordField
            id="admin-password"
            label="Password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={submitting}
            className="skeu-depth focus-ring mt-2 w-full rounded-lg bg-admin py-2.5 text-sm font-semibold text-admin-ink hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
