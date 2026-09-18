"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import SkillsightLogo from "./SkillsightLogo";
import ThemeToggle from "./ThemeToggle";
import TagList from "./TagList";
import SiteForm from "./SiteForm";
import AdminUsers from "./AdminUsers";
import {
  createSiteAction,
  updateSiteAction,
  deleteSiteAction,
  toggleSiteFieldAction,
} from "@/app/admin/actions";

export default function AdminDashboard({ initialSites, initialUsers, isSuperAdmin }) {
  const [sites, setSites] = useState(initialSites);
  const [formState, setFormState] = useState(null); // null | "new" | site object
  const [formErrors, setFormErrors] = useState(null);
  const [pendingRemoval, setPendingRemoval] = useState(null);
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);

  function showToast(message) {
    setToast(message);
    setTimeout(() => setToast(null), 2200);
  }

  async function handleSave(payload) {
    setBusy(true);
    setFormErrors(null);
    const result =
      formState === "new"
        ? await createSiteAction(payload)
        : await updateSiteAction(formState.id, payload);
    setBusy(false);

    if (result.errors) {
      setFormErrors(result.errors);
      return;
    }

    setSites((prev) => {
      if (formState === "new") return [result.site, ...prev];
      return prev.map((s) => (s.id === result.site.id ? result.site : s));
    });
    showToast(formState === "new" ? `${result.site.name} added` : `${result.site.name} updated`);
    setFormState(null);
  }

  async function confirmRemoval(site) {
    if (pendingRemoval?.id !== site.id) {
      setPendingRemoval(site);
      return;
    }
    setBusy(true);
    const result = await deleteSiteAction(site.id);
    setBusy(false);
    if (result.errors) {
      showToast(result.errors.form);
      return;
    }
    setSites((prev) => prev.filter((s) => s.id !== site.id));
    setPendingRemoval(null);
    showToast(`${site.name} removed`);
  }

  async function toggleField(site, field) {
    setBusy(true);
    const result = await toggleSiteFieldAction(site.id, field);
    setBusy(false);
    if (result.errors) {
      showToast(result.errors.form);
      return;
    }
    setSites((prev) => prev.map((s) => (s.id === result.site.id ? result.site : s)));
  }

  const metrics = {
    total: sites.length,
    published: sites.filter((s) => s.active).length,
    featured: sites.filter((s) => s.featured).length,
  };

  return (
    <div className="flex flex-1 flex-col">
      <header className="skeu-panel border-b border-admin/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <SkillsightLogo tone="admin" className="text-3xl" />
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="hidden items-center gap-1.5 text-sm text-admin-accent sm:flex">
              <span className="h-2 w-2 rounded-full bg-admin-accent" aria-hidden="true" />
              Admin
            </span>
            <Link
              href="/"
              className="skeu-depth focus-ring tap-target rounded-full border border-border px-3.5 py-1.5 text-sm font-medium text-text-muted hover:text-text"
            >
              View shelf
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
        <div className="grid grid-cols-3 gap-4">
          <Metric label="Total sites" value={metrics.total} />
          <Metric label="Published" value={metrics.published} />
          <Metric label="Featured" value={metrics.featured} />
        </div>

        <div className="flex items-center justify-between">
          <h1 className="font-display text-xl font-semibold text-text">
            Sites
          </h1>
          <button
            type="button"
            onClick={() => {
              setFormErrors(null);
              setFormState("new");
            }}
            className="skeu-depth focus-ring tap-target rounded-full bg-admin px-4 py-2 text-sm font-semibold text-admin-ink hover:opacity-90"
          >
            Add site
          </button>
        </div>

        <div className="skeu-panel overflow-x-auto rounded-2xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="text-text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Category</th>
                <th className="px-4 py-3 font-medium">Tags</th>
                <th className="px-4 py-3 font-medium">Featured</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sites.map((site) => (
                <tr key={site.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <p className="font-medium text-text">{site.name}</p>
                    <p className="text-xs text-text-muted">/{site.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-text-muted">{site.category}</td>
                  <td className="px-4 py-3">
                    <TagList tags={site.tags} />
                  </td>
                  <td className="px-4 py-3 max-md:py-4">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={site.featured}
                      disabled={busy}
                      onClick={() => toggleField(site, "featured")}
                      className={`skeu-depth focus-ring tap-target rounded-full px-2.5 py-1 text-xs font-medium ${
                        site.featured
                          ? "bg-primary text-primary-ink"
                          : "border border-border text-text-muted"
                      }`}
                    >
                      {site.featured ? "Featured" : "Not featured"}
                    </button>
                  </td>
                  <td className="px-4 py-3 max-md:py-4">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={site.active}
                      disabled={busy}
                      onClick={() => toggleField(site, "active")}
                      className={`skeu-depth focus-ring tap-target rounded-full px-2.5 py-1 text-xs font-medium ${
                        site.active
                          ? "bg-success text-background"
                          : "border border-border text-text-muted"
                      }`}
                    >
                      {site.active ? "Published" : "Unpublished"}
                    </button>
                  </td>
                  <td className="px-4 py-3 max-md:py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFormErrors(null);
                          setFormState(site);
                        }}
                        className="skeu-depth focus-ring tap-target rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:border-primary"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => confirmRemoval(site)}
                        className={`skeu-depth focus-ring tap-target rounded-md border px-3 py-1.5 text-xs font-medium ${
                          pendingRemoval?.id === site.id
                            ? "border-error bg-error/10 text-error"
                            : "border-border text-text hover:border-error hover:text-error"
                        }`}
                      >
                        {pendingRemoval?.id === site.id ? "Confirm remove" : "Remove"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {sites.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-text-muted">
                    No sites yet. Add the first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <AdminUsers initialUsers={initialUsers} isSuperAdmin={isSuperAdmin} showToast={showToast} />
      </main>

      <AnimatePresence>
        {formState && (
          <SiteForm
            initial={formState === "new" ? null : formState}
            existingSlugs={sites.map((s) => s.slug)}
            errors={formErrors}
            busy={busy}
            onSave={handleSave}
            onClose={() => setFormState(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="skeu-panel fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border px-4 py-2 text-sm text-text shadow-lg"
            role="status"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="skeu-panel rounded-2xl border border-border p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-text">
        {value}
      </p>
    </div>
  );
}
