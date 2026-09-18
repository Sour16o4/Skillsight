import { CATEGORIES } from "./categories";

export function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateSite(values, { existingSlugs = [] } = {}) {
  const errors = {};

  if (!values.name?.trim()) {
    errors.name = "Name is required.";
  }

  if (!values.slug?.trim()) {
    errors.slug = "Slug is required.";
  } else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(values.slug)) {
    errors.slug = "Use lowercase letters, numbers and hyphens only.";
  } else if (existingSlugs.includes(values.slug)) {
    errors.slug = "This slug is already in use.";
  }

  if (!values.url?.trim()) {
    errors.url = "URL is required.";
  } else if (!/^https:\/\//.test(values.url.trim())) {
    errors.url = "Use an https:// address.";
  }

  if (values.description && values.description.length > 120) {
    errors.description = "Keep the description to 120 characters or fewer.";
  }

  if (!CATEGORIES.includes(values.category)) {
    errors.category = "Choose a category.";
  }

  if (values.tags && values.tags.length > 5) {
    errors.tags = "Up to 5 tags.";
  }

  if (values.embedUrl && !/^https:\/\//.test(values.embedUrl.trim())) {
    errors.embedUrl = "Use an https:// address.";
  }

  if (values.image) {
    const isRemote = /^https:\/\//.test(values.image);
    const isLocal = values.image.startsWith("/thumbnails/");
    if (!isRemote && !isLocal) {
      errors.image = "Use an https:// address or a /thumbnails/… path.";
    }
  }

  return errors;
}
