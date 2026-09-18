"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CATEGORIES } from "@/lib/categories";
import { slugify, validateSite } from "@/lib/validation";
import { uploadThumbnailAction } from "@/app/admin/actions";

const EMPTY = {
  name: "",
  slug: "",
  url: "",
  embedUrl: "",
  description: "",
  category: CATEGORIES[0],
  tags: "",
  image: "",
  featured: false,
  active: true,
};

export default function SiteForm({
  initial,
  onSave,
  onClose,
  existingSlugs = [],
  errors: serverErrors,
  busy = false,
}) {
  const isEdit = Boolean(initial);
  const [values, setValues] = useState(() =>
    initial
      ? { ...EMPTY, ...initial, tags: (initial.tags ?? []).join(", ") }
      : EMPTY
  );

  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);
  const [errors, setErrors] = useState({});
  const [slugTouched, setSlugTouched] = useState(isEdit);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const mergedErrors = { ...errors, ...serverErrors };

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadError("");
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    const result = await uploadThumbnailAction(formData);
    setUploading(false);
    if (result.error) {
      setUploadError(result.error);
      return;
    }
    update("image", result.url);
  }

  function update(field, value) {
    setValues((v) => {
      const next = { ...v, [field]: value };
      if (field === "name" && !slugTouched) {
        next.slug = slugify(value);
      }
      return next;
    });
  }

  function handleSubmit(event) {
    event.preventDefault();
    const tags = values.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean)
      .slice(0, 5);

    const payload = { ...values, tags };
    const slugsToCheck = isEdit
      ? existingSlugs.filter((s) => s !== initial.slug)
      : existingSlugs;

    const validationErrors = validateSite(payload, { existingSlugs: slugsToCheck });
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    onSave(payload);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-black/60"
      />
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="skeu-panel relative flex h-full w-full max-w-md flex-col overflow-y-auto border-l border-border p-6"
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-text">
            {isEdit ? "Edit site" : "Add site"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="focus-ring rounded-md px-2 py-1 text-sm text-text-muted hover:text-text"
          >
            Close
          </button>
        </div>

        <form className="flex flex-1 flex-col gap-4" onSubmit={handleSubmit} noValidate>
          <Field label="Name" error={mergedErrors.name}>
            <input
              value={values.name}
              onChange={(e) => update("name", e.target.value)}
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            />
          </Field>

          <Field label="Slug" error={mergedErrors.slug}>
            <input
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                update("slug", slugify(e.target.value));
              }}
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 font-mono text-sm text-text"
            />
          </Field>

          <Field label="URL" error={mergedErrors.url}>
            <input
              value={values.url}
              onChange={(e) => update("url", e.target.value)}
              placeholder="https://example.com"
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            />
          </Field>

          <Field
            label="Embed URL"
            error={mergedErrors.embedUrl}
            hint="Use the site's official embed link if it has one (optional)"
          >
            <input
              value={values.embedUrl ?? ""}
              onChange={(e) => update("embedUrl", e.target.value)}
              placeholder="https://example.com/export/embed.html"
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            />
          </Field>

          <Field label="Description" error={mergedErrors.description} hint={`${values.description.length}/120`}>
            <textarea
              value={values.description}
              onChange={(e) => update("description", e.target.value)}
              rows={3}
              maxLength={120}
              className="skeu-well focus-ring w-full resize-none rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            />
          </Field>

          <Field label="Category" error={mergedErrors.category}>
            <select
              value={values.category}
              onChange={(e) => update("category", e.target.value)}
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Tags" error={mergedErrors.tags} hint="Comma-separated, up to 5">
            <input
              value={values.tags}
              onChange={(e) => update("tags", e.target.value)}
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            />
          </Field>

          <Field label="Thumbnail" error={mergedErrors.image} hint="https://… or /thumbnails/… (optional)">
            <input
              value={values.image ?? ""}
              onChange={(e) => update("image", e.target.value)}
              className="skeu-well focus-ring w-full rounded-lg border border-border px-3.5 py-2.5 text-sm text-text"
            />
            <div className="mt-2 flex items-center gap-2">
              <label className="skeu-depth focus-ring cursor-pointer rounded-md border border-border px-3 py-1.5 text-xs font-medium text-text hover:border-primary">
                {uploading ? "Uploading…" : "Upload image"}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleFileChange}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
              <span className="text-xs text-text-muted">PNG, JPG or WebP, up to 1 MB</span>
            </div>
            {uploadError && (
              <p className="text-xs text-error" role="alert">
                {uploadError}
              </p>
            )}
          </Field>

          <div className="skeu-well flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
            <span className="text-sm font-medium text-text">Featured</span>
            <Toggle checked={values.featured} onChange={(v) => update("featured", v)} />
          </div>

          <div className="skeu-well flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5">
            <span className="text-sm font-medium text-text">Published</span>
            <Toggle checked={values.active} onChange={(v) => update("active", v)} />
          </div>

          <div className="mt-auto flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="skeu-depth focus-ring flex-1 rounded-lg border border-border py-2.5 text-sm font-medium text-text hover:border-primary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              className="skeu-depth focus-ring flex-1 rounded-lg bg-primary py-2.5 text-sm font-semibold text-primary-ink hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "…" : isEdit ? "Save changes" : "Add site"}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function Field({ label, error, hint, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between">
        <label className="text-sm font-medium text-text">{label}</label>
        {hint && !error && <span className="text-xs text-text-muted">{hint}</span>}
      </div>
      {children}
      {error && (
        <p className="text-xs text-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`skeu-well focus-ring relative h-6 w-11 rounded-full transition-colors ${
        checked ? "bg-success" : "bg-border"
      }`}
    >
      <span
        className={`skeu-depth absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}
