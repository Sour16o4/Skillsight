"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import SkillsightLogo from "./SkillsightLogo";
import PasswordField from "./PasswordField";
import { authClient } from "@/lib/auth-client";

export default function UserSignIn({ googleEnabled }) {
  const [mode, setMode] = useState("signin"); // signin | signup
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/";

  async function handleSubmit(event) {
    event.preventDefault();
    setErrors({});

    const fieldErrors = {};
    if (mode === "signup" && !name.trim()) fieldErrors.name = "Name is required.";
    if (!email.trim()) fieldErrors.email = "Email is required.";
    if (mode === "signup" && password.length < 12) {
      fieldErrors.password = "Use at least 12 characters.";
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setSubmitting(true);
    const { data, error } =
      mode === "signup"
        ? await authClient.signUp.email({ name, email, password })
        : await authClient.signIn.email({ email, password });
    setSubmitting(false);

    if (error) {
      setErrors({ form: error.message || "Something went wrong." });
      return;
    }

    // An admin account signing in here still ends up at the admin
    // dashboard, same as using /admin/login directly.
    router.push(data?.user?.role === "admin" ? "/admin" : next);
    router.refresh();
  }

  async function handleGoogle() {
    await authClient.signIn.social({ provider: "google", callbackURL: next });
  }

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-16">
      <div className="mb-8 flex justify-center">
        <SkillsightLogo tone="primary" className="text-3xl" />
      </div>

      <div className="skeu-panel rounded-2xl border border-border p-6">
        <div className="skeu-well mb-6 flex rounded-lg border border-border p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signin"}
            onClick={() => setMode("signin")}
            className={`focus-ring flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === "signin" ? "skeu-depth bg-primary text-primary-ink" : "text-text-muted"
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "signup"}
            onClick={() => setMode("signup")}
            className={`focus-ring flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              mode === "signup" ? "skeu-depth bg-primary text-primary-ink" : "text-text-muted"
            }`}
          >
            Create account
          </button>
        </div>

        {googleEnabled && (
          <>
            <button
              type="button"
              onClick={handleGoogle}
              className="skeu-depth focus-ring mb-4 flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2.5 text-sm font-medium text-text hover:border-primary"
            >
              Continue with Google
            </button>
            <div className="mb-4 flex items-center gap-3 text-xs text-text-muted">
              <span className="h-px flex-1 bg-divider" />
              or
              <span className="h-px flex-1 bg-divider" />
            </div>
          </>
        )}

        <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
          {errors.form && (
            <p className="rounded-lg bg-error/10 px-3 py-2 text-sm text-error" role="alert">
              {errors.form}
            </p>
          )}

          {mode === "signup" && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="name" className="text-sm font-medium text-text">
                Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
              />
              {errors.name && (
                <p className="text-xs text-error" role="alert">
                  {errors.name}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm font-medium text-text">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            />
            {errors.email && (
              <p className="text-xs text-error" role="alert">
                {errors.email}
              </p>
            )}
          </div>

          <PasswordField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
          {errors.password && (
            <p className="-mt-2 text-xs text-error" role="alert">
              {errors.password}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="skeu-depth focus-ring mt-2 w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-ink transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "…" : mode === "signup" ? "Create account" : "Sign in"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-center text-sm text-text-muted">
        Looking for the shelf?{" "}
        <Link href="/" className="focus-ring rounded-md font-medium text-primary">
          Back to Skillsight
        </Link>
      </p>
    </div>
  );
}
